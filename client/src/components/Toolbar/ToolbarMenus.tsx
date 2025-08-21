import React, { useRef, useEffect, useState } from 'react';
import { ChevronDown, Settings, FileText, Layout, Grid3x3, Users, Maximize2, Save, Upload, Download, Eye, StickyNote, Square, Circle, Diamond } from 'lucide-react';
import { useDiagramStore } from '../../stores/diagramStore';
import { userService } from '../../services/userService';
import { exportCurrentViewportAsPNG, exportFullDiagramAsPNG } from '../../lib/exportUtils';
import { ImportExportDialog } from '../ImportExportDialog';

interface ToolbarMenusProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  showMiniMap?: boolean;
  onToggleMiniMap?: () => void;
}

export const ToolbarMenus: React.FC<ToolbarMenusProps> = ({ 
  fileInputRef, 
  onFileUpload, 
  showMiniMap, 
  onToggleMiniMap 
}) => {
  const {
    nodes,
    edges,
    autoLayout,
    snapToGrid,
    toggleGrid,
    addStickyNote,
    addShape,
    isReadOnly,
    currentDiagramId,
    addNotification,
    showLaneColors,
    setShowLaneColors
  } = useDiagramStore();

  const [showMainMenu, setShowMainMenu] = useState(false);
  const [showImportExportDialog, setShowImportExportDialog] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (showMainMenu && menuRef.current && !menuRef.current.contains(target)) {
        setShowMainMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMainMenu]);

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
    setShowMainMenu(false);
  };

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
    setShowMainMenu(false);
  };

  const handleImport = () => {
    fileInputRef.current?.click();
    setShowMainMenu(false);
  };

  const handleExportCurrentView = async () => {
    try {
      if (nodes.length === 0) {
        addNotification('warning', 'No elements to export');
        setShowMainMenu(false);
        return;
      }

      addNotification('info', 'Exporting current view...');
      await exportCurrentViewportAsPNG(nodes, 'current-view.png');
      addNotification('success', 'Current view exported successfully');
    } catch (error) {
      console.error('Current view export error:', error);
      addNotification('error', 'Failed to export current view');
    } finally {
      setShowMainMenu(false);
    }
  };

  const handleExportFullDiagram = async () => {
    try {
      if (nodes.length === 0) {
        addNotification('warning', 'No elements to export');
        setShowMainMenu(false);
        return;
      }

      addNotification('info', 'Exporting full diagram...');
      await exportFullDiagramAsPNG(nodes, 'full-diagram.png');
      addNotification('success', 'Diagram exported successfully');
    } catch (error) {
      console.error('Full diagram export error:', error);
      addNotification('error', 'Failed to export diagram');
    } finally {
      setShowMainMenu(false);
    }
  };

  const handleBPMNImportExport = () => {
    setShowImportExportDialog(true);
    setShowMainMenu(false);
  };

  const handleAutoLayout = () => {
    autoLayout();
    setShowMainMenu(false);
  };

  const handleAddStickyNote = () => {
    addStickyNote({ x: 500, y: 300 });
    setShowMainMenu(false);
  };

  const handleAddShape = (shapeType: 'rectangle' | 'circle' | 'diamond') => {
    addShape({ x: 500, y: 300 }, shapeType);
    setShowMainMenu(false);
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowMainMenu(!showMainMenu)}
          className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
        >
          <Settings size={18} />
          <span className="text-sm font-medium">Menu</span>
          <ChevronDown size={14} />
        </button>
        
        {showMainMenu && (
          <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-[220px] py-2">
            {/* File Section */}
            <div className="px-3 py-1">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">File</div>
              <div className="space-y-1">
                <button
                  onClick={handleSave}
                  disabled={isReadOnly}
                  className="w-full text-left px-2 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 rounded"
                >
                  <Save size={16} className="text-gray-500" />
                  <span>Save</span>
                </button>
                <button
                  onClick={handleImport}
                  disabled={isReadOnly}
                  className="w-full text-left px-2 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 rounded"
                >
                  <Upload size={16} className="text-gray-500" />
                  <span>Import JSON</span>
                </button>
                <button
                  onClick={handleBPMNImportExport}
                  className="w-full text-left px-2 py-2 text-sm hover:bg-gray-50 flex items-center space-x-3 rounded"
                >
                  <FileText size={16} className="text-gray-500" />
                  <span>BPMN Import/Export</span>
                </button>
              </div>
            </div>

            <div className="border-t border-gray-100 my-2"></div>

            {/* Export Section */}
            <div className="px-3 py-1">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Export</div>
              <div className="space-y-1">
                <button
                  onClick={handleExportJSON}
                  className="w-full text-left px-2 py-2 text-sm hover:bg-gray-50 flex items-center space-x-3 rounded"
                >
                  <Download size={16} className="text-gray-500" />
                  <span>Export JSON</span>
                </button>
                <button
                  onClick={handleExportCurrentView}
                  className="w-full text-left px-2 py-2 text-sm hover:bg-gray-50 flex items-center space-x-3 rounded"
                >
                  <Eye size={16} className="text-gray-500" />
                  <span>Export Current View</span>
                </button>
                <button
                  onClick={handleExportFullDiagram}
                  className="w-full text-left px-2 py-2 text-sm hover:bg-gray-50 flex items-center space-x-3 rounded"
                >
                  <Maximize2 size={16} className="text-gray-500" />
                  <span>Export Full Diagram</span>
                </button>
              </div>
            </div>

            <div className="border-t border-gray-100 my-2"></div>

            {/* Shapes Section */}
            <div className="px-3 py-1">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Shapes</div>
              <div className="space-y-1">
                <button
                  onClick={handleAddStickyNote}
                  disabled={isReadOnly}
                  className="w-full text-left px-2 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 rounded"
                >
                  <StickyNote size={16} className="text-gray-500" />
                  <span>Sticky Note</span>
                </button>
                <button
                  onClick={() => handleAddShape('rectangle')}
                  disabled={isReadOnly}
                  className="w-full text-left px-2 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 rounded"
                >
                  <Square size={16} className="text-gray-500" />
                  <span>Rectangle</span>
                </button>
                <button
                  onClick={() => handleAddShape('circle')}
                  disabled={isReadOnly}
                  className="w-full text-left px-2 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 rounded"
                >
                  <Circle size={16} className="text-gray-500" />
                  <span>Circle</span>
                </button>
                <button
                  onClick={() => handleAddShape('diamond')}
                  disabled={isReadOnly}
                  className="w-full text-left px-2 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 rounded"
                >
                  <Diamond size={16} className="text-gray-500" />
                  <span>Diamond</span>
                </button>
              </div>
            </div>

            <div className="border-t border-gray-100 my-2"></div>

            {/* View Section */}
            <div className="px-3 py-1">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">View</div>
              <div className="space-y-1">
                <button
                  onClick={handleAutoLayout}
                  className="w-full text-left px-2 py-2 text-sm hover:bg-gray-50 flex items-center space-x-3 rounded"
                >
                  <Layout size={16} className="text-gray-500" />
                  <span>Auto Layout</span>
                </button>
                <button
                  onClick={() => {
                    toggleGrid();
                    setShowMainMenu(false);
                  }}
                  className="w-full text-left px-2 py-2 text-sm hover:bg-gray-50 flex items-center space-x-3 rounded"
                >
                  <Grid3x3 size={16} className="text-gray-500" />
                  <span>{snapToGrid ? 'Disable' : 'Enable'} Grid</span>
                </button>
                <button
                  onClick={() => {
                    setShowLaneColors(!showLaneColors);
                    setShowMainMenu(false);
                  }}
                  className="w-full text-left px-2 py-2 text-sm hover:bg-gray-50 flex items-center space-x-3 rounded"
                >
                  <Users size={16} className="text-gray-500" />
                  <span>{showLaneColors ? 'Hide' : 'Show'} Lane Colors</span>
                </button>
                <button
                  onClick={() => {
                    onToggleMiniMap?.();
                    setShowMainMenu(false);
                  }}
                  className="w-full text-left px-2 py-2 text-sm hover:bg-gray-50 flex items-center space-x-3 rounded"
                >
                  <Maximize2 size={16} className="text-gray-500" />
                  <span>{showMiniMap ? 'Hide' : 'Show'} Mini Map</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ImportExportDialog
        isOpen={showImportExportDialog}
        onClose={() => setShowImportExportDialog(false)}
      />
    </>
  );
};