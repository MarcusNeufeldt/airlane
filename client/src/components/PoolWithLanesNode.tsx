import React, { useState, useCallback } from 'react';
import { NodeProps, NodeResizer, Handle, Position } from 'reactflow';
import { Building2, Users, Plus, Trash2, GripVertical } from 'lucide-react';
import { useDiagramStore } from '../stores/diagramStore';

export interface Lane {
  id: string;
  name: string;
  height: number;
  color: string;
}

export interface PoolWithLanesData {
  id: string;
  label: string;
  participant: string;
  lanes: Lane[];
  width: number;
  height: number;
  nodeType: 'pool-with-lanes';
}

const laneColors = [
  '#f5f5f5', // Light Gray
  '#e3f2fd', // Faint Blue
  '#e8eaf6', // Faint Indigo
  '#e0f2f1', // Faint Teal
  '#f1f8e9', // Faint Green
  '#fffde7', // Faint Yellow
];

export const PoolWithLanesNode: React.FC<NodeProps<PoolWithLanesData>> = ({ 
  id, 
  data, 
  selected 
}) => {
  const { updateNode } = useDiagramStore();
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [editingLane, setEditingLane] = useState<string | null>(null);
  const [laneName, setLaneName] = useState('');

  const handleResize = useCallback((event: any, params: any) => {
    updateNode(id, { 
      width: params.width, 
      height: params.height 
    });
  }, [id, updateNode]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  }, []);

  const addLane = useCallback(() => {
    const newLane: Lane = {
      id: `lane_${Date.now()}`,
      name: `Lane ${(data.lanes?.length || 0) + 1}`,
      height: 120,
      color: laneColors[(data.lanes?.length || 0) % laneColors.length]
    };
    
    const updatedLanes = [...(data.lanes || []), newLane];
    const newHeight = updatedLanes.reduce((sum, lane) => sum + lane.height, 60); // 60px for header
    
    updateNode(id, { 
      lanes: updatedLanes,
      height: newHeight
    });
    setShowContextMenu(false);
  }, [data.lanes, id, updateNode]);

  const removeLane = useCallback((laneId: string) => {
    const updatedLanes = (data.lanes || []).filter(lane => lane.id !== laneId);
    const newHeight = updatedLanes.length > 0 
      ? updatedLanes.reduce((sum, lane) => sum + lane.height, 60)
      : 200; // minimum height
    
    updateNode(id, { 
      lanes: updatedLanes,
      height: newHeight
    });
  }, [data.lanes, id, updateNode]);

  const updateLaneName = useCallback((laneId: string, newName: string) => {
    const updatedLanes = (data.lanes || []).map(lane => 
      lane.id === laneId ? { ...lane, name: newName } : lane
    );
    updateNode(id, { lanes: updatedLanes });
    setEditingLane(null);
    setLaneName('');
  }, [data.lanes, id, updateNode]);

  const startEditingLane = useCallback((lane: Lane) => {
    setEditingLane(lane.id);
    setLaneName(lane.name);
  }, []);

  const resizeLane = useCallback((laneId: string, deltaHeight: number) => {
    const updatedLanes = (data.lanes || []).map(lane => 
      lane.id === laneId 
        ? { ...lane, height: Math.max(80, lane.height + deltaHeight) }
        : lane
    );
    const newHeight = updatedLanes.reduce((sum, lane) => sum + lane.height, 60);
    
    updateNode(id, { 
      lanes: updatedLanes,
      height: newHeight
    });
  }, [data.lanes, id, updateNode]);

  const lanes = data.lanes || [];
  const poolHeight = data.height || 200;
  const poolWidth = data.width || 400;

  return (
    <>
      <NodeResizer
        color="#4f46e5"
        isVisible={selected}
        minWidth={300}
        minHeight={200}
        onResize={handleResize}
      />
      
      <div
        className={`bg-white border-2 rounded-lg flex transition-all duration-150 ${
          selected ? 'border-indigo-600' : 'border-gray-400'
        }`}
        style={{
          width: poolWidth,
          height: poolHeight,
        }}
        onContextMenu={handleContextMenu}
      >
        {/* Pool Header (Vertical Label) */}
        <div 
          className="bg-gray-700 border-r-2 border-gray-500 flex items-center justify-center p-2 rounded-l-lg" 
          style={{ width: '40px' }}
        >
          <div className="transform -rotate-90 whitespace-nowrap flex items-center gap-2 text-sm font-semibold text-white">
            <Building2 size={14} />
            <span>{data.participant || data.label || 'Pool'}</span>
          </div>
        </div>

        {/* Lanes Container */}
        <div className="flex-1 flex flex-col">
          {lanes.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <p className="text-sm mb-2">No lanes defined</p>
                <button
                  onClick={addLane}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs flex items-center gap-1"
                >
                  <Plus size={14} />
                  Add Lane
                </button>
              </div>
            </div>
          ) : (
            lanes.map((lane, index) => (
              <div 
                key={lane.id}
                className="relative flex-1 border-b border-gray-300 last:border-b-0 group"
                style={{ 
                  backgroundColor: lane.color,
                  minHeight: lane.height,
                  flex: `0 0 ${lane.height}px`
                }}
              >
                {/* Lane Header */}
                <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-2 bg-white/70">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-gray-600" />
                    {editingLane === lane.id ? (
                      <input
                        type="text"
                        value={laneName}
                        onChange={(e) => setLaneName(e.target.value)}
                        onBlur={() => updateLaneName(lane.id, laneName)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            updateLaneName(lane.id, laneName);
                          } else if (e.key === 'Escape') {
                            setEditingLane(null);
                            setLaneName('');
                          }
                        }}
                        className="px-1 py-0.5 text-sm border rounded"
                        autoFocus
                      />
                    ) : (
                      <span 
                        className="text-sm font-medium text-gray-700 cursor-pointer hover:text-blue-600"
                        onClick={() => startEditingLane(lane)}
                      >
                        {lane.name}
                      </span>
                    )}
                  </div>
                  
                  {/* Lane Actions */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <button
                      onClick={() => removeLane(lane.id)}
                      className="p-1 hover:bg-red-100 rounded text-red-500"
                      title="Remove lane"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Lane Resize Handle */}
                {index < lanes.length - 1 && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize flex items-center justify-center hover:bg-gray-400/30"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const startY = e.clientY;
                      const startHeight = lane.height;
                      
                      const handleMouseMove = (e: MouseEvent) => {
                        const deltaY = e.clientY - startY;
                        resizeLane(lane.id, deltaY);
                      };
                      
                      const handleMouseUp = () => {
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                      };
                      
                      document.addEventListener('mousemove', handleMouseMove);
                      document.addEventListener('mouseup', handleMouseUp);
                    }}
                  >
                    <GripVertical size={12} className="text-gray-400" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Connection Handles */}
        <Handle
          type="target"
          position={Position.Left}
          id="input-left"
          style={{ left: -8 }}
        />
        <Handle
          type="source"
          position={Position.Right}
          id="output-right"
          style={{ right: -8 }}
        />
        <Handle
          type="target"
          position={Position.Top}
          id="input-top"
          style={{ top: -8 }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="output-bottom"
          style={{ bottom: -8 }}
        />
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowContextMenu(false)}
          />
          <div
            className="fixed bg-white border border-gray-300 rounded shadow-lg py-1 z-50"
            style={{ left: contextMenuPosition.x, top: contextMenuPosition.y }}
          >
            <button
              onClick={addLane}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            >
              <Plus size={14} />
              Add Lane
            </button>
          </div>
        </>
      )}
    </>
  );
};