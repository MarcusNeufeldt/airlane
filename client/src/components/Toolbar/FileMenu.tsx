import React, { useRef, useState, useEffect } from 'react';
import { FileText, ChevronDown, Save, Upload, Download, Eye, Maximize2 } from 'lucide-react';
import { useDiagramStore } from '../../stores/diagramStore';
import { userService } from '../../services/userService';
import { exportCurrentViewportAsPNG, exportFullDiagramAsPNG } from '../../lib/exportUtils';
import { ImportExportDialog } from '../ImportExportDialog';

interface FileMenuProps {
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const FileMenu: React.FC<FileMenuProps> = ({ fileInputRef, onFileUpload }) => {
  const {
    nodes,
    edges,
    importDiagram,
    isReadOnly,
    currentDiagramId,
    addNotification,
    showFileMenu,
    setShowFileMenu
  } = useDiagramStore();

  const menuRef = useRef<HTMLDivElement>(null);
  const [showImportExportDialog, setShowImportExportDialog] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (showFileMenu && menuRef.current && !menuRef.current.contains(target)) {
        setShowFileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFileMenu, setShowFileMenu]);

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
    setShowFileMenu(false);
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

  const handleBPMNImportExport = () => {
    setShowImportExportDialog(true);
    setShowFileMenu(false);
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
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

      <ImportExportDialog
        isOpen={showImportExportDialog}
        onClose={() => setShowImportExportDialog(false)}
      />
    </>
  );
};