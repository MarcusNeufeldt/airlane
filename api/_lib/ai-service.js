const axios = require('axios');
require('dotenv').config();

class AIService {
  constructor() {
    // Sanitize API key to remove any hidden characters, newlines, or whitespace
    this.apiKey = process.env.OPENROUTER_API_KEY?.trim().replace(/[\r\n\t]/g, '');
    this.baseURL = process.env.OPENROUTER_BASE_URL?.trim();
    this.defaultModel = process.env.DEFAULT_AI_MODEL?.trim() || 'anthropic/claude-3.5-sonnet';
    
    console.log('🔧 AIService constructor');
    console.log('🔑 API Key exists:', !!this.apiKey);
    console.log('🔑 API Key length:', this.apiKey?.length);
    console.log('🌐 Base URL:', this.baseURL);
    console.log('🤖 Default model:', this.defaultModel);
    
    // Reasoning configuration
    this.enableReasoning = process.env.ENABLE_REASONING === 'true';
    this.reasoningEffort = process.env.REASONING_EFFORT || 'medium';
    this.reasoningMaxTokens = parseInt(process.env.REASONING_MAX_TOKENS) || 4000;
    this.reasoningExclude = process.env.REASONING_EXCLUDE === 'true';
    
    if (!this.apiKey || !this.baseURL) {
      console.error('❌ Missing required environment variables');
      console.error('❌ API Key:', !!this.apiKey);
      console.error('❌ Base URL:', this.baseURL);
    }
  }

  // Get reasoning configuration for API calls
  getReasoningConfig() {
    if (!this.enableReasoning) {
      return {};
    }
    
    // OpenRouter only allows either 'effort' OR 'max_tokens', not both
    // Use effort by default, or max_tokens if effort is explicitly set to 'custom'
    const config = {
      reasoning: {
        exclude: this.reasoningExclude
      }
    };
    
    if (this.reasoningEffort === 'custom') {
      config.reasoning.max_tokens = this.reasoningMaxTokens;
    } else {
      config.reasoning.effort = this.reasoningEffort;
    }
    
    return config;
  }

  // Get safe headers with properly formatted Authorization
  getSafeHeaders(additionalHeaders = {}) {
    if (!this.apiKey) {
      throw new Error('API key is not configured');
    }
    
    // Ensure the API key is clean and properly formatted
    const cleanApiKey = this.apiKey.replace(/[^\w\-\.]/g, '');
    
    return {
      'Authorization': `Bearer ${cleanApiKey}`,
      'Content-Type': 'application/json',
      ...additionalHeaders
    };
  }

