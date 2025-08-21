import React, { useState } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { DataObjectNodeData } from '../types';
import { useDiagramStore } from '../stores/diagramStore';
import { FileText, Database, Archive, Download, Upload } from 'lucide-react';

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

  const getDataIcon = () => {
    switch (data.dataType) {
      case 'input':
        return <Download className="w-4 h-4 text-green-600" />;
      case 'output':
        return <Upload className="w-4 h-4 text-blue-600" />;
      case 'collection':
        return <Archive className="w-4 h-4 text-purple-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getBackgroundColor = () => {
    switch (data.dataType) {
      case 'input':
        return 'bg-green-50 border-green-300';
      case 'output':
        return 'bg-blue-50 border-blue-300';
      case 'collection':
        return 'bg-purple-50 border-purple-300';
      default:
        return 'bg-gray-50 border-gray-300';
    }
  };

  return (
    <div className="relative">
      {/* Connection handles - data objects typically connect via associations */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white !shadow-sm hover:!scale-125 !transition-transform" 
        id="association-top"
      />
      <Handle 
        type="target" 
        position={Position.Left} 
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white !shadow-sm hover:!scale-125 !transition-transform" 
        id="association-left"
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white !shadow-sm hover:!scale-125 !transition-transform" 
        id="association-right"
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white !shadow-sm hover:!scale-125 !transition-transform" 
        id="association-bottom"
      />
      
      <div
        className={`border-2 shadow-md transition-all duration-150 hover:shadow-lg ${getBackgroundColor()} ${
          selected ? 'ring-2 ring-blue-400' : ''
        }`}
        style={{
          width: 100,
          height: 80,
          clipPath: 'polygon(0% 0%, 85% 0%, 100% 20%, 100% 100%, 0% 100%)',
        }}
        onDoubleClick={handleDoubleClick}
      >
        <div className="p-2 flex flex-col items-center justify-center h-full">
          {/* Data type icon */}
          <div className="mb-1">
            {getDataIcon()}
          </div>
          
          {/* Data object label */}
          {isEditing ? (
            <input
              value={label}
              onChange={handleLabelChange}
              onBlur={handleLabelBlur}
              onKeyDown={handleKeyDown}
              className="w-full text-center text-xs bg-transparent border-b border-gray-400 outline-none font-medium"
              style={{ fontSize: '10px' }}
              autoFocus
            />
          ) : (
            <span className="text-center text-xs font-medium leading-tight" style={{ fontSize: '10px' }}>
              {data.label || 'Data'}
            </span>
          )}
          
          {/* Data state */}
          {data.state && (
            <div className="text-xs text-gray-600 mt-1 leading-none" style={{ fontSize: '8px' }}>
              [{data.state}]
            </div>
          )}
        </div>
      </div>
      
      {/* Collection indicator for collection type */}
      {data.dataType === 'collection' && (
        <div className="absolute bottom-1 right-1">
          <Database className="w-3 h-3 text-purple-600" />
        </div>
      )}
    </div>
  );
};