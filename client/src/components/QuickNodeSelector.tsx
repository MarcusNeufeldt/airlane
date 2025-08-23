import React, { useEffect, useRef } from 'react';
import { 
  Activity, 
  PlayCircle, 
  StopCircle, 
  GitBranch, 
  Database,
  Clock
} from 'lucide-react';

interface QuickNodeSelectorProps {
  x: number; // Screen coordinates
  y: number; // Screen coordinates
  sourceNodeId: string;
  onSelectNode: (nodeType: string, direction: 'right' | 'down' | 'left' | 'up', eventType?: string) => void;
  onClose: () => void;
}

const nodeTypes = [
  { type: 'process', icon: Activity, label: 'Task', color: 'bg-blue-100 hover:bg-blue-200 text-blue-800' },
  { type: 'event', subType: 'start', icon: PlayCircle, label: 'Start', color: 'bg-green-100 hover:bg-green-200 text-green-800' },
  { type: 'event', subType: 'end', icon: StopCircle, label: 'End', color: 'bg-red-100 hover:bg-red-200 text-red-800' },
  { type: 'gateway', icon: GitBranch, label: 'Gateway', color: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800' },
  { type: 'event', subType: 'intermediate', icon: Clock, label: 'Timer', color: 'bg-purple-100 hover:bg-purple-200 text-purple-800' },
  { type: 'data-object', icon: Database, label: 'Data', color: 'bg-gray-100 hover:bg-gray-200 text-gray-800' },
];

export const QuickNodeSelector: React.FC<QuickNodeSelectorProps> = ({
  x,
  y,
  sourceNodeId,
  onSelectNode,
  onClose
}) => {
  const selectorRef = useRef<HTMLDivElement>(null);
  const [selectedDirection, setSelectedDirection] = React.useState<'right' | 'down' | 'left' | 'up'>('right');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    // Add a small delay to prevent immediate closing
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Calculate position to ensure the selector stays within viewport
  const calculatePosition = () => {
    const selectorWidth = 280; // Approximate width
    const selectorHeight = 200; // Approximate height
    const padding = 20;

    let adjustedX = x;
    let adjustedY = y;

    // Adjust horizontal position
    if (x + selectorWidth > window.innerWidth - padding) {
      adjustedX = x - selectorWidth - padding;
    }

    // Adjust vertical position
    if (y + selectorHeight > window.innerHeight - padding) {
      adjustedY = y - selectorHeight - padding;
    }

    return { x: adjustedX, y: adjustedY };
  };

  const position = calculatePosition();

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black bg-opacity-10" />
      
      {/* Quick Node Selector */}
      <div
        ref={selectorRef}
        className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-xl p-4"
        style={{ 
          left: position.x, 
          top: position.y,
          minWidth: '280px'
        }}
      >
        <div className="text-sm font-medium text-gray-700 mb-3">Add Node</div>
        
        {/* Direction Selector */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {/* Up */}
          <div className="col-start-2">
            <button
              onClick={() => setSelectedDirection('up')}
              className={`w-8 h-8 rounded border flex items-center justify-center transition-colors ${
                selectedDirection === 'up' 
                  ? 'bg-blue-500 text-white border-blue-600' 
                  : 'bg-gray-100 hover:bg-gray-200 border-gray-300'
              }`}
              title="Add above"
            >
              ↑
            </button>
          </div>
          
          {/* Left */}
          <div className="col-start-1 row-start-2">
            <button
              onClick={() => setSelectedDirection('left')}
              className={`w-8 h-8 rounded border flex items-center justify-center transition-colors ${
                selectedDirection === 'left' 
                  ? 'bg-blue-500 text-white border-blue-600' 
                  : 'bg-gray-100 hover:bg-gray-200 border-gray-300'
              }`}
              title="Add to left"
            >
              ←
            </button>
          </div>
          
          {/* Center (source node indicator) */}
          <div className="col-start-2 row-start-2">
            <div className="w-8 h-8 bg-gray-400 rounded border-2 border-gray-500 flex items-center justify-center">
              <Activity size={16} className="text-white" />
            </div>
          </div>
          
          {/* Right */}
          <div className="col-start-3 row-start-2">
            <button
              onClick={() => setSelectedDirection('right')}
              className={`w-8 h-8 rounded border flex items-center justify-center transition-colors ${
                selectedDirection === 'right' 
                  ? 'bg-blue-500 text-white border-blue-600' 
                  : 'bg-gray-100 hover:bg-gray-200 border-gray-300'
              }`}
              title="Add to right"
            >
              →
            </button>
          </div>
          
          {/* Down */}
          <div className="col-start-2 row-start-3">
            <button
              onClick={() => setSelectedDirection('down')}
              className={`w-8 h-8 rounded border flex items-center justify-center transition-colors ${
                selectedDirection === 'down' 
                  ? 'bg-blue-500 text-white border-blue-600' 
                  : 'bg-gray-100 hover:bg-gray-200 border-gray-300'
              }`}
              title="Add below"
            >
              ↓
            </button>
          </div>
        </div>

        {/* Node Type Grid */}
        <div className="grid grid-cols-3 gap-2">
          {nodeTypes.map(({ type, subType, icon: Icon, label, color }) => (
            <button
              key={`${type}-${subType || 'default'}`}
              onClick={() => {
                onSelectNode(type, selectedDirection, subType);
                onClose();
              }}
              className={`p-3 rounded-lg border border-gray-200 flex flex-col items-center gap-1 transition-colors ${color}`}
              title={`Add ${label} ${selectedDirection}`}
            >
              <Icon size={20} />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>


      </div>
    </>
  );
};
