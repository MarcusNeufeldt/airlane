import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  NodeTypes,
  EdgeTypes,
  ConnectionMode,
  ConnectionLineType,
  MarkerType,
  useReactFlow,
  Node,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useDiagramStore } from '../stores/diagramStore';
import { DiagramNodeData } from '../types';
import { ProcessNode } from './ProcessNode';
import { EventNode } from './EventNode';
import { GatewayNode } from './GatewayNode';
import { LaneNode } from './LaneNode';
import { PoolNode } from './PoolNode';
import { PoolWithLanesNode } from './PoolWithLanesNode';
import { DataObjectNode } from './DataObjectNode';
import { SequenceFlowEdge } from './SequenceFlowEdge';
import { MessageFlowEdge } from './MessageFlowEdge';
import { AssociationEdge } from './AssociationEdge';
import { StickyNote } from './StickyNote';
import { Shape } from './Shape';
import { CanvasSearch } from './CanvasSearch';
import { AlignmentToolbar } from './AlignmentToolbar';
import { ZoomToolbar } from './ZoomToolbar';
import { ProcessContextMenu } from './ProcessContextMenu';
import { QuickNodeSelector } from './QuickNodeSelector';
import { AlignmentGuides } from './AlignmentGuides';

const nodeTypes: NodeTypes = {
  process: ProcessNode,
  event: EventNode,
  gateway: GatewayNode,
  lane: LaneNode,
  pool: PoolNode,
  'pool-with-lanes': PoolWithLanesNode,
  'data-object': DataObjectNode,
  'sticky-note': StickyNote,
  shape: Shape,
};

const edgeTypes: EdgeTypes = {
  'sequence-flow': SequenceFlowEdge,
  'message-flow': MessageFlowEdge,
  'association': AssociationEdge,
};

interface CanvasProps {
  showMiniMap?: boolean;
}

export const Canvas: React.FC<CanvasProps> = ({ showMiniMap = true }) => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    selectNode,
    setSelectedNodes,
    setContextMenuNode,
    snapToGrid,
    gridSize,
    isReadOnly,
    closeAllDropdowns,
    selectedNodeIds,
    isSearchOpen,
    setSearchOpen,
    searchResults,
    currentSearchIndex,
    deleteSelectedNodes,
    duplicateSelectedNodes,
    selectAllNodes,
    deselectAllNodes,
    undo,
    redo,
    canUndo,
    canRedo,
    addNode,
    deleteNode,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    updateNode,
    alignSelectedNodes,
    distributeSelectedNodes,
  } = useDiagramStore();

  const { setCenter, getNode, zoomIn, zoomOut, fitView, screenToFlowPosition } = useReactFlow();
  const [alignmentToolbarPosition, setAlignmentToolbarPosition] = useState<{ x: number; y: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number; // Screen coordinates for menu positioning
    y: number; // Screen coordinates for menu positioning
    flowX: number; // Flow coordinates for node positioning
    flowY: number; // Flow coordinates for node positioning
    nodeId?: string;
    nodeType?: string;
  } | null>(null);
  
  const [quickNodeSelector, setQuickNodeSelector] = useState<{
    x: number;
    y: number;
    sourceNodeId: string;
  } | null>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  
  // Sort nodes by z-index to ensure proper layering
  const sortedNodes = React.useMemo(() => {
    return [...nodes].sort((a, b) => {
      const aZ = a.zIndex || 0;
      const bZ = b.zIndex || 0;
      return aZ - bZ;
    });
  }, [nodes]);
  
  // Enhanced nodes with search highlighting and locked state handling
  const enhancedNodes = React.useMemo(() => {
    return sortedNodes.map(node => {
      const isSearchResult = searchResults.includes(node.id);
      const isCurrentSearchResult = searchResults[currentSearchIndex] === node.id;
      const isLocked = node.type === 'lane' && node.data?.locked;
      
      return {
        ...node,
        draggable: !isLocked,
        zIndex: isLocked ? -50 : node.zIndex,
        style: {
          ...node.style,
          opacity: searchResults.length > 0 && !isSearchResult ? 0.3 : 1,
          boxShadow: isCurrentSearchResult ? '0 0 0 3px #3b82f6' : isSearchResult ? '0 0 0 2px #93c5fd' : undefined,
        }
      };
    });
  }, [sortedNodes, searchResults, currentSearchIndex]);
  
  // Center view on search result
  useEffect(() => {
    if (currentSearchIndex >= 0 && searchResults.length > 0) {
      const nodeId = searchResults[currentSearchIndex];
      const node = getNode(nodeId);
      if (node) {
        setCenter(
          node.position.x + (node.style?.width as number || 300) / 2,
          node.position.y + (node.style?.height as number || 200) / 2,
          { zoom: 1, duration: 500 }
        );
      }
    }
  }, [currentSearchIndex, searchResults, getNode, setCenter]);
  
  // Update alignment toolbar position when selection changes
  useEffect(() => {
    if (selectedNodeIds.length >= 2) {
      const selectedNodes = nodes.filter(node => selectedNodeIds.includes(node.id));
      if (selectedNodes.length >= 2) {
        // Calculate center position of selected nodes
        const centerX = selectedNodes.reduce((sum, node) => 
          sum + node.position.x + ((node.style?.width as number || 300) / 2), 0) / selectedNodes.length;
        const centerY = selectedNodes.reduce((sum, node) => 
          sum + node.position.y + ((node.style?.height as number || 200) / 2), 0) / selectedNodes.length;
        
        setAlignmentToolbarPosition({ x: centerX, y: centerY });
      }
    } else {
      setAlignmentToolbarPosition(null);
    }
  }, [selectedNodeIds, nodes]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if user is typing in an input or textarea
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Don't handle shortcuts in read-only mode (except search)
      if (isReadOnly && !(event.ctrlKey || event.metaKey) && event.key !== 'f') {
        return;
      }

      const isCtrlOrCmd = event.ctrlKey || event.metaKey;

      // Ctrl+F or Cmd+F to open search
      if (isCtrlOrCmd && event.key === 'f') {
        event.preventDefault();
        setSearchOpen(true);
        return;
      }

      // Delete or Backspace to delete selected nodes
      if ((event.key === 'Delete' || event.key === 'Backspace') && !isReadOnly) {
        event.preventDefault();
        if (selectedNodeIds.length > 0) {
          deleteSelectedNodes();
        }
        return;
      }

      // Ctrl+A or Cmd+A to select all
      if (isCtrlOrCmd && event.key === 'a') {
        event.preventDefault();
        selectAllNodes();
        return;
      }

      // Ctrl+D or Cmd+D to duplicate selected nodes
      if (isCtrlOrCmd && event.key === 'd' && !isReadOnly) {
        event.preventDefault();
        if (selectedNodeIds.length > 0) {
          duplicateSelectedNodes();
        }
        return;
      }

      // Ctrl+Z or Cmd+Z to undo
      if (isCtrlOrCmd && event.key === 'z' && !event.shiftKey && !isReadOnly) {
        event.preventDefault();
        if (canUndo()) {
          undo();
        }
        return;
      }

      // Ctrl+Y or Cmd+Shift+Z to redo
      if (((isCtrlOrCmd && event.key === 'y') || (isCtrlOrCmd && event.shiftKey && event.key === 'z')) && !isReadOnly) {
        event.preventDefault();
        if (canRedo()) {
          redo();
        }
        return;
      }

      // Escape to deselect all
      if (event.key === 'Escape') {
        event.preventDefault();
        deselectAllNodes();
        setSearchOpen(false);
        closeAllDropdowns();
        return;
      }

      // Zoom controls
      // Ctrl++ or Ctrl+= to zoom in
      if (isCtrlOrCmd && (event.key === '+' || event.key === '=')) {
        event.preventDefault();
        zoomIn({ duration: 300 });
        return;
      }

      // Ctrl+- to zoom out
      if (isCtrlOrCmd && event.key === '-') {
        event.preventDefault();
        zoomOut({ duration: 300 });
        return;
      }

      // Ctrl+0 to fit view
      if (isCtrlOrCmd && event.key === '0') {
        event.preventDefault();
        fitView({ duration: 500, padding: 0.1 });
        return;
      }

      // Ctrl+R to reset view
      if (isCtrlOrCmd && event.key === 'r') {
        event.preventDefault();
        setCenter(0, 0, { zoom: 1, duration: 500 });
        return;
      }

      // Ctrl+S to save
      if (isCtrlOrCmd && event.key === 's' && !isReadOnly) {
        event.preventDefault();
        // Trigger save through the diagram store
        const saveButton = document.querySelector('[title="Save"], button:has(svg.lucide-save)') as HTMLButtonElement;
        if (saveButton && !saveButton.disabled) {
          saveButton.click();
        }
        return;
      }

      // Ctrl+? to show keyboard shortcuts
      if (isCtrlOrCmd && event.key === '?') {
        event.preventDefault();
        // Trigger keyboard shortcuts dialog
        const shortcutsButton = document.querySelector('[title*="keyboard shortcuts"], [title*="Shortcuts"]') as HTMLButtonElement;
        if (shortcutsButton) {
          shortcutsButton.click();
        }
        return;
      }

      // Quick element creation shortcuts (when not in read-only mode)
      if (!isReadOnly) {
        // Press 't' to add Task
        if (event.key === 't' && !isCtrlOrCmd) {
          event.preventDefault();
          addNode('process', { x: 400, y: 200 });
          return;
        }

        // Press 'e' to add Start Event
        if (event.key === 'e' && !isCtrlOrCmd) {
          event.preventDefault();
          addNode('event', { x: 400, y: 200 }, { eventType: 'start' });
          return;
        }

        // Press 'g' to add Gateway
        if (event.key === 'g' && !isCtrlOrCmd) {
          event.preventDefault();
          addNode('gateway', { x: 400, y: 200 });
          return;
        }

        // Press 'p' to add Pool with Lanes
        if (event.key === 'p' && !isCtrlOrCmd) {
          event.preventDefault();
          addNode('pool-with-lanes', { x: 400, y: 200 });
          return;
        }

        // Press 'd' to add Data Object
        if (event.key === 'd' && !isCtrlOrCmd) {
          event.preventDefault();
          addNode('data-object', { x: 400, y: 200 });
          return;
        }
      }

      // Alignment shortcuts (Ctrl+Shift+key)
      if (isCtrlOrCmd && event.shiftKey && selectedNodeIds.length >= 2 && !isReadOnly) {
        if (event.key === 'L' || event.key === 'l') {
          event.preventDefault();
          alignSelectedNodes('left');
          return;
        }
        if (event.key === 'R' || event.key === 'r') {
          event.preventDefault();
          alignSelectedNodes('right');
          return;
        }
        if (event.key === 'T' || event.key === 't') {
          event.preventDefault();
          alignSelectedNodes('top');
          return;
        }
        if (event.key === 'B' || event.key === 'b') {
          event.preventDefault();
          alignSelectedNodes('bottom');
          return;
        }
        if (event.key === 'C' || event.key === 'c') {
          event.preventDefault();
          alignSelectedNodes('center-horizontal');
          return;
        }
        if (event.key === 'M' || event.key === 'm') {
          event.preventDefault();
          alignSelectedNodes('center-vertical');
          return;
        }
        // Distribution shortcuts
        if (event.key === 'H' || event.key === 'h') {
          event.preventDefault();
          if (selectedNodeIds.length >= 3) {
            distributeSelectedNodes('horizontal');
          }
          return;
        }
        if (event.key === 'V' || event.key === 'v') {
          event.preventDefault();
          if (selectedNodeIds.length >= 3) {
            distributeSelectedNodes('vertical');
          }
          return;
        }
      }

      // Arrow key navigation between selected elements
      if (selectedNodeIds.length > 1 && !isCtrlOrCmd) {
        if (event.key.startsWith('Arrow')) {
          event.preventDefault();
          // Find current focused node (first selected node)
          const currentNode = nodes.find(n => n.id === selectedNodeIds[0]);
          if (!currentNode) return;

          let nextNode: Node<DiagramNodeData> | null = null;
          switch (event.key) {
            case 'ArrowLeft':
              nextNode = nodes
                .filter(n => selectedNodeIds.includes(n.id) && n.id !== currentNode.id)
                .sort((a, b) => b.position.x - a.position.x)[0]; // Leftmost node
              break;
            case 'ArrowRight':
              nextNode = nodes
                .filter(n => selectedNodeIds.includes(n.id) && n.id !== currentNode.id)
                .sort((a, b) => a.position.x - b.position.x)[0]; // Rightmost node
              break;
            case 'ArrowUp':
              nextNode = nodes
                .filter(n => selectedNodeIds.includes(n.id) && n.id !== currentNode.id)
                .sort((a, b) => b.position.y - a.position.y)[0]; // Topmost node
              break;
            case 'ArrowDown':
              nextNode = nodes
                .filter(n => selectedNodeIds.includes(n.id) && n.id !== currentNode.id)
                .sort((a, b) => a.position.y - b.position.y)[0]; // Bottommost node
              break;
          }

          if (nextNode) {
            // Move focus to the next node by updating selection
            setSelectedNodes([nextNode.id, ...selectedNodeIds.filter(id => id !== nextNode!.id)]);
          }
          return;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    setSearchOpen,
    addNode,
    alignSelectedNodes,
    distributeSelectedNodes,
    nodes,
    setSelectedNodes,
    selectedNodeIds,
    deleteSelectedNodes,
    selectAllNodes,
    duplicateSelectedNodes,
    deselectAllNodes,
    undo,
    redo,
    canUndo,
    canRedo,
    isReadOnly,
    closeAllDropdowns,
    zoomIn,
    zoomOut,
    fitView,
    setCenter
  ]);
  
  // Validate connections - allow all for now
  const isValidConnection = useCallback((connection: any) => {
    return true; // Allow all connections for now
  }, []);

  // Handle canvas click to deselect nodes, close context menu, and close dropdowns
  const handlePaneClick = useCallback(() => {
    selectNode(null);
    setContextMenuNode(null);
    setContextMenu(null);
    setQuickNodeSelector(null);
    closeAllDropdowns();
  }, [selectNode, setContextMenuNode, closeAllDropdowns]);

  // Handle right-click context menu
  const handleNodeContextMenu = useCallback((event: React.MouseEvent, node: any) => {
    event.preventDefault();
    const flowPosition = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      flowX: flowPosition.x,
      flowY: flowPosition.y,
      nodeId: node.id,
      nodeType: node.type,
    });
  }, [screenToFlowPosition]);

  const handlePaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    // Convert screen coordinates to flow coordinates
    const flowPosition = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
    setContextMenu({
      x: event.clientX,        // Screen coordinates for menu positioning
      y: event.clientY,        // Screen coordinates for menu positioning
      flowX: flowPosition.x,   // Flow coordinates for node positioning
      flowY: flowPosition.y,   // Flow coordinates for node positioning
    });
  }, [screenToFlowPosition]);

  // Context menu actions
  const handleContextMenuDelete = useCallback(() => {
    if (contextMenu?.nodeId) {
      deleteNode(contextMenu.nodeId);
    }
    setContextMenu(null);
  }, [contextMenu, deleteNode]);

  const handleContextMenuEdit = useCallback(() => {
    if (contextMenu?.nodeId) {
      selectNode(contextMenu.nodeId);
      // You could also trigger inline editing here
    }
    setContextMenu(null);
  }, [contextMenu, selectNode]);

  const handleContextMenuDuplicate = useCallback(() => {
    if (contextMenu?.nodeId) {
      const node = nodes.find(n => n.id === contextMenu.nodeId);
      if (node) {
        selectNode(contextMenu.nodeId);
        duplicateSelectedNodes();
      }
    }
    setContextMenu(null);
  }, [contextMenu, nodes, selectNode, duplicateSelectedNodes]);

  const handleContextMenuProperties = useCallback(() => {
    if (contextMenu?.nodeId) {
      selectNode(contextMenu.nodeId);
    }
    setContextMenu(null);
  }, [contextMenu, selectNode]);

  const handleContextMenuAddNode = useCallback((type: string, direction: 'right' | 'down' | 'left' | 'up') => {
    if (contextMenu) {
      let position = { x: contextMenu.flowX, y: contextMenu.flowY }; // Use flow coordinates
      
      if (contextMenu.nodeId) {
        const node = nodes.find(n => n.id === contextMenu.nodeId);
        if (node) {
          const offset = 150;
          switch (direction) {
            case 'right':
              position = { x: node.position.x + offset, y: node.position.y };
              break;
            case 'down':
              position = { x: node.position.x, y: node.position.y + offset };
              break;
            case 'left':
              position = { x: node.position.x - offset, y: node.position.y };
              break;
            case 'up':
              position = { x: node.position.x, y: node.position.y - offset };
              break;
          }
        }
      }
      
      addNode(type as any, position);
    }
    setContextMenu(null);
  }, [contextMenu, nodes, addNode]);

  // Handle node click for quick selector
  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    // Only show quick selector for process nodes, events, gateways, and data objects
    const allowedTypes = ['process', 'event', 'gateway', 'data-object'];
    if (!node.type || !allowedTypes.includes(node.type)) {
      return;
    }

    // Don't show if context menu is open or if this is a right-click
    if (contextMenu || event.button === 2) {
      return;
    }

    // Don't show if Ctrl/Cmd is held (multi-selection mode)
    if (event.ctrlKey || event.metaKey) {
      return;
    }

    event.stopPropagation();
    
    // Calculate position near the node
    const nodeElement = event.currentTarget as HTMLElement;
    const rect = nodeElement.getBoundingClientRect();
    
    setQuickNodeSelector({
      x: rect.right + 10, // Position to the right of the node
      y: rect.top,
      sourceNodeId: node.id
    });
  }, [contextMenu]);

  // Handle quick node selector actions
  const handleQuickNodeSelect = useCallback((nodeType: string, direction: 'right' | 'down' | 'left' | 'up', eventType?: string, suggestedLabel?: string) => {
    if (!quickNodeSelector) return;

    const sourceNode = nodes.find(n => n.id === quickNodeSelector.sourceNodeId);
    if (!sourceNode) return;

    // Get accurate dimensions for different node types
    const getNodeDimensions = (nodeType: string, eventType?: string) => {
      switch (nodeType) {
        case 'process':
          return { width: 160, height: 80 };
        case 'event':
          return { width: 60, height: 60 }; // Events are circular
        case 'gateway':
          return { width: 60, height: 60 }; // Gateways are diamond-shaped
        case 'data-object':
          return { width: 80, height: 90 };
        default:
          return { width: 150, height: 80 };
      }
    };

    // Calculate position based on direction with proper center alignment
    const sourceWidth = sourceNode.width || getNodeDimensions(sourceNode.type || 'process').width;
    const sourceHeight = sourceNode.height || getNodeDimensions(sourceNode.type || 'process').height;
    const newNodeDimensions = getNodeDimensions(nodeType, eventType);
    const newNodeWidth = newNodeDimensions.width;
    const newNodeHeight = newNodeDimensions.height;
    const gap = 80; // Gap between nodes
    
    // Calculate source node center
    const sourceCenterX = sourceNode.position.x + sourceWidth / 2;
    const sourceCenterY = sourceNode.position.y + sourceHeight / 2;
    
    let position = { x: 0, y: 0 };
    
    switch (direction) {
      case 'right':
        // Place new node to the right, centered vertically with source
        position.x = sourceNode.position.x + sourceWidth + gap;
        position.y = sourceCenterY - newNodeHeight / 2;
        break;
      case 'down':
        // Place new node below, centered horizontally with source
        position.x = sourceCenterX - newNodeWidth / 2;
        position.y = sourceNode.position.y + sourceHeight + gap;
        break;
      case 'left':
        // Place new node to the left, centered vertically with source
        position.x = sourceNode.position.x - newNodeWidth - gap;
        position.y = sourceCenterY - newNodeHeight / 2;
        break;
      case 'up':
        // Place new node above, centered horizontally with source
        position.x = sourceCenterX - newNodeWidth / 2;
        position.y = sourceNode.position.y - newNodeHeight - gap;
        break;
    }

    // Create the node with appropriate options
    let options: any = {};
    if (nodeType === 'event' && eventType) {
      options = { eventType };
    } else if (nodeType === 'gateway' && eventType) {
      // For gateways, eventType is actually the gatewayType (subType)
      options = { gatewayType: eventType };
    } else if (nodeType === 'data-object' && eventType) {
      // For data objects, eventType is actually the dataType
      options = { dataType: eventType };
    }
    
    // Add suggested label from AI if provided
    if (suggestedLabel) {
      options.label = suggestedLabel;
    }

    // Snap position to grid if enabled
    const finalPosition = snapToGrid ? {
      x: Math.round(position.x / gridSize) * gridSize,
      y: Math.round(position.y / gridSize) * gridSize,
    } : position;

    // Store connection info before creating node
    const sourceNodeId = quickNodeSelector.sourceNodeId;
    const currentDirection = direction; // Capture direction for closure
    
    // Store the current nodes count to find the new node after creation
    const nodeCountBefore = nodes.length;
    
    // Create the new node - the store will generate the ID
    addNode(nodeType as any, finalPosition, options);

    // Create automatic connection between source and new node
    setTimeout(() => {
      const allNodes = useDiagramStore.getState().nodes;
      
      // Find the newly added node (should be the one that wasn't there before)
      const newNodes = allNodes.filter(node => !nodes.some(oldNode => oldNode.id === node.id));
      const targetNode = newNodes[0]; // Should be the newly created node
      
      console.log('🔗 Connection Debug - Source node ID:', sourceNodeId);
      console.log('🔗 Connection Debug - Nodes before:', nodeCountBefore);
      console.log('🔗 Connection Debug - Nodes after:', allNodes.length);
      console.log('🔗 Connection Debug - New nodes found:', newNodes.length);
      console.log('🔗 Connection Debug - Target node:', targetNode?.id);
      
      if (targetNode) {
        // Determine the correct source and target handles based on direction and node types
        let sourceHandle: string = 'output-right'; // Default fallback
        let targetHandle: string = 'input-left';   // Default fallback
        
        // Get source node to determine its handle IDs
        const currentSourceNode = allNodes.find(n => n.id === sourceNodeId);
        
        // Source handle logic (from the clicked node)
        if (currentSourceNode?.type === 'event') {
          const eventData = currentSourceNode.data as any;
          if (eventData.eventType === 'start') {
            sourceHandle = currentDirection === 'right' ? 'start-right' : 'start-bottom';
          } else if (eventData.eventType === 'intermediate') {
            // For intermediate events, use specific handle IDs
            sourceHandle = currentDirection === 'right' ? 'inter-output' : 
                          currentDirection === 'down' ? 'inter-bottom' : 
                          currentDirection === 'left' ? 'inter-output' : 'inter-output'; // Left connections use right output
          } else if (eventData.eventType === 'end') {
            // End events don't have output handles, so this shouldn't happen
            console.warn('⚠️  Attempting to connect FROM an end event - this is not allowed in BPMN');
            sourceHandle = 'output-right'; // Use fallback to prevent connection
          }
        } else if (currentSourceNode?.type === 'data-object') {
          // For data objects, use association handles
          switch (currentDirection) {
            case 'right':
              sourceHandle = 'association-right';
              break;
            case 'down':
              sourceHandle = 'association-bottom';
              break;
            case 'left':
              sourceHandle = 'association-left';
              break;
            case 'up':
              sourceHandle = 'association-top';
              break;
            default:
              sourceHandle = 'association-right';
          }
        } else {
          // For process/gateway nodes
          switch (currentDirection) {
            case 'right':
              sourceHandle = 'output-right';
              break;
            case 'down':
              sourceHandle = 'output-bottom';
              break;
            case 'left':
              sourceHandle = 'output-left';
              break;
            case 'up':
              sourceHandle = 'output-top';
              break;
            default:
              sourceHandle = 'output-right';
          }
        }
        
        // Target handle logic (for the new node)
        if (targetNode.type === 'event') {
          const newEventData = targetNode.data as any;
          if (newEventData.eventType === 'end') {
            targetHandle = currentDirection === 'right' ? 'end-left' : 'end-top';
          } else if (newEventData.eventType === 'intermediate') {
            // For intermediate events, use specific handle IDs
            targetHandle = currentDirection === 'right' ? 'inter-input' : 
                          currentDirection === 'down' ? 'inter-top' : 
                          currentDirection === 'left' ? 'inter-input' : 'inter-top';
          } else {
            // For start events, they don't have input handles, so connection should fail
            // But if we're connecting TO a start event, we shouldn't allow that
            console.warn('⚠️  Attempting to connect TO a start event - this is not allowed in BPMN');
            targetHandle = 'input-left'; // Use fallback to prevent connection
          }
        } else if (targetNode.type === 'data-object') {
          // Data objects use association handles
          switch (currentDirection) {
            case 'right':
              targetHandle = 'association-left';
              break;
            case 'down':
              targetHandle = 'association-top';
              break;
            case 'left':
              targetHandle = 'association-right';
              break;
            case 'up':
              targetHandle = 'association-bottom';
              break;
            default:
              targetHandle = 'association-left';
          }
        } else {
          // For process/gateway nodes
          switch (currentDirection) {
            case 'right':
              targetHandle = 'input-left';
              break;
            case 'down':
              targetHandle = 'input-top';
              break;
            case 'left':
              targetHandle = 'input-right';
              break;
            case 'up':
              targetHandle = 'input-bottom';
              break;
            default:
              targetHandle = 'input-left';
          }
        }
        
        // Determine edge type based on node types
        let edgeType = 'sequence-flow';
        let markerEnd: any = { type: 'arrowclosed' as const };
        
        // Use association edge for data objects
        if (currentSourceNode?.type === 'data-object' || targetNode.type === 'data-object') {
          edgeType = 'association';
          markerEnd = undefined; // Association edges typically don't have arrow markers
        }
        
        const newEdge = {
          id: `edge-${Date.now()}`,
          source: sourceNodeId,
          target: targetNode.id,
          sourceHandle: sourceHandle,
          targetHandle: targetHandle,
          type: edgeType,
          markerEnd: markerEnd,
        };
        
        console.log('🔗 Creating edge with handles:', { 
          sourceHandle, 
          targetHandle, 
          direction: currentDirection,
          sourceNodeType: currentSourceNode?.type,
          targetNodeType: targetNode.type,
          sourceId: sourceNodeId,
          targetId: targetNode.id,
          edgeObject: newEdge
        });
        
        // Add the edge using the store's onConnect method
        const connectionResult = onConnect(newEdge);
        console.log('🔗 Connection result:', connectionResult);
      } else {
        console.error('🔗 ERROR: Could not find newly created node for connection!');
      }
    }, 100); // Small delay to ensure node is created first

    setQuickNodeSelector(null);
  }, [quickNodeSelector, nodes, addNode, onConnect, snapToGrid, gridSize]);
  
  // Handle selection changes from ReactFlow
  const handleSelectionChange = useCallback((params: any) => {
    const selectedNodes = params.nodes || [];
    const nodeIds = selectedNodes.map((node: any) => node.id);
    setSelectedNodes(nodeIds);
    
    // Update selectedNodeId for PropertyPanel
    if (nodeIds.length === 1) {
      selectNode(nodeIds[0]);
    } else {
      selectNode(null);
    }
  }, [setSelectedNodes, selectNode]);

  // Handle drag start
  const handleNodeDragStart = useCallback((_event: React.MouseEvent, node: Node) => {
    setIsDragging(true);
    setDraggingNodeId(node.id);
  }, []);

  // Handle drag stop
  const handleNodeDragStop = useCallback(() => {
    setIsDragging(false);
    setDraggingNodeId(null);
  }, []);

  // Removed double-click handlers for tables and edges since we're using process modeling now

  return (
    <div className="flex-1 h-full relative">
      <ReactFlow
        nodes={enhancedNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onPaneClick={handlePaneClick}
        onPaneContextMenu={handlePaneContextMenu}
        onNodeContextMenu={handleNodeContextMenu}
        onNodeClick={handleNodeClick}
        onNodeDragStart={handleNodeDragStart}
        onNodeDragStop={handleNodeDragStop}
        onSelectionChange={handleSelectionChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{ type: 'sequence-flow', markerEnd: { type: MarkerType.ArrowClosed } }}
        connectionMode={ConnectionMode.Loose}
        connectionLineType={ConnectionLineType.Step}
        connectionLineStyle={{ stroke: '#3b82f6', strokeWidth: 2 }}
        snapToGrid={snapToGrid}
        snapGrid={[gridSize, gridSize]}
        attributionPosition="bottom-left"
        nodesDraggable={!isReadOnly}
        nodesConnectable={!isReadOnly}
        elementsSelectable={!isReadOnly}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
        multiSelectionKeyCode="Control"
        selectionOnDrag={true}
      >
        <Background 
          variant={snapToGrid ? BackgroundVariant.Dots : BackgroundVariant.Lines}
          gap={snapToGrid ? gridSize : 20}
          size={snapToGrid ? 2 : 1}
          color={snapToGrid ? '#d1d5db' : '#f3f4f6'}
        />
        <Controls />
        {showMiniMap && (
          <MiniMap
            nodeStrokeColor={(n) => {
              if (n.type === 'table') return '#1a192b';
              return '#eee';
            }}
            nodeColor={(n) => {
              if (n.type === 'table') return '#fff';
              return '#fff';
            }}
            style={{
              backgroundColor: '#f7fafc',
            }}
          />
        )}
      </ReactFlow>
      
      {/* Search Component */}
      {isSearchOpen && (
        <CanvasSearch onClose={() => setSearchOpen(false)} />
      )}
      
      {/* Zoom Toolbar */}
      <ZoomToolbar />
      
      {/* Alignment Toolbar */}
      {alignmentToolbarPosition && (
        <AlignmentToolbar 
          selectedNodes={selectedNodeIds}
          position={alignmentToolbarPosition}
        />
      )}

      {/* Dynamic Alignment Guides */}
      <AlignmentGuides 
        nodes={nodes} 
        isDragging={isDragging} 
        draggingNodeId={draggingNodeId} 
      />

      {/* Context Menu */}
      {contextMenu && (
        <ProcessContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          nodeId={contextMenu.nodeId}
          nodeType={contextMenu.nodeType}
          onClose={() => setContextMenu(null)}
          onDelete={handleContextMenuDelete}
          onEdit={handleContextMenuEdit}
          onDuplicate={handleContextMenuDuplicate}
          onProperties={handleContextMenuProperties}
          onAddNode={handleContextMenuAddNode}
        />
      )}

      {/* Quick Node Selector */}
      {quickNodeSelector && (
        <QuickNodeSelector
          x={quickNodeSelector.x}
          y={quickNodeSelector.y}
          sourceNodeId={quickNodeSelector.sourceNodeId}
          onSelectNode={handleQuickNodeSelect}
          onClose={() => setQuickNodeSelector(null)}
        />
      )}
    </div>
  );
};
