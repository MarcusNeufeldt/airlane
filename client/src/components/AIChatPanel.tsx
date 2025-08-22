import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, RefreshCw, RotateCcw, Paperclip, X } from 'lucide-react';
import { aiService, ChatMessage, ProcessModel } from '../services/aiService';
import { useDiagramStore } from '../stores/diagramStore';

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<Array<{file: File, preview: string}>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { 
    nodes, 
    edges, 
    importDiagram,
    flashTable,
    isReadOnly,
    currentDiagramId,
    addStickyNote
  } = useDiagramStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat with greeting message (no backend for now)
  useEffect(() => {
    if (isOpen && currentDiagramId) {
      console.log(`📜 Loading chat history for diagram: ${currentDiagramId}`);
      setIsLoading(true);
      aiService.getChatHistory(currentDiagramId)
        .then(history => {
          console.log(`📜 Loaded ${history.length} chat messages`);
          if (history.length === 0) {
            setMessages([{
              role: 'assistant',
              content: "Hi! I'm Process Modeler AI, your intelligent assistant for this visual BPMN process modeling tool. I can help you create business processes, modify tasks and flows on the canvas, and analyze your process designs. I understand the visual connections between your process elements and will help maintain them as we work together. What process would you like to model today?",
              timestamp: new Date()
            }]);
          } else {
            setMessages(history);
          }
        })
        .catch(err => {
          console.error('❌ Error loading chat history:', err);
          const errorMessage: ChatMessage = {
            role: 'assistant',
            content: `Error loading chat history: ${err.message}. Starting fresh conversation.`,
            timestamp: new Date()
          };
          setMessages([errorMessage]);
        })
        .finally(() => setIsLoading(false));
    } else if (isOpen && !currentDiagramId) {
      setMessages([{
        role: 'assistant',
        content: "Please open a diagram to start chatting with the AI assistant.",
        timestamp: new Date()
      }]);
    }
  }, [isOpen, currentDiagramId]);

  // Convert current diagram to ProcessModel format
  const getCurrentProcess = (): ProcessModel | undefined => {
    if (nodes.length === 0) return undefined;

    const elements = nodes.map(node => {
      const element: any = {
        id: node.id,
        type: node.data.nodeType,
        label: node.data.label || node.data.name || '',
        description: node.data.description,
        position: {
          x: node.position.x,
          y: node.position.y
        },
        properties: {}
      };

      // Add type-specific properties
      if (node.data.nodeType === 'event') {
        element.properties.eventType = node.data.eventType;
      } else if (node.data.nodeType === 'process') {
        element.properties.processType = node.data.processType;
        element.properties.taskType = node.data.taskType;
        element.properties.performer = node.data.performer;
        element.properties.assignee = node.data.assignedLane;
      } else if (node.data.nodeType === 'gateway') {
        element.properties.gatewayType = node.data.gatewayType;
      } else if (node.data.nodeType === 'data-object') {
        element.properties.dataType = node.data.dataType;
        element.properties.state = node.data.state;
      } else if (node.data.nodeType === 'pool') {
        element.properties.participant = node.data.participant;
      } else if (node.data.nodeType === 'lane') {
        element.properties.assignee = node.data.assignee;
      }

      return element;
    });

    const flows = edges.map(edge => {
      const flow: any = {
        id: edge.id,
        type: edge.type === 'foreign-key' ? 'sequence-flow' : edge.type,
        source: edge.source,
        target: edge.target,
        label: edge.data?.label
      };

      // Add flow-specific properties
      if (edge.data?.condition) {
        flow.condition = edge.data.condition;
      }
      if (edge.data?.isDefault) {
        flow.isDefault = edge.data.isDefault;
      }
      if (edge.data?.messageType) {
        flow.messageType = edge.data.messageType;
      }

      return flow;
    });

    return { elements, flows };
  };

  // Apply process changes to the canvas
  const applyProcessChanges = (processModel: ProcessModel, isModification: boolean = false) => {
    console.log('🔄 applyProcessChanges called:', { isModification, nodeCount: nodes.length, processModel });

    if (!isModification || nodes.length === 0) {
      // Full replacement mode
      const newNodes = processModel.elements.map((element) => ({
        id: element.id,
        type: element.type as any,
        position: element.position,
        data: {
          id: element.id,
          nodeType: element.type,
          label: element.label,
          description: element.description,
          ...element.properties
        },
      }));
      
      const newEdges = processModel.flows.map(flow => ({
        id: flow.id,
        type: flow.type,
        source: flow.source,
        target: flow.target,
        data: {
          label: flow.label,
          condition: flow.condition,
          isDefault: flow.isDefault,
          messageType: flow.messageType
        }
      }));
      
      console.log('🔄 Applying full process replacement to canvas:', { nodes: newNodes.length, edges: newEdges.length });
      importDiagram({ nodes: newNodes, edges: newEdges });
      newNodes.forEach(node => {
        flashTable(node.id);
      });
      return;
    }

    // Incremental modification mode
    const currentProcess = getCurrentProcess();
    if (!currentProcess) {
      // Fallback if we can't get current state
      applyProcessChanges(processModel, false);
      return;
    }
    
    console.log('🔄 Performing atomic incremental update for process model');
    const finalState = computeFinalProcessState(currentProcess, processModel);
    
    console.log('✅ Final state computed:', { nodes: finalState.nodes.length, edges: finalState.edges.length, affected: finalState.affectedElementIds.length });
    importDiagram({ nodes: finalState.nodes, edges: finalState.edges });
    finalState.affectedElementIds.forEach(id => {
      flashTable(id);
    });
  };

  // Compute the final process state for incremental modifications
  const computeFinalProcessState = (currentProcess: ProcessModel, newProcess: ProcessModel) => {
    const currentNodes = [...nodes];
    const currentEdges = [...edges];
    const affectedElementIds: string[] = [];

    // Create lookup maps for the new process
    const newElementsByLabel = new Map(newProcess.elements.map(e => [e.label, e]));
    const elementLabelToId = new Map(currentNodes.map(n => [n.data.label, n.id]));

    // Track existing elements and update them if they exist in the new process
    const finalNodes = currentNodes.map((node) => {
      const newElement = newElementsByLabel.get(node.data.label);
      if (newElement) {
        // Update existing element data
        affectedElementIds.push(node.id);
        return {
          ...node,
          data: {
            ...node.data,
            label: newElement.label,
            description: newElement.description,
            ...newElement.properties
          }
        };
      }
      return node;
    });

    // Add new elements that don't exist in current process
    newProcess.elements.forEach((newElement) => {
      if (!elementLabelToId.has(newElement.label)) {
        const newNode = {
          id: newElement.id || `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: newElement.type as any,
          position: newElement.position,
          data: {
            id: newElement.id,
            nodeType: newElement.type,
            label: newElement.label,
            description: newElement.description,
            ...newElement.properties
          },
        };
        finalNodes.push(newNode);
        elementLabelToId.set(newElement.label, newNode.id);
        affectedElementIds.push(newNode.id);
      }
    });

    // Handle flows/edges
    const finalEdges = [...currentEdges];
    
    // Create a set of current flow keys for comparison
    const currentFlowKeys = new Set(currentEdges.map(edge => `${edge.source}->${edge.target}`));

    // Add new flows from the AI model
    newProcess.flows.forEach((newFlow) => {
      const sourceElement = newProcess.elements.find(e => e.id === newFlow.source);
      const targetElement = newProcess.elements.find(e => e.id === newFlow.target);
      if (sourceElement && targetElement) {
        const sourceNodeId = elementLabelToId.get(sourceElement.label);
        const targetNodeId = elementLabelToId.get(targetElement.label);
        if (sourceNodeId && targetNodeId) {
          const flowKey = `${sourceNodeId}->${targetNodeId}`;
          if (!currentFlowKeys.has(flowKey)) {
            console.log(`+ Adding new flow: ${sourceElement.label} -> ${targetElement.label}`);
            const newEdge = {
              id: newFlow.id || `edge-${Date.now()}-${finalEdges.length}`,
              type: newFlow.type,
              source: sourceNodeId,
              target: targetNodeId,
              data: {
                label: newFlow.label,
                condition: newFlow.condition,
                isDefault: newFlow.isDefault,
                messageType: newFlow.messageType,
              },
            };
            finalEdges.push(newEdge);
          }
        }
      }
    });

    return { nodes: finalNodes, edges: finalEdges, affectedElementIds };
  };

  const handleSendMessage = async () => {
    if ((!inputMessage.trim() && uploadedImages.length === 0) || isLoading || !currentDiagramId) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage + (uploadedImages.length > 0 ? `[${uploadedImages.length} image(s) attached]` : ''),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    const currentInput = inputMessage;
    const currentImages = uploadedImages;
    setInputMessage('');
    setUploadedImages([]);
    setIsLoading(true);

    try {
      const currentProcess = getCurrentProcess();
      console.log('🎯 Sending message to AI via stateful chat:', currentInput);
      console.log('📊 Current process:', currentProcess);
      console.log('📍 Diagram ID:', currentDiagramId);
      console.log('🖼️ Images attached:', currentImages.length);

      const imageDataUrls = await Promise.all(currentImages.map(img => convertImageToBase64(img.file)));

      // This is the key change: use the stateful endpoint
      const response = await aiService.postChatMessage(currentDiagramId, currentInput, currentProcess, imageDataUrls);
      
      console.log('📦 Response from stateful chat:', response);

      if (response.process) {
        console.log('🎨 Process modification detected!');
        const isModification = !!getCurrentProcess();
        applyProcessChanges(response.process, isModification);
      }

      if (response.content) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.content,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      }

    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateProcess = async (prompt: string) => {
    setIsGenerating(true);
    try {
      const currentProcess = getCurrentProcess();
      const process = await aiService.generateProcess(prompt, currentProcess);
      
      // Apply the generated process to the canvas
      applyProcessChanges(process, !!currentProcess);

      const successMessage: ChatMessage = {
        role: 'assistant',
        content: `✅ I've generated and applied a new process to your canvas with ${process.elements.length} elements and ${process.flows.length} flows. The process includes: ${process.elements.map(e => e.label).join(', ')}.`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, successMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Failed to generate process: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnalyzeProcess = async () => {
    const currentProcess = getCurrentProcess();
    if (!currentProcess) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'No process to analyze. Please create some process elements first.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    setIsLoading(true);
    try {
      const analysis = await aiService.analyzeProcess(currentProcess);
      
      const analysisMessage: ChatMessage = {
        role: 'assistant',
        content: `📊 **Process Analysis:**\n\n${analysis}`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, analysisMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Failed to analyze process: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSummarizeProcess = async () => {
      const currentProcess = getCurrentProcess();
      if (!currentProcess || currentProcess.elements.length === 0) {
          const errorMessage: ChatMessage = {
              role: 'assistant',
              content: 'There is no process on the canvas to summarize. Please add some elements first.',
              timestamp: new Date(),
          };
          setMessages(prev => [...prev, errorMessage]);
          return;
      }

      setIsGenerating(true);
      const thinkingMessage: ChatMessage = {
          role: 'assistant',
          content: 'Analyzing your process to create a summary...',
          timestamp: new Date(),
      };
      setMessages(prev => [...prev, thinkingMessage]);

      try {
          const summary = await aiService.summarizeProcess(currentProcess);

          // Find a good position for the sticky note (e.g., near the start event)
          const startEvent = nodes.find(n => n.type === 'event' && n.data.eventType === 'start');
          const position = startEvent 
              ? { x: startEvent.position.x - 220, y: startEvent.position.y } 
              : { x: 50, y: 50 };

          addStickyNote(position, summary);
          
          const successMessage: ChatMessage = {
              role: 'assistant',
              content: `✅ I've summarized the process and added it to a sticky note on your canvas.`,
              timestamp: new Date(),
          };
          setMessages(prev => [...prev, successMessage]);

      } catch (error) {
          const errorMessage: ChatMessage = {
              role: 'assistant',
              content: `Failed to summarize the process: ${error instanceof Error ? error.message : 'Unknown error'}`,
              timestamp: new Date(),
          };
          setMessages(prev => [...prev, errorMessage]);
      } finally {
          setIsGenerating(false);
      }
  };

  const handleResetChat = async () => {
    if (!currentDiagramId) {
      console.warn('No diagram ID available for resetting chat');
      return;
    }
    if (!window.confirm('Are you sure you want to clear all chat history for this diagram? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await aiService.clearChatHistory(currentDiagramId);
      console.log(`✅ Chat history cleared: ${result.deletedCount} messages deleted`);
      setMessages([{
        role: 'assistant',
        content: "Hi! I'm Process Modeler AI, your intelligent assistant for this visual BPMN process modeling tool. I can help you create business processes, modify tasks and flows on the canvas, and analyze your process designs. I understand the visual connections between your process elements and will help maintain them as we work together. What process would you like to model today?",
        timestamp: new Date()
      }]);
      // Optional: show a temporary success message
      const successMessage: ChatMessage = {
        role: 'assistant',
        content: `🗑️ Chat history cleared! Deleted ${result.deletedCount} messages. Starting fresh conversation.`,
        timestamp: new Date(),
      };
      setTimeout(() => {
        setMessages(prev => [...prev, successMessage]);
      }, 500);
    } catch (error) {
      console.error('❌ Failed to clear chat history:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Failed to clear chat history: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Image handling functions
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const preview = event.target?.result as string;
          setUploadedImages(prev => [...prev, { file, preview }]);
        };
        reader.readAsDataURL(file);
      }
    });

    // Reset file input
    e.target.value = '';
  };

  const handleImagePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    Array.from(items).forEach(item => {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const preview = event.target?.result as string;
            setUploadedImages(prev => [...prev, { file, preview }]);
          };
          reader.readAsDataURL(file);
        }
      }
    });
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const quickActions = [
    {
      label: 'Generate Customer Onboarding Process',
      action: () => handleGenerateProcess('Create a customer onboarding process with registration, verification, and welcome steps'),
    },
    {
      label: 'Generate Order Fulfillment Process',
      action: () => handleGenerateProcess('Create an order fulfillment process with order processing, inventory check, shipping, and delivery'),
    },
    {
      label: 'Analyze Current Process',
      action: handleAnalyzeProcess,
    },
    {
      label: 'Summarize Process on Sticky Note',
      action: handleSummarizeProcess,
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bot size={24} />
          <h2 className="text-lg font-semibold">AI Assistant</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleResetChat}
            disabled={isLoading || isReadOnly}
            className="p-1.5 text-white hover:text-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={isReadOnly ? "Clear chat history is disabled in read-only mode" : "Clear chat history"}
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            ×
          </button>
        </div>
      </div>

      {/* Read-Only Notice */}
      {isReadOnly && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <div className="flex items-center text-yellow-800">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-sm font-medium">AI Assistant is disabled in read-only mode</span>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Actions</h3>
        <div className="space-y-2">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              disabled={isLoading || isGenerating || isReadOnly}
              className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex items-start space-x-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <div className="bg-blue-100 rounded-full p-2">
                <Bot size={16} className="text-blue-600" />
              </div>
            )}
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">{message.content}</div>
              <div className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
            {message.role === 'user' && (
              <div className="bg-gray-100 rounded-full p-2">
                <User size={16} className="text-gray-600" />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 rounded-full p-2">
              <RefreshCw size={16} className="text-blue-600 animate-spin" />
            </div>
            <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
              <div className="text-sm">Thinking...</div>
            </div>
          </div>
        )}

        {isGenerating && (
          <div className="flex items-start space-x-3">
            <div className="bg-purple-100 rounded-full p-2">
              <Sparkles size={16} className="text-purple-600 animate-pulse" />
            </div>
            <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
              <div className="text-sm">Generating schema...</div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Uploaded Images Preview */}
      {uploadedImages.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-2">
            {uploadedImages.map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={image.preview}
                  alt={`Upload ${index + 1}`}
                  className="w-16 h-16 object-cover rounded-lg border border-gray-300"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  disabled={isLoading}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              onPaste={handleImagePaste}
              placeholder={isReadOnly ? "AI Assistant is disabled in read-only mode" : "Ask me about process design, generate workflows, or get BPMN suggestions..."}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
              disabled={isLoading || isReadOnly}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isReadOnly}
              className="absolute right-2 top-2 p-1 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Upload image"
            >
              <Paperclip size={16} />
            </button>
          </div>
          <button
            onClick={handleSendMessage}
            disabled={(!inputMessage.trim() && uploadedImages.length === 0) || isLoading || isReadOnly}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </div>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>
    </div>
  );
};