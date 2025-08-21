import React, { useState } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { ProcessNodeData } from '../types';
import { useDiagramStore } from '../stores/diagramStore';
import { Settings, MoreHorizontal, User, Cog, Hand, Code, Calculator, Send, Download } from 'lucide-react';

export const ProcessNode: React.FC<NodeProps<ProcessNodeData>> = ({ id, data, selected }) => {
  const { updateNode, showLaneColors } = useDiagramStore();
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(e.target.value);
  };

  const handleLabelBlur = () => {
    updateNode(id, { label });
    setIsEditing(false);
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleLabelBlur();
    }
  };

  const isSubprocess = data.processType === 'subprocess';

  const getTaskIcon = () => {
    if (!data.taskType || isSubprocess) return null;
    
    switch (data.taskType) {
      case 'user':
        return <User className="w-3 h-3 text-gray-600" />;
      case 'service':
        return <Cog className="w-3 h-3 text-gray-600" />;
      case 'manual':
        return <Hand className="w-3 h-3 text-gray-600" />;
      case 'script':
        return <Code className="w-3 h-3 text-gray-600" />;
      case 'business-rule':
        return <Calculator className="w-3 h-3 text-gray-600" />;
      case 'send':
        return <Send className="w-3 h-3 text-gray-600" />;
      case 'receive':
        return <Download className="w-3 h-3 text-gray-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="relative">
      {/* Connection handles - left as primary input, all sides available */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="!w-4 !h-4 !bg-blue-500 !border-2 !border-white !shadow-md hover:!scale-125 !transition-transform" 
        id="input-left"
        isConnectable={true}
      />
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!w-3 !h-3 !bg-blue-300 !border-2 !border-white !shadow-sm hover:!scale-125 !transition-transform" 
        id="input-top"
        isConnectable={true}
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        className="!w-4 !h-4 !bg-blue-400 !border-2 !border-white !shadow-sm hover:!scale-125 !transition-transform" 
        id="output-right"
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!w-4 !h-4 !bg-blue-400 !border-2 !border-white !shadow-sm hover:!scale-125 !transition-transform" 
        id="output-bottom"
      />
      
      <div
        className={`bg-white rounded-lg shadow-lg border-2 transition-all duration-150 hover:shadow-xl ${
          selected ? 'border-blue-500 ring-2 ring-blue-200' : 
          (showLaneColors && data.laneColor ? `border-[${data.laneColor}]` : 'border-gray-300')
        } ${
          isSubprocess ? 'border-dashed border-blue-400' : ''
        }`}
        style={{
          width: 160,
          minHeight: 80,
          borderColor: !selected && showLaneColors && data.laneColor ? data.laneColor : undefined,
          borderWidth: showLaneColors && data.laneColor ? '3px' : '2px'
        }}
        onDoubleClick={handleDoubleClick}
      >
        {/* Header bar for subprocess */}
        {isSubprocess && (
          <div className="bg-blue-50 rounded-t-lg px-3 py-1 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <Settings className="w-3 h-3 text-blue-600" />
              <span className="text-xs text-blue-600 font-medium">Subprocess</span>
              <MoreHorizontal className="w-3 h-3 text-blue-600" />
            </div>
          </div>
        )}
        
        {/* Main content */}
        <div className={`px-3 flex items-center justify-center ${
          isSubprocess ? 'py-2' : 'py-4'
        }`} style={{ minHeight: isSubprocess ? '50px' : '72px' }}>
          {isEditing ? (
            <input
              value={label}
              onChange={handleLabelChange}
              onBlur={handleLabelBlur}
              onKeyDown={handleKeyDown}
              className="w-full text-center text-sm bg-transparent border-b border-blue-400 outline-none font-medium"
              autoFocus
            />
          ) : (
            <span className="text-center text-sm font-medium text-gray-800 leading-tight">
              {data.label}
            </span>
          )}
        </div>
        
        {/* Task type indicator */}
        {!isSubprocess && (
          <div className="absolute top-2 left-2 p-1 bg-white rounded border border-gray-300">
            {getTaskIcon() || <div className="w-3 h-3 rounded bg-gray-300"></div>}
          </div>
        )}
        
        {/* Lane assignment indicator */}
        {showLaneColors && data.laneName && (
          <div 
            className="absolute top-1 right-1 text-xs text-white px-2 py-0.5 rounded-full text-center min-w-[20px] shadow-sm"
            style={{ 
              backgroundColor: data.laneColor || '#6B7280',
              fontSize: '10px',
              lineHeight: '1.2'
            }}
            title={`Lane: ${data.laneName}`}
          >
            {data.laneName.substring(0, 3).toUpperCase()}
          </div>
        )}
        
        {/* Legacy lane assignment for compatibility */}
        {data.assignedLane && !data.laneName && (
          <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            {data.performer || 'Unassigned'}
          </div>
        )}
      </div>
    </div>
  );
};