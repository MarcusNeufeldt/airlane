import React, { useRef, useEffect, useState } from 'react';
import {
  Download, Upload, Save, Undo, Redo, Bot, Layout,
  Grid3x3, StickyNote, Square, Circle, Diamond, ChevronDown,
  FileText, Shapes, Settings, Eye, Maximize2, Focus, Search,
  GitBranch, Activity, Users, Building2, Database, StopCircle, PlayCircle,
  Keyboard
} from 'lucide-react';
// Removed useReactFlow import to avoid context issues
import { useDiagramStore } from '../stores/diagramStore';
import { userService } from '../services/userService';
import { LockStatusIndicator } from './LockStatusIndicator';
import { exportCurrentViewportAsPNG, exportFullDiagramAsPNG } from '../lib/exportUtils';
import { ImportExportDialog } from './ImportExportDialog';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';

interface ToolbarProps {
  onOpenAIChat: () => void;
  showMiniMap?: boolean;
  onToggleMiniMap?: () => void;
}

export const ToolbarClean: React.FC<ToolbarProps> = ({ onOpenAIChat, showMiniMap, onToggleMiniMap }) => {
  const { 
    addNode, 
    nodes, 
    edges, 
    importDiagram, 
    autoLayout, 
    undo, 
    redo, 
    canUndo, 
    canRedo,
    snapToGrid,
    toggleGrid,
    addStickyNote,
    addShape,
    isReadOnly,
    currentDiagramId,
    addNotification,
    showFileMenu,
    showShapeMenu,
    showViewMenu,
    showLaneColors,
    setShowFileMenu,
    setShowShapeMenu,
    setShowViewMenu,
    setShowLaneColors,
    setSearchOpen
  } = useDiagramStore();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileMenuRef = useRef<HTMLDivElement>(null);
  const shapeMenuRef = useRef<HTMLDivElement>(null);
  const viewMenuRef = useRef<HTMLDivElement>(null);
  
  // Dialog states
  const [showImportExportDialog, setShowImportExportDialog] = useState(false);
  const [showKeyboardShortcutsDialog, setShowKeyboardShortcutsDialog] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Check if click is outside file menu
      if (showFileMenu && fileMenuRef.current && !fileMenuRef.current.contains(target)) {
        setShowFileMenu(false);
      }
      
      // Check if click is outside shape menu
      if (showShapeMenu && shapeMenuRef.current && !shapeMenuRef.current.contains(target)) {
        setShowShapeMenu(false);
      }
      
      // Check if click is outside view menu
      if (showViewMenu && viewMenuRef.current && !viewMenuRef.current.contains(target)) {
        setShowViewMenu(false);
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFileMenu, showShapeMenu, showViewMenu, setShowFileMenu, setShowShapeMenu, setShowViewMenu]);

  const handleAddProcess = () => {
    addNode('process', { x: 400, y: 200 });
  };
  
  const handleAddStartEvent = () => {
    addNode('event', { x: 400, y: 200 }, { eventType: 'start' });
  };

  const handleAddEndEvent = () => {
    addNode('event', { x: 400, y: 200 }, { eventType: 'end' });
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleAddIntermediateEvent = () => {
    addNode('event', { x: 400, y: 200 }, { eventType: 'intermediate' });
  };
  
  const handleAddGateway = () => {
    addNode('gateway', { x: 400, y: 200 });
  };

  const handleAddLane = () => {
    addNode('lane', { x: 400, y: 200 });
  };

  const handleAddPool = () => {
    addNode('pool', { x: 400, y: 200 });
  };

  const handleAddDataObject = () => {
    addNode('data-object', { x: 400, y: 200 });
  };

  const handleAutoLayout = () => {
    autoLayout();
    setShowViewMenu(false);
  };

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

  const handleAddStickyNote = () => {
    addStickyNote({ x: 500, y: 300 });
    setShowShapeMenu(false);
  };

  const handleAddShape = (shapeType: 'rectangle' | 'circle' | 'diamond') => {
    addShape({ x: 500, y: 300 }, shapeType);
    setShowShapeMenu(false);
  };

  const handleSave = async () => {
    if (!currentDiagramId) {
      addNotification('warning', 'No diagram ID available for saving');
      return;
    }

    const currentUser = userService.getCurrentUser();
    if (!currentUser) {
      addNotification('warning', 'You must be logged in to save');
      return;
    }

    if (isReadOnly) {
      addNotification('warning', 'Cannot save in read-only mode');
      return;
    }

    try {
      // Show saving notification
      addNotification('info', 'Saving diagram...', 1000);
      
      const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
      
      const response = await fetch(`${API_BASE_URL}/diagram?id=${currentDiagramId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          name: 'Process Diagram',
          nodes,
          edges,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        addNotification('success', '✅ Diagram saved successfully!');
      } else if (response.status === 403) {
        addNotification('error', result.message || 'Your editing session has expired. Please reload to get the latest version.');
      } else {
        console.error('Save failed:', result.message);
        addNotification('error', 'Failed to save diagram: ' + result.message);
      }
    } catch (error) {
      console.error('Save error:', error);
      addNotification('error', 'Failed to save diagram. Please try again.');
    }
    setShowFileMenu(false);
  };

  // Removed SQL export as it's not relevant for process diagrams

  const handleExportJSON = () => {
    const diagramData = {
      version: '1.0',
      nodes,
      edges,
      metadata: {
        exportedAt: new Date().toISOString(),
        nodesCount: nodes.length,
        relationshipsCount: edges.length
      }
    };
    
    const json = JSON.stringify(diagramData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram.json';
    a.click();
    URL.revokeObjectURL(url);
    setShowFileMenu(false);
  };

  const handleImport = () => {
    fileInputRef.current?.click();
    setShowFileMenu(false);
  };

  const handleExportCurrentView = async () => {
    try {
      if (nodes.length === 0) {
        addNotification('warning', 'No elements to export');
        setShowFileMenu(false);
        return;
      }

      addNotification('info', 'Exporting current view...');
      
      await exportCurrentViewportAsPNG(nodes, 'current-view.png');
      
      addNotification('success', 'Current view exported successfully');
    } catch (error) {
      console.error('Current view export error:', error);
      addNotification('error', 'Failed to export current view');
    } finally {
      setShowFileMenu(false);
    }
  };

  const handleExportFullDiagram = async () => {
    try {
      if (nodes.length === 0) {
        addNotification('warning', 'No elements to export');
        setShowFileMenu(false);
        return;
      }

      addNotification('info', 'Exporting current view as full diagram. Tip: Use the green "Fit View" button to show all tables first!');
      
      await exportFullDiagramAsPNG(nodes, 'full-diagram.png');
      
      addNotification('success', 'Diagram exported successfully');
    } catch (error) {
      console.error('Full diagram export error:', error);
      addNotification('error', 'Failed to export diagram');
    } finally {
      setShowFileMenu(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      
      try {
        const diagramData = JSON.parse(content);
        
        if (diagramData.nodes && Array.isArray(diagramData.nodes)) {
          importDiagram({
            nodes: diagramData.nodes,
            edges: diagramData.edges || []
          });
          alert(`Successfully imported ${diagramData.nodes.length} nodes and ${(diagramData.edges || []).length} connections`);
        } else {
          throw new Error('Invalid diagram format - no nodes found');
        }
      } catch (jsonError) {
        // SQL import removed for process diagrams
        alert(`Error parsing file. Please ensure it's a valid JSON diagram file.`);
      }
    };
    
    reader.readAsText(file);
    event.target.value = '';
  };

  // BPMN Import/Export handlers
  const handleBPMNImportExport = () => {
    setShowImportExportDialog(true);
    setShowFileMenu(false);
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
      
      <div className="flex items-center space-x-2">
        {/* Primary Actions - Process Elements */}
        <button
          onClick={handleAddStartEvent}
          disabled={isReadOnly}
          className="flex items-center space-x-1 px-3 py-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Add Start Event"
        >
          <PlayCircle size={16} />
          <span className="text-sm">Start</span>
        </button>

        <button
          onClick={handleAddEndEvent}
          disabled={isReadOnly}
          className="flex items-center space-x-1 px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Add End Event"
        >
          <StopCircle size={16} />
          <span className="text-sm">End</span>
        </button>
        
        <button
          onClick={handleAddProcess}
          disabled={isReadOnly}
          className="flex items-center space-x-1 px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Add Process/Task"
        >
          <Activity size={16} />
          <span className="text-sm">Task</span>
        </button>
        
        <button
          onClick={handleAddGateway}
          disabled={isReadOnly}
          className="flex items-center space-x-1 px-3 py-1.5 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Add Gateway (Decision Point)"
        >
          <GitBranch size={16} />
          <span className="text-sm">Gateway</span>
        </button>

        {/* Organization Elements */}
        <button
          onClick={handleAddLane}
          disabled={isReadOnly}
          className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Add Lane (Process Organizer)"
        >
          <Users size={16} />
          <span className="text-sm">Lane</span>
        </button>

        <button
          onClick={handleAddPool}
          disabled={isReadOnly}
          className="flex items-center space-x-1 px-3 py-1.5 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Add Pool (Participant Container)"
        >
          <Building2 size={16} />
          <span className="text-sm">Pool</span>
        </button>

        <button
          onClick={handleAddDataObject}
          disabled={isReadOnly}
          className="flex items-center space-x-1 px-3 py-1.5 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Add Data Object (Input/Output)"
        >
          <Database size={16} />
          <span className="text-sm">Data</span>
        </button>

        {/* Search Button */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center space-x-1 px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded transition-colors"
          title="Search tables and columns (Ctrl+F)"
        >
          <Search size={16} />
          <span className="text-sm">Search</span>
        </button>

        {/* Fit View Button */}
        <button
          onClick={handleFitView}
          className="flex items-center space-x-1 px-3 py-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          title="Fit all tables in view (⌘+Shift+F)"
        >
          <Focus size={16} />
          <span className="text-sm">Fit View</span>
        </button>

        {/* Keyboard Shortcuts Button */}
        <button
          onClick={() => setShowKeyboardShortcutsDialog(true)}
          className="flex items-center space-x-1 px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded transition-colors"
          title="View keyboard shortcuts (Ctrl+?)"
        >
          <Keyboard size={16} />
          <span className="text-sm">Shortcuts</span>
        </button>

        {/* File Menu */}
        <div className="relative" ref={fileMenuRef}>
          <button
            onClick={() => setShowFileMenu(!showFileMenu)}
            className="flex items-center space-x-1 px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            <FileText size={16} />
            <span className="text-sm">File</span>
            <ChevronDown size={14} />
          </button>
          
          {showFileMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[150px]">
              <button
                onClick={handleSave}
                disabled={isReadOnly}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Save size={14} />
                <span>Save</span>
              </button>
              <button
                onClick={handleImport}
                disabled={isReadOnly}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Upload size={14} />
                <span>Import JSON</span>
              </button>
              <button
                onClick={handleBPMNImportExport}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <FileText size={14} />
                <span>BPMN Import/Export</span>
              </button>
              <div className="border-t border-gray-200 my-1"></div>
              <button
                onClick={handleExportJSON}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <Download size={14} />
                <span>Export JSON</span>
              </button>
              <button
                onClick={handleExportCurrentView}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <Eye size={14} />
                <span>Export PNG (Current View)</span>
              </button>
              <button
                onClick={handleExportFullDiagram}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <Maximize2 size={14} />
                <span>Export PNG (Fit All Tables)</span>
              </button>
            </div>
          )}
        </div>

        {/* Shapes Menu */}
        <div className="relative" ref={shapeMenuRef}>
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

        {/* View Menu */}
        <div className="relative" ref={viewMenuRef}>
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
      </div>

      {/* Right side actions */}
      <div className="flex items-center space-x-2">
        {/* Lock Status Indicator */}
        <LockStatusIndicator />
        
        {/* Undo/Redo */}
        <div className="flex items-center space-x-1 border-r border-gray-300 pr-2">
          <button
            onClick={undo}
            disabled={!canUndo || isReadOnly}
            className="p-1.5 text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            <Undo size={16} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo || isReadOnly}
            className="p-1.5 text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Redo (Ctrl+Y)"
          >
            <Redo size={16} />
          </button>
        </div>

        {/* AI Assistant */}
        <button
          onClick={onOpenAIChat}
          disabled={isReadOnly}
          className="flex items-center space-x-1 px-3 py-1.5 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
          title={isReadOnly ? "AI Assistant is disabled in read-only mode" : "Open AI Assistant"}
        >
          <Bot size={16} />
          <span className="text-sm">AI Assistant</span>
        </button>
      </div>

      {/* Dialogs */}
      <ImportExportDialog
        isOpen={showImportExportDialog}
        onClose={() => setShowImportExportDialog(false)}
      />
      <KeyboardShortcutsDialog
        isOpen={showKeyboardShortcutsDialog}
        onClose={() => setShowKeyboardShortcutsDialog(false)}
      />
    </div>
  );
};