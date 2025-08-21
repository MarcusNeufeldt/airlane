import React, { useState } from 'react';
import { NodeProps, Handle, Position, NodeResizer } from 'reactflow';
import { PoolNodeData } from '../types';
import { useDiagramStore } from '../stores/diagramStore';
import { Building2, ChevronDown, ChevronRight } from 'lucide-react';

export const PoolNode: React.FC<NodeProps<PoolNodeData>> = ({ id, data, selected }) => {
  const { updateNode } = useDiagramStore();
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

  const toggleCollapsed = () => {
    updateNode(id, { isCollapsed: !data.isCollapsed });
  };

  const handleResize = (event: any, params: any) => {
    updateNode(id, {
      width: params.width,
      height: params.height,
    });
  };

  return (
    <div className="relative">
      {/* Resizer - allows dragging to resize */}
      <NodeResizer
        color="#7c3aed"
        isVisible={selected}
        minWidth={300}
        minHeight={data.isCollapsed ? 60 : 150}
        onResize={handleResize}
      />
      
      {/* Connection handles - pools can have message flows */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!w-3 !h-3 !bg-green-500 !border-2 !border-white opacity-0 hover:opacity-100 !transition-opacity" 
        id="message-input-top"
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!w-3 !h-3 !bg-green-500 !border-2 !border-white opacity-0 hover:opacity-100 !transition-opacity" 
        id="message-output-bottom"
      />
      
      <div
        className={`bg-white border-2 border-gray-400 rounded-lg flex transition-all duration-150 ${
          selected ? 'border-blue-500 ring-2 ring-blue-200' : 'hover:border-gray-500'
        } ${data.isCollapsed ? 'shadow-sm' : 'shadow-lg'}`}
        style={{
          width: data.width || 400,
          height: data.isCollapsed ? 60 : (data.height || 200),
          minWidth: 300,
          minHeight: data.isCollapsed ? 60 : 150,
        }}
      >
        {/* Pool participant header (rotated on left side) */}
        <div className="bg-gray-100 border-r border-gray-300 flex items-center justify-center p-2 rounded-l-lg" style={{ width: '40px' }}>
          <div className="transform -rotate-90 whitespace-nowrap">
            <div className="flex items-center space-x-1">
              <Building2 className="w-3 h-3 text-gray-600" />
              {isEditing ? (
                <input
                  value={label}
                  onChange={handleLabelChange}
                  onBlur={handleLabelBlur}
                  onKeyDown={handleKeyDown}
                  className="text-xs font-medium bg-transparent border-b border-gray-400 outline-none text-gray-800 w-16"
                  autoFocus
                />
              ) : (
                <span 
                  className="text-xs font-medium text-gray-800 cursor-pointer" 
                  onDoubleClick={handleDoubleClick}
                >
                  {data.participant || 'Participant'}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Pool content area */}
        <div className="flex-1 flex flex-col">
          {/* Collapse/expand toggle */}
          <div className="flex justify-between items-center p-2 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-700">{data.label || 'Process Pool'}</span>
            <button
              onClick={toggleCollapsed}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              {data.isCollapsed ? (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>
          
          {/* Pool content (hidden when collapsed) */}
          {!data.isCollapsed && (
            <div className="flex-1 p-4 text-center text-sm text-gray-500">
              <div>Add lanes and process elements here</div>
              <div className="text-xs mt-2 text-gray-400">
                Participant: {data.participant || 'Not assigned'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};