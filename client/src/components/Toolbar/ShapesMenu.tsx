import React, { useRef, useEffect } from 'react';
import { Shapes, ChevronDown, StickyNote, Square, Circle, Diamond } from 'lucide-react';
import { useDiagramStore } from '../../stores/diagramStore';

export const ShapesMenu: React.FC = () => {
  const {
    addStickyNote,
    addShape,
    isReadOnly,
    showShapeMenu,
    setShowShapeMenu
  } = useDiagramStore();

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (showShapeMenu && menuRef.current && !menuRef.current.contains(target)) {
        setShowShapeMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showShapeMenu, setShowShapeMenu]);

  const handleAddStickyNote = () => {
    addStickyNote({ x: 500, y: 300 });
    setShowShapeMenu(false);
  };

  const handleAddShape = (shapeType: 'rectangle' | 'circle' | 'diamond') => {
    addShape({ x: 500, y: 300 }, shapeType);
    setShowShapeMenu(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowShapeMenu(!showShapeMenu)}
        disabled={isReadOnly}
        className="flex items-center space-x-1 px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Shapes size={16} />
        <span className="text-sm">Shapes</span>
        <ChevronDown size={14} />
      </button>
      
      {showShapeMenu && !isReadOnly && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[150px]">
          <button
            onClick={handleAddStickyNote}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
          >
            <StickyNote size={14} />
            <span>Sticky Note</span>
          </button>
          <div className="border-t border-gray-200 my-1"></div>
          <button
            onClick={() => handleAddShape('rectangle')}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
          >
            <Square size={14} />
            <span>Rectangle</span>
          </button>
          <button
            onClick={() => handleAddShape('circle')}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
          >
            <Circle size={14} />
            <span>Circle</span>
          </button>
          <button
            onClick={() => handleAddShape('diamond')}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
          >
            <Diamond size={14} />
            <span>Diamond</span>
          </button>
        </div>
      )}
    </div>
  );
};