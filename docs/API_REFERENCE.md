# Process Pipeline Creator - API Reference

## Store API (Zustand)

The main application state is managed through a Zustand store accessible via `useDiagramStore()`.

### Core Data Methods

#### `addNode(type: NodeType, position: Position)`
Creates a new process element on the canvas.

**Parameters:**
- `type`: `'process' | 'event' | 'gateway'`
- `position`: `{ x: number; y: number }`

**Example:**
```typescript
const { addNode } = useDiagramStore();
addNode('process', { x: 400, y: 200 });
```

#### `updateNode(nodeId: string, updates: Partial<DiagramNodeData>)`
Updates properties of an existing node.

**Parameters:**
- `nodeId`: Unique identifier of the node
- `updates`: Partial node data object

**Example:**
```typescript
const { updateNode } = useDiagramStore();
updateNode('process-123', { 
  label: 'Updated Task Name',
  description: 'New description' 
});
```

#### `deleteNode(nodeId: string)`
Removes a node and all connected edges.

**Parameters:**
- `nodeId`: Unique identifier of the node

**Example:**
```typescript
const { deleteNode } = useDiagramStore();
deleteNode('process-123');
```

### Connection Methods

#### `onConnect(connection: Connection)`
Creates a sequence flow between two nodes.

**Parameters:**
- `connection`: ReactFlow connection object

**Automatically called by ReactFlow when users create connections.**

### Selection Methods

#### `selectNode(nodeId: string | null)`
Selects a single node for editing.

**Parameters:**
- `nodeId`: Node ID to select, or `null` to clear selection

**Example:**
```typescript
const { selectNode } = useDiagramStore();
selectNode('process-123'); // Select node
selectNode(null);          // Clear selection
```

#### `setSelectedNodes(nodeIds: string[])`
Sets multiple selected nodes for batch operations.

**Parameters:**
- `nodeIds`: Array of node IDs

**Example:**
```typescript
const { setSelectedNodes } = useDiagramStore();
setSelectedNodes(['process-123', 'gateway-456']);
```

### History Methods

#### `undo()`
Reverts the last action.

**Example:**
```typescript
const { undo, canUndo } = useDiagramStore();
if (canUndo()) {
  undo();
}
```

#### `redo()`
Re-applies a previously undone action.

**Example:**
```typescript
const { redo, canRedo } = useDiagramStore();
if (canRedo()) {
  redo();
}
```

#### `clearHistory()`
Clears the undo/redo history.

### UI State Methods

#### `toggleGrid()`
Toggles snap-to-grid functionality.

**Example:**
```typescript
const { toggleGrid, snapToGrid } = useDiagramStore();
console.log('Grid enabled:', snapToGrid);
toggleGrid();
```

#### `setGridSize(size: number)`
Sets the grid size for snapping.

**Parameters:**
- `size`: Grid size in pixels

### Notification Methods

#### `addNotification(type: NotificationType, message: string, duration?: number)`
Shows a notification to the user.

**Parameters:**
- `type`: `'success' | 'error' | 'warning' | 'info'`
- `message`: Notification text
- `duration`: Display duration in ms (default: 3000)

**Example:**
```typescript
const { addNotification } = useDiagramStore();
addNotification('success', 'Process saved successfully!');
addNotification('error', 'Failed to connect elements', 5000);
```

### Search Methods

#### `searchNodes(query: string)`
Searches for nodes by label, description, or content.

**Parameters:**
- `query`: Search string

**Example:**
```typescript
const { searchNodes, searchResults } = useDiagramStore();
searchNodes('approval');
console.log('Found nodes:', searchResults);
```

#### `navigateToSearchResult(index: number)`
Focuses on a specific search result.

**Parameters:**
- `index`: Index in search results array

### Alignment Methods

#### `alignSelectedNodes(alignment: AlignmentType)`
Aligns multiple selected nodes.

**Parameters:**
- `alignment`: `'left' | 'right' | 'top' | 'bottom' | 'center-horizontal' | 'center-vertical'`

**Example:**
```typescript
const { alignSelectedNodes, selectedNodeIds } = useDiagramStore();
if (selectedNodeIds.length >= 2) {
  alignSelectedNodes('left');
}
```

#### `distributeSelectedNodes(direction: 'horizontal' | 'vertical')`
Evenly distributes selected nodes.

**Parameters:**
- `direction`: Distribution direction

---

## Component APIs

### ProcessNode Component

#### Props
```typescript
interface ProcessNodeProps extends NodeProps<ProcessNodeData> {
  id: string;
  data: ProcessNodeData;
  selected: boolean;
}
```

#### Data Structure
```typescript
interface ProcessNodeData {
  id: string;
  nodeType: 'process';
  processType: 'task' | 'subprocess';
  label: string;
  description?: string;
  color?: string;
  borderColor?: string;
}
```

### EventNode Component

