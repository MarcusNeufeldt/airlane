const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

export interface ProcessModel {
  elements: ProcessElement[];
  flows: ProcessFlow[];
}

export interface ProcessElement {
  id: string;
  type: 'process' | 'event' | 'gateway' | 'lane' | 'pool' | 'data-object';
  label: string;
  description?: string;
  position: {
    x: number;
    y: number;
  };
  properties?: {
    eventType?: 'start' | 'intermediate' | 'end';
    processType?: 'task' | 'subprocess';
    taskType?: 'user' | 'service' | 'manual' | 'script' | 'business-rule' | 'send' | 'receive';
    gatewayType?: 'exclusive' | 'parallel' | 'inclusive' | 'event-based' | 'complex';
    dataType?: 'input' | 'output' | 'collection';
    participant?: string;
    assignee?: string;
    performer?: string;
    state?: string;
  };
}

export interface ProcessFlow {
  id: string;
  type: 'sequence-flow' | 'message-flow' | 'association';
  source: string;
  target: string;
  label?: string;
  condition?: string;
  isDefault?: boolean;
  messageType?: string;
}

// Legacy interfaces for backward compatibility
export interface DatabaseSchema {
  tables: Table[];
  relationships: Relationship[];
}

export interface Table {
  name: string;
  description?: string;
  columns: Column[];
  indexes?: Index[];
  compositePrimaryKey?: string[];
}

export interface Column {
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isNullable: boolean;
  isUnique?: boolean;
  hasIndex?: boolean;
  checkConstraint?: string;
  defaultValue?: string;
  description?: string;
}

export interface Index {
  name: string;
  columns: string[];
  unique: boolean;
  type?: 'btree' | 'hash' | 'gin' | 'gist';
}

export interface Relationship {
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
  type: '1:1' | '1:N' | 'N:N';
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  name?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

class AIService {
  // New method for fetching chat history for a specific diagram
  async getChatHistory(diagramId: string): Promise<ChatMessage[]> {
    const url = `${API_BASE_URL}/diagram-chat?id=${diagramId}`;
    console.log(`📞 Fetching chat history from URL: ${url}`);
    console.log(`📞 API_BASE_URL: ${API_BASE_URL}`);
    console.log(`📞 Diagram ID: ${diagramId}`);
    
    const response = await fetch(url);
    console.log(`📞 Response status: ${response.status}`);
    console.log(`📞 Response headers:`, response.headers);
    
    if (!response.ok) {
      const text = await response.text();
      console.error(`📞 Error response text:`, text.substring(0, 200));
      throw new Error(`Failed to fetch chat history: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`📞 Parsed response data:`, data);
    
    // Convert date strings to Date objects
    return data.map((msg: any) => ({ 
      ...msg, 
      timestamp: new Date(msg.createdAt || msg.timestamp) 
    }));
  }

  // New method for posting messages to the stateful chat endpoint
  async postChatMessage(diagramId: string, message: string, currentProcess?: ProcessModel, images?: string[]): Promise<any> {
    console.log(`💬 Posting message to diagram ${diagramId}:`, message.substring(0, 100));
    if (images && images.length > 0) {
      console.log(`🖼️ Including ${images.length} images in request`);
    }
    
    const response = await fetch(`${API_BASE_URL}/diagram-chat?id=${diagramId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, currentProcess, images }),
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.error || 'Failed to chat with AI');
        } catch(e) {
            throw new Error(`Failed to chat with AI: ${errorText}`);
        }
    }
    
