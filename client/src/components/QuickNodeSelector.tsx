import React, { useEffect, useRef, useState } from 'react';
import { 
  Activity, 
  PlayCircle, 
  StopCircle, 
  GitBranch, 
  Database,
  Clock,
  FileText,
  HardDrive,
  Link2,
  Brain,
  Loader2,
  Check,
  X,
  RefreshCw
} from 'lucide-react';
import { aiService, AINodeSuggestion, ProcessModel } from '../services/aiService';
import { useDiagramStore } from '../stores/diagramStore';

interface QuickNodeSelectorProps {
  x: number; // Screen coordinates
  y: number; // Screen coordinates
  sourceNodeId: string;
  onSelectNode: (nodeType: string, direction: 'right' | 'down' | 'left' | 'up', eventType?: string) => void;
  onClose: () => void;
}

const nodeTypes = [
  { type: 'process', icon: Activity, label: 'Task', color: 'bg-blue-100 hover:bg-blue-200 text-blue-800' },
  { type: 'event', subType: 'start', icon: PlayCircle, label: 'Start', color: 'bg-green-100 hover:bg-green-200 text-green-800' },
  { type: 'event', subType: 'end', icon: StopCircle, label: 'End', color: 'bg-red-100 hover:bg-red-200 text-red-800' },
  { type: 'gateway', icon: GitBranch, label: 'Gateway', color: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800' },
  { type: 'event', subType: 'intermediate', icon: Clock, label: 'Timer', color: 'bg-purple-100 hover:bg-purple-200 text-purple-800' },
  { type: 'data-object', subType: 'input', icon: FileText, label: 'Data', color: 'bg-gray-100 hover:bg-gray-200 text-gray-800' },
  { type: 'data-object', subType: 'storage', icon: HardDrive, label: 'Storage', color: 'bg-slate-100 hover:bg-slate-200 text-slate-800' },
  { type: 'data-object', subType: 'reference', icon: Link2, label: 'Reference', color: 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800' },
];

export const QuickNodeSelector: React.FC<QuickNodeSelectorProps> = ({
  x,
  y,
  sourceNodeId,
  onSelectNode,
  onClose
}) => {
  const selectorRef = useRef<HTMLDivElement>(null);
  const { nodes, edges } = useDiagramStore();
  
  // Existing state
  const [selectedDirection, setSelectedDirection] = useState<'right' | 'down' | 'left' | 'up'>('right');
  
  // AI Preview Mode state
  const [isAIMode, setIsAIMode] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AINodeSuggestion | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showReasoning, setShowReasoning] = useState(false);

  // Convert current diagram to ProcessModel for AI
  const getCurrentProcess = (): ProcessModel => {
    const elements = nodes.map(node => ({
      id: node.id,
      type: node.type as any,
      label: node.data?.label || 'Unlabeled',
      position: node.position,
      properties: node.data
    }));

    const flows = edges.map(edge => ({
      id: edge.id,
      type: edge.type as any || 'sequence-flow',
      source: edge.source,
      target: edge.target,
      label: edge.data?.label,
      condition: edge.data?.condition
    }));

    return { elements, flows };
  };

  // AI functions
  const requestAISuggestion = async () => {
    setIsLoadingAI(true);
    setAiError(null);
    try {
      const currentProcess = getCurrentProcess();
      // Use the currently selected direction as context for AI
      const contextWithDirection = `User wants to place the next node ${selectedDirection} of the current node. Suggest the most logical next BPMN element for this direction.`;
      const suggestion = await aiService.suggestNextNode(sourceNodeId, currentProcess, contextWithDirection);
      
      // Respect the user's selected direction instead of overriding it
      suggestion.direction = selectedDirection;
      
      setAiSuggestion(suggestion);
      setIsAIMode(true);
    } catch (error) {
      setAiError('Failed to get AI suggestion. Please try again.');
      console.error('AI suggestion error:', error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const acceptAISuggestion = () => {
    if (aiSuggestion) {
      onSelectNode(aiSuggestion.nodeType, aiSuggestion.direction, aiSuggestion.subType);
    }
  };

  const declineAISuggestion = () => {
    setIsAIMode(false);
    setAiSuggestion(null);
    setAiError(null);
    setShowReasoning(false);
  };

  const retryAISuggestion = () => {
    setShowReasoning(false);
    requestAISuggestion();
  };

  // Helper function to get the icon for AI suggestion
  const getAISuggestionIcon = () => {
    if (!aiSuggestion) return Activity;
    
    const { nodeType, subType } = aiSuggestion;
    
    switch (nodeType) {
      case 'process':
        return Activity;
      case 'event':
        if (subType === 'start') return PlayCircle;
        if (subType === 'end') return StopCircle;
        if (subType === 'intermediate') return Clock;
        return PlayCircle;
      case 'gateway':
        return GitBranch;
      case 'data-object':
        if (subType === 'storage') return HardDrive;
        if (subType === 'reference') return Link2;
        return FileText;
      default:
        return Activity;
    }
  };

  // Helper function to get color for AI suggestion
  const getAISuggestionColor = () => {
    if (!aiSuggestion) return 'bg-blue-100 text-blue-800';
    
    const { nodeType, subType } = aiSuggestion;
    
    switch (nodeType) {
      case 'process':
        return 'bg-blue-100 text-blue-800';
      case 'event':
        if (subType === 'start') return 'bg-green-100 text-green-800';
        if (subType === 'end') return 'bg-red-100 text-red-800';
        if (subType === 'intermediate') return 'bg-purple-100 text-purple-800';
        return 'bg-green-100 text-green-800';
      case 'gateway':
        return 'bg-yellow-100 text-yellow-800';
      case 'data-object':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  // Helper function to get descriptive node type info
  const getNodeTypeDescription = () => {
    if (!aiSuggestion) return '';
    
    const { nodeType, subType, properties } = aiSuggestion;
    
    switch (nodeType) {
      case 'process':
        if (properties?.taskType) {
          const taskTypes: Record<string, string> = {
            user: 'User Task',
            service: 'Service Task',
            manual: 'Manual Task',
            script: 'Script Task',
            'business-rule': 'Business Rule Task',
            send: 'Send Task',
            receive: 'Receive Task'
          };
          return `Task Node | Type: ${taskTypes[properties.taskType] || 'Process Task'}`;
        }
        return 'Task Node | Type: Process Task';
        
      case 'event':
        const eventTypes: Record<string, string> = {
          start: 'Start Event',
          end: 'End Event',
          intermediate: 'Intermediate Event'
        };
        return `${eventTypes[subType || ''] || 'Event'} | Type: ${subType || 'Standard'}`;
        
      case 'gateway':
        const gatewayTypes: Record<string, string> = {
          exclusive: 'Gateway XOR',
          parallel: 'Gateway AND',
          inclusive: 'Gateway OR',
          'event-based': 'Event Gateway',
          complex: 'Complex Gateway'
        };
        return gatewayTypes[subType || ''] || 'Gateway';
        
      case 'data-object':
        const dataTypes: Record<string, string> = {
          storage: 'Data Store',
          reference: 'Data Object Reference',
          input: 'Input Data',
          output: 'Output Data',
          collection: 'Data Collection'
        };
        return `${dataTypes[subType || ''] || 'Data Object'} | Type: ${subType || 'Standard'}`;
        
      default:
        return 'Node';
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    // Add a small delay to prevent immediate closing
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Calculate position to ensure the selector stays within viewport
  const calculatePosition = () => {
    const selectorWidth = 280; // Approximate width
    const selectorHeight = 200; // Approximate height
    const padding = 20;

    let adjustedX = x;
    let adjustedY = y;

    // Adjust horizontal position
    if (x + selectorWidth > window.innerWidth - padding) {
      adjustedX = x - selectorWidth - padding;
    }

    // Adjust vertical position
    if (y + selectorHeight > window.innerHeight - padding) {
      adjustedY = y - selectorHeight - padding;
    }

    return { x: adjustedX, y: adjustedY };
  };

  const position = calculatePosition();

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black bg-opacity-10" />
      
      {/* Quick Node Selector */}
      <div
        ref={selectorRef}
        className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-xl p-4"
        style={{ 
          left: position.x, 
          top: position.y,
          minWidth: '280px'
        }}
      >
        <div className="text-sm font-medium text-gray-700 mb-3">Add Node</div>
        
        {/* Direction Selector */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {/* Up */}
          <div className="col-start-2">
            <button
              onClick={() => setSelectedDirection('up')}
              className={`w-8 h-8 rounded border flex items-center justify-center transition-colors ${
                selectedDirection === 'up' 
                  ? 'bg-blue-500 text-white border-blue-600' 
                  : 'bg-gray-100 hover:bg-gray-200 border-gray-300'
              }`}
              title="Add above"
            >
              ↑
            </button>
          </div>
          
          {/* Left */}
          <div className="col-start-1 row-start-2">
            <button
              onClick={() => setSelectedDirection('left')}
              className={`w-8 h-8 rounded border flex items-center justify-center transition-colors ${
                selectedDirection === 'left' 
                  ? 'bg-blue-500 text-white border-blue-600' 
                  : 'bg-gray-100 hover:bg-gray-200 border-gray-300'
              }`}
              title="Add to left"
            >
              ←
            </button>
          </div>
          
          {/* Center (source node indicator) */}
          <div className="col-start-2 row-start-2">
            <div className="w-8 h-8 bg-gray-400 rounded border-2 border-gray-500 flex items-center justify-center">
              <Activity size={16} className="text-white" />
            </div>
          </div>
          
          {/* Right */}
          <div className="col-start-3 row-start-2">
            <button
              onClick={() => setSelectedDirection('right')}
              className={`w-8 h-8 rounded border flex items-center justify-center transition-colors ${
                selectedDirection === 'right' 
                  ? 'bg-blue-500 text-white border-blue-600' 
                  : 'bg-gray-100 hover:bg-gray-200 border-gray-300'
              }`}
              title="Add to right"
            >
              →
            </button>
          </div>
          
          {/* Down */}
          <div className="col-start-2 row-start-3">
            <button
              onClick={() => setSelectedDirection('down')}
              className={`w-8 h-8 rounded border flex items-center justify-center transition-colors ${
                selectedDirection === 'down' 
                  ? 'bg-blue-500 text-white border-blue-600' 
                  : 'bg-gray-100 hover:bg-gray-200 border-gray-300'
              }`}
              title="Add below"
            >
              ↓
            </button>
          </div>
        </div>

        {/* AI Preview Mode - Compact Visual Design */}
        {isAIMode && aiSuggestion ? (
          <div className="mb-4">
            {/* AI Suggested Node Display */}
            <div className="mb-3">
              <div className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                <Brain className="w-3 h-3 text-purple-600" />
                AI Suggests:
              </div>
              
              {/* Visual Node Preview */}
              <div className={`p-3 rounded-lg border-2 border-dashed border-purple-300 ${getAISuggestionColor()} flex items-center gap-3`}>
                <div className="flex-shrink-0">
                  {React.createElement(getAISuggestionIcon(), { size: 24 })}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{aiSuggestion.label}</div>
                  <div className="text-xs opacity-75">
                    {getNodeTypeDescription()}
                  </div>
                </div>
                <button
                  onClick={() => setShowReasoning(!showReasoning)}
                  className="flex-shrink-0 w-6 h-6 rounded-full bg-white bg-opacity-50 hover:bg-opacity-75 flex items-center justify-center transition-colors"
                  title={showReasoning ? "Hide reasoning" : "Show AI reasoning"}
                >
                  <span className={`text-xs transform transition-transform ${showReasoning ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
              </div>
              
              {/* Collapsible Reasoning */}
              {showReasoning && (
                <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
                  <strong>AI Reasoning:</strong> {aiSuggestion.reasoning}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={acceptAISuggestion}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-md transition-colors"
              >
                <Check className="w-4 h-4" />
                Accept
              </button>
              <button
                onClick={declineAISuggestion}
                className="flex items-center gap-1 px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
                Decline
              </button>
              <button
                onClick={retryAISuggestion}
                className="flex items-center gap-1 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded-md transition-colors"
                disabled={isLoadingAI}
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingAI ? 'animate-spin' : ''}`} />
                Retry
              </button>
            </div>
          </div>
        ) : null}

        {/* AI Error State */}
        {aiError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-sm text-red-700">{aiError}</div>
            <button
              onClick={retryAISuggestion}
              className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
              disabled={isLoadingAI}
            >
              Try again
            </button>
          </div>
        )}

        {/* AI Smart Node Button */}
        {!isAIMode && (
          <div className="mb-4">
            <button
              onClick={requestAISuggestion}
              disabled={isLoadingAI}
              className="w-full flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoadingAI ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">AI is thinking...</span>
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  <span className="text-sm font-medium">🤖 AI Smart Node</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Manual Node Selection */}
        {!isAIMode && (
          <>
            <div className="text-xs text-gray-500 mb-2 text-center">Or choose manually:</div>
            
            {/* Node Type Grid */}
            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
          {nodeTypes.map(({ type, subType, icon: Icon, label, color }) => (
            <button
              key={`${type}-${subType || 'default'}`}
              onClick={() => {
                onSelectNode(type, selectedDirection, subType);
                onClose();
              }}
              className={`p-3 rounded-lg border border-gray-200 flex flex-col items-center gap-1 transition-colors ${color}`}
              title={`Add ${label} ${selectedDirection}`}
            >
              <Icon size={20} />
              <span className="text-xs font-medium">{label}</span>
            </button>
              ))}
            </div>
          </>
        )}

      </div>
    </>
  );
};
