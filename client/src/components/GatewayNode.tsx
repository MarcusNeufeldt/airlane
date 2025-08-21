import React, { useState } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { GatewayNodeData } from '../types';
import { useDiagramStore } from '../stores/diagramStore';
import { X, Plus, Circle, Zap, Settings } from 'lucide-react';

export const GatewayNode: React.FC<NodeProps<GatewayNodeData>> = ({ id, data, selected }) => {
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

  const getGatewayIcon = () => {
    switch (data.gatewayType) {
      case 'exclusive':
        return <X className="w-4 h-4 text-yellow-800" strokeWidth={3} />;
      case 'parallel':
        return <Plus className="w-4 h-4 text-yellow-800" strokeWidth={3} />;
      case 'inclusive':
        return <Circle className="w-4 h-4 text-yellow-800" strokeWidth={3} />;
      case 'event-based':
        return <Zap className="w-4 h-4 text-yellow-800" strokeWidth={3} />;
      case 'complex':
        return <Settings className="w-4 h-4 text-yellow-800" strokeWidth={3} />;
      default:
        return <X className="w-4 h-4 text-yellow-800" strokeWidth={3} />;
    }
  };

  const getGatewayDescription = () => {
    switch (data.gatewayType) {
      case 'exclusive':
        return 'XOR - Choose one path based on conditions';
      case 'parallel':
        return 'AND - Split into parallel paths or synchronize';
      case 'inclusive':
        return 'OR - Allow multiple paths based on conditions';
      case 'event-based':
        return 'Event-based - Wait for one of multiple events';
      case 'complex':
        return 'Complex - Advanced synchronization scenarios';
      default:
        return 'Gateway';
    }
  };

  return (
    <div className="relative group">
      {/* BPMN Gateway handles - both input (target) and output (source) for flow control */}
      
      {/* Input handles - for merging flows */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!w-3 !h-3 !bg-gray-300 group-hover:!bg-blue-500 !border !border-gray-400 group-hover:!border-white !shadow-sm hover:!scale-125 !transition-all !z-20 !opacity-50 group-hover:!opacity-100" 
        style={{ top: '-6px' }}
        id="input-top"
      />
      
      <Handle 
        type="target" 
        position={Position.Left} 
        className="!w-3 !h-3 !bg-gray-300 group-hover:!bg-blue-500 !border !border-gray-400 group-hover:!border-white !shadow-sm hover:!scale-125 !transition-all !z-20 !opacity-50 group-hover:!opacity-100" 
        style={{ left: '-6px' }}
        id="input-left"
      />
      
      {/* Output handles - for splitting flows */}
      <Handle 
        type="source" 
        position={Position.Right} 
        className="!w-3 !h-3 !bg-gray-300 group-hover:!bg-yellow-500 !border !border-gray-400 group-hover:!border-white !shadow-sm hover:!scale-125 !transition-all !z-20 !opacity-50 group-hover:!opacity-100" 
        style={{ right: '-6px' }}
        id="output-right"
      />
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!w-3 !h-3 !bg-gray-300 group-hover:!bg-yellow-500 !border !border-gray-400 group-hover:!border-white !shadow-sm hover:!scale-125 !transition-all !z-20 !opacity-50 group-hover:!opacity-100" 
        style={{ bottom: '-6px' }}
        id="output-bottom"
      />
      
      <div
        className={`bg-yellow-100 shadow-lg flex items-center justify-center transform rotate-45 transition-all duration-150 hover:shadow-xl ${
          selected ? 'ring-2 ring-yellow-600' : ''
        }`}
        style={{ 
          width: 50, 
          height: 50,
          borderWidth: (showLaneColors && data.laneColor) ? '3px' : '2px',
          borderColor: (showLaneColors && data.laneColor) || '#facc15',
          borderStyle: 'solid'
        }}
        onDoubleClick={handleDoubleClick}
        title={getGatewayDescription()}
      >
        <div className="transform -rotate-45 flex items-center justify-center">
          {/* Gateway type icon */}
          {getGatewayIcon()}
        </div>
      </div>
      
      {/* Lane assignment indicator */}
      {showLaneColors && data.laneName && (
        <div 
          className="absolute -top-2 -right-2 text-xs text-white px-1.5 py-0.5 rounded-full text-center min-w-[16px] shadow-sm"
          style={{ 
            backgroundColor: data.laneColor || '#6B7280',
            fontSize: '9px',
            lineHeight: '1.1'
          }}
          title={`Lane: ${data.laneName}`}
        >
          {data.laneName.substring(0, 2).toUpperCase()}
        </div>
      )}
      
      {/* Gateway label below (for splitting gateways - questions) */}
      {!isEditing && data.label && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1">
          <span className="text-xs text-gray-700 bg-white px-2 py-1 rounded shadow-sm whitespace-nowrap border font-medium">
            {data.label}
          </span>
        </div>
      )}

      {/* Inline editing */}
      {isEditing && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1">
          <input
            value={label}
            onChange={handleLabelChange}
            onBlur={handleLabelBlur}
            onKeyDown={handleKeyDown}
            className="text-xs text-center bg-white border border-yellow-400 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-yellow-500"
            placeholder="Gateway question..."
            autoFocus
          />
        </div>
      )}
    </div>
  );
};