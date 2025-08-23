export type NodeType = 'process' | 'event' | 'gateway' | 'lane' | 'pool' | 'pool-with-lanes' | 'data-object';
export type EventType = 'start' | 'intermediate' | 'end' | 'boundary';
export type ProcessType = 'task' | 'subprocess';
export type TaskType = 'user' | 'service' | 'manual' | 'script' | 'business-rule' | 'send' | 'receive';
export type GatewayType = 'exclusive' | 'parallel' | 'inclusive' | 'event-based' | 'complex';
export type EdgeType = 'sequence-flow' | 'message-flow' | 'association';
export type DataObjectType = 'input' | 'output' | 'collection';

// Base interface for all node data
export interface BaseNodeData {
  id: string;
  label: string;
  description?: string;
  color?: string;
  borderColor?: string;
  laneId?: string;
  laneName?: string;
  laneColor?: string;
}

// Specific data interfaces for each node type
export interface EventNodeData extends BaseNodeData {
  nodeType: 'event';
  eventType: EventType;
  eventSubType?: 'error' | 'timer' | 'message' | 'escalation';
}

export interface ProcessNodeData extends BaseNodeData {
  nodeType: 'process';
  processType: ProcessType;
  taskType?: TaskType;
  assignedLane?: string;
  performer?: string;
}

export interface GatewayNodeData extends BaseNodeData {
  nodeType: 'gateway';
  gatewayType: GatewayType;
}

export interface LaneNodeData extends BaseNodeData {
  nodeType: 'lane';
  poolId?: string;
  assignee?: string;
  width: number;
  height: number;
  locked?: boolean;
  backgroundColor?: string;
}

export interface PoolNodeData extends BaseNodeData {
  nodeType: 'pool';
  participant: string;
  isCollapsed?: boolean;
  width: number;
  height: number;
}

export interface PoolWithLanesData extends BaseNodeData {
  nodeType: 'pool-with-lanes';
  participant: string;
  lanes: Array<{
    id: string;
    name: string;
    height: number;
    color: string;
  }>;
  width: number;
  height: number;
}

export interface DataObjectNodeData extends BaseNodeData {
  nodeType: 'data-object';
  dataType: DataObjectType;
  dataObjectType?: 'data-object' | 'data-store';
  state?: string;
}

// A union type for any possible node data
export type DiagramNodeData = EventNodeData | ProcessNodeData | GatewayNodeData | LaneNodeData | PoolNodeData | PoolWithLanesData | DataObjectNodeData | StickyNoteData | ShapeData;

// Data for edges (connectors)
export interface SequenceFlowData {
  condition?: string;
  isDefault?: boolean;
}

export interface MessageFlowData {
  messageType?: string;
  sender?: string;
  receiver?: string;
}

export interface AssociationData {
  associationType: 'text' | 'data';
  direction?: 'none' | 'one' | 'both';
}

// Existing types for non-process elements (can remain as they are)
export interface StickyNoteData {
  id: string;
  nodeType: 'sticky-note';
  content: string;
  color: string;
  author?: string;
  timestamp?: Date;
  width?: number;
  height?: number;
}

export interface ShapeData {
  id: string;
  nodeType: 'shape';
  type: 'rectangle' | 'circle' | 'diamond';
  title?: string;
  text?: string;
  color: string;
  borderColor: string;
  width: number;
  height: number;
}