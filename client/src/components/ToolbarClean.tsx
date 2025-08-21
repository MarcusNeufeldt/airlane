import React, { useRef } from 'react';
import { useDiagramStore } from '../stores/diagramStore';
import { LockStatusIndicator } from './LockStatusIndicator';
import {
  ProcessElementsToolbar,
  QuickActions,
  SimulationControls,
  ToolbarMenus
} from './Toolbar';

interface ToolbarProps {
  onOpenAIChat: () => void;
  showMiniMap?: boolean;
  onToggleMiniMap?: () => void;
  onOpenSimulation?: () => void;
}

export const ToolbarClean: React.FC<ToolbarProps> = ({ onOpenAIChat, showMiniMap, onToggleMiniMap, onOpenSimulation }) => {
  const { importDiagram, addNotification } = useDiagramStore();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          addNotification('success', `Successfully imported ${diagramData.nodes.length} nodes and ${(diagramData.edges || []).length} connections`);
        } else {
          throw new Error('Invalid diagram format - no nodes found');
        }
      } catch (jsonError) {
        addNotification('error', `Error parsing file. Please ensure it's a valid JSON diagram file.`);
      }
    };
    
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      {/* Hidden file input for imports */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
      
      <div className="px-6 py-3 flex items-center justify-between">
        {/* Left side - Primary Tools */}
        <div className="flex items-center space-x-6">
          {/* Process Elements - Most important */}
          <ProcessElementsToolbar />
          
          {/* Quick Actions - Secondary */}
          <QuickActions onOpenAIChat={onOpenAIChat} />
          
          {/* Consolidated Menu - Tertiary */}
          <ToolbarMenus 
            fileInputRef={fileInputRef} 
            onFileUpload={handleFileUpload}
            showMiniMap={showMiniMap} 
            onToggleMiniMap={onToggleMiniMap} 
          />
        </div>

        {/* Right side - Status and Specialized Controls */}
        <div className="flex items-center space-x-4">
          {/* Lock Status */}
          <LockStatusIndicator />
          
          {/* Simulation Controls */}
          <SimulationControls onOpenSimulation={onOpenSimulation} />
        </div>
      </div>
    </div>
  );
};