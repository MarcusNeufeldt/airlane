import React, { useState } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { DataObjectNodeData } from '../types';
import { useDiagramStore } from '../stores/diagramStore';
import { FileText, Database, Archive } from 'lucide-react';

export const DataObjectNode: React.FC<NodeProps<DataObjectNodeData>> = ({ id, data, selected }) => {
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

  return (
    <div 
      className="relative group flex flex-col items-center justify-center"
      style={{ width: 80, height: 90 }} // Smaller, invisible bounding box for handles
    >
      {/* Connection handles - positioned directly on the icon edges */}
      <Handle 
        type="target" 
        id="association-top"
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white !shadow-sm hover:!scale-125 !transition-transform !opacity-0 group-hover:!opacity-100" 
        style={{ top: 20, left: '50%', transform: 'translate(-50%, -50%)' }}
      />
      <Handle 
        type="target" 
        id="association-left"
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white !shadow-sm hover:!scale-125 !transition-transform !opacity-0 group-hover:!opacity-100" 
        style={{ top: '50%', left: 24, transform: 'translate(-50%, -50%)' }}
      />
      <Handle 
        type="source" 
        id="association-right"
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white !shadow-sm hover:!scale-125 !transition-transform !opacity-0 group-hover:!opacity-100" 
        style={{ top: '50%', right: 14, transform: 'translate(50%, -50%)' }}
      />
      <Handle 
        type="source" 
        id="association-bottom"
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white !shadow-sm hover:!scale-125 !transition-transform !opacity-0 group-hover:!opacity-100" 
        style={{ bottom: 18, top: 'auto', left: '50%', transform: 'translate(-50%, 50%)' }}
      />
      
      {/* Visible Content: Icon and Label */}
      <div 
        className={`flex flex-col items-center p-2 rounded-md transition-all ${selected ? 'bg-blue-100 ring-2 ring-blue-400' : 'bg-transparent'}`}
        onDoubleClick={handleDoubleClick}
      >
        {/* Icon */}
        <div className="mb-1">
          {data.dataObjectType === 'data-store' 
            ? <Database className="w-8 h-8 text-gray-700" /> 
            : <FileText className="w-8 h-8 text-gray-700" />
          }
        </div>
        
        {/* Label */}
        {isEditing ? (
          <input
            value={label}
            onChange={handleLabelChange}
            onBlur={handleLabelBlur}
            onKeyDown={handleKeyDown}
            className="w-20 text-center text-xs bg-white border-b border-gray-400 outline-none font-medium"
            autoFocus
          />
        ) : (
          <span className="text-center text-xs font-medium leading-tight max-w-[80px]">
            {data.label || 'Data'}
          </span>
        )}
      </div>
      
      {/* Collection indicator for collection type */}
      {data.dataType === 'collection' && (
        <div className="absolute bottom-1 right-1">
          <Archive className="w-3 h-3 text-gray-600" />
        </div>
      )}
    </div>
  );
};