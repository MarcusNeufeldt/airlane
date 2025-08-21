import React, { useRef, useEffect } from 'react';
import { Settings, ChevronDown, Layout, Grid3x3, Users, Maximize2 } from 'lucide-react';
import { useDiagramStore } from '../../stores/diagramStore';

interface ViewMenuProps {
  showMiniMap?: boolean;
  onToggleMiniMap?: () => void;
}

export const ViewMenu: React.FC<ViewMenuProps> = ({ showMiniMap, onToggleMiniMap }) => {
  const {
    autoLayout,
    snapToGrid,
    toggleGrid,
    showViewMenu,
    showLaneColors,
    setShowViewMenu,
    setShowLaneColors
  } = useDiagramStore();

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (showViewMenu && menuRef.current && !menuRef.current.contains(target)) {
        setShowViewMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showViewMenu, setShowViewMenu]);

  const handleAutoLayout = () => {
    autoLayout();
    setShowViewMenu(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowViewMenu(!showViewMenu)}
        className="flex items-center space-x-1 px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded transition-colors"
      >
        <Settings size={16} />
        <span className="text-sm">View</span>
        <ChevronDown size={14} />
      </button>
      
      {showViewMenu && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[150px]">
          <button
            onClick={handleAutoLayout}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
          >
            <Layout size={14} />
            <span>Auto Layout</span>
          </button>
          <button
            onClick={() => {
              toggleGrid();
              setShowViewMenu(false);
            }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
          >
            <Grid3x3 size={14} />
            <span>{snapToGrid ? 'Disable' : 'Enable'} Grid</span>
          </button>
          <button
            onClick={() => {
              setShowLaneColors(!showLaneColors);
              setShowViewMenu(false);
            }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
          >
            <Users size={14} />
            <span>{showLaneColors ? 'Hide' : 'Show'} Lane Colors</span>
          </button>
          <button
            onClick={() => {
              onToggleMiniMap?.();
              setShowViewMenu(false);
            }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
          >
            <Maximize2 size={14} />
            <span>{showMiniMap ? 'Hide' : 'Show'} Mini Map</span>
          </button>
        </div>
      )}
    </div>
  );
};