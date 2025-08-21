import React, { useState } from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from 'reactflow';
import { useDiagramStore } from '../stores/diagramStore';
import { X } from 'lucide-react';

export const SequenceFlowEdge: React.FC<EdgeProps> = ({
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
  const [condition, setCondition] = useState(data?.condition || '');

  const handleConditionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCondition(e.target.value);
  };

  const handleConditionBlur = () => {
    updateEdge(id, { ...data, condition });
    setIsEditing(false);
  };

  const handleLabelDoubleClick = () => {
    setIsEditing(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleConditionBlur();
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
          stroke: selected ? '#3b82f6' : '#64748b',
          strokeWidth: selected ? 3 : 2,
          strokeDasharray: data?.type === 'conditional' ? '5,5' : 'none',
        }}
        className="react-flow__edge-path hover:stroke-blue-500 transition-colors"
        d={edgePath}
        markerEnd={markerEnd}
      />
      
      <EdgeLabelRenderer>
        {/* Condition label or input */}
        {(data?.condition || isEditing || selected) && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <div className="flex items-center gap-1">
              {isEditing ? (
                <input
                  value={condition}
                  onChange={handleConditionChange}
                  onBlur={handleConditionBlur}
                  onKeyDown={handleKeyDown}
                  className="text-xs bg-white border border-blue-400 rounded px-2 py-1 outline-none min-w-16"
                  placeholder="Condition"
                  autoFocus
                />
              ) : (
                <>  
                  {data?.condition && (
                    <div
                      onClick={() => setIsEditing(true)}
                      onDoubleClick={handleLabelDoubleClick}
                      className="text-xs bg-white border border-gray-300 rounded px-2 py-1 shadow-sm cursor-pointer hover:border-blue-400 transition-colors"
                    >
                      {data.condition}
                    </div>
                  )}
                  {selected && !data?.condition && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-xs bg-white border border-dashed border-gray-400 rounded px-2 py-1 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
                    >
                      Add condition
                    </button>
                  )}
                  {selected && (
                    <button
                      onClick={handleDeleteClick}
                      className="ml-1 p-1 bg-red-100 hover:bg-red-200 rounded border border-red-300 transition-colors"
                      title="Delete connection"
                    >
                      <X className="w-3 h-3 text-red-600" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
};