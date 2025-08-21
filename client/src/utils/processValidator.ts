import { Node, Edge } from 'reactflow';
import { DiagramNodeData, EventNodeData, GatewayNodeData, ProcessNodeData } from '../types';

export interface ValidationIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  nodeId?: string;
  edgeId?: string;
  category: 'structure' | 'bpmn-compliance' | 'best-practice';
}

export class ProcessValidator {
  private nodes: Node<DiagramNodeData>[];
  private edges: Edge[];
  private issues: ValidationIssue[] = [];

  constructor(nodes: Node<DiagramNodeData>[], edges: Edge[]) {
    this.nodes = nodes;
    this.edges = edges;
    this.issues = [];
  }

  validate(): ValidationIssue[] {
    this.issues = [];
    
    // Don't validate empty canvas
    if (this.nodes.length === 0) {
      return this.issues;
    }
    
    // Core BPMN validation rules
    this.validateProcessStructure();
    this.validateStartEvents();
    this.validateEndEvents();
    this.validateGateways();
    this.validateConnectivity();
    this.validateBestPractices();

    return this.issues;
  }

  private validateProcessStructure(): void {
    const startEvents = this.getEventNodes('start');
    const endEvents = this.getEventNodes('end');

    // Every process should have at least one start event
    if (startEvents.length === 0) {
      this.addIssue({
        type: 'error',
        message: 'Process must have at least one Start Event',
        category: 'structure'
      });
    }

    // Every process should have at least one end event
    if (endEvents.length === 0) {
      this.addIssue({
        type: 'error',
        message: 'Process must have at least one End Event',
        category: 'structure'
      });
    }

    // Warn about multiple start events (valid but uncommon)
    if (startEvents.length > 1) {
      this.addIssue({
        type: 'warning',
        message: `Process has ${startEvents.length} Start Events. Consider if this is intentional.`,
        category: 'best-practice'
      });
    }
  }

  private validateStartEvents(): void {
    const startEvents = this.getEventNodes('start');
    
    startEvents.forEach(event => {
      const outgoingEdges = this.getOutgoingEdges(event.id);
      const incomingEdges = this.getIncomingEdges(event.id);

      // Start events should not have incoming sequence flows
      if (incomingEdges.length > 0) {
        this.addIssue({
          type: 'error',
          message: 'Start Event cannot have incoming sequence flows',
          nodeId: event.id,
          category: 'bpmn-compliance'
        });
      }

      // Start events should have at least one outgoing flow
      if (outgoingEdges.length === 0) {
        this.addIssue({
          type: 'error',
          message: 'Start Event must have at least one outgoing sequence flow',
          nodeId: event.id,
          category: 'structure'
        });
      }
    });
  }

  private validateEndEvents(): void {
    const endEvents = this.getEventNodes('end');
    
    endEvents.forEach(event => {
      const outgoingEdges = this.getOutgoingEdges(event.id);
      const incomingEdges = this.getIncomingEdges(event.id);

      // End events should not have outgoing sequence flows
      if (outgoingEdges.length > 0) {
        this.addIssue({
          type: 'error',
          message: 'End Event cannot have outgoing sequence flows',
          nodeId: event.id,
          category: 'bpmn-compliance'
        });
      }

      // End events should have at least one incoming flow
      if (incomingEdges.length === 0) {
        this.addIssue({
          type: 'warning',
          message: 'End Event has no incoming sequence flows - unreachable',
          nodeId: event.id,
          category: 'structure'
        });
      }
    });
  }

  private validateGateways(): void {
    const gateways = this.getGatewayNodes();
    
    gateways.forEach(gateway => {
      const outgoingEdges = this.getOutgoingEdges(gateway.id);
      const incomingEdges = this.getIncomingEdges(gateway.id);
      const gatewayData = gateway.data as GatewayNodeData;

      // Gateways should have at least one incoming and one outgoing flow
      if (incomingEdges.length === 0) {
        this.addIssue({
          type: 'warning',
          message: `${gatewayData.gatewayType} Gateway has no incoming flows`,
          nodeId: gateway.id,
          category: 'structure'
        });
      }

      if (outgoingEdges.length === 0) {
        this.addIssue({
          type: 'warning',
          message: `${gatewayData.gatewayType} Gateway has no outgoing flows`,
          nodeId: gateway.id,
          category: 'structure'
        });
      }

      // Exclusive and Inclusive gateways with multiple outgoing flows should have conditions
      if ((gatewayData.gatewayType === 'exclusive' || gatewayData.gatewayType === 'inclusive') && outgoingEdges.length > 1) {
        const edgesWithoutConditions = outgoingEdges.filter(edge => !edge.data?.condition || edge.data.condition.trim() === '');
        
        if (edgesWithoutConditions.length === outgoingEdges.length) {
          this.addIssue({
            type: 'warning',
            message: `${gatewayData.gatewayType} Gateway should have conditions on outgoing flows`,
            nodeId: gateway.id,
            category: 'best-practice'
          });
        }

        // For exclusive gateways, should have one default flow
        if (gatewayData.gatewayType === 'exclusive' && edgesWithoutConditions.length === 0) {
          this.addIssue({
            type: 'info',
            message: 'Consider marking one outgoing flow as default for Exclusive Gateway',
            nodeId: gateway.id,
            category: 'best-practice'
          });
        }
      }

      // Parallel gateways should not have conditions on outgoing flows
      if (gatewayData.gatewayType === 'parallel') {
        const edgesWithConditions = outgoingEdges.filter(edge => edge.data?.condition && edge.data.condition.trim() !== '');
        if (edgesWithConditions.length > 0) {
          this.addIssue({
            type: 'warning',
            message: 'Parallel Gateway should not have conditions on outgoing flows',
            nodeId: gateway.id,
            category: 'bpmn-compliance'
          });
        }
      }
    });
  }

