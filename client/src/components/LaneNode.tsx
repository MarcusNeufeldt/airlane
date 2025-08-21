import React, { useState, useEffect, useRef } from 'react';
import { NodeProps, Handle, Position, NodeResizer } from 'reactflow';
import { LaneNodeData } from '../types';
import { useDiagramStore } from '../stores/diagramStore';
import { User, Users, Lock, Unlock, Palette } from 'lucide-react';

export const LaneNode: React.FC<NodeProps<LaneNodeData>> = ({ id, data, selected }) => {
  const { updateNode } = useDiagramStore();
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

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

  const handleResize = (event: any, params: any) => {
    updateNode(id, {
      width: params.width,
      height: params.height,
    });
  };

  const handleToggleLock = () => {
    const newLocked = !data.locked;
    updateNode(id, { locked: newLocked });
  };

  const handleColorChange = (color: string) => {
    updateNode(id, { backgroundColor: color });
    setShowColorPicker(false);
  };

  // Predefined color palette
  const colorOptions = [
    '#dbeafe', // light blue (default)
    '#dcfce7', // light green
    '#fef3c7', // light yellow
    '#fce7f3', // light pink
    '#f3e8ff', // light purple
    '#fdf2f8', // light rose
    '#ecfdf5', // light emerald
    '#fff7ed', // light orange
    '#f0f9ff', // lighter blue
    '#ffffff', // white
    '#f3f4f6', // light gray
    '#e5e7eb', // gray
  ];

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
    };

    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColorPicker]);

  return (
    <div className="relative">
      {/* Resizer - allows dragging to resize (only when not locked) */}
      {!data.locked && (
        <NodeResizer
          color="#2563eb"
          isVisible={selected}
          minWidth={200}
          minHeight={100}
          onResize={handleResize}
        />
      )}
      
      {/* Connection handles - lanes can have connections on all sides */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!w-2 !h-2 !bg-gray-400 !border !border-white opacity-0 hover:opacity-100 !transition-opacity" 
        id="input-top"
      />
      <Handle 
        type="target" 
        position={Position.Left} 
        className="!w-2 !h-2 !bg-gray-400 !border !border-white opacity-0 hover:opacity-100 !transition-opacity" 
        id="input-left"
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        className="!w-2 !h-2 !bg-gray-400 !border !border-white opacity-0 hover:opacity-100 !transition-opacity" 
        id="output-right"
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!w-2 !h-2 !bg-gray-400 !border !border-white opacity-0 hover:opacity-100 !transition-opacity" 
        id="output-bottom"
      />
      
      <div
        className={`border-2 rounded-lg flex flex-col transition-all duration-150 ${
          data.locked 
            ? 'border-gray-300 opacity-75' 
            : selected 
              ? 'border-blue-500 ring-2 ring-blue-200' 
              : 'border-blue-200 hover:border-blue-300'
        }`}
        style={{
          backgroundColor: data.backgroundColor || '#dbeafe',
          width: data.width || 300,
          height: data.height || 150,
          minWidth: 200,
          minHeight: 100,
        }}
      >
        {/* Lane header */}
        <div className={`border-b border-blue-200 p-2 rounded-t-lg ${data.locked ? 'bg-gray-100' : 'bg-blue-100'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {data.assignee ? <User className="w-4 h-4 text-blue-600" /> : <Users className="w-4 h-4 text-blue-600" />}
              {isEditing ? (
                <input
                  value={label}
                  onChange={handleLabelChange}
                  onBlur={handleLabelBlur}
                  onKeyDown={handleKeyDown}
                  className="text-sm font-medium bg-transparent border-b border-blue-400 outline-none text-blue-800"
                  autoFocus
                />
              ) : (
                <span 
                  className="text-sm font-medium text-blue-800 cursor-pointer" 
                  onDoubleClick={handleDoubleClick}
                >
                  {data.label || 'Lane'}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-1">
              {/* Color Picker Button */}
              <div className="relative" ref={colorPickerRef}>
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="p-1 rounded transition-colors text-gray-600 hover:bg-blue-200"
                  title="Change lane color"
                >
                  <Palette className="w-4 h-4" />
                </button>
                
                {/* Color Picker Dropdown */}
                {showColorPicker && (
                  <div className="absolute top-8 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[140px]">
                    <div className="grid grid-cols-4 gap-1">
                      {colorOptions.map((color) => (
                        <button
                          key={color}
                          onClick={() => handleColorChange(color)}
                          className={`w-6 h-6 rounded border-2 hover:scale-110 transition-transform ${
                            (data.backgroundColor || '#dbeafe') === color 
                              ? 'border-blue-500 ring-1 ring-blue-200' 
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Lock/Unlock Button */}
              <button
                onClick={handleToggleLock}
                className={`p-1 rounded transition-colors ${
                  data.locked 
                    ? 'text-red-600 hover:bg-red-50' 
                    : 'text-gray-600 hover:bg-blue-200'
                }`}
                title={data.locked ? 'Unlock lane' : 'Lock lane'}
              >
                {data.locked ? (
                  <Lock className="w-4 h-4" />
                ) : (
                  <Unlock className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          {data.assignee && (
            <div className="text-xs text-blue-600 mt-1">
              Assignee: {data.assignee}
            </div>
          )}
        </div>
        
        {/* Lane content area */}
        <div className="flex-1 p-2 text-center text-xs text-gray-500">
          Drop process elements here
        </div>
      </div>
    </div>
  );
};