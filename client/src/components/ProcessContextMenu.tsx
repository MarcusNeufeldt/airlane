import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { 
  Trash2, 
  Edit3, 
  Copy, 
  Settings,
  PlusCircle,
  ArrowRight,
  ArrowDown,
  ArrowLeft,
  ArrowUp
} from 'lucide-react';

interface ProcessContextMenuProps {
  x: number;
  y: number;
  nodeId?: string;
  nodeType?: string;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onProperties: () => void;
  onAddNode?: (type: string, direction: 'right' | 'down' | 'left' | 'up') => void;
}

export const ProcessContextMenu: React.FC<ProcessContextMenuProps> = ({
  x,
  y,
  nodeId,
  nodeType,
  onClose,
  onDelete,
  onEdit,
  onDuplicate,
  onProperties,
  onAddNode,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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

  // Different menu items based on context
  const getMenuItems = () => {
    const items = [];

    if (nodeId) {
      // Node-specific actions
      items.push({
        icon: Edit3,
        label: 'Edit Label',
        onClick: onEdit,
        shortcut: 'F2',
      });

      items.push({
        icon: Settings,
        label: 'Properties',
        onClick: onProperties,
        shortcut: 'Enter',
      });

      if (nodeType === 'process' || nodeType === 'event' || nodeType === 'gateway') {
        items.push({ divider: true });
        
        // Add connected nodes
        items.push({
          icon: PlusCircle,
          label: 'Add Node',
          submenu: [
            {
              icon: ArrowRight,
              label: 'Add to Right',
              onClick: () => onAddNode?.('process', 'right'),
            },
            {
              icon: ArrowDown,
              label: 'Add Below',
              onClick: () => onAddNode?.('process', 'down'),
            },
            {
              icon: ArrowLeft,
              label: 'Add to Left',
              onClick: () => onAddNode?.('process', 'left'),
            },
            {
              icon: ArrowUp,
              label: 'Add Above',
              onClick: () => onAddNode?.('process', 'up'),
            },
          ],
        });
      }

      items.push({ divider: true });

      items.push({
        icon: Copy,
        label: 'Duplicate',
        onClick: onDuplicate,
        shortcut: 'Ctrl+D',
      });

      items.push({
        icon: Trash2,
        label: `Delete ${getNodeTypeLabel(nodeType)}`,
        onClick: onDelete,
        shortcut: 'Del',
        danger: true,
      });
    } else {
      // Canvas context menu
      items.push({
        icon: PlusCircle,
        label: 'Add Process Task',
        onClick: () => onAddNode?.('process', 'down'),
      });
      
      items.push({
        icon: PlusCircle,
        label: 'Add Start Event',
        onClick: () => onAddNode?.('event', 'down'),
      });
      
      items.push({
        icon: PlusCircle,
        label: 'Add Gateway',
        onClick: () => onAddNode?.('gateway', 'down'),
      });
    }

    return items;
  };

  const getNodeTypeLabel = (type?: string) => {
    switch (type) {
      case 'process': return 'Task';
      case 'event': return 'Event';
      case 'gateway': return 'Gateway';
      case 'lane': return 'Lane';
      case 'pool': return 'Pool';
      case 'data-object': return 'Data Object';
      default: return 'Element';
    }
  };

  const menuItems = getMenuItems();

  const menuContent = (
    <div
      ref={menuRef}
      className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[9999] min-w-[200px]"
      style={{ 
        left: Math.min(x, window.innerWidth - 220), 
        top: Math.min(y, window.innerHeight - 300) 
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {menuItems.map((item, index) => {
        if ('divider' in item && item.divider) {
          return <div key={index} className="border-t border-gray-200 my-1" />;
        }

        if ('submenu' in item && item.submenu) {
          return (
            <div key={index} className="relative group">
              <button
                className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-100 transition-colors text-gray-700"
              >
                <div className="flex items-center space-x-2">
                  <item.icon size={16} />
                  <span className="text-sm">{item.label}</span>
                </div>
                <ArrowRight size={12} className="text-gray-400" />
              </button>
              
              {/* Submenu */}
              <div className="absolute left-full top-0 ml-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[180px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[10000]">
                {item.submenu.map((subItem, subIndex) => (
                  <button
                    key={subIndex}
                    onClick={(e) => {
                      e.stopPropagation();
                      subItem.onClick();
                      onClose();
                    }}
                    className="w-full px-3 py-2 flex items-center space-x-2 hover:bg-gray-100 transition-colors text-gray-700"
                  >
                    <subItem.icon size={16} />
                    <span className="text-sm">{subItem.label}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        }

        const Icon = item.icon!;
        return (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              item.onClick!();
              onClose();
            }}
            className={`w-full px-3 py-2 flex items-center justify-between hover:bg-gray-100 transition-colors ${
              item.danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Icon size={16} />
              <span className="text-sm">{item.label}</span>
            </div>
            {item.shortcut && (
              <span className="text-xs text-gray-400">{item.shortcut}</span>
            )}
          </button>
        );
      })}
    </div>
  );

  return ReactDOM.createPortal(menuContent, document.body);
};