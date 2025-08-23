import React, { useState } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { EventNodeData } from '../types';
import { useDiagramStore } from '../stores/diagramStore';
import { Play, Square, Circle, Zap, Timer, MessageSquare } from 'lucide-react';

export const EventNode: React.FC<NodeProps<EventNodeData>> = ({ id, data, selected }) => {
  const { updateNode, showLaneColors, simulationActiveNodes, isSimulating, animatingNodeIds } = useDiagramStore();
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
  const isAnimating = animatingNodeIds.has(id);

  const getEventIcon = () => {
    switch (data.eventSubType) {
      case 'error':
        return <Zap className="w-4 h-4 text-red-600" />;
      case 'timer':
        return <Timer className="w-4 h-4 text-indigo-600" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getEventStyles = () => {
    let icon = getEventIcon();

    switch (data.eventType) {
      case 'start':
        return {
          borderColor: '#10b981', // green-500
          borderWidth: '2px',
          borderStyle: 'solid',
          bgColor: '#dcfce7', // green-100
          icon: <Play className="w-4 h-4 text-green-600" />
        };
      case 'intermediate':
        return {
          borderColor: '#f59e0b', // yellow-500
          borderWidth: '2px',
          borderStyle: 'dashed',
          bgColor: '#fef3c7', // yellow-100
          icon: <Circle className="w-4 h-4 text-yellow-600" />
        };
      case 'end':
        return {
          borderColor: '#ef4444', // red-500
          borderWidth: '3px',
          borderStyle: 'solid',
          bgColor: '#fecaca', // red-100
          icon: <Square className="w-4 h-4 text-red-600" />
        };
      case 'boundary':
        return {
          borderColor: '#6b7280', // gray-500
          borderWidth: '2px',
          borderStyle: 'dashed',
          bgColor: '#f3f4f6', // gray-100
          icon: icon || <Circle className="w-4 h-4 text-gray-600" />
        };
      default:
        return {
          borderColor: '#6b7280', // gray-500
          borderWidth: '2px',
          borderStyle: 'solid',
          bgColor: '#f3f4f6', // gray-100
          icon: icon || <Circle className="w-4 h-4 text-gray-600" />
        };
    }
  };

  const eventStyles = getEventStyles();

  return (
    <div className="relative group">
      {/* Connection handles - BPMN-compliant event connections */}
      
      {/* Start Event: Only outputs (can trigger the process) */}
      {data.eventType === 'start' && (
        <>
          <Handle 
            type="source" 
            position={Position.Right} 
            className="!w-3 !h-3 !bg-green-500 !border-2 !border-white !shadow-sm hover:!scale-125 !transition-transform !opacity-60 group-hover:!opacity-100" 
            id="start-right"
          />
          <Handle 
            type="source" 
            position={Position.Bottom} 
            className="!w-3 !h-3 !bg-green-500 !border-2 !border-white !shadow-sm hover:!scale-125 !transition-transform !opacity-60 group-hover:!opacity-100" 
            id="start-bottom"
          />
        </>
      )}
      
      {/* End Event: Only inputs (receives flow to complete process) */}
      {data.eventType === 'end' && (
        <>
          <Handle 
            type="target" 
            position={Position.Left} 
            className="!w-3 !h-3 !bg-red-500 !border-2 !border-white !shadow-sm hover:!scale-125 !transition-transform !opacity-60 group-hover:!opacity-100" 
            id="end-left"
          />
          <Handle 
            type="target" 
            position={Position.Top} 
            className="!w-3 !h-3 !bg-red-500 !border-2 !border-white !shadow-sm hover:!scale-125 !transition-transform !opacity-60 group-hover:!opacity-100" 
            id="end-top"
          />
        </>
      )}
      
      {/* Intermediate Event: Both inputs and outputs (can occur during the process) */}
      {(data.eventType === 'intermediate' || data.eventType === 'boundary') && (
        <>
          <Handle 
            type="target" 
            position={Position.Left} 
            className="!w-3 !h-3 !bg-yellow-500 !border-2 !border-white !shadow-sm hover:!scale-125 !transition-transform !opacity-60 group-hover:!opacity-100" 
            id="inter-input"
          />
          <Handle 
            type="source" 
            position={Position.Right} 
            className="!w-3 !h-3 !bg-yellow-500 !border-2 !border-white !shadow-sm hover:!scale-125 !transition-transform !opacity-60 group-hover:!opacity-100" 
            id="inter-output"
          />
          <Handle 
            type="target" 
            position={Position.Top} 
            className="!w-3 !h-3 !bg-yellow-500 !border-2 !border-white !shadow-sm hover:!scale-125 !transition-transform !opacity-60 group-hover:!opacity-100" 
            id="inter-top"
          />
          <Handle 
            type="source" 
            position={Position.Bottom} 
            className="!w-3 !h-3 !bg-yellow-500 !border-2 !border-white !shadow-sm hover:!scale-125 !transition-transform !opacity-60 group-hover:!opacity-100" 
            id="inter-bottom"
          />
        </>
      )}
      
      <div
        className={`rounded-full shadow-lg flex flex-col items-center justify-center transition-all duration-150 hover:shadow-xl ${
          isAnimating ? 'ring-2 ring-purple-500 animate-pulse' :
          selected ? 'ring-2 ring-blue-400' :
          simulationActiveNodes.includes(id) && isSimulating ? 'ring-2 ring-green-400 animate-pulse' : ''
        }`}
        style={{
          width: 50,
          height: 50,
          backgroundColor: eventStyles.bgColor,
          borderColor: (showLaneColors && data.laneColor) || eventStyles.borderColor,
          borderWidth: (showLaneColors && data.laneColor) ? '3px' : eventStyles.borderWidth,
          borderStyle: eventStyles.borderStyle,
        }}
        onDoubleClick={handleDoubleClick}
      >
        {/* Event type icon */}
        <div className="mb-1">
          {eventStyles.icon}
        </div>
        
        {/* Event label */}
        {isEditing ? (
          <input
            value={label}
            onChange={handleLabelChange}
            onBlur={handleLabelBlur}
            onKeyDown={handleKeyDown}
            className="w-8 text-center text-xs bg-transparent border-b border-gray-400 outline-none font-medium"
            style={{ fontSize: '8px' }}
            autoFocus
          />
        ) : (
          data.label && (
            <span className="text-xs text-center font-semibold leading-none" style={{ fontSize: '8px' }}>
              {data.label.length > 4 ? data.label.substring(0, 4) + '...' : data.label}
            </span>
          )
        )}
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
      
      {/* Label below the event */}
      {!isEditing && data.label && data.label.length > 4 && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1">
          <span className="text-xs text-gray-600 bg-white px-1 py-0.5 rounded shadow-sm whitespace-nowrap">
            {data.label}
          </span>
        </div>
      )}
    </div>
  );
};