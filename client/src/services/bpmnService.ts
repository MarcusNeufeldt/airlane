import { Node, Edge } from 'reactflow';

// BPMN Element type mappings
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const BPMN_TO_INTERNAL_TYPE: Record<string, string> = {
  'startEvent': 'event',
  'endEvent': 'event',
  'intermediateThrowEvent': 'event',
  'intermediateCatchEvent': 'event',
  'userTask': 'process',
  'serviceTask': 'process',
  'scriptTask': 'process',
  'sendTask': 'process',
  'receiveTask': 'process',
  'manualTask': 'process',
  'businessRuleTask': 'process',
  'exclusiveGateway': 'gateway',
  'parallelGateway': 'gateway',
  'inclusiveGateway': 'gateway',
  'eventBasedGateway': 'gateway',
  'complexGateway': 'gateway',
  'lane': 'lane',
  'participant': 'pool',
  'dataObjectReference': 'data-object',
  'dataStoreReference': 'data-object',
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const INTERNAL_TO_BPMN_TYPE: Record<string, string> = {
  'event-start': 'startEvent',
  'event-end': 'endEvent',
  'event-intermediate': 'intermediateThrowEvent',
  'process-user': 'userTask',
  'process-service': 'serviceTask',
  'process-script': 'scriptTask',
  'process-send': 'sendTask',
  'process-receive': 'receiveTask',
  'process-manual': 'manualTask',
  'process-business-rule': 'businessRuleTask',
  'gateway-exclusive': 'exclusiveGateway',
  'gateway-parallel': 'parallelGateway',
  'gateway-inclusive': 'inclusiveGateway',
  'gateway-event-based': 'eventBasedGateway',
  'gateway-complex': 'complexGateway',
  'lane': 'lane',
  'pool': 'participant',
  'data-object': 'dataObjectReference',
};

// Helper function to determine event type
function getEventType(element: Element): 'start' | 'intermediate' | 'end' {
  const tagName = element.tagName.toLowerCase();
  if (tagName.includes('start')) return 'start';
  if (tagName.includes('end')) return 'end';
  return 'intermediate';
}

// Helper function to determine task type
function getTaskType(element: Element): string {
  const tagName = element.tagName.toLowerCase();
  if (tagName.includes('user')) return 'user';
  if (tagName.includes('service')) return 'service';
  if (tagName.includes('script')) return 'script';
  if (tagName.includes('send')) return 'send';
  if (tagName.includes('receive')) return 'receive';
  if (tagName.includes('manual')) return 'manual';
  if (tagName.includes('businessrule')) return 'business-rule';
  return 'user';
}

// Helper function to generate lane colors
function generateLaneColor(index: number): string {
  // CHANGE: Use a more professional, muted color palette
  const colors = [
    '#f5f5f5', // Light Gray
    '#e3f2fd', // Faint Blue
    '#e8eaf6', // Faint Indigo
    '#e0f2f1', // Faint Teal
    '#f1f8e9', // Faint Green
    '#fffde7', // Faint Yellow
  ];
  return colors[index % colors.length];
}

// Helper function to generate pool colors  
function generatePoolColor(index: number): string {
  const colors = [
    '#1F2937', // gray-800
    '#374151', // gray-700
    '#4B5563', // gray-600
    '#6B7280', // gray-500
  ];
  return colors[index % colors.length];
}

// Helper function to determine gateway type
function getGatewayType(element: Element): string {
  const tagName = element.tagName.toLowerCase();
  if (tagName.includes('exclusive')) return 'exclusive';
  if (tagName.includes('parallel')) return 'parallel';
  if (tagName.includes('inclusive')) return 'inclusive';
  if (tagName.includes('eventbased')) return 'event-based';
  if (tagName.includes('complex')) return 'complex';
  return 'exclusive';
}

export class BPMNService {
  /**
   * Import BPMN XML and convert to React Flow nodes and edges
   */
  static async importBPMN(xmlContent: string): Promise<{ nodes: Node[], edges: Edge[] }> {
    // Clean up the XML content - replace literal \n with actual newlines
    const cleanedXml = xmlContent.replace(/\\n/g, '\n').trim();
    
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(cleanedXml, 'text/xml');
    
    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Invalid XML: ' + parserError.textContent);
    }
    
    // Check if we have a valid BPMN document
    const definitions = xmlDoc.querySelector('definitions');
    if (!definitions) {
      throw new Error('Invalid BPMN: No definitions element found');
    }

    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    // Get the process element
    const process = xmlDoc.querySelector('process');
    if (!process) {
      // CHANGE 1: Find process within a participant if it's not top-level
      const participant = xmlDoc.querySelector('participant');
      const processId = participant?.getAttribute('processRef');
      if (!processId || !xmlDoc.querySelector(`process[id="${processId}"]`)) {
        throw new Error('No process element found in BPMN file');
      }
    }

    // Get diagram information for positions - handle both namespaced and non-namespaced elements
    const shapes = xmlDoc.querySelectorAll('bpmndi\\:BPMNShape, BPMNShape');
    // CHANGE 2: The map will now store the full bounds object
    const shapePositions = new Map<string, { x: number, y: number, width: number, height: number }>();
    
    console.log(`Found ${shapes.length} shape definitions`);
    
    shapes.forEach((shape, index) => {
      const elementId = shape.getAttribute('bpmnElement');
      const bounds = shape.querySelector('omgdc\\:Bounds, Bounds');
      if (elementId && bounds) {
        const x = parseFloat(bounds.getAttribute('x') || '0');
        const y = parseFloat(bounds.getAttribute('y') || '0');
        // CHANGE 3: Extract and store width and height
        const width = parseFloat(bounds.getAttribute('width') || '100');
        const height = parseFloat(bounds.getAttribute('height') || '80');
        console.log(`Shape ${index}: ${elementId} at (${x}, ${y}) with size (${width}x${height})`);
        shapePositions.set(elementId, { x, y, width, height });
      }
    });
    
    console.log(`Extracted ${shapePositions.size} positions from diagram`);

    // Extract lane and pool information
    const lanes = new Map<string, { name: string, color: string, poolId?: string }>();
    const pools = new Map<string, { name: string, color: string, lanes: string[] }>();
    const elementLaneMap = new Map<string, string>(); // elementId -> laneId
    
    // Look for collaboration and pools first
    const collaboration = xmlDoc.querySelector('collaboration');
    const poolToLanesMap = new Map<string, string[]>();
    
    // Look for lanes in all processes (handle multiple processes)
    const allProcesses = xmlDoc.querySelectorAll('process');
    
    // First, find which process belongs to which pool
    const processToPoolMap = new Map<string, string>();
    if (collaboration) {
      const participants = collaboration.querySelectorAll('participant');
      participants.forEach(participant => {
        const poolId = participant.getAttribute('id');
        const processRef = participant.getAttribute('processRef');
        if (poolId && processRef) {
          processToPoolMap.set(processRef, poolId);
        }
      });
    }
    
    allProcesses.forEach(proc => {
      const processId = proc.getAttribute('id');
      const poolId = processId ? processToPoolMap.get(processId) : null;
      
      const laneElements = proc.querySelectorAll('lane');
      console.log(`🔍 Found ${laneElements.length} lane elements in process ${proc.id || 'unnamed'}`);
      
      laneElements.forEach((lane, index) => {
        const laneId = lane.getAttribute('id') || `lane_${index}`;
        const laneName = (lane.getAttribute('name') || `Lane ${index + 1}`).replace(/&#10;/g, '\n');
        const color = generateLaneColor(index);
        lanes.set(laneId, { name: laneName, color, poolId: poolId || undefined });
        
        // Track which lanes belong to which pool
        if (poolId && poolToLanesMap.has(poolId)) {
          poolToLanesMap.get(poolId)?.push(laneId);
        }
        
        console.log(`🏊 Lane ${index}: ${laneId} (${laneName}) - color: ${color}, pool: ${poolId || 'none'}`);
        
        // Map flow nodes to this lane
        const flowNodeRefs = lane.querySelectorAll('flowNodeRef');
        console.log(`   Found ${flowNodeRefs.length} flowNodeRefs in lane ${laneId}`);
        
        flowNodeRefs.forEach(ref => {
          const elementId = ref.textContent?.trim();
          if (elementId) {
            elementLaneMap.set(elementId, laneId);
            console.log(`   📋 Mapped ${elementId} → ${laneId}`);
          }
        });
      });
    });
    
    // Process pools (participants) in collaboration
    if (collaboration) {
      const participants = collaboration.querySelectorAll('participant');
      participants.forEach((participant, index) => {
        const poolId = participant.getAttribute('id') || `pool_${index}`;
        const poolName = (participant.getAttribute('name') || `Pool ${index + 1}`).replace(/&#10;/g, '\n');
        const color = generatePoolColor(index);
        pools.set(poolId, { name: poolName, color, lanes: [] });
        poolToLanesMap.set(poolId, []);
      });
    }
    
    // Create unified pool-with-lanes nodes
    poolToLanesMap.forEach((laneIds, poolId) => {
      const poolInfo = pools.get(poolId);
      const positionData = shapePositions.get(poolId) || { x: 50, y: 50, width: 600, height: 400 };
      
      // Collect lane information
      const poolLanes = laneIds.map((laneId, index) => {
        const laneInfo = lanes.get(laneId);
        const lanePosition = shapePositions.get(laneId);
        return {
          id: laneId,
          name: laneInfo?.name || `Lane ${index + 1}`,
          height: lanePosition?.height || 120,
          color: laneInfo?.color || generateLaneColor(index)
        };
      });
      
      // Create the unified pool-with-lanes node
      nodes.push({
        id: poolId,
        type: 'pool-with-lanes',
        position: { x: positionData.x, y: positionData.y },
        data: {
          id: poolId,
          label: poolInfo?.name || 'Pool',
          participant: poolInfo?.name || 'Pool',
          lanes: poolLanes,
          width: positionData.width,
          height: positionData.height,
          nodeType: 'pool-with-lanes' as const
        },
        zIndex: -20,
      });
    });
    
    // For pools without lanes, create simple pool nodes
    pools.forEach((poolInfo, poolId) => {
      if (!poolToLanesMap.has(poolId) || poolToLanesMap.get(poolId)?.length === 0) {
        const positionData = shapePositions.get(poolId) || { x: 50, y: 50, width: 600, height: 400 };
        nodes.push({
          id: poolId,
          type: 'pool-with-lanes',
          position: { x: positionData.x, y: positionData.y },
          data: {
            id: poolId,
            label: poolInfo.name,
            participant: poolInfo.name,
            lanes: [],
            width: positionData.width,
            height: positionData.height,
            nodeType: 'pool-with-lanes' as const
          },
          zIndex: -20,
        });
      }
    });
    
    console.log(`Found ${lanes.size} lanes and ${pools.size} pools`);
    console.log('Lane assignments:', Array.from(elementLaneMap.entries()));

    // Process all BPMN elements from all processes
    const elementsToProcess: Element[] = [];
    allProcesses.forEach(p => elementsToProcess.push(...Array.from(p.children)));
    
    for (let i = 0; i < elementsToProcess.length; i++) {
      const element = elementsToProcess[i];
      const tagName = element.tagName.toLowerCase();
      const id = element.getAttribute('id') || `element_${i}`;
      const name = (element.getAttribute('name') || '').replace(/&#10;/g, '\n');
      
      // Skip sequence flows and lanes (we'll process them separately)
      if (tagName === 'sequenceflow' || tagName === 'lane' || tagName === 'laneset') continue;
      
      // Get position and dimensions from diagram
      const positionData = shapePositions.get(id) || { x: 100 + (i * 150), y: 200, width: 100, height: 80 };
      const position = { x: positionData.x, y: positionData.y };
      console.log(`Node ${id}: position(${position.x}, ${position.y}) - ${shapePositions.has(id) ? 'from diagram' : 'fallback'}`);
      
      // Check if element is assigned to a lane
      const assignedLaneId = elementLaneMap.get(id);
      const laneInfo = assignedLaneId ? lanes.get(assignedLaneId) : null;
      const poolId = laneInfo?.poolId;
      
      if (assignedLaneId) {
        console.log(`🎯 Element ${id} assigned to lane ${assignedLaneId} (${laneInfo?.name}) in pool ${poolId || 'none'}`);
      } else {
        console.log(`❌ Element ${id} not assigned to any lane`);
      }
      
      // Determine node type based on BPMN element type
      let nodeType = '';
      let nodeData: any = {
        label: name || id,
        laneId: assignedLaneId,
        laneName: laneInfo?.name,
        laneColor: laneInfo?.color,
      };
      
      if (tagName.includes('event')) {
        nodeType = 'event';
        nodeData.eventType = getEventType(element);
        
        // Check for message events
        if (element.querySelector('messageEventDefinition')) {
          nodeData.eventSubType = 'message';
        } else if (element.querySelector('timerEventDefinition')) {
          nodeData.eventSubType = 'timer';
        } else if (element.querySelector('errorEventDefinition')) {
          nodeData.eventSubType = 'error';
        }
      } else if (tagName.includes('task')) {
        nodeType = 'process';
        nodeData.processType = 'task';
        nodeData.taskType = getTaskType(element);
        
        // Check for documentation
        const documentation = element.querySelector('documentation');
        if (documentation) {
          nodeData.description = documentation.textContent?.trim();
        }
      } else if (tagName.includes('gateway')) {
        nodeType = 'gateway';
        nodeData.gatewayType = getGatewayType(element);

      } else if (tagName.includes('dataobject')) {
        nodeType = 'data-object';
        nodeData.dataType = 'input';
      }
      
      if (nodeType) {
        const elementNode: any = {
          id,
          type: nodeType,
          position,
          data: nodeData,
          // All flow elements on top
          zIndex: 0,
        };
        
        // Assign element to its pool if it has a lane
        if (poolId) {
          elementNode.parentNode = poolId;
          elementNode.extent = 'parent'; // Constrain element within its pool
          console.log(`🔗 Element ${id} assigned to parent pool ${poolId} via lane ${assignedLaneId}`);
        }
        
        nodes.push(elementNode);
      }
    }
    
    // Process sequence flows as edges from all processes
    const allSequenceFlows: Element[] = [];
    allProcesses.forEach(p => allSequenceFlows.push(...Array.from(p.querySelectorAll('sequenceFlow'))));
    console.log(`Found ${allSequenceFlows.length} sequence flows`);
    allSequenceFlows.forEach((flow, index) => {
      const id = flow.getAttribute('id') || `flow_${index}`;
      const source = flow.getAttribute('sourceRef');
      const target = flow.getAttribute('targetRef');
      const name = flow.getAttribute('name') || '';
      
      console.log(`Flow ${index}: ${id}, ${source} -> ${target}, name: "${name}"`);
      
      if (source && target) {
        const edgeData: any = {
          label: name,
        };
        
        // Check for condition
        const condition = flow.querySelector('conditionExpression');
        if (condition && condition.textContent && condition.textContent.trim() !== 'None') {
          edgeData.condition = condition.textContent.trim();
        }
        
        // Determine correct handle IDs based on node types
        const sourceNode = nodes.find(n => n.id === source);
        const targetNode = nodes.find(n => n.id === target);
        
        let sourceHandle = 'output-right';
        let targetHandle = 'input-left';
        
        // Handle event nodes with specific handle naming
        if (sourceNode?.type === 'event') {
          const eventData = sourceNode.data as any;
          if (eventData.eventType === 'start') {
            sourceHandle = 'start-right';
          } else if (eventData.eventType === 'intermediate') {
            sourceHandle = 'inter-output';
          }
        }
        
        if (targetNode?.type === 'event') {
          const eventData = targetNode.data as any;
          if (eventData.eventType === 'end') {
            targetHandle = 'end-left';
          } else if (eventData.eventType === 'intermediate') {
            targetHandle = 'inter-input';
          }
        }
        
        console.log(`  Using handles: ${sourceHandle} -> ${targetHandle}`);

        edges.push({
          id,
          source,
          target,
          sourceHandle,
          targetHandle,
          type: 'sequence-flow',
          data: edgeData,
        });
      }
    });
    
    // Process message flows if any
    const messageFlows = xmlDoc.querySelectorAll('messageFlow');
    messageFlows.forEach((flow, index) => {
      const id = flow.getAttribute('id') || `msgflow_${index}`;
      const source = flow.getAttribute('sourceRef');
      const target = flow.getAttribute('targetRef');
      const name = flow.getAttribute('name') || '';
      
      if (source && target) {
        edges.push({
          id,
          source,
          target,
          sourceHandle: 'output-right',
          targetHandle: 'input-left',
          type: 'message-flow',
          data: { label: name, messageType: name },
        });
      }
    });
    
    console.log(`Import complete: ${nodes.length} nodes, ${edges.length} edges`);
    console.log('Nodes:', nodes.map(n => `${n.id}(${n.type})`));
    console.log('Edges:', edges.map(e => `${e.source}->${e.target}`));
    
    return { nodes, edges };
  }

  /**
   * Export React Flow nodes and edges to BPMN XML
   */
  static exportBPMN(nodes: Node[], edges: Edge[], processName: string = 'Process'): string {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const timestamp = new Date().toISOString();
    
    // Start building the XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
             xmlns:omgdc="http://www.omg.org/spec/DD/20100524/DC"
             xmlns:omgdi="http://www.omg.org/spec/DD/20100524/DI"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xmlns:signavio="http://www.signavio.com"
             id="definitions_${Date.now()}"
             targetNamespace="http://bpmn.io/schema/bpmn"
             exporter="Signavio Process Pipeline Creator"
             exporterVersion="1.0.0">
  
  <process id="process_${Date.now()}" name="${processName}" isExecutable="false">
`;

    // Add lanes and pools first
    const lanes = nodes.filter(n => n.type === 'lane');
    const pools = nodes.filter(n => n.type === 'pool');
    
    if (pools.length > 0) {
      pools.forEach(pool => {
        xml += `    <participant id="${pool.id}" name="${pool.data.label || pool.id}" processRef="process_${Date.now()}" />
`;
      });
    }
    
    if (lanes.length > 0) {
      xml += '    <laneSet>\n';
      lanes.forEach(lane => {
        xml += `      <lane id="${lane.id}" name="${lane.data.label || lane.id}">
`;
        // Add flow node refs for nodes in this lane (simplified - would need proper lane assignment logic)
        xml += '      </lane>\n';
      });
      xml += '    </laneSet>\n';
    }
    
    // Process other nodes
    nodes.forEach(node => {
      if (node.type === 'lane' || node.type === 'pool') return;
      
      const nodeId = node.id;
      const label = node.data.label || nodeId;
      
      // Get outgoing edges
      const outgoing = edges.filter(e => e.source === nodeId);
      const incoming = edges.filter(e => e.target === nodeId);
      
      switch (node.type) {
        case 'event':
          const eventType = node.data.eventType || 'start';
          const eventTag = eventType === 'start' ? 'startEvent' : 
                          eventType === 'end' ? 'endEvent' : 
                          'intermediateThrowEvent';
          
          xml += `    <${eventTag} id="${nodeId}" name="${label}">
`;
          
          // Add Signavio metadata
          xml += `      <extensionElements>
        <signavio:signavioMetaData metaKey="bgcolor" metaValue="#ffffff" />
        <signavio:signavioMetaData metaKey="bordercolor" metaValue="#000000" />
      </extensionElements>
`;
          
          // Add flows
          incoming.forEach(edge => {
            xml += `      <incoming>${edge.id}</incoming>
`;
          });
          outgoing.forEach(edge => {
            xml += `      <outgoing>${edge.id}</outgoing>
`;
          });
          
          // Add event definition if needed
          if (node.data.eventSubType === 'message') {
            xml += `      <messageEventDefinition id="msgDef_${nodeId}" />
`;
          } else if (node.data.eventSubType === 'timer') {
            xml += `      <timerEventDefinition id="timerDef_${nodeId}" />
`;
          }
          
          xml += `    </${eventTag}>
`;
          break;
          
        case 'process':
          const taskType = node.data.taskType || 'user';
          const taskTag = taskType === 'user' ? 'userTask' :
                         taskType === 'service' ? 'serviceTask' :
                         taskType === 'script' ? 'scriptTask' :
                         taskType === 'send' ? 'sendTask' :
                         taskType === 'receive' ? 'receiveTask' :
                         taskType === 'manual' ? 'manualTask' :
                         taskType === 'business-rule' ? 'businessRuleTask' :
                         'task';
          
          xml += `    <${taskTag} id="${nodeId}" name="${label}" implementation="##unspecified">
`;
          
          // Add documentation if present
          if (node.data.description) {
            xml += `      <documentation><![CDATA[${node.data.description}]]></documentation>
`;
          }
          
          // Add Signavio metadata
          xml += `      <extensionElements>
        <signavio:signavioMetaData metaKey="bgcolor" metaValue="#FFFFFF" />
        <signavio:signavioMetaData metaKey="bordercolor" metaValue="#000000" />
      </extensionElements>
`;
          
          // Add flows
          incoming.forEach(edge => {
            xml += `      <incoming>${edge.id}</incoming>
`;
          });
          outgoing.forEach(edge => {
            xml += `      <outgoing>${edge.id}</outgoing>
`;
          });
          
          xml += `    </${taskTag}>
`;
          break;
          
        case 'gateway':
          const gatewayType = node.data.gatewayType || 'exclusive';
          const gatewayTag = gatewayType === 'exclusive' ? 'exclusiveGateway' :
                            gatewayType === 'parallel' ? 'parallelGateway' :
                            gatewayType === 'inclusive' ? 'inclusiveGateway' :
                            gatewayType === 'event-based' ? 'eventBasedGateway' :
                            gatewayType === 'complex' ? 'complexGateway' :
                            'exclusiveGateway';
          
          xml += `    <${gatewayTag} id="${nodeId}" name="${label}" gatewayDirection="Diverging">
`;
          
          // Add Signavio metadata
          xml += `      <extensionElements>
        <signavio:signavioMetaData metaKey="bgcolor" metaValue="#ffffff" />
        <signavio:signavioMetaData metaKey="bordercolor" metaValue="#000000" />
      </extensionElements>
`;
          
          // Add flows
          incoming.forEach(edge => {
            xml += `      <incoming>${edge.id}</incoming>
`;
          });
          outgoing.forEach(edge => {
            xml += `      <outgoing>${edge.id}</outgoing>
`;
          });
          
          xml += `    </${gatewayTag}>
`;
          break;
          
        case 'data-object':
          xml += `    <dataObjectReference id="${nodeId}" name="${label}" dataObjectRef="dataObj_${nodeId}" />
    <dataObject id="dataObj_${nodeId}" />
`;
          break;
      }
    });
    
    // Add sequence flows
    edges.forEach(edge => {
      if (edge.type === 'message-flow') return; // Handle message flows separately
      
      const label = edge.data?.label || '';
      const condition = edge.data?.condition || '';
      
      xml += `    <sequenceFlow id="${edge.id}" name="${label}" sourceRef="${edge.source}" targetRef="${edge.target}">
`;
      
      // Add Signavio metadata
      xml += `      <extensionElements>
        <signavio:signavioMetaData metaKey="bordercolor" metaValue="#000000" />
      </extensionElements>
`;
      
      // Add condition if present
      if (condition) {
        xml += `      <conditionExpression xsi:type="tFormalExpression"><![CDATA[${condition}]]></conditionExpression>
`;
      }
      
      xml += `    </sequenceFlow>
`;
    });
    
    xml += '  </process>\n';
    
    // Add collaboration for message flows
    const messageFlows = edges.filter(e => e.type === 'message-flow');
    if (messageFlows.length > 0) {
      xml += `  <collaboration id="collaboration_${Date.now()}">
`;
      
      // Add participants
      if (pools.length > 0) {
        pools.forEach(pool => {
          xml += `    <participant id="${pool.id}_ref" processRef="process_${Date.now()}" />
`;
        });
      }
      
      // Add message flows
      messageFlows.forEach(flow => {
        xml += `    <messageFlow id="${flow.id}" name="${flow.data?.label || ''}" sourceRef="${flow.source}" targetRef="${flow.target}" />
`;
      });
      
      xml += '  </collaboration>\n';
    }
    
    // Add BPMN diagram information
    xml += `  <bpmndi:BPMNDiagram id="diagram_${Date.now()}">
    <bpmndi:BPMNPlane id="plane_${Date.now()}" bpmnElement="process_${Date.now()}">
`;
    
    // Add shapes
    nodes.forEach(node => {
      const width = node.data?.width || (node.type === 'gateway' ? 40 : node.type === 'event' ? 30 : 100);
      const height = node.data?.height || (node.type === 'gateway' ? 40 : node.type === 'event' ? 30 : 80);
      
      xml += `      <bpmndi:BPMNShape id="${node.id}_gui" bpmnElement="${node.id}">
        <omgdc:Bounds x="${Math.round(node.position.x)}" y="${Math.round(node.position.y)}" width="${width}" height="${height}" />
      </bpmndi:BPMNShape>
`;
    });
    
    // Add edges (simplified - would need proper waypoint calculation)
    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        xml += `      <bpmndi:BPMNEdge id="${edge.id}_gui" bpmnElement="${edge.id}">
        <omgdi:waypoint x="${Math.round(sourceNode.position.x + 50)}" y="${Math.round(sourceNode.position.y + 40)}" />
        <omgdi:waypoint x="${Math.round(targetNode.position.x)}" y="${Math.round(targetNode.position.y + 40)}" />
      </bpmndi:BPMNEdge>
`;
      }
    });
    
    xml += `    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</definitions>`;
    
    return xml;
  }
}