  private validateConnectivity(): void {
    // Check for orphaned nodes (no connections)
    this.nodes.forEach(node => {
      const incomingEdges = this.getIncomingEdges(node.id);
      const outgoingEdges = this.getOutgoingEdges(node.id);
      const nodeData = node.data;

      // Only validate BPMN elements, skip non-BPMN nodes
      if (!['event', 'process', 'gateway'].includes(nodeData.nodeType)) {
        return;
      }

      // Skip start events for incoming check, end events for outgoing check
      const isStartEvent = nodeData.nodeType === 'event' && (nodeData as EventNodeData).eventType === 'start';
      const isEndEvent = nodeData.nodeType === 'event' && (nodeData as EventNodeData).eventType === 'end';

      // Get label safely
      const label = 'label' in nodeData ? nodeData.label : 'Unnamed';

      if (!isStartEvent && incomingEdges.length === 0) {
        this.addIssue({
          type: 'warning',
          message: `${nodeData.nodeType} "${label}" has no incoming connections`,
          nodeId: node.id,
          category: 'structure'
        });
      }

      if (!isEndEvent && outgoingEdges.length === 0) {
        this.addIssue({
          type: 'warning',
          message: `${nodeData.nodeType} "${label}" has no outgoing connections`,
          nodeId: node.id,
          category: 'structure'
        });
      }
    });
  }

  private validateBestPractices(): void {
    // Check for empty labels
    this.nodes.forEach(node => {
      // Only validate BPMN elements
      if (!['event', 'process', 'gateway'].includes(node.data.nodeType)) {
        return;
      }

      const label = 'label' in node.data ? node.data.label : '';
      if (!label || label.trim() === '') {
        this.addIssue({
          type: 'info',
          message: `${node.data.nodeType} should have a descriptive label`,
          nodeId: node.id,
          category: 'best-practice'
        });
      }
    });

    // Check for very long process paths (complexity warning)
    const processNodes = this.getProcessNodes();
    if (processNodes.length > 20) {
      this.addIssue({
        type: 'info',
        message: `Process has ${processNodes.length} tasks. Consider breaking into sub-processes for better readability.`,
        category: 'best-practice'
      });
    }
  }

  // Helper methods
  private getEventNodes(eventType?: 'start' | 'intermediate' | 'end'): Node<EventNodeData>[] {
    return this.nodes.filter(node => {
      const nodeData = node.data;
      return nodeData.nodeType === 'event' && 
             (!eventType || (nodeData as EventNodeData).eventType === eventType);
    }) as Node<EventNodeData>[];
  }

  private getGatewayNodes(): Node<GatewayNodeData>[] {
    return this.nodes.filter(node => node.data.nodeType === 'gateway') as Node<GatewayNodeData>[];
  }

  private getProcessNodes(): Node<ProcessNodeData>[] {
    return this.nodes.filter(node => node.data.nodeType === 'process') as Node<ProcessNodeData>[];
  }

  private getIncomingEdges(nodeId: string): Edge[] {
    return this.edges.filter(edge => edge.target === nodeId);
  }

  private getOutgoingEdges(nodeId: string): Edge[] {
    return this.edges.filter(edge => edge.source === nodeId);
  }

  private addIssue(issue: Omit<ValidationIssue, 'id'>): void {
    this.issues.push({
      ...issue,
      id: `validation-${this.issues.length + 1}`
    });
  }
}

// Convenience function for easy validation
export function validateProcess(nodes: Node<DiagramNodeData>[], edges: Edge[]): ValidationIssue[] {
  const validator = new ProcessValidator(nodes, edges);
  return validator.validate();
}