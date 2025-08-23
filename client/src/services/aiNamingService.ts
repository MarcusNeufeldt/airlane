import { ProcessModel, ProcessElement } from './aiService';
import { BPMNService } from './bpmnService';
import { useDiagramStore } from '../stores/diagramStore';

const API_BASE_URL = process.env.NODE_ENV === 'production' ? '/api' : (process.env.REACT_APP_API_URL || 'http://localhost:3001');

export interface AINameSuggestion {
  suggestions: string[];
  reasoning: string;
  confidence: number;
  context: string;
}

export interface NodeNamingContext {
  targetNodeId: string;
  currentName: string;
  nodeType: string;
  properties?: any;
  predecessors: ProcessElement[];
  successors: ProcessElement[];
  processContext: string;
  fullProcess: ProcessModel; // Add complete process schema
}

class AINamingService {
  /**
   * Get AI-powered name suggestions for a specific node
   */
  async suggestNodeNames(
    nodeId: string,
    currentProcess: ProcessModel,
    additionalContext?: string,
    nodes?: any[],
    edges?: any[]
  ): Promise<AINameSuggestion> {
    console.log('🏷️ suggestNodeNames called for node:', nodeId);
    
    try {
      // Build context about the node and its surroundings
      const context = this.buildNamingContext(nodeId, currentProcess);
      
      // Generate BPMN XML if nodes and edges are provided
      let bpmnXml = '';
      if (nodes && edges) {
        try {
          bpmnXml = BPMNService.exportBPMN(nodes, edges, 'Current Process');
          console.log('🏷️ Generated BPMN XML for AI context:', bpmnXml.substring(0, 200) + '...');
        } catch (error) {
          console.warn('🏷️ Failed to generate BPMN XML:', error);
        }
      }
      
      console.log('🏷️ Sending context to backend:', context);
      
      const response = await fetch(`${API_BASE_URL}/suggest-node-names`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          context,
          bpmnXml,
          additionalContext: additionalContext || 'Suggest clear, professional BPMN node names'
        }),
      });

      if (!response.ok) {
        console.error('❌ AI naming suggestion failed:', response.status);
        throw new Error(`AI naming suggestion failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ AI naming suggestions received:', data);
      return data.suggestion;
    } catch (error) {
      console.error('❌ Error getting AI naming suggestions:', error);
      
      // Fallback suggestions based on simple heuristics
      return this.getFallbackNameSuggestions(nodeId, currentProcess);
    }
  }

  /**
   * Build comprehensive context about a node for AI analysis
   */
  private buildNamingContext(nodeId: string, currentProcess: ProcessModel): NodeNamingContext {
    const targetNode = currentProcess.elements.find(el => el.id === nodeId);
    
    if (!targetNode) {
      throw new Error(`Node ${nodeId} not found in process`);
    }

    // Find incoming flows (predecessors)
    const incomingFlows = currentProcess.flows.filter(flow => flow.target === nodeId);
    const predecessors = incomingFlows
      .map(flow => currentProcess.elements.find(el => el.id === flow.source))
      .filter(Boolean) as ProcessElement[];

    // Find outgoing flows (successors)
    const outgoingFlows = currentProcess.flows.filter(flow => flow.source === nodeId);
    const successors = outgoingFlows
      .map(flow => currentProcess.elements.find(el => el.id === flow.target))
      .filter(Boolean) as ProcessElement[];

    // Build process context description
    const processContext = this.describeProcessContext(targetNode, predecessors, successors, currentProcess);

    return {
      targetNodeId: nodeId,
      currentName: targetNode.label,
      nodeType: targetNode.type,
      properties: targetNode.properties,
      predecessors,
      successors,
      processContext,
      fullProcess: currentProcess // Include complete process schema
    };
  }

  /**
   * Create a descriptive context about the process flow
   */
  private describeProcessContext(
    targetNode: ProcessElement,
    predecessors: ProcessElement[],
    successors: ProcessElement[],
    currentProcess: ProcessModel
  ): string {
    let context = `The process contains ${currentProcess.elements.length} elements total. `;
    
    // Describe the target node
    context += `The target node "${targetNode.label}" is a ${targetNode.type}`;
    if (targetNode.properties) {
      if (targetNode.properties.eventType) {
        context += ` (${targetNode.properties.eventType} event)`;
      } else if (targetNode.properties.taskType) {
        context += ` (${targetNode.properties.taskType} task)`;
      } else if (targetNode.properties.gatewayType) {
        context += ` (${targetNode.properties.gatewayType} gateway)`;
      }
    }
    context += '. ';

    // Describe predecessors
    if (predecessors.length > 0) {
      context += `It comes after: ${predecessors.map(p => `"${p.label}" (${p.type})`).join(', ')}. `;
    } else {
      context += 'It appears to be a starting element with no predecessors. ';
    }

    // Describe successors
    if (successors.length > 0) {
      context += `It leads to: ${successors.map(s => `"${s.label}" (${s.type})`).join(', ')}. `;
    } else {
      context += 'It appears to be an ending element with no successors. ';
    }

    // Add overall process context
    const startEvents = currentProcess.elements.filter(el => 
      el.type === 'event' && el.properties?.eventType === 'start'
    );
    const endEvents = currentProcess.elements.filter(el => 
      el.type === 'event' && el.properties?.eventType === 'end'
    );
    const tasks = currentProcess.elements.filter(el => el.type === 'process');
    const gateways = currentProcess.elements.filter(el => el.type === 'gateway');

    context += `The overall process has ${startEvents.length} start event(s), ${tasks.length} task(s), ${gateways.length} gateway(s), and ${endEvents.length} end event(s).`;

    return context;
  }

  /**
   * Generate fallback name suggestions when AI is not available
   */
  private getFallbackNameSuggestions(nodeId: string, currentProcess: ProcessModel): AINameSuggestion {
    const targetNode = currentProcess.elements.find(el => el.id === nodeId);
    
    if (!targetNode) {
      return {
        suggestions: ['Process Step', 'Activity', 'Task'],
        reasoning: 'Default suggestions when target node not found',
        confidence: 0.3,
        context: 'Fallback mode - AI service unavailable'
      };
    }

    const context = this.buildNamingContext(nodeId, currentProcess);
    let suggestions: string[] = [];
    let reasoning = '';

    switch (targetNode.type) {
      case 'process':
        suggestions = this.generateTaskNameSuggestions(context);
        reasoning = 'Generated based on task type and process flow context';
        break;
        
      case 'event':
        suggestions = this.generateEventNameSuggestions(context);
        reasoning = 'Generated based on event type and position in process';
        break;
        
      case 'gateway':
        suggestions = this.generateGatewayNameSuggestions(context);
        reasoning = 'Generated based on gateway type and decision logic';
        break;
        
      case 'data-object':
        suggestions = this.generateDataObjectNameSuggestions(context);
        reasoning = 'Generated based on data object type and usage context';
        break;
        
      default:
        suggestions = ['Process Element', 'BPMN Element', 'Workflow Component'];
        reasoning = 'Generic suggestions for unknown element type';
    }

    return {
      suggestions,
      reasoning,
      confidence: 0.6,
      context: 'Fallback heuristic suggestions'
    };
  }

  private generateTaskNameSuggestions(context: NodeNamingContext): string[] {
    const suggestions: string[] = [];
    
    // Based on task type
    if (context.properties?.taskType) {
      switch (context.properties.taskType) {
        case 'user':
          suggestions.push('Review Process', 'Approve Request', 'Complete Form', 'Validate Information');
          break;
        case 'service':
          suggestions.push('Process Data', 'Send Notification', 'Update System', 'Generate Report');
          break;
        case 'manual':
          suggestions.push('Manual Review', 'Physical Inspection', 'Sign Document', 'Collect Materials');
          break;
        case 'script':
          suggestions.push('Run Calculation', 'Process Automation', 'Execute Script', 'Transform Data');
          break;
        default:
          suggestions.push('Process Task', 'Complete Activity', 'Execute Step');
      }
    }

    // Based on predecessors
    if (context.predecessors.length > 0) {
      const prevLabels = context.predecessors.map(p => p.label.toLowerCase());
      if (prevLabels.some(l => l.includes('submit') || l.includes('request'))) {
        suggestions.push('Review Submission', 'Validate Request', 'Process Application');
      }
      if (prevLabels.some(l => l.includes('review') || l.includes('check'))) {
        suggestions.push('Make Decision', 'Approve or Reject', 'Finalize Review');
      }
    }

    // Based on successors
    if (context.successors.length > 0) {
      const nextLabels = context.successors.map(s => s.label.toLowerCase());
      if (nextLabels.some(l => l.includes('gateway') || l.includes('decision'))) {
        suggestions.push('Prepare for Decision', 'Complete Assessment', 'Gather Information');
      }
      if (nextLabels.some(l => l.includes('end') || l.includes('complete'))) {
        suggestions.push('Finalize Process', 'Complete Workflow', 'Close Case');
      }
    }

    return suggestions.slice(0, 4); // Return top 4 suggestions
  }

  private generateEventNameSuggestions(context: NodeNamingContext): string[] {
    const suggestions: string[] = [];
    
    if (context.properties?.eventType === 'start') {
      suggestions.push('Process Started', 'Request Received', 'Workflow Initiated', 'Case Opened');
    } else if (context.properties?.eventType === 'end') {
      suggestions.push('Process Completed', 'Request Fulfilled', 'Workflow Finished', 'Case Closed');
    } else {
      suggestions.push('Status Updated', 'Milestone Reached', 'Timer Expired', 'Signal Received');
    }

    return suggestions;
  }

  private generateGatewayNameSuggestions(context: NodeNamingContext): string[] {
    const suggestions: string[] = [];
    
    if (context.properties?.gatewayType === 'exclusive') {
      suggestions.push('Decision Point', 'Approval Required?', 'Route Selection', 'Condition Check');
    } else if (context.properties?.gatewayType === 'parallel') {
      suggestions.push('Parallel Split', 'Concurrent Processing', 'Multi-track Start', 'Parallel Merge');
    } else if (context.properties?.gatewayType === 'inclusive') {
      suggestions.push('Multiple Options', 'Selective Processing', 'Conditional Paths', 'Option Gateway');
    } else {
      suggestions.push('Process Gateway', 'Flow Control', 'Decision Hub', 'Route Manager');
    }

    return suggestions;
  }

  private generateDataObjectNameSuggestions(context: NodeNamingContext): string[] {
    const suggestions: string[] = [];
    
    if (context.properties?.dataType === 'input') {
      suggestions.push('Input Document', 'Source Data', 'Request Form', 'Initial Information');
    } else if (context.properties?.dataType === 'output') {
      suggestions.push('Final Report', 'Result Document', 'Output Data', 'Generated Report');
    } else if (context.properties?.dataType === 'storage') {
      suggestions.push('Data Repository', 'Information Store', 'Knowledge Base', 'Data Warehouse');
    } else {
      suggestions.push('Process Data', 'Information Object', 'Data Asset', 'Document');
    }

    return suggestions;
  }
}

export const aiNamingService = new AINamingService();
