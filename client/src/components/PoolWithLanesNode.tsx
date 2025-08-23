import React, { useState, useCallback } from 'react';
import { NodeProps, NodeResizer, Handle, Position } from 'reactflow';
import { Building2, Users, Plus, Trash2, Split, ArrowUp, ArrowDown, Edit2 } from 'lucide-react';
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
  const { updateNode, deleteNode } = useDiagramStore();
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [contextLaneId, setContextLaneId] = useState<string | null>(null);
  const [selectedLaneId, setSelectedLaneId] = useState<string | null>(null);
  const [editingLane, setEditingLane] = useState<string | null>(null);
  const [laneName, setLaneName] = useState('');

  const handleResize = useCallback((_event: any, params: any) => {
    updateNode(id, { 
      width: params.width, 
      height: params.height 
    });
  }, [id, updateNode]);

  const handleContextMenu = useCallback((e: React.MouseEvent, laneId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setContextLaneId(laneId || null);
    setShowContextMenu(true);
  }, []);

  const handleLaneClick = useCallback((e: React.MouseEvent, laneId: string) => {
    e.stopPropagation();
    setSelectedLaneId(laneId);
  }, []);

  const addLaneAbove = useCallback((targetLaneId?: string) => {
    const lanes = data.lanes || [];
    const newLane: Lane = {
      id: `lane_${Date.now()}`,
      name: `Lane ${lanes.length + 1}`,
      height: 120,
      color: laneColors[lanes.length % laneColors.length]
    };
    
    let updatedLanes: Lane[];
    if (targetLaneId) {
      const index = lanes.findIndex(l => l.id === targetLaneId);
      updatedLanes = [...lanes.slice(0, index), newLane, ...lanes.slice(index)];
    } else {
      updatedLanes = [newLane, ...lanes];
    }
    
    const newHeight = updatedLanes.reduce((sum, lane) => sum + lane.height, 60);
    updateNode(id, { 
      lanes: updatedLanes,
      height: newHeight
    });
    setShowContextMenu(false);
  }, [data.lanes, id, updateNode]);

  const addLaneBelow = useCallback((targetLaneId?: string) => {
    const lanes = data.lanes || [];
    const newLane: Lane = {
      id: `lane_${Date.now()}`,
      name: `Lane ${lanes.length + 1}`,
      height: 120,
      color: laneColors[lanes.length % laneColors.length]
    };
    
    let updatedLanes: Lane[];
    if (targetLaneId) {
      const index = lanes.findIndex(l => l.id === targetLaneId);
      updatedLanes = [...lanes.slice(0, index + 1), newLane, ...lanes.slice(index + 1)];
    } else {
      updatedLanes = [...lanes, newLane];
    }
    
    const newHeight = updatedLanes.reduce((sum, lane) => sum + lane.height, 60);
    updateNode(id, { 
      lanes: updatedLanes,
      height: newHeight
    });
    setShowContextMenu(false);
  }, [data.lanes, id, updateNode]);

  const divideLane = useCallback((laneId: string) => {
    const lanes = data.lanes || [];
    const laneIndex = lanes.findIndex(l => l.id === laneId);
    if (laneIndex === -1) return;
    
    const originalLane = lanes[laneIndex];
    const halfHeight = originalLane.height / 2;
    
    const lane1: Lane = {
      ...originalLane,
      height: halfHeight,
      name: `${originalLane.name} (1)`
    };
    
    const lane2: Lane = {
      id: `lane_${Date.now()}`,
      name: `${originalLane.name} (2)`,
      height: halfHeight,
      color: laneColors[(lanes.length) % laneColors.length]
    };
    
    const updatedLanes = [
      ...lanes.slice(0, laneIndex),
      lane1,
      lane2,
      ...lanes.slice(laneIndex + 1)
    ];
    
    updateNode(id, { lanes: updatedLanes });
    setShowContextMenu(false);
  }, [data.lanes, id, updateNode]);

  const removeLane = useCallback((laneId: string) => {
    const updatedLanes = (data.lanes || []).filter(lane => lane.id !== laneId);
    const newHeight = updatedLanes.length > 0 
      ? updatedLanes.reduce((sum, lane) => sum + lane.height, 60)
      : 200;
    
    updateNode(id, { 
      lanes: updatedLanes,
      height: newHeight
    });
    setShowContextMenu(false);
    setSelectedLaneId(null);
  }, [data.lanes, id, updateNode]);

  const deleteEntirePool = useCallback(() => {
    deleteNode(id);
    setShowContextMenu(false);
  }, [id, deleteNode]);

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

  const lanes = data.lanes || [];
  const poolHeight = data.height || 200;
  const poolWidth = data.width || 600;

  // Clear selected lane when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.lane-container')) {
        setSelectedLaneId(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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
        onContextMenu={(e) => handleContextMenu(e)}
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
            <div 
              className="flex-1 flex items-center justify-center text-gray-400"
              onContextMenu={(e) => handleContextMenu(e)}
            >
              <div className="text-center">
                <p className="text-sm mb-2">No lanes defined</p>
                <button
                  onClick={() => addLaneBelow()}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs flex items-center gap-1"
                >
                  <Plus size={14} />
                  Add Lane
                </button>
              </div>
            </div>
          ) : (
            lanes.map((lane, index) => {
              let laneActualHeight = lane.height;
              // Calculate actual height as proportion of available space
              const totalLaneHeight = lanes.reduce((sum, l) => sum + l.height, 0);
              const availableHeight = poolHeight - 4; // Small padding
              laneActualHeight = (lane.height / totalLaneHeight) * availableHeight;

              const isSelected = selectedLaneId === lane.id;

              return (
                <div 
                  key={lane.id}
                  className={`lane-container relative border-b border-gray-300 last:border-b-0 group transition-all ${
                    isSelected ? 'ring-2 ring-blue-400 ring-inset z-10' : ''
                  }`}
                  style={{ 
                    backgroundColor: lane.color,
                    height: `${laneActualHeight}px`,
                    minHeight: '60px'
                  }}
                  onClick={(e) => handleLaneClick(e, lane.id)}
                  onContextMenu={(e) => handleContextMenu(e, lane.id)}
                >
                  {/* Lane Header */}
                  <div className={`absolute top-0 left-0 right-0 flex items-center justify-between p-2 ${
                    isSelected ? 'bg-blue-50/90' : 'bg-white/70'
                  } z-10`}>
                    <div className="flex items-center gap-2">
                      <Users size={14} className={isSelected ? 'text-blue-600' : 'text-gray-600'} />
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
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span 
                          className={`text-sm font-medium cursor-pointer ${
                            isSelected ? 'text-blue-700' : 'text-gray-700 hover:text-blue-600'
                          }`}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            startEditingLane(lane);
                          }}
                        >
                          {lane.name}
                        </span>
                      )}
                    </div>
                    
                    {/* Quick actions for selected lane */}
                    {isSelected && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditingLane(lane);
                          }}
                          className="p-1 hover:bg-blue-200 rounded text-blue-600"
                          title="Edit lane name"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            divideLane(lane.id);
                          }}
                          className="p-1 hover:bg-blue-200 rounded text-blue-600"
                          title="Divide lane"
                        >
                          <Split size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeLane(lane.id);
                          }}
                          className="p-1 hover:bg-red-200 rounded text-red-500"
                          title="Delete lane"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Lane Resize Handle - Now with better drag handling */}
                  {index < lanes.length - 1 && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize flex items-center justify-center z-30"
                      style={{
                        background: 'linear-gradient(to bottom, transparent, rgba(156, 163, 175, 0.3))'
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Prevent node dragging
                        const nodeElement = (e.target as HTMLElement).closest('.react-flow__node') as HTMLElement;
                        if (nodeElement) {
                          nodeElement.style.pointerEvents = 'none';
                        }
                        
                        const startY = e.clientY;
                        const startHeight = lane.height;
                        const nextLane = lanes[index + 1];
                        const nextStartHeight = nextLane.height;
                        
                        const handleMouseMove = (e: MouseEvent) => {
                          e.preventDefault();
                          e.stopPropagation();
                          
                          const deltaY = e.clientY - startY;
                          const scaleFactor = totalLaneHeight / availableHeight;
                          const adjustedDelta = deltaY * scaleFactor;
                          
                          const newHeight = startHeight + adjustedDelta;
                          const newNextHeight = nextStartHeight - adjustedDelta;
                          
                          if (newHeight >= 60 && newNextHeight >= 60) {
                            const updatedLanes = lanes.map((l, i) => {
                              if (i === index) return { ...l, height: newHeight };
                              if (i === index + 1) return { ...l, height: newNextHeight };
                              return l;
                            });
                            
                            updateNode(id, { lanes: updatedLanes });
                          }
                        };
                        
                        const handleMouseUp = (e: MouseEvent) => {
                          e.preventDefault();
                          e.stopPropagation();
                          
                          // Re-enable node dragging
                          if (nodeElement) {
                            nodeElement.style.pointerEvents = '';
                          }
                          
                          document.removeEventListener('mousemove', handleMouseMove);
                          document.removeEventListener('mouseup', handleMouseUp);
                        };
                        
                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                      }}
                    >
                      <div className="bg-gray-400 h-0.5 w-8 rounded" />
                    </div>
                  )}
                </div>
              );
            })
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
            className="fixed bg-white border border-gray-300 rounded-lg shadow-lg py-1 z-50 min-w-[200px]"
            style={{ left: contextMenuPosition.x, top: contextMenuPosition.y }}
          >
            {contextLaneId ? (
              // Lane-specific context menu
              <>
                <button
                  onClick={() => addLaneAbove(contextLaneId)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <ArrowUp size={14} />
                  Add Lane Above
                </button>
                <button
                  onClick={() => divideLane(contextLaneId)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <Split size={14} />
                  Divide into 2 Lanes
                </button>
                <button
                  onClick={() => addLaneBelow(contextLaneId)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <ArrowDown size={14} />
                  Add Lane Below
                </button>
                <div className="border-t border-gray-200 my-1" />
                <button
                  onClick={() => removeLane(contextLaneId)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  Delete Lane
                </button>
              </>
            ) : (
              // Pool context menu
              <>
                <button
                  onClick={() => addLaneBelow()}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <Plus size={14} />
                  Add Lane
                </button>
                <div className="border-t border-gray-200 my-1" />
                <button
                  onClick={deleteEntirePool}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  Delete Entire Pool
                </button>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
};