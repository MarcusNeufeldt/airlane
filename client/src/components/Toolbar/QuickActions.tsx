import React, { useState } from 'react';
import { Search, Focus, Keyboard, Undo, Redo, Bot } from 'lucide-react';
import { useDiagramStore } from '../../stores/diagramStore';
import { KeyboardShortcutsDialog } from '../KeyboardShortcutsDialog';

interface QuickActionsProps {
  onOpenAIChat: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onOpenAIChat }) => {
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    isReadOnly,
    setSearchOpen,
    addNotification
  } = useDiagramStore();

  const [showKeyboardShortcutsDialog, setShowKeyboardShortcutsDialog] = useState(false);

  const handleFitView = () => {
    // Trigger the native ReactFlow fit view button
    const fitViewButton = document.querySelector('.react-flow__controls-fitview') as HTMLButtonElement;
    if (fitViewButton) {
      fitViewButton.click();
      addNotification('success', 'Fitted all tables in view');
    } else {
      // Fallback: try to find any fit view control
      const controls = document.querySelector('.react-flow__controls');
      const buttons = controls?.querySelectorAll('button');
      if (buttons && buttons.length >= 3) {
        // Usually the fit view button is the 3rd button (after zoom in/out)
        (buttons[2] as HTMLButtonElement).click();
        addNotification('success', 'Fitted all tables in view');
      } else {
        addNotification('warning', 'Could not find fit view control. Use the controls panel on the bottom-right.');
      }
    }
  };

  return (
    <div className="flex items-center space-x-3">
      {/* Essential Actions - Compact Group */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => setSearchOpen(true)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
          title="Search (Ctrl+F)"
        >
          <Search size={18} />
        </button>

        <button
          onClick={handleFitView}
          className="p-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors"
          title="Fit all in view (⌘+Shift+F)"
        >
          <Focus size={18} />
        </button>

        <button
          onClick={() => setShowKeyboardShortcutsDialog(true)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
          title="Shortcuts (Ctrl+?)"
        >
          <Keyboard size={18} />
        </button>
      </div>

      {/* Undo/Redo - Grouped */}
      <div className="flex items-center space-x-0.5 bg-gray-50 rounded-lg p-1">
        <button
          onClick={undo}
          disabled={!canUndo || isReadOnly}
          className="p-1.5 text-gray-600 hover:bg-white hover:shadow-sm rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          title="Undo (Ctrl+Z)"
        >
          <Undo size={16} />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo || isReadOnly}
          className="p-1.5 text-gray-600 hover:bg-white hover:shadow-sm rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          title="Redo (Ctrl+Y)"
        >
          <Redo size={16} />
        </button>
      </div>

      {/* AI Assistant - Prominent */}
      <button
        onClick={onOpenAIChat}
        disabled={isReadOnly}
        className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500"
        title={isReadOnly ? "AI Assistant is disabled in read-only mode" : "Open AI Assistant"}
      >
        <Bot size={18} />
        <span className="text-sm font-medium">AI</span>
      </button>

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog
        isOpen={showKeyboardShortcutsDialog}
        onClose={() => setShowKeyboardShortcutsDialog(false)}
      />
    </div>
  );
};