#### Props
```typescript
interface EventNodeProps extends NodeProps<EventNodeData> {
  id: string;
  data: EventNodeData;
  selected: boolean;
}
```

#### Data Structure
```typescript
interface EventNodeData {
  id: string;
  nodeType: 'event';
  eventType: 'start' | 'intermediate' | 'end';
  label: string;
  description?: string;
  color?: string;
  borderColor?: string;
}
```

### GatewayNode Component

#### Props
```typescript
interface GatewayNodeProps extends NodeProps<GatewayNodeData> {
  id: string;
  data: GatewayNodeData;
  selected: boolean;
}
```

#### Data Structure
```typescript
interface GatewayNodeData {
  id: string;
  nodeType: 'gateway';
  gatewayType: 'exclusive' | 'parallel' | 'inclusive';
  label: string;
  description?: string;
  color?: string;
  borderColor?: string;
}
```

### SequenceFlowEdge Component

#### Props
```typescript
interface SequenceFlowEdgeProps extends EdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  data?: SequenceFlowData;
}
```

#### Data Structure
```typescript
interface SequenceFlowData {
  condition?: string;
  isDefault?: boolean;
}
```

---

## Utility Functions

### Position Utilities

#### `snapToGridPosition(position: Position, gridSize: number, snapEnabled: boolean)`
Snaps a position to the nearest grid point.

**Parameters:**
- `position`: `{ x: number; y: number }`
- `gridSize`: Grid size in pixels
- `snapEnabled`: Whether snapping is enabled

**Returns:** Snapped position object

### Export Utilities

#### `exportCurrentViewportAsPNG(nodes: Node[], filename: string)`
Exports the current viewport as a PNG image.

**Parameters:**
- `nodes`: Array of nodes to export
- `filename`: Output filename

**Returns:** Promise that resolves when export completes

#### `exportFullDiagramAsPNG(nodes: Node[], filename: string)`
Exports the entire diagram as a PNG image.

**Parameters:**
- `nodes`: Array of nodes to export
- `filename`: Output filename

**Returns:** Promise that resolves when export completes

---

## Type Definitions

### Core Types

```typescript
export type NodeType = 'process' | 'event' | 'gateway';
export type EventType = 'start' | 'intermediate' | 'end';
export type ProcessType = 'task' | 'subprocess';
export type GatewayType = 'exclusive' | 'parallel' | 'inclusive';
export type NotificationType = 'success' | 'error' | 'warning' | 'info';
export type AlignmentType = 'left' | 'right' | 'top' | 'bottom' | 'center-horizontal' | 'center-vertical';
```

### Position & Geometry

```typescript
interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

### Notification System

```typescript
interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: number;
  duration?: number;
}
```

### History System

```typescript
interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}
```

---

## Event Handlers

### Canvas Events

#### `onNodesChange(changes: NodeChange[])`
Handles node position and selection changes.

#### `onEdgesChange(changes: EdgeChange[])`
Handles edge modifications and deletions.

#### `onConnect(connection: Connection)`
Handles new connection creation.

#### `onPaneClick()`
Handles canvas background clicks (deselects nodes).

### Node Events

#### `onDoubleClick()`
Triggers in-line editing mode.

#### `onLabelChange(newLabel: string)`
Updates node label through the store.

#### `onLabelBlur()`
Exits in-line editing mode.

---

## Keyboard Shortcuts API

### Global Shortcuts

```typescript
interface KeyboardShortcuts {
  'Ctrl+Z': () => undo();
  'Ctrl+Y': () => redo();
  'Ctrl+F': () => setSearchOpen(true);
  'Delete': () => deleteSelectedNodes();
  'Escape': () => clearSelection();
}
```

### Implementation Example

```typescript
useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
      event.preventDefault();
      undo();
    }
    // ... other shortcuts
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [undo, redo, setSearchOpen]);
```

---

## Error Handling

### Store Error States

```typescript
interface ErrorState {
  hasError: boolean;
  errorMessage: string | null;
  lastErrorAction: string | null;
}
```

### Error Handling Patterns

```typescript
// In store actions
try {
  // Perform operation
  setStateWithHistory(newState, 'Action Name');
} catch (error) {
  addNotification('error', `Failed to perform action: ${error.message}`);
  console.error('Action failed:', error);
}
```

---

## Performance Considerations

### Memoization Patterns

```typescript
// Memoize expensive calculations
const sortedNodes = useMemo(() => {
  return [...nodes].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
}, [nodes]);

// Memoize callbacks
const handleNodeUpdate = useCallback((nodeId: string, updates: any) => {
  updateNode(nodeId, updates);
}, [updateNode]);
```

### Debounced Operations

```typescript
// Debounce search queries
const debouncedSearch = useMemo(
  () => debounce((query: string) => searchNodes(query), 300),
  [searchNodes]
);
```

This API reference provides comprehensive documentation for all public interfaces and methods available in the Process Pipeline Creator application.