  // Schema definitions for structured output (BPMN process format)
  getBPMNProcessFormat() {
    return {
      type: "object",
      properties: {
        elements: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string", description: "Unique element identifier" },
              type: { 
                type: "string", 
                enum: ["process", "event", "gateway", "lane", "pool", "pool-with-lanes", "data-object"],
                description: "BPMN element type" 
              },
              label: { type: "string", description: "Element label or name" },
              description: { type: "string", description: "Element description" },
              position: {
                type: "object",
                properties: {
                  x: { type: "number" },
                  y: { type: "number" }
                },
                required: ["x", "y"]
              },
              properties: {
                type: "object",
                description: "Element-specific properties",
                properties: {
                  eventType: { type: "string", enum: ["start", "intermediate", "end"] },
                  processType: { type: "string", enum: ["task", "subprocess"] },
                  taskType: { type: "string", enum: ["user", "service", "manual", "script", "business-rule", "send", "receive"] },
                  gatewayType: { type: "string", enum: ["exclusive", "parallel", "inclusive", "event-based", "complex"] },
                  dataType: { type: "string", enum: ["input", "output", "collection"] },
                  participant: { type: "string", description: "Pool participant name" },
                  assignee: { type: "string", description: "Lane assignee" },
                  performer: { type: "string", description: "Process performer" },
                  state: { type: "string", description: "Data object state" },
                  lanes: { 
                    type: "array", 
                    description: "Array of lanes for pool-with-lanes type",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string", description: "Lane identifier" },
                        name: { type: "string", description: "Lane name" },
                        height: { type: "number", description: "Lane height in pixels" },
                        color: { type: "string", description: "Lane background color" }
                      },
                      required: ["id", "name", "height", "color"]
                    }
                  },
                  width: { type: "number", description: "Element width in pixels" },
                  height: { type: "number", description: "Element height in pixels" }
                }
              }
            },
            required: ["id", "type", "label", "position"]
          }
        },
        flows: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string", description: "Unique flow identifier" },
              type: { 
                type: "string", 
                enum: ["sequence-flow", "message-flow", "association"],
                description: "Flow type" 
              },
              source: { type: "string", description: "Source element ID" },
              target: { type: "string", description: "Target element ID" },
              label: { type: "string", description: "Flow label" },
              condition: { type: "string", description: "Flow condition (for sequence flows)" },
              isDefault: { type: "boolean", description: "Is this the default flow?" },
              messageType: { type: "string", description: "Message type (for message flows)" }
            },
            required: ["id", "type", "source", "target"]
          }
        }
      },
      required: ["elements", "flows"]
    };
  }

  // System prompt for process generation
  getProcessGenerationPrompt() {
    return `You are a BPMN process modeling expert. Your task is to create well-structured business process workflows based on user requirements.

Key principles:
1. Follow BPMN 2.0 notation standards
2. Create clear, logical process flows with proper start and end events
3. Use appropriate BPMN elements (tasks, events, gateways, pools, lanes)
4. Ensure processes have proper sequence flows connecting all elements
5. Use meaningful labels that describe business activities
6. Consider process organization with lanes and pools for different participants

When generating processes:
- Always include at least one start event and one end event
- Use appropriate task types (user, service, manual, script, business-rule, send, receive)
- Connect elements with sequence flows to create logical process paths
- Use gateways for decision points and parallel activities
- For processes with multiple roles/departments, use "pool-with-lanes" type instead of separate "lane" and "pool" elements
- The "pool-with-lanes" element should include a lanes array with lane objects containing id, name, height, and color
- Assign tasks to specific lanes using the "assignee" property to match the lane name
- Position elements logically from left to right following process flow  
- Use standard lane colors like #f5f5f5, #e3f2fd, #e8eaf6, #e0f2f1, #f1f8e9, #fffde7

Respond ONLY with valid JSON matching the required BPMN process format. Do not include any explanations or additional text.`;
  }

  // Generate process from natural language description
  async generateProcess(userPrompt, existingProcess = null) {
    try {
      const systemPrompt = this.getProcessGenerationPrompt();
      const processFormat = this.getBPMNProcessFormat();
      
      let messages = [
        {
          role: "system",
          content: systemPrompt
        }
      ];

      if (existingProcess) {
        messages.push({
          role: "user",
          content: `Current process: ${JSON.stringify(existingProcess, null, 2)}\n\nModification request: ${userPrompt}`
        });
      } else {
        messages.push({
          role: "user",
          content: `Create a business process for: ${userPrompt}`
        });
      }

      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: this.defaultModel,
        messages: messages,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "bpmn_process",
            schema: processFormat,
            strict: true
          }
        },
        temperature: 0.1,
        ...this.getReasoningConfig()
      }, {
        headers: this.getSafeHeaders({
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Process Pipeline Creator'
        })
      });

      let content = response.data.choices[0].message.content;
      
      // Handle case where AI returns JSON wrapped in markdown code blocks
      if (content.includes('```json')) {
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          content = jsonMatch[1];
        }
      } else if (content.includes('```')) {
        // Handle generic code blocks
        const codeMatch = content.match(/```\s*([\s\S]*?)\s*```/);
        if (codeMatch) {
          content = codeMatch[1];
        }
      }
      
      return JSON.parse(content.trim());
    } catch (error) {
      console.error('AI Service Error:', error.response?.data || error.message);
      throw new Error(`Failed to generate process: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Get available tools for function calling
  getAvailableTools() {
    return [
      {
        type: "function",
        function: {
          name: "generate_business_process",
          description: "Generate a complete BPMN business process based on user requirements",
          parameters: {
            type: "object",
            properties: {
              description: {
                type: "string",
                description: "Description of what the business process should represent (e.g., 'customer onboarding', 'order fulfillment', 'employee hiring')"
              },
              requirements: {
                type: "array",
                items: { type: "string" },
                description: "Specific requirements or features needed"
              }
            },
            required: ["description"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "modify_existing_process",
          description: "Modify the current BPMN process. IMPORTANT: Only use this if the user has provided specific, actionable details. If the request is vague (like 'add some tasks'), ask for clarification first instead of calling this tool.",
          parameters: {
            type: "object",
            properties: {
              modification_type: {
                type: "string",
                enum: ["add_element", "modify_element", "add_flow", "remove_element", "add_lane", "add_pool"],
                description: "Type of modification to make"
              },
              description: {
                type: "string",
                description: "Description of the modification needed"
              }
            },
            required: ["modification_type", "description"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "analyze_current_process",
          description: "Analyze the current BPMN process and provide insights",
          parameters: {
            type: "object",
            properties: {
              analysis_type: {
                type: "string",
                enum: ["efficiency", "compliance", "best_practices", "validation", "general"],
                description: "Type of analysis to perform"
              }
            },
            required: ["analysis_type"]
          }
        }
      }
    ];
  }

  // Chat with AI about the process (with function calling)
  async chatAboutProcess(userMessage, currentProcess = null, conversationHistory = [], images = []) {
    try {
      console.log('🔍 AI Service Debug - images parameter:', images);
      console.log('🔍 AI Service Debug - images type:', typeof images);
      console.log('🔍 AI Service Debug - images length:', images ? images.length : 'undefined');
      
      // Check if any previous messages mention images
      const conversationMentionsImages = conversationHistory.some(msg => 
        msg.content && msg.content.includes('[User attached') && msg.content.includes('image(s)]')
      );
      
      console.log('🔍 AI Service Debug - conversationMentionsImages:', conversationMentionsImages);
      
      const systemPrompt = `You are an expert AI assistant embedded within a **visual, web-based BPMN process modeling tool**. Your name is "Process Modeler AI".

Your primary role is to help users design and modify business processes by interacting with a visual canvas.${(images && images.length > 0) || conversationMentionsImages ? ' You have vision capabilities and can analyze images. You may have already analyzed images in this conversation.' : ''}

**IMPORTANT:** Only mention image analysis if you are actually processing images. If the user provides text instructions, respond as if you are processing text-based requirements, not analyzing any visual content.

**Key Concepts of Your Environment:**
- The user is looking at an interactive **canvas**.
- The process elements (tasks, events, gateways) are represented as **nodes** on the canvas.
- The process flows (sequence flows, message flows) are represented as **edges** or **connections** between the nodes.
- When you modify the process, the canvas updates visually.
- This is a BPMN 2.0 compliant process modeling tool similar to Signavio.

**CRITICAL INSTRUCTIONS:**
1. **Interpret "Connections":** When a user mentions "connections," "flows," or "links," they are ALWAYS referring to the **visual flows on the canvas**. They are NEVER talking about network connections. If they say "connections are lost," it means the visual flows disappeared after your last modification. Acknowledge this and help them fix the process to restore the flows. **Do not lecture them about network connectivity.**
2. **Handle Vague Requests:** If a user's request is too vague to be actionable (e.g., "add some tasks" or "make it better"), **first ask for clarification or propose specific, sensible changes and ask for confirmation** before calling a tool. For example, suggest 3-4 useful process steps and ask "Would you like me to add these tasks?"
3. **Be Specific:** When you use a tool to modify the process, your confirmation message should be specific about what you did (e.g., "✅ I've added a 'Review Application' user task and connected it to the approval gateway.").

**CONTEXT & MEMORY:**
- The entire conversation history for this specific process diagram is provided to you in every message. You have perfect memory of our entire design session.
- Refer back to earlier points in our conversation to understand the business goals and reasons behind previous design decisions.
- If your actions cause an error or an unexpected result, use the full conversation context to understand what the state *should have been* and help restore it. Your primary goal is to maintain the integrity of the process design throughout this long-running session.

You have access to these tools:
1. generate_business_process - Create a new BPMN process from scratch.
2. modify_existing_process - Modify the current process.
3. analyze_current_process - Analyze the current process and provide insights.

Current process on the canvas:
${currentProcess ? JSON.stringify(currentProcess, null, 2) : 'No process is on the canvas yet.'}`;

      // Construct user message with images if provided
      let userContent = userMessage;
      if (images && images.length > 0) {
        // Use multimodal format when images are present
        userContent = [
          { type: "text", text: userMessage || "Please analyze these images." }
        ];
        
        // Add images to content array
        images.forEach(imageDataUrl => {
          userContent.push({
            type: "image_url",
            image_url: {
              url: imageDataUrl
            }
          });
        });
      }

      const messages = [
        { role: "system", content: systemPrompt },
        ...conversationHistory,
        { role: "user", content: userContent }
      ];

      // Use the default model (which supports vision)
      const modelToUse = this.defaultModel;

      console.log(`🤖 Using model: ${modelToUse} ${images && images.length > 0 ? '(with images)' : ''}`);

      // Try with function calling first
      try {
        const response = await axios.post(`${this.baseURL}/chat/completions`, {
          model: modelToUse,
          messages: messages,
          tools: this.getAvailableTools(),
          tool_choice: "auto",
          temperature: 0.7,
          ...this.getReasoningConfig()
        }, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'Database Diagram Tool'
          }
        });

        const message = response.data.choices[0].message;
        console.log('🤖 AI Response message:', JSON.stringify(message, null, 2));

        // Check if AI wants to use a tool
        if (message.tool_calls && message.tool_calls.length > 0) {
          console.log('🔧 Tool calls detected:', message.tool_calls.length);
          console.log('🔧 First tool call:', JSON.stringify(message.tool_calls[0], null, 2));
          return {
            type: 'tool_call',
            tool_call: message.tool_calls[0],
            message: message.content || "I'll help you with that using the appropriate tool."
          };
        }

        console.log('💬 Direct message response');
        return {
          type: 'message',
          content: message.content
        };
      } catch (functionCallError) {
        console.log('Function calling failed, falling back to text analysis:', functionCallError.response?.data?.error?.message);
        
        // Fallback: Use text-based intent detection
        const intentPrompt = `You are Process Modeler AI, an assistant embedded in a visual BPMN process diagramming tool. Analyze this user message and determine their intent:

User message: "${userMessage}"

Current process exists: ${currentProcess ? 'Yes' : 'No'}

Respond with ONLY ONE of these exact phrases:
- "GENERATE_PROCESS" - if they want to create a new process
- "MODIFY_PROCESS" - if they want to change the existing process  
- "ANALYZE_PROCESS" - if they want analysis only
- "CHAT" - if it's a general question

Intent:`;

        const intentResponse = await axios.post(`${this.baseURL}/chat/completions`, {
          model: this.defaultModel,
          messages: [{ role: "user", content: intentPrompt }],
          temperature: 0.1,
          ...this.getReasoningConfig()
        }, {
          headers: this.getSafeHeaders({
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'Database Diagram Tool'
          })
        });

        const intent = intentResponse.data.choices[0].message.content.trim();
        
        if (intent === 'GENERATE_PROCESS') {
          return {
            type: 'tool_call',
            tool_call: {
              function: {
                name: 'generate_business_process',
                arguments: JSON.stringify({ description: userMessage })
              }
            },
            message: "I'll generate a process for you."
          };
        } else if (intent === 'MODIFY_PROCESS') {
          return {
            type: 'tool_call',
            tool_call: {
              function: {
                name: 'modify_existing_process',
                arguments: JSON.stringify({ 
                  modification_type: 'add_element', 
                  description: userMessage 
                })
              }
            },
            message: "I'll modify the process for you."
          };
        } else if (intent === 'ANALYZE_PROCESS') {
          return {
            type: 'tool_call',
            tool_call: {
              function: {
                name: 'analyze_current_process',
                arguments: JSON.stringify({ analysis_type: 'general' })
              }
            },
            message: "I'll analyze your process."
          };
        } else {
          // Regular chat fallback
          const chatResponse = await axios.post(`${this.baseURL}/chat/completions`, {
            model: this.defaultModel,
            messages: messages,
            temperature: 0.7,
            ...this.getReasoningConfig()
          }, {
            headers: this.getSafeHeaders({
              'HTTP-Referer': 'http://localhost:3000',
              'X-Title': 'Database Diagram Tool'
            })
          });

          return {
            type: 'message',
            content: chatResponse.data.choices[0].message.content
          };
        }
      }
    } catch (error) {
      console.error('AI Chat Error:', error.response?.data || error.message);
      throw new Error(`Chat failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Analyze current process and provide suggestions (direct API call, no tools)
  async analyzeProcess(process) {
    try {
      console.log('🔍 Starting process analysis');
      console.log('📊 Process input:', JSON.stringify(process, null, 2));
      
      const prompt = `You are a business process expert. Analyze this BPMN process and provide human-readable suggestions for improvements.

Process:
${JSON.stringify(process, null, 2)}

Please provide a detailed analysis covering:

1. **Overall Assessment:** Brief summary of the process quality
2. **BPMN Compliance:** Check if the process follows BPMN 2.0 standards
3. **Process Flow:** Analyze the logical flow and connections
4. **Element Usage:** Review the appropriateness of element types used
5. **Potential Issues:** Identify any problems or inefficiencies
6. **Optimization Suggestions:** Recommend specific improvements
7. **Best Practices:** Highlight any best practice violations

Format your response in clear markdown with proper headers and bullet points.`;

      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: this.defaultModel,
        messages: [
          { role: "system", content: "You are an expert business process analyst who provides clear, actionable feedback on BPMN process models." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        ...this.getReasoningConfig()
      }, {
        headers: this.getSafeHeaders({
          'HTTP-Referer': 'https://signavio-clone.local',
          'X-Title': 'BPMN Process Modeling Tool'
        })
      });

      console.log('✅ Process analysis complete');
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Process Analysis Error:', error.response?.data || error.message);
      throw new Error(`Process analysis failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async suggestNextNode(sourceNodeId, currentProcess, context = 'Suggest the most logical next BPMN element') {
    try {
      console.log('🤖 Starting AI node suggestion for:', sourceNodeId);
      
      // Find the source node
      const sourceNode = currentProcess.elements.find(el => el.id === sourceNodeId);
      if (!sourceNode) {
        throw new Error(`Source node with ID ${sourceNodeId} not found`);
      }

      // Analyze the context around the source node
      const connectedFlows = currentProcess.flows.filter(flow => 
        flow.source === sourceNodeId || flow.target === sourceNodeId
      );

      const prompt = `You are an expert BPMN process designer. Given the current process context, suggest the most logical next BPMN element.

**Current Process Context:**
- Total elements: ${currentProcess.elements.length}
- Total flows: ${currentProcess.flows.length}

**Source Node (where user clicked):**
- ID: ${sourceNode.id}
- Type: ${sourceNode.type}
- Label: ${sourceNode.label}
- Properties: ${JSON.stringify(sourceNode.properties || {}, null, 2)}

**Connected Flows:**
${connectedFlows.map(flow => `- ${flow.type}: ${flow.source} → ${flow.target} ${flow.label ? `(${flow.label})` : ''}`).join('\n')}

**Full Process Elements:**
${currentProcess.elements.map(el => `- ${el.type}: ${el.label} (${el.id})`).join('\n')}

**Context:** ${context}

Based on BPMN best practices and the current process state, suggest the next most logical element to add.

**IMPORTANT:** Keep the reasoning very brief (maximum 1-2 sentences). Focus on the core logic, not detailed explanations.

Respond with a JSON object in this exact format:
{
  "nodeType": "process|event|gateway|data-object",
  "subType": "start|end|intermediate|exclusive|parallel|inclusive|user|service|manual|input|output|storage|reference",
  "label": "Suggested node name",
  "reasoning": "Very brief explanation (1-2 sentences max)",
  "confidence": 0.8,
  "direction": "right|down|left|up",
  "properties": {
    "eventType": "start|intermediate|end",
    "gatewayType": "exclusive|parallel|inclusive|event-based|complex",
    "taskType": "user|service|manual|script|business-rule|send|receive",
    "dataType": "input|output|collection|storage|reference"
  }
}

Only include properties that are relevant to the suggested node type.`;

      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: this.defaultModel,
        messages: [
          { 
            role: "system", 
            content: "You are an expert BPMN process designer who provides intelligent suggestions for process modeling. Always respond with valid JSON." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3, // Lower temperature for more consistent suggestions
        ...this.getReasoningConfig()
      }, {
        headers: this.getSafeHeaders({
          'HTTP-Referer': 'https://airlane-bpmn.local',
          'X-Title': 'AI Smart Node Suggestion'
        })
      });

      const responseContent = response.data.choices[0].message.content;
      console.log('🤖 AI suggestion raw response:', responseContent);

      // Parse the JSON response
      let suggestion;
      try {
        // Extract JSON from the response (in case it's wrapped in markdown)
        const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : responseContent;
        suggestion = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('❌ Failed to parse AI suggestion JSON:', parseError);
        // Fallback suggestion
        suggestion = this.getFallbackSuggestion(sourceNode);
      }

      // Validate and clean the suggestion
      suggestion = this.validateSuggestion(suggestion);
      
      console.log('✅ AI node suggestion generated:', suggestion);
      return suggestion;
    } catch (error) {
      console.error('❌ AI Node Suggestion Error:', error.response?.data || error.message);
      // Return fallback suggestion instead of throwing
      const sourceNode = currentProcess.elements.find(el => el.id === sourceNodeId);
      return this.getFallbackSuggestion(sourceNode);
    }
  }

  // Helper method to create fallback suggestions
  getFallbackSuggestion(sourceNode) {
    if (!sourceNode) {
      return {
        nodeType: 'process',
        label: 'Process Task',
        reasoning: 'Default suggestion when source node not found',
        confidence: 0.5,
        direction: 'right'
      };
    }

    switch (sourceNode.type) {
      case 'event':
        if (sourceNode.properties?.eventType === 'start') {
                  return {
          nodeType: 'process',
          label: 'First Process Step',
          reasoning: 'Start events need a first business activity',
          confidence: 0.8,
          direction: 'right',
          properties: { taskType: 'user' }
        };
        }
        return {
          nodeType: 'event',
          subType: 'end',
          label: 'End Event',
          reasoning: 'Completes the process flow',
          confidence: 0.7,
          direction: 'right',
          properties: { eventType: 'end' }
        };
        
      case 'process':
        return {
          nodeType: 'gateway',
          subType: 'exclusive',
          label: 'Decision Gateway',
          reasoning: 'Tasks often need decision points',
          confidence: 0.6,
          direction: 'right',
          properties: { gatewayType: 'exclusive' }
        };
        
      case 'gateway':
        return {
          nodeType: 'process',
          label: 'Process Task',
          reasoning: 'Gateways split to activities',
          confidence: 0.7,
          direction: 'down',
          properties: { taskType: 'user' }
        };
        
      default:
        return {
          nodeType: 'process',
          label: 'Process Task',
          reasoning: 'Standard activity',
          confidence: 0.5,
          direction: 'right',
          properties: { taskType: 'user' }
        };
    }
  }

  // New method for node naming suggestions
  async suggestNodeNames(context, additionalContext, bpmnXml) {
    console.log('🏷️ Generating naming suggestions for:', context.targetNodeId);
    
    // Build a comprehensive prompt with raw BPMN XML schema
    const prompt = `You are a BPMN expert helping to suggest better names for process elements based on the complete BPMN process schema.

**COMPLETE BPMN XML SCHEMA:**
${bpmnXml || 'BPMN XML not available'}

**TARGET NODE TO RENAME:**
- Current Name: "${context.currentName}"
- Node Type: ${context.nodeType}
- Node ID: ${context.targetNodeId}
- Position in Flow: ${context.processContext}
${context.properties ? `- Properties: ${JSON.stringify(context.properties)}` : ''}

**IMMEDIATE CONTEXT:**
- Comes After: ${(context.predecessors || []).map(p => `"${p.label}" (${p.type})`).join(', ') || 'Process Start'}
- Leads To: ${(context.successors || []).map(s => `"${s.label}" (${s.type})`).join(', ') || 'Process End'}

**BUSINESS CONTEXT:** ${additionalContext}

**ANALYSIS INSTRUCTIONS:**
1. **Parse the BPMN XML** above to understand the complete business process structure
2. **Identify the target node** with ID "${context.targetNodeId}" in the XML
3. **Analyze the business context** by examining:
   - Process name and documentation elements
   - Task types (userTask, serviceTask, etc.)
   - Gateway types and decision points
   - Event types and triggers
   - Sequence flows and process logic
   - Lane assignments and participants

**BUSINESS PROCESS ANALYSIS:**
Based on the BPMN XML schema, determine:
- What type of business process this represents (e.g., customer onboarding, order fulfillment, approval workflow, etc.)
- What business domain/industry this process serves
- What the overall business objective is
- Where the target node fits in the business workflow

**TASK:** Suggest 3-4 contextually appropriate professional names for the target node "${context.currentName}" (ID: ${context.targetNodeId}) based on:
- The complete BPMN process context from the XML
- Industry-standard BPMN and business terminology  
- The node's position and role in the business workflow
- What business stakeholders would understand this step to be
- Standard naming patterns for this type of BPMN element

**REQUIREMENTS:**
- Names must be 2-5 words maximum
- Use professional business language
- Make names specific to the business context
- Avoid generic terms like "Task 1" or "Process Step"

Respond with a JSON object in this exact format:
{
  "suggestions": ["Business Action Name", "Professional Activity", "Contextual Task Name", "Specific Process Step"],
  "reasoning": "Brief explanation of why these names fit the business context (1-2 sentences max)",
  "confidence": 0.8,
  "context": "Business analysis approach used"
}`;

    try {
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: this.defaultModel,
        messages: [
          { 
            role: 'system', 
            content: 'You are a BPMN naming expert. Provide clear, professional node name suggestions.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const aiResponse = response.data.choices[0].message.content;
      console.log('🏷️ Raw AI naming response:', aiResponse);

      // Parse JSON response (handle potential markdown wrapping)
      let suggestion;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : aiResponse;
        suggestion = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('❌ Failed to parse AI naming response:', parseError);
        throw new Error('Invalid AI response format');
      }

      // Validate and clean the suggestion
      const validatedSuggestion = this.validateNamingSuggestion(suggestion);
      console.log('✅ Validated naming suggestion:', validatedSuggestion);
      
      return validatedSuggestion;
    } catch (error) {
      console.error('❌ AI naming service error:', error.message);
      
      // Fallback to heuristic-based suggestions
      return this.getFallbackNamingSuggestion(context);
    }
  }

  // Helper method to get fallback naming suggestions
  getFallbackNamingSuggestion(context) {
    console.log('🏷️ Using fallback naming suggestions for:', context.nodeType);
    
    let suggestions = [];
    let reasoning = '';
    
    switch (context.nodeType) {
      case 'process':
        suggestions = ['Process Task', 'Complete Step', 'Execute Activity', 'Perform Action'];
        reasoning = 'Generic task names based on common process patterns';
        break;
      case 'event':
        if (context.properties?.eventType === 'start') {
          suggestions = ['Process Started', 'Request Received', 'Case Opened', 'Workflow Initiated'];
        } else if (context.properties?.eventType === 'end') {
          suggestions = ['Process Completed', 'Request Fulfilled', 'Case Closed', 'Workflow Finished'];
        } else {
          suggestions = ['Event Occurred', 'Status Changed', 'Milestone Reached', 'Signal Received'];
        }
        reasoning = 'Standard event naming based on event type and common patterns';
        break;
      case 'gateway':
        if (context.properties?.gatewayType === 'exclusive') {
          suggestions = ['Decision Point', 'Approval Required?', 'Route Selection', 'Check Condition'];
        } else if (context.properties?.gatewayType === 'parallel') {
          suggestions = ['Parallel Split', 'Concurrent Start', 'Multi-track Processing', 'Parallel Merge'];
        } else {
          suggestions = ['Process Gateway', 'Flow Control', 'Decision Hub', 'Route Manager'];
        }
        reasoning = 'Gateway names based on type and decision logic patterns';
        break;
      case 'data-object':
        suggestions = ['Process Data', 'Information Object', 'Document', 'Data Asset'];
        reasoning = 'Generic data object names for information handling';
        break;
      default:
        suggestions = ['Process Element', 'BPMN Component', 'Workflow Item', 'Process Node'];
        reasoning = 'Fallback names for unknown element types';
    }

    return {
      suggestions: suggestions.slice(0, 4),
      reasoning,
      confidence: 0.6,
      context: 'Heuristic-based fallback suggestions'
    };
  }

  // Helper method to validate and clean naming suggestions
  validateNamingSuggestion(suggestion) {
    // Ensure required fields exist
    if (!suggestion.suggestions || !Array.isArray(suggestion.suggestions)) {
      suggestion.suggestions = ['Improved Name', 'Better Label', 'Clear Title'];
    }
    
    if (!suggestion.reasoning || typeof suggestion.reasoning !== 'string') {
      suggestion.reasoning = 'AI-generated naming suggestions based on context';
    }
    
    if (!suggestion.confidence || typeof suggestion.confidence !== 'number') {
      suggestion.confidence = 0.7;
    }
    
    if (!suggestion.context || typeof suggestion.context !== 'string') {
      suggestion.context = 'Context-aware naming analysis';
    }

    // Ensure suggestions are clean and reasonable
    suggestion.suggestions = suggestion.suggestions
      .filter(name => name && typeof name === 'string' && name.length > 0)
      .map(name => name.trim())
      .slice(0, 4); // Maximum 4 suggestions

    // Ensure confidence is between 0 and 1
    suggestion.confidence = Math.max(0, Math.min(1, suggestion.confidence));

    // Truncate reasoning if too long
    if (suggestion.reasoning.length > 200) {
      suggestion.reasoning = suggestion.reasoning.substring(0, 200) + '...';
    }

    return suggestion;
  }

  // Helper method to validate and clean suggestions
  validateSuggestion(suggestion) {
    const validNodeTypes = ['process', 'event', 'gateway', 'data-object'];
    const validDirections = ['up', 'down', 'left', 'right'];

    // Ensure required fields exist and are valid
    if (!validNodeTypes.includes(suggestion.nodeType)) {
      suggestion.nodeType = 'process';
    }
    
    if (!validDirections.includes(suggestion.direction)) {
      suggestion.direction = 'right';
    }

    if (!suggestion.label) {
      suggestion.label = 'Suggested Node';
    }

    if (!suggestion.reasoning) {
      suggestion.reasoning = 'AI suggested this as the next logical step';
    }

    if (typeof suggestion.confidence !== 'number' || suggestion.confidence < 0 || suggestion.confidence > 1) {
      suggestion.confidence = 0.7;
    }

    return suggestion;
  }

  async summarizeProcess(process) {
      try {
        console.log('📝 Starting process summarization');
        const prompt = `You are an expert BPMN process analyst. Analyze the following BPMN process model and provide a very concise, one-paragraph summary (maximum 3-4 sentences). 
        
        Your summary should describe the main purpose, key stages, and primary outcome of the process. 
        
        CRITICAL: Respond ONLY with the plain text summary. Do not use formatting, markdown, lists, or introductory phrases like "This process describes...".
  
        Process Model:
        ${JSON.stringify(process, null, 2)}`;
        
        const response = await axios.post(`${this.baseURL}/chat/completions`, {
          model: this.defaultModel,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          max_tokens: 150,
        }, {
          headers: this.getSafeHeaders({
            'HTTP-Referer': 'https://signavio.vercel.app',
            'X-Title': 'BPMN Process Modeling Tool'
          })
        });
        
        const summary = response.data.choices[0].message.content.trim();
        console.log('✅ Summarization complete:', summary);
        return summary;
  
      } catch (error) {
        console.error('Process Summarization Error:', error.response?.data || error.message);
        throw new Error(`Process summarization failed: ${error.response?.data?.error?.message || error.message}`);
      }
  }

  // Analyze current schema and provide suggestions (direct API call, no tools)
  async analyzeSchema(schema) {
    try {
      console.log('🔍 Starting schema analysis');
      console.log('📊 Schema input:', JSON.stringify(schema, null, 2));
      
      const prompt = `You are a database expert. Analyze this database schema and provide human-readable suggestions for improvements.

Schema:
${JSON.stringify(schema, null, 2)}

Please provide a detailed analysis covering:

1. **Overall Assessment:** Brief summary of the schema quality
2. **Potential Issues:** Any problems or concerns you identify
3. **Missing Indexes:** Suggested indexes for better performance
4. **Normalization:** Any normalization improvements needed
5. **Performance Considerations:** Tips for better performance

Respond with plain text analysis, not as a tool call.`;

      // Make direct API call without tool options to avoid triggering function calls
      const requestBody = {
        model: this.defaultModel,
        messages: [
          {
            role: 'system',
            content: 'You are a database design expert. Provide helpful analysis and suggestions in plain text format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        ...this.getReasoningConfig()
      };
      
      console.log('🔍 Analysis request model:', this.defaultModel);
      console.log('📤 Sending analysis request to:', this.baseURL);

      const response = await axios.post(`${this.baseURL}/chat/completions`, requestBody, {
        headers: this.getSafeHeaders(),
      });

      console.log('📥 Analysis response status:', response.status);
      console.log('📋 Analysis response data:', JSON.stringify(response.data, null, 2));

      const analysis = response.data.choices[0]?.message?.content;
      
      console.log('✅ Analysis content received:', !!analysis);
      console.log('📏 Analysis length:', analysis?.length || 0);
      console.log('📝 Analysis preview:', analysis?.substring(0, 100) + '...');
      console.log('🔍 Raw analysis value:', JSON.stringify(analysis));
      console.log('🔍 Analysis type:', typeof analysis);
      
      if (!analysis) {
        console.error('❌ No analysis content - response.data.choices[0]:', response.data.choices[0]);
        throw new Error('No analysis content received from AI');
      }
      
      console.log('🎯 Returning analysis:', analysis);
      return analysis;
    } catch (error) {
      console.error('Schema analysis error:', error.response?.data || error.message);
      throw new Error(`Schema analysis failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

module.exports = AIService;