    const data = await response.json();
    console.log('💬 Stateful chat response:', data);
    return data;
  }

  // New method for clearing chat history
  async clearChatHistory(diagramId: string): Promise<{ success: boolean; deletedCount: number }> {
    console.log(`🗑️ Clearing chat history for diagram ${diagramId}`);
    
    const response = await fetch(`${API_BASE_URL}/diagram-chat?id=${diagramId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.error || 'Failed to clear chat history');
        } catch(e) {
            throw new Error(`Failed to clear chat history: ${errorText}`);
        }
    }
    
    const data = await response.json();
    console.log('🗑️ Chat history cleared:', data);
    return { success: data.success, deletedCount: data.deletedCount };
  }

  async summarizeProcess(process: ProcessModel): Promise<string> {
      console.log('📝 Requesting process summary from backend...');
      const response = await fetch(`${API_BASE_URL}/summarize-process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ process }),
      });
  
      if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to summarize process');
      }
  
      const data = await response.json();
      console.log('✅ Received summary:', data.summary);
      return data.summary;
  }

  async generateProcess(prompt: string, existingProcess?: ProcessModel): Promise<ProcessModel> {
    console.log('🔄 generateProcess called with prompt:', prompt);
    console.log('🔄 Existing process provided:', !!existingProcess);
    
    try {
      const response = await fetch(`${API_BASE_URL}/generate-process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          existingProcess,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Generate process failed:', error);
        throw new Error(error.error || 'Failed to generate process');
      }

      const data = await response.json();
      console.log('📦 Generate process response:', data);
      
      if (!data.process) {
        console.error('❌ No process in response, full data:', data);
        throw new Error('No process returned from API');
      }
      
      return data.process;
    } catch (error) {
      console.log('❌ Backend not available, generating sample process');
      // Fallback: generate a simple sample process
      return this.generateSampleProcess(prompt);
    }
  }

  private generateSampleProcess(prompt: string): ProcessModel {
    // Create a simple sample process based on the prompt
    const processName = prompt.toLowerCase().includes('onboarding') ? 'Customer Onboarding' :
                       prompt.toLowerCase().includes('order') ? 'Order Fulfillment' :
                       'Sample Process';
    
    return {
      elements: [
        {
          id: 'start-1',
          type: 'event',
          label: 'Start',
          position: { x: 100, y: 200 },
          properties: { eventType: 'start' }
        },
        {
          id: 'task-1',
          type: 'process',
          label: `${processName} Task`,
          position: { x: 250, y: 200 },
          properties: { processType: 'task', taskType: 'user' }
        },
        {
          id: 'end-1',
          type: 'event',
          label: 'End',
          position: { x: 400, y: 200 },
          properties: { eventType: 'end' }
        }
      ],
      flows: [
        {
          id: 'flow-1',
          type: 'sequence-flow',
          source: 'start-1',
          target: 'task-1'
        },
        {
          id: 'flow-2',
          type: 'sequence-flow',
          source: 'task-1',
          target: 'end-1'
        }
      ]
    };
  }

  // Legacy method for backward compatibility
  async generateSchema(prompt: string, existingSchema?: DatabaseSchema): Promise<DatabaseSchema> {
    console.log('🔄 generateSchema called with prompt:', prompt);
    console.log('🔄 Existing schema provided:', !!existingSchema);
    
    const response = await fetch(`${API_BASE_URL}/generate-schema`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        existingSchema,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Generate schema failed:', error);
      throw new Error(error.error || 'Failed to generate schema');
    }

    const data = await response.json();
    console.log('📦 Generate schema response:', data);
    
    if (!data.schema) {
      console.error('❌ No schema in response, full data:', data);
      throw new Error('No schema returned from API');
    }
    
    return data.schema;
  }

  async chatAboutProcess(
    message: string,
    currentProcess?: ProcessModel,
    conversationHistory: ChatMessage[] = []
  ): Promise<{ type: 'message' | 'tool_call'; content?: string; tool_call?: any; message?: string; process?: ProcessModel }> {
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          currentProcess,
          conversationHistory: conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!response.ok) {
          const errorText = await response.text();
          try {
              const errorJson = JSON.parse(errorText);
              throw new Error(errorJson.error || 'Failed to chat with AI');
          } catch (e) {
              throw new Error(`Failed to chat with AI: ${errorText}`);
          }
      }

      const data = await response.json();
      console.log('🌐 Raw API response:', data);
      console.log('🌐 Response has process?', !!data.process);
      console.log('🌐 Response has content?', !!data.content);
      
      // Backend returns either:
      // 1. { content: "message" } for simple messages
      // 2. { process: {...}, content: "message" } for process modifications
      // 3. { response: { type: "tool_call", ... } } for tool calls (not currently used)
      
      // If there's a process in the response, include it
      if (data.process) {
        console.log('🌐 Returning response with process');
        return {
          type: 'message',
          content: data.content,
          process: data.process
        };
      }
      
      // Otherwise return as a simple message
      console.log('🌐 Returning simple message response');
      return {
        type: 'message',
        content: data.content || data.message || 'I understand your request.'
      };
    } catch (error) {
      console.log('❌ Backend not available, using fallback response');
      // Fallback: return a helpful message when backend is not available
      return {
        type: 'message',
        content: `I understand you want to ${message.toLowerCase()}. However, I need a backend AI service to provide intelligent responses. For now, you can use the Quick Actions below to generate sample processes, or try the legacy schema tools if available.`
      };
    }
  }

  // Legacy method for backward compatibility
  async chatAboutSchema(
    message: string,
    currentSchema?: DatabaseSchema,
    conversationHistory: ChatMessage[] = []
  ): Promise<{ type: 'message' | 'tool_call'; content?: string; tool_call?: any; message?: string; schema?: DatabaseSchema }> {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        currentSchema,
        conversationHistory: conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
      }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.error || 'Failed to chat with AI');
        } catch (e) {
            throw new Error(`Failed to chat with AI: ${errorText}`);
        }
    }

    const data = await response.json();
    console.log('🌐 Raw API response:', data);
    console.log('🌐 Response has schema?', !!data.schema);
    console.log('🌐 Response has content?', !!data.content);
    
    // Backend returns either:
    // 1. { content: "message" } for simple messages
    // 2. { schema: {...}, content: "message" } for schema modifications
    // 3. { response: { type: "tool_call", ... } } for tool calls (not currently used)
    
    // If there's a schema in the response, include it
    if (data.schema) {
      console.log('🌐 Returning response with schema');
      return {
        type: 'message',
        content: data.content,
        schema: data.schema
      };
    }
    
    // Otherwise return as a simple message
    console.log('🌐 Returning simple message response');
    return {
      type: 'message',
      content: data.content || data.message || 'I understand your request.'
    };
  }

  async analyzeProcess(process: ProcessModel): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/analyze-process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ process }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to analyze process');
      }

      const data = await response.json();
      return data.content;
    } catch (error) {
      console.log('❌ Backend not available, providing sample analysis');
      // Fallback: provide a basic analysis
      return `## Process Analysis (Sample)

**Overall Assessment:** 
Your process contains ${process.elements.length} elements and ${process.flows.length} flows.

**Elements Found:**
${process.elements.map(e => `- ${e.type}: ${e.label}`).join('\n')}

**BPMN Compliance:**
- ✅ Process has elements and flows
- ⚠️  Full AI analysis requires backend service

**Recommendations:**
- Consider adding more descriptive labels
- Ensure proper start and end events
- Validate sequence flow connections

*Note: This is a basic analysis. Connect to the AI backend for detailed BPMN compliance checking and optimization suggestions.*`;
    }
  }

  // Legacy method for backward compatibility
  async analyzeSchema(schema: DatabaseSchema): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/analyze-schema`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ schema }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to analyze schema');
    }

    const data = await response.json();
    return data.content;
  }
}

export const aiService = new AIService();