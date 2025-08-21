import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Keyboard, X } from 'lucide-react';

interface KeyboardShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsDialog: React.FC<KeyboardShortcutsDialogProps> = ({ isOpen, onClose }) => {
  const shortcuts = [
    {
      category: 'Navigation & Selection',
      items: [
        { keys: 'Ctrl+F', description: 'Open search' },
        { keys: 'Ctrl+A', description: 'Select all elements' },
        { keys: 'Escape', description: 'Deselect all' },
        { keys: 'Delete / Backspace', description: 'Delete selected elements' },
        { keys: 'Arrow Keys', description: 'Navigate between selected elements' },
      ]
    },
    {
      category: 'Element Creation',
      items: [
        { keys: 'T', description: 'Add Task' },
        { keys: 'E', description: 'Add Start Event' },
        { keys: 'G', description: 'Add Gateway' },
        { keys: 'L', description: 'Add Lane' },
        { keys: 'P', description: 'Add Pool' },
        { keys: 'D', description: 'Add Data Object' },
        { keys: 'Ctrl+D', description: 'Duplicate selected elements' },
      ]
    },
    {
      category: 'Alignment & Layout',
      items: [
        { keys: 'Ctrl+Shift+L', description: 'Align left' },
        { keys: 'Ctrl+Shift+R', description: 'Align right' },
        { keys: 'Ctrl+Shift+T', description: 'Align top' },
        { keys: 'Ctrl+Shift+B', description: 'Align bottom' },
        { keys: 'Ctrl+Shift+C', description: 'Align center horizontally' },
        { keys: 'Ctrl+Shift+M', description: 'Align center vertically' },
        { keys: 'Ctrl+Shift+H', description: 'Distribute horizontally' },
        { keys: 'Ctrl+Shift+V', description: 'Distribute vertically' },
      ]
    },
    {
      category: 'View & Zoom',
      items: [
        { keys: 'Ctrl++', description: 'Zoom in' },
        { keys: 'Ctrl+-', description: 'Zoom out' },
        { keys: 'Ctrl+0', description: 'Fit view' },
        { keys: 'Ctrl+R', description: 'Reset view' },
      ]
    },
    {
      category: 'Editing',
      items: [
        { keys: 'Ctrl+Z', description: 'Undo' },
        { keys: 'Ctrl+Y / Ctrl+Shift+Z', description: 'Redo' },
        { keys: 'Ctrl+S', description: 'Save diagram' },
        { keys: 'F2', description: 'Rename selected element' },
      ]
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {shortcuts.map((category, index) => (
            <div key={index}>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {category.category}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {category.items.map((shortcut, shortcutIndex) => (
                  <div
                    key={shortcutIndex}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-sm text-gray-700">
                      {shortcut.description}
                    </span>
                    <kbd className="px-2 py-1 bg-gray-200 text-gray-800 text-xs font-mono rounded border">
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h4 className="font-medium text-blue-900 mb-2">💡 Pro Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use <kbd className="px-1 py-0.5 bg-blue-100 text-blue-900 text-xs rounded">Ctrl+F</kbd> to quickly search for elements</li>
            <li>• Select multiple elements and use alignment shortcuts for perfect layouts</li>
            <li>• Use arrow keys to navigate between selected elements without mouse</li>
            <li>• Press single letters (T, E, G, etc.) to quickly add elements anywhere on canvas</li>
          </ul>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
