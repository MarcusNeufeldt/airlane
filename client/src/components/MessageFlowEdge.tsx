import React, { useState } from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from 'reactflow';
import { useDiagramStore } from '../stores/diagramStore';
import { X, Mail } from 'lucide-react';

export const MessageFlowEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
}) => {
  const { updateEdge, removeEdge } = useDiagramStore();
  const [isEditing, setIsEditing] = useState(false);
  const [messageType, setMessageType] = useState(data?.messageType || '');

  const handleMessageTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageType(e.target.value);
  };

  const handleMessageTypeBlur = () => {
    updateEdge(id, { ...data, messageType });
    setIsEditing(false);
  };

  const handleLabelDoubleClick = () => {
    setIsEditing(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleMessageTypeBlur();
    }
  };

  const handleDeleteClick = () => {
    removeEdge(id);
  };

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          stroke: selected ? '#16a34a' : '#22c55e',
          strokeWidth: selected ? 3 : 2,
          strokeDasharray: '8,4',
        }}
        className="react-flow__edge-path hover:stroke-green-600 transition-colors"
        d={edgePath}
        markerEnd={markerEnd}
      />
      
      <EdgeLabelRenderer>
        {/* Message icon and label */}
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div className="flex items-center gap-1">
            {/* Message icon */}
            <div className="bg-green-100 border border-green-300 rounded p-1">
              <Mail className="w-3 h-3 text-green-700" />
            </div>
            
            {isEditing ? (
              <input
                value={messageType}
                onChange={handleMessageTypeChange}
                onBlur={handleMessageTypeBlur}
                onKeyDown={handleKeyDown}
                className="text-xs bg-white border border-green-400 rounded px-2 py-1 outline-none min-w-20"
                placeholder="Message type"
                autoFocus
              />
            ) : (
              <>  
                {data?.messageType && (
                  <div
                    onClick={() => setIsEditing(true)}
                    onDoubleClick={handleLabelDoubleClick}
                    className="text-xs bg-green-50 border border-green-300 rounded px-2 py-1 shadow-sm cursor-pointer hover:border-green-400 transition-colors"
                  >
                    {data.messageType}
                  </div>
                )}
                {selected && !data?.messageType && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-xs bg-white border border-dashed border-green-400 rounded px-2 py-1 text-green-600 hover:border-green-500 hover:text-green-700 transition-colors"
                  >
                    Add message
                  </button>
                )}
                {selected && (
                  <button
                    onClick={handleDeleteClick}
                    className="ml-1 p-1 bg-red-100 hover:bg-red-200 rounded border border-red-300 transition-colors"
                    title="Delete message flow"
                  >
                    <X className="w-3 h-3 text-red-600" />
                  </button>
                )}
              </>
            )}
          </div>
          
          {/* Sender/Receiver info */}
          {(data?.sender || data?.receiver) && !isEditing && (
            <div className="text-xs text-gray-600 mt-1 bg-white px-1 py-0.5 rounded border border-gray-200 shadow-sm">
              {data?.sender && <div>From: {data.sender}</div>}
              {data?.receiver && <div>To: {data.receiver}</div>}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};