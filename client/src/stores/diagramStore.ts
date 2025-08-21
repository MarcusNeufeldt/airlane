import { create } from 'zustand';
import {
  Node,
  Edge,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  Connection,
} from 'reactflow';
import {
  DiagramNodeData,
  StickyNoteData,
  ShapeData,
  NodeType,
  EventNodeData,
  ProcessNodeData,
  GatewayNodeData,
  LaneNodeData,
  PoolNodeData,
  DataObjectNodeData,
} from '../types';
import * as Y from 'yjs';

interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: number;
  duration?: number;
}

interface UIState {
  selectedNodeId: string | null;
  selectedNodeIds: string[];
  contextMenuNodeId: string | null;
  animatingNodeIds: Set<string>;
  yNodes: Y.Array<any> | null;
  yEdges: Y.Array<any> | null;
  notifications: Notification[];
  showFileMenu: boolean;
  showShapeMenu: boolean;
  showViewMenu: boolean;
  showLaneColors: boolean;
  snapToGrid: boolean;
  gridSize: number;
  history: HistoryState[];
  historyIndex: number;
  maxHistorySize: number;
  isReadOnly: boolean;
  lockedBy: string | null;
  currentDiagramId: string | null;
  lockStatus: 'locked' | 'unlocked' | 'expired' | 'warning';
  lockTimeRemaining: number;
  lastHeartbeat: number;
  searchQuery: string;
  searchResults: string[];
  currentSearchIndex: number;
  isSearchOpen: boolean;
}

interface DiagramState extends UIState {
  nodes: Node[];
  edges: Edge[];
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  
  // New/Refactored functions
  addNode: (type: NodeType, position: { x: number; y: number }, options?: any) => void;
  updateNode: (nodeId: string, data: Partial<DiagramNodeData>) => void;
  deleteNode: (nodeId: string) => void;
  deleteSelectedNodes: () => void;
  duplicateSelectedNodes: () => void;
  selectAllNodes: () => void;
  deselectAllNodes: () => void;
  updateEdge: (edgeId: string, data: any) => void;
  removeEdge: (edgeId: string) => void;
  
  // Generic/UI functions
  selectNode: (nodeId: string | null) => void;
  setSelectedNodes: (nodeIds: string[]) => void;
  setContextMenuNode: (nodeId: string | null) => void;
  importDiagram: (diagramData: { nodes: Node[]; edges?: Edge[] }) => void;
  autoLayout: () => void;
  
  // All other UI/notification/locking functions
  flashTable: (tableId: string) => void;
  addStickyNote: (position: { x: number; y: number }) => void;
  addShape: (position: { x: number; y: number }, shapeType: 'rectangle' | 'circle' | 'diamond') => void;
  toggleNodeSelection: (nodeId: string) => void;
  initializeYjs: (doc: Y.Doc) => void;
  syncFromYjs: () => void;
  toggleGrid: () => void;
  setGridSize: (size: number) => void;
  setReadOnly: (isReadOnly: boolean, lockedBy?: string | null) => void;
  setCurrentDiagramId: (diagramId: string | null) => void;
  setLockStatus: (status: 'locked' | 'unlocked' | 'expired' | 'warning', timeRemaining?: number) => void;
  updateLockTimeRemaining: (seconds: number) => void;
  addNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string, duration?: number) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setShowFileMenu: (show: boolean) => void;
  setShowShapeMenu: (show: boolean) => void;
  setShowViewMenu: (show: boolean) => void;
  setShowLaneColors: (show: boolean) => void;
  closeAllDropdowns: () => void;
  setSearchQuery: (query: string) => void;
  setSearchOpen: (isOpen: boolean) => void;
  searchNodes: (query: string) => void;
  navigateToSearchResult: (index: number) => void;
  nextSearchResult: () => void;
  previousSearchResult: () => void;
  alignSelectedNodes: (alignment: 'left' | 'right' | 'top' | 'bottom' | 'center-horizontal' | 'center-vertical') => void;
  distributeSelectedNodes: (direction: 'horizontal' | 'vertical') => void;
}

const snapToGridPosition = (position: { x: number; y: number }, gridSize: number, snapEnabled: boolean) => {
  if (!snapEnabled) return position;
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize,
  };
};

const createSetStateWithHistory = (get: any, set: any) => {
  return (newState: Partial<DiagramState>, actionName: string) => {
    const { history, historyIndex, maxHistorySize } = get();
    set(newState);
    const { nodes, edges } = get();
    const currentState: HistoryState = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(currentState);
    if (newHistory.length > maxHistorySize) {
      newHistory.shift();
    } else {
      set({ historyIndex: historyIndex + 1 });
    }
    console.log(`History saved for: ${actionName} (total states: ${newHistory.length})`);
    set({ history: newHistory });
  };
};

export const useDiagramStore = create<DiagramState>((set, get) => {
  const setStateWithHistory = createSetStateWithHistory(get, set);
  
  return {
    // Initial State
    nodes: [],
    edges: [],
    selectedNodeId: null,
    selectedNodeIds: [],
    contextMenuNodeId: null,
    animatingNodeIds: new Set(),
    yNodes: null,
    yEdges: null,
    notifications: [],
    showFileMenu: false,
    showShapeMenu: false,
    showViewMenu: false,
    showLaneColors: true,
    snapToGrid: true,
    gridSize: 15,
    history: [],
    historyIndex: -1,
    maxHistorySize: 50,
    isReadOnly: false,
    lockedBy: null,
    currentDiagramId: null,
    lockStatus: 'unlocked',
    lockTimeRemaining: 0,
    lastHeartbeat: Date.now(),
    searchQuery: '',
    searchResults: [],
    currentSearchIndex: -1,
    isSearchOpen: false,

    // History Management
    undo: () => {
      const { history, historyIndex } = get();
      if (historyIndex > 0) {
        const previousState = history[historyIndex - 1];
        set({
          nodes: JSON.parse(JSON.stringify(previousState.nodes)),
          edges: JSON.parse(JSON.stringify(previousState.edges)),
          historyIndex: historyIndex - 1,
        });
      }
    },

    redo: () => {
      const { history, historyIndex } = get();
      if (historyIndex < history.length - 1) {
        const nextState = history[historyIndex + 1];
        set({
          nodes: JSON.parse(JSON.stringify(nextState.nodes)),
          edges: JSON.parse(JSON.stringify(nextState.edges)),
          historyIndex: historyIndex + 1,
        });
      }
    },

    canUndo: () => get().historyIndex > 0,
    canRedo: () => get().historyIndex < get().history.length - 1,
    
    clearHistory: () => {
      set({
        history: [],
        historyIndex: -1,
      });
    },

    // Core React Flow Handlers
    onNodesChange: (changes) => {
      const newNodes = applyNodeChanges(changes, get().nodes);
      const hasPositionChange = changes.some(c => c.type === 'position' && !c.dragging);
      if (hasPositionChange) {
        setStateWithHistory({ nodes: newNodes }, 'Move Node');
      } else {
        set({ nodes: newNodes });
      }
    },

    onEdgesChange: (changes) => {
      set({ edges: applyEdgeChanges(changes, get().edges) });
    },

    onConnect: (connection) => {
      const newEdge = {
        ...connection,
        id: `edge-${Date.now()}`,
        type: 'sequence-flow',
        markerEnd: { type: 'arrowclosed' as const },
      };
      setStateWithHistory({ edges: addEdge(newEdge, get().edges) }, 'Add Connection');
    },

    // NEW/REFACTORED ACTIONS
    addNode: (type, position, options = {}) => {
      const { snapToGrid, gridSize } = get();
      const snappedPosition = snapToGridPosition(position, gridSize, snapToGrid);
      const id = `${type}-${Date.now()}`;
      let newNode: Node;

      switch (type) {
        case 'event':
          const eventData: EventNodeData = { 
            id, 
            nodeType: 'event', 
            eventType: options.eventType || 'start', 
            label: options.eventType === 'end' ? 'End' : options.eventType === 'intermediate' ? 'Intermediate' : 'Start'
          };
          newNode = { id, type, position: snappedPosition, data: eventData };
          break;
        case 'gateway':
          const gatewayData: GatewayNodeData = { 
            id, 
            nodeType: 'gateway', 
            gatewayType: 'exclusive', 
            label: '' 
          };
          newNode = { id, type, position: snappedPosition, data: gatewayData };
          break;
        case 'lane':
          const laneData: LaneNodeData = { 
            id, 
            nodeType: 'lane', 
            label: 'Lane', 
            width: 300,
            height: 150
          };
          newNode = { id, type, position: snappedPosition, data: laneData, zIndex: -10 };
          break;
        case 'pool':
          const poolData: PoolNodeData = { 
            id, 
            nodeType: 'pool', 
            label: 'Process Pool',
            participant: 'Participant',
            width: 400,
            height: 200,
            isCollapsed: false
          };
          newNode = { id, type, position: snappedPosition, data: poolData, zIndex: -20 };
          break;
        case 'data-object':
          const dataObjectData: DataObjectNodeData = { 
            id, 
            nodeType: 'data-object', 
            dataType: 'input',
            label: 'Data Object'
          };
          newNode = { id, type, position: snappedPosition, data: dataObjectData };
          break;
        case 'process':
        default:
          const processData: ProcessNodeData = { 
            id, 
            nodeType: 'process', 
            processType: 'task', 
            label: 'New Task' 
          };
          newNode = { id, type, position: snappedPosition, data: processData };
          break;
      }
      
      setStateWithHistory({ nodes: [...get().nodes, newNode], selectedNodeId: id }, 'Add Node');
    },

    updateNode: (nodeId, updates) => {
      const newNodes = get().nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...updates } } : node
      );
      setStateWithHistory({ nodes: newNodes }, 'Update Node');
    },

    deleteNode: (nodeId) => {
      const newNodes = get().nodes.filter((node) => node.id !== nodeId);
      const newEdges = get().edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId);
      const selectedNodeId = get().selectedNodeId === nodeId ? null : get().selectedNodeId;
      setStateWithHistory({ nodes: newNodes, edges: newEdges, selectedNodeId }, 'Delete Node');
    },

    deleteSelectedNodes: () => {
      const { selectedNodeIds } = get();
      if (selectedNodeIds.length === 0) return;
      
      const newNodes = get().nodes.filter((node) => !selectedNodeIds.includes(node.id));
      const newEdges = get().edges.filter((edge) => 
        !selectedNodeIds.includes(edge.source) && !selectedNodeIds.includes(edge.target)
      );
      setStateWithHistory({ 
        nodes: newNodes, 
        edges: newEdges, 
        selectedNodeId: null, 
        selectedNodeIds: [] 
      }, 'Delete Selected Nodes');
    },

    duplicateSelectedNodes: () => {
      const { selectedNodeIds, nodes } = get();
      if (selectedNodeIds.length === 0) return;
      
      const selectedNodes = nodes.filter(node => selectedNodeIds.includes(node.id));
      const newNodes = [...nodes];
      const newSelectedIds: string[] = [];
      
      selectedNodes.forEach(node => {
        const newId = `${node.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const duplicatedNode = {
          ...node,
          id: newId,
          position: {
            x: node.position.x + 50,
            y: node.position.y + 50
          },
          data: {
            ...node.data,
            id: newId
          }
        };
        newNodes.push(duplicatedNode);
        newSelectedIds.push(newId);
      });
      
      setStateWithHistory({ 
        nodes: newNodes, 
        selectedNodeIds: newSelectedIds,
        selectedNodeId: newSelectedIds.length === 1 ? newSelectedIds[0] : null
      }, 'Duplicate Nodes');
    },

    selectAllNodes: () => {
      const allNodeIds = get().nodes.map(node => node.id);
      set({ 
        selectedNodeIds: allNodeIds,
        selectedNodeId: allNodeIds.length === 1 ? allNodeIds[0] : null
      });
    },

    deselectAllNodes: () => {
      set({ selectedNodeIds: [], selectedNodeId: null });
    },

    updateEdge: (edgeId, data) => {
      const newEdges = get().edges.map((edge) =>
        edge.id === edgeId ? { ...edge, data: { ...edge.data, ...data } } : edge
      );
      setStateWithHistory({ edges: newEdges }, 'Update Edge');
    },

    removeEdge: (edgeId) => {
      const newEdges = get().edges.filter((edge) => edge.id !== edgeId);
      setStateWithHistory({ edges: newEdges }, 'Remove Edge');
    },

    // GENERIC/UI ACTIONS
    selectNode: (nodeId) => {
      set({ selectedNodeId: nodeId, selectedNodeIds: nodeId ? [nodeId] : [] });
    },

    setSelectedNodes: (nodeIds) => {
      set({ selectedNodeIds: nodeIds });
    },

    setContextMenuNode: (nodeId) => {
      set({ contextMenuNodeId: nodeId });
    },

    importDiagram: (diagramData) => {
      const newNodes = diagramData.nodes || [];
      const newEdges = diagramData.edges || [];
      set({ 
        nodes: newNodes, 
        edges: newEdges,
        history: [],
        historyIndex: -1,
      });
    },

    autoLayout: () => {
      get().addNotification('info', 'Auto-layout is being redeveloped for process diagrams!', 3000);
    },

    flashTable: (nodeId) => {
      const animatingNodeIds = new Set(get().animatingNodeIds);
      animatingNodeIds.add(nodeId);
      set({ animatingNodeIds });
      
      setTimeout(() => {
        const ids = new Set(get().animatingNodeIds);
        ids.delete(nodeId);
        set({ animatingNodeIds: ids });
      }, 2000);
    },

    addStickyNote: (position) => {
      const { snapToGrid, gridSize } = get();
      const snappedPosition = snapToGridPosition(position, gridSize, snapToGrid);
      const id = `sticky-${Date.now()}`;
      const stickyData: StickyNoteData = {
        id,
        nodeType: 'sticky-note',
        content: 'New Note',
        color: '#fef3c7',
        width: 200,
        height: 150,
      };
      const newNode: Node = {
        id,
        type: 'sticky-note',
        position: snappedPosition,
        data: stickyData,
      };
      setStateWithHistory({ nodes: [...get().nodes, newNode] }, 'Add Sticky Note');
    },

    addShape: (position, shapeType) => {
      const { snapToGrid, gridSize } = get();
      const snappedPosition = snapToGridPosition(position, gridSize, snapToGrid);
      const id = `shape-${Date.now()}`;
      const shapeData: ShapeData = {
        id,
        nodeType: 'shape',
        type: shapeType,
        title: '',
        text: '',
        color: '#e0e7ff',
        borderColor: '#6366f1',
        width: shapeType === 'circle' ? 150 : 200,
        height: shapeType === 'circle' ? 150 : 100,
      };
      const newNode: Node = {
        id,
        type: 'shape',
        position: snappedPosition,
        data: shapeData,
        style: {
          width: shapeData.width,
          height: shapeData.height,
        },
      };
      setStateWithHistory({ nodes: [...get().nodes, newNode] }, 'Add Shape');
    },

    toggleNodeSelection: (nodeId) => {
      const currentIds = get().selectedNodeIds;
      const newIds = currentIds.includes(nodeId)
        ? currentIds.filter(id => id !== nodeId)
        : [...currentIds, nodeId];
      set({ selectedNodeIds: newIds });
    },

    initializeYjs: (doc) => {
      const yNodes = doc.getArray('nodes');
      const yEdges = doc.getArray('edges');
      set({ yNodes, yEdges });
      
      yNodes.observe(() => {
        get().syncFromYjs();
      });
      
      yEdges.observe(() => {
        get().syncFromYjs();
      });
    },

    syncFromYjs: () => {
      const { yNodes, yEdges } = get();
      if (yNodes && yEdges) {
        set({
          nodes: yNodes.toArray(),
          edges: yEdges.toArray(),
        });
      }
    },

    toggleGrid: () => {
      set({ snapToGrid: !get().snapToGrid });
    },

    setGridSize: (size) => {
      set({ gridSize: size });
    },

    setReadOnly: (isReadOnly, lockedBy = null) => {
      set({ isReadOnly, lockedBy });
    },

    setCurrentDiagramId: (diagramId) => {
      set({ currentDiagramId: diagramId });
    },

    setLockStatus: (status, timeRemaining = 0) => {
      set({ lockStatus: status, lockTimeRemaining: timeRemaining });
    },

    updateLockTimeRemaining: (seconds) => {
      set({ lockTimeRemaining: seconds });
    },

    addNotification: (type, message, duration = 3000) => {
      const notification: Notification = {
        id: `notification-${Date.now()}`,
        type,
        message,
        timestamp: Date.now(),
        duration,
      };
      
      set({ notifications: [...get().notifications, notification] });
      
      if (duration > 0) {
        setTimeout(() => {
          get().removeNotification(notification.id);
        }, duration);
      }
    },

    removeNotification: (id) => {
      set({ notifications: get().notifications.filter(n => n.id !== id) });
    },

    clearNotifications: () => {
      set({ notifications: [] });
    },

    setShowFileMenu: (show) => {
      set({ showFileMenu: show });
    },

    setShowShapeMenu: (show) => {
      set({ showShapeMenu: show });
    },

    setShowViewMenu: (show) => {
      set({ showViewMenu: show });
    },

    setShowLaneColors: (show) => {
      set({ showLaneColors: show });
    },

    closeAllDropdowns: () => {
      set({
        showFileMenu: false,
        showShapeMenu: false,
        showViewMenu: false,
      });
    },

    setSearchQuery: (query) => {
      set({ searchQuery: query });
    },

    setSearchOpen: (isOpen) => {
      set({ isSearchOpen: isOpen });
      if (!isOpen) {
        set({
          searchQuery: '',
          searchResults: [],
          currentSearchIndex: -1,
        });
      }
    },

    searchNodes: (query) => {
      if (!query.trim()) {
        set({ searchResults: [], currentSearchIndex: -1 });
        return;
      }

      const lowerQuery = query.toLowerCase();
      const results = get().nodes.filter(node => {
        const data = node.data as any;
        if (data.label && data.label.toLowerCase().includes(lowerQuery)) {
          return true;
        }
        if (data.description && data.description.toLowerCase().includes(lowerQuery)) {
          return true;
        }
        if (data.content && data.content.toLowerCase().includes(lowerQuery)) {
          return true;
        }
        if (data.text && data.text.toLowerCase().includes(lowerQuery)) {
          return true;
        }
        return false;
      }).map(node => node.id);

      set({ 
        searchResults: results,
        currentSearchIndex: results.length > 0 ? 0 : -1,
      });
    },

    navigateToSearchResult: (index) => {
      const { searchResults } = get();
      if (index >= 0 && index < searchResults.length) {
        set({ currentSearchIndex: index });
        const nodeId = searchResults[index];
        get().selectNode(nodeId);
      }
    },

    nextSearchResult: () => {
      const { searchResults, currentSearchIndex } = get();
      if (searchResults.length === 0) return;
      
      const nextIndex = (currentSearchIndex + 1) % searchResults.length;
      get().navigateToSearchResult(nextIndex);
    },

    previousSearchResult: () => {
      const { searchResults, currentSearchIndex } = get();
      if (searchResults.length === 0) return;
      
      const prevIndex = currentSearchIndex <= 0 ? searchResults.length - 1 : currentSearchIndex - 1;
      get().navigateToSearchResult(prevIndex);
    },

    alignSelectedNodes: (alignment) => {
      const { selectedNodeIds, nodes } = get();
      if (selectedNodeIds.length < 2) return;

      const selectedNodes = nodes.filter(node => selectedNodeIds.includes(node.id));
      let alignedNodes = [...nodes];

      switch (alignment) {
        case 'left':
          const minX = Math.min(...selectedNodes.map(n => n.position.x));
          alignedNodes = nodes.map(node =>
            selectedNodeIds.includes(node.id)
              ? { ...node, position: { ...node.position, x: minX } }
              : node
          );
          break;
        case 'right':
          const maxX = Math.max(...selectedNodes.map(n => n.position.x));
          alignedNodes = nodes.map(node =>
            selectedNodeIds.includes(node.id)
              ? { ...node, position: { ...node.position, x: maxX } }
              : node
          );
          break;
        case 'top':
          const minY = Math.min(...selectedNodes.map(n => n.position.y));
          alignedNodes = nodes.map(node =>
            selectedNodeIds.includes(node.id)
              ? { ...node, position: { ...node.position, y: minY } }
              : node
          );
          break;
        case 'bottom':
          const maxY = Math.max(...selectedNodes.map(n => n.position.y));
          alignedNodes = nodes.map(node =>
            selectedNodeIds.includes(node.id)
              ? { ...node, position: { ...node.position, y: maxY } }
              : node
          );
          break;
        case 'center-horizontal':
          const avgX = selectedNodes.reduce((sum, n) => sum + n.position.x, 0) / selectedNodes.length;
          alignedNodes = nodes.map(node =>
            selectedNodeIds.includes(node.id)
              ? { ...node, position: { ...node.position, x: avgX } }
              : node
          );
          break;
        case 'center-vertical':
          const avgY = selectedNodes.reduce((sum, n) => sum + n.position.y, 0) / selectedNodes.length;
          alignedNodes = nodes.map(node =>
            selectedNodeIds.includes(node.id)
              ? { ...node, position: { ...node.position, y: avgY } }
              : node
          );
          break;
      }

      setStateWithHistory({ nodes: alignedNodes }, `Align ${alignment}`);
    },

    distributeSelectedNodes: (direction) => {
      const { selectedNodeIds, nodes } = get();
      if (selectedNodeIds.length < 3) return;

      const selectedNodes = nodes.filter(node => selectedNodeIds.includes(node.id));
      let distributedNodes = [...nodes];

      if (direction === 'horizontal') {
        const sortedByX = [...selectedNodes].sort((a, b) => a.position.x - b.position.x);
        const minX = sortedByX[0].position.x;
        const maxX = sortedByX[sortedByX.length - 1].position.x;
        const spacing = (maxX - minX) / (sortedByX.length - 1);

        sortedByX.forEach((node, index) => {
          const newX = minX + spacing * index;
          distributedNodes = distributedNodes.map(n =>
            n.id === node.id ? { ...n, position: { ...n.position, x: newX } } : n
          );
        });
      } else {
        const sortedByY = [...selectedNodes].sort((a, b) => a.position.y - b.position.y);
        const minY = sortedByY[0].position.y;
        const maxY = sortedByY[sortedByY.length - 1].position.y;
        const spacing = (maxY - minY) / (sortedByY.length - 1);

        sortedByY.forEach((node, index) => {
          const newY = minY + spacing * index;
          distributedNodes = distributedNodes.map(n =>
            n.id === node.id ? { ...n, position: { ...n.position, y: newY } } : n
          );
        });
      }

      setStateWithHistory({ nodes: distributedNodes }, `Distribute ${direction}`);
    },
  };
});