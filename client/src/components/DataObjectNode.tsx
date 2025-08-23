import React, { useState } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { DataObjectNodeData } from '../types';
import { useDiagramStore } from '../stores/diagramStore';
import { FileText, Database, Archive, HardDrive, Link2 } from 'lucide-react';

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
    <div className="relative group">
      {/* BPMN Data Object Box */}
      <div 
        className={`bg-white border-2 rounded-lg shadow-lg transition-all duration-150 hover:shadow-xl flex flex-col items-center justify-center p-3 ${
          selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-400 hover:border-gray-500'
        }`}
        style={{ width: 80, height: 90 }}
        onDoubleClick={handleDoubleClick}
      >
        {/* Connection handles - positioned on the box edges */}
        <Handle 
          type="target" 
          position={Position.Top}
          id="association-top"
          className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white !shadow-sm hover:!scale-125 !transition-transform" 
          style={{ top: -6, left: '50%', transform: 'translate(-50%, 0)' }}
        />
        <Handle 
          type="target" 
          position={Position.Left}
          id="association-left"
          className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white !shadow-sm hover:!scale-125 !transition-transform" 
          style={{ top: '50%', left: -6, transform: 'translate(0, -50%)' }}
        />
        <Handle 
          type="source" 
          position={Position.Right}
          id="association-right"
          className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white !shadow-sm hover:!scale-125 !transition-transform" 
          style={{ top: '50%', right: -6, transform: 'translate(0, -50%)' }}
        />
        <Handle 
          type="source" 
          position={Position.Bottom}
          id="association-bottom"
          className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white !shadow-sm hover:!scale-125 !transition-transform" 
          style={{ bottom: -6, left: '50%', transform: 'translate(-50%, 0)' }}
        />
        {/* Icon */}
        <div className="mb-1">
          {data.dataObjectType === 'data-store' ? (
            <Database className="w-6 h-6 text-gray-700" />
          ) : data.dataType === 'storage' ? (
            <HardDrive className="w-6 h-6 text-gray-700" />
          ) : data.dataType === 'reference' ? (
            <Link2 className="w-6 h-6 text-gray-700" />
          ) : (
            <FileText className="w-6 h-6 text-gray-700" />
          )}
        </div>
        
        {/* Label */}
        {isEditing ? (
          <input
            value={label}
            onChange={handleLabelChange}
            onBlur={handleLabelBlur}
            onKeyDown={handleKeyDown}
            className="w-16 text-center text-xs bg-white border-b border-gray-400 outline-none font-medium"
            autoFocus
          />
        ) : (
          <span className="text-center text-xs font-medium leading-tight max-w-[70px] text-gray-700">
            {data.label || 'Data'}
          </span>
        )}
        
        {/* Collection indicator for collection type */}
        {data.dataType === 'collection' && (
          <div className="absolute bottom-1 right-1">
            <Archive className="w-3 h-3 text-gray-600" />
          </div>
        )}
      </div>
    </div>
  );
};