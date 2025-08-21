const axios = require('axios');
require('dotenv').config();

class AIService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseURL = process.env.OPENROUTER_BASE_URL;
    this.defaultModel = process.env.DEFAULT_AI_MODEL || 'anthropic/claude-3.5-sonnet';
    
    console.log('🔧 AIService constructor');
    console.log('🔑 API Key exists:', !!this.apiKey);
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
                enum: ["process", "event", "gateway", "lane", "pool", "data-object"],
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
                  state: { type: "string", description: "Data object state" }
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
- Organize related activities in lanes by role or department
- Use pools to separate different participants or organizations
- Position elements logically from left to right following process flow

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
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Process Pipeline Creator'
        }
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
      // Check if any previous messages mention images
      const conversationMentionsImages = conversationHistory.some(msg => 
        msg.content && msg.content.includes('[User attached') && msg.content.includes('image(s)]')
      );
      
      const systemPrompt = `You are an expert AI assistant embedded within a **visual, web-based BPMN process modeling tool**. Your name is "Process Modeler AI".

Your primary role is to help users design and modify business processes by interacting with a visual canvas.${(images && images.length > 0) || conversationMentionsImages ? ' You have vision capabilities and can analyze images. You may have already analyzed images in this conversation.' : ''}

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
        const intentPrompt = `You are Data Modeler AI, an assistant embedded in a visual database diagramming tool. Analyze this user message and determine their intent:

User message: "${userMessage}"

Current schema exists: ${currentSchema ? 'Yes' : 'No'}

Respond with ONLY ONE of these exact phrases:
- "GENERATE_SCHEMA" - if they want to create a new schema
- "MODIFY_SCHEMA" - if they want to change the existing schema  
- "ANALYZE_SCHEMA" - if they want analysis only
- "CHAT" - if it's a general question

Intent:`;

        const intentResponse = await axios.post(`${this.baseURL}/chat/completions`, {
          model: this.defaultModel,
          messages: [{ role: "user", content: intentPrompt }],
          temperature: 0.1,
          ...this.getReasoningConfig()
        }, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'Database Diagram Tool'
          }
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
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'http://localhost:3000',
              'X-Title': 'Database Diagram Tool'
            }
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
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://signavio-clone.local',
          'X-Title': 'BPMN Process Modeling Tool'
        }
      });

      console.log('✅ Process analysis complete');
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Process Analysis Error:', error.response?.data || error.message);
      throw new Error(`Process analysis failed: ${error.response?.data?.error?.message || error.message}`);
    }
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
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://signavio.vercel.app',
            'X-Title': 'BPMN Process Modeling Tool'
          }
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
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
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