import React, { useState } from 'react';
import { EdgeProps, EdgeLabelRenderer, Position } from 'reactflow';
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
  const { updateEdge, removeEdge, simulationActiveEdges, isSimulating, gridSize, snapToGrid } = useDiagramStore();
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

  // Custom Manhattan routing function for grid-based connections
  const getManhattanPath = (
    sourceX: number,
    sourceY: number,
    sourcePosition: Position,
    targetX: number,
    targetY: number,
    targetPosition: Position,
    gridSize: number = 20
  ) => {
    // Snap coordinates to grid
    const snapToGrid = (value: number) => Math.round(value / gridSize) * gridSize;
    
    // Calculate connection points - sourceX/sourceY are already the handle positions
    // We just need to use them directly since ReactFlow provides the exact connection points
    const getConnectionPoint = (x: number, y: number, position: Position) => {
      // ReactFlow already provides the exact connection point coordinates
      // sourceX/sourceY and targetX/targetY are the handle centers
      return { x, y };
    };

    const source = getConnectionPoint(sourceX, sourceY, sourcePosition);
    const target = getConnectionPoint(targetX, targetY, targetPosition);

    // Use exact connection points (don't snap them to grid)
    const startX = source.x;
    const startY = source.y;
    const endX = target.x;
    const endY = target.y;

    // Calculate waypoints for Manhattan routing
    const waypoints: Array<{x: number, y: number}> = [
      { x: startX, y: startY }
    ];

    // Add intermediate waypoints for orthogonal routing
    const midY = startY + (endY - startY) / 2;

    // Improved Manhattan routing logic
    const horizontalDistance = Math.abs(endX - startX);
    const verticalDistance = Math.abs(endY - startY);
    
    // Always add intermediate points for cleaner routing
    if (horizontalDistance > gridSize && verticalDistance > gridSize) {
      // Both horizontal and vertical movement needed
      if (sourcePosition === Position.Right || sourcePosition === Position.Left) {
        // Start horizontally from source
        const intermediateX = startX + (endX - startX) * 0.6;
        const gridAlignedX = snapToGrid ? snapToGrid(intermediateX) : intermediateX;
        waypoints.push({ x: gridAlignedX, y: startY });
        waypoints.push({ x: gridAlignedX, y: endY });
      } else {
        // Start vertically from source
        const intermediateY = startY + (endY - startY) * 0.6;
        const gridAlignedY = snapToGrid ? snapToGrid(intermediateY) : intermediateY;
        waypoints.push({ x: startX, y: gridAlignedY });
        waypoints.push({ x: endX, y: gridAlignedY });
      }
    } else if (horizontalDistance > gridSize) {
      // Only horizontal movement - add intermediate point for arrow direction
      const intermediateX = startX + (endX - startX) * 0.95; // 95% of the way
      waypoints.push({ x: intermediateX, y: startY });
    } else if (verticalDistance > gridSize) {
      // Only vertical movement - add intermediate point for arrow direction  
      const intermediateY = startY + (endY - startY) * 0.95; // 95% of the way
      waypoints.push({ x: startX, y: intermediateY });
    } else {
      // Very short distance - add a tiny intermediate point for direction
      if (Math.abs(endX - startX) > Math.abs(endY - startY)) {
        // More horizontal than vertical
        const intermediateX = startX + (endX - startX) * 0.8;
        waypoints.push({ x: intermediateX, y: startY });
      } else {
        // More vertical than horizontal
        const intermediateY = startY + (endY - startY) * 0.8;
        waypoints.push({ x: startX, y: intermediateY });
      }
    }

    waypoints.push({ x: endX, y: endY });

    // Create SVG path from waypoints
    const pathData = waypoints.reduce((path, point, index) => {
      return path + (index === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`);
    }, '');

    // Calculate label position (center of path)
    const labelX = (startX + endX) / 2;
    const labelY = (startY + endY) / 2;

    return [pathData, labelX, labelY] as const;
  };

  const [edgePath, labelX, labelY] = getManhattanPath(
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    snapToGrid ? gridSize : 20 // Use actual grid size when snap-to-grid is enabled
  );

  // Ensure edgePath is a string for the SVG d attribute
  const pathString = String(edgePath);

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          stroke: selected ? '#3b82f6' :
                  simulationActiveEdges.includes(id) && isSimulating ? '#10b981' : '#64748b',
          strokeWidth: selected ? 3 :
                       simulationActiveEdges.includes(id) && isSimulating ? 4 : 2,
          strokeDasharray: data?.type === 'conditional' ? '5,5' : 'none',
          filter: simulationActiveEdges.includes(id) && isSimulating ? 'drop-shadow(0 0 4px #10b981)' : 'none',
        }}
        className={`react-flow__edge-path hover:stroke-blue-500 transition-all duration-300 ${
          simulationActiveEdges.includes(id) && isSimulating ? 'animate-pulse' : ''
        }`}
        d={pathString}
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