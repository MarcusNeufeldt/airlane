import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, RefreshCw, RotateCcw, Paperclip, X } from 'lucide-react';
import { aiService, ChatMessage, ProcessModel, DatabaseSchema } from '../services/aiService';
import { useDiagramStore } from '../stores/diagramStore';

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<Array<{file: File, preview: string}>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { 
    nodes, 
    edges, 
    importDiagram,
    flashTable,
    isReadOnly,
    currentDiagramId,
    addStickyNote
  } = useDiagramStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat with greeting message (no backend for now)
  useEffect(() => {
    if (isOpen && currentDiagramId) {
      console.log(`📜 Loading chat history for diagram: ${currentDiagramId}`);
      setIsLoading(true);
      aiService.getChatHistory(currentDiagramId)
        .then(history => {
          console.log(`📜 Loaded ${history.length} chat messages`);
          if (history.length === 0) {
            setMessages([{
              role: 'assistant',
              content: "Hi! I'm Process Modeler AI, your intelligent assistant for this visual BPMN process modeling tool. I can help you create business processes, modify tasks and flows on the canvas, and analyze your process designs. I understand the visual connections between your process elements and will help maintain them as we work together. What process would you like to model today?",
              timestamp: new Date()
            }]);
          } else {
            setMessages(history);
          }
        })
        .catch(err => {
          console.error('❌ Error loading chat history:', err);
          const errorMessage: ChatMessage = {
            role: 'assistant',
            content: `Error loading chat history: ${err.message}. Starting fresh conversation.`,
            timestamp: new Date()
          };
          setMessages([errorMessage]);
        })
        .finally(() => setIsLoading(false));
    } else if (isOpen && !currentDiagramId) {
      setMessages([{
        role: 'assistant',
        content: "Please open a diagram to start chatting with the AI assistant.",
        timestamp: new Date()
      }]);
    }
  }, [isOpen, currentDiagramId]);

  // Convert current diagram to ProcessModel format
  const getCurrentProcess = (): ProcessModel | undefined => {
    if (nodes.length === 0) return undefined;

    const elements = nodes.map(node => {
      const element: any = {
        id: node.id,
        type: node.data.nodeType,
        label: node.data.label || node.data.name || '',
        description: node.data.description,
        position: {
          x: node.position.x,
          y: node.position.y
        },
        properties: {}
      };

      // Add type-specific properties
      if (node.data.nodeType === 'event') {
        element.properties.eventType = node.data.eventType;
      } else if (node.data.nodeType === 'process') {
        element.properties.processType = node.data.processType;
        element.properties.taskType = node.data.taskType;
        element.properties.performer = node.data.performer;
        element.properties.assignee = node.data.assignedLane;
      } else if (node.data.nodeType === 'gateway') {
        element.properties.gatewayType = node.data.gatewayType;
      } else if (node.data.nodeType === 'data-object') {
        element.properties.dataType = node.data.dataType;
        element.properties.state = node.data.state;
      } else if (node.data.nodeType === 'pool') {
        element.properties.participant = node.data.participant;
      } else if (node.data.nodeType === 'lane') {
        element.properties.assignee = node.data.assignee;
      }

      return element;
    });

    const flows = edges.map(edge => {
      const flow: any = {
        id: edge.id,
        type: edge.type === 'foreign-key' ? 'sequence-flow' : edge.type,
        source: edge.source,
        target: edge.target,
        label: edge.data?.label
      };

      // Add flow-specific properties
      if (edge.data?.condition) {
        flow.condition = edge.data.condition;
      }
      if (edge.data?.isDefault) {
        flow.isDefault = edge.data.isDefault;
      }
      if (edge.data?.messageType) {
        flow.messageType = edge.data.messageType;
      }

      return flow;
    });

    return { elements, flows };
  };

  // Legacy method for backward compatibility
  const getCurrentSchema = (): DatabaseSchema | undefined => {
    if (nodes.length === 0) return undefined;

    const tables = nodes.map(node => ({
      name: node.data.name,
      columns: node.data.columns?.map((col: any) => ({
        name: col.name,
        type: col.type,
        isPrimaryKey: col.isPrimaryKey || false,
        isNullable: col.isNullable !== false,
        defaultValue: col.defaultValue,
      })) || [],
    }));

    const relationships = edges.map(edge => {
      // Parse actual column names from edge handles
      let sourceColumn = 'id';
      let targetColumn = 'id';
      
      if (edge.sourceHandle && edge.targetHandle) {
        // Handle format: {tableId}-{columnId}-source/target
        const sourceInfo = edge.sourceHandle.split('-');
        const targetInfo = edge.targetHandle.split('-');
        
        if (sourceInfo.length >= 3 && targetInfo.length >= 3) {
          const sourceColumnId = `${sourceInfo[2]}-${sourceInfo[3]}`;
          const targetColumnId = `${targetInfo[2]}-${targetInfo[3]}`;
          
          // Find actual column names from nodes
          const sourceNode = nodes.find(n => n.id === edge.source);
          const targetNode = nodes.find(n => n.id === edge.target);
          
          if (sourceNode && targetNode) {
            const sourceCol = sourceNode.data.columns?.find((col: any) => col.id === sourceColumnId);
            const targetCol = targetNode.data.columns?.find((col: any) => col.id === targetColumnId);
            
            if (sourceCol) sourceColumn = sourceCol.name;
            if (targetCol) targetColumn = targetCol.name;
          }
        }
      }
      
      // Get table names from nodes instead of edge IDs
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      return {
        sourceTable: sourceNode?.data.name || '',
        sourceColumn: sourceColumn,
        targetTable: targetNode?.data.name || '',
        targetColumn: targetColumn,
        type: edge.data?.cardinality || '1:N',
        onDelete: edge.data?.onDelete || 'CASCADE',
        onUpdate: edge.data?.onUpdate || 'CASCADE',
        name: edge.data?.label,
      };
    });

    return { tables, relationships };
  };

  // Atomic schema update system - replaces setTimeout chains with single state update
  const applySchemaChanges = (newSchema: DatabaseSchema, isModification: boolean = false) => {
    console.log('🔄 applySchemaChanges called:', { 
      isModification, 
      nodeCount: nodes.length, 
      newSchema,
      relationships: newSchema.relationships 
    });
    
    if (!isModification || nodes.length === 0) {
      // If it's a new schema or no existing nodes, do full replacement
      console.log('📋 Using full schema replacement');
      applySchemaToCanvas(newSchema);
      return;
    }

    // Get current schema state
    const currentSchema = getCurrentSchema();
    if (!currentSchema) {
      applySchemaToCanvas(newSchema);
      return;
    }

    console.log('🔄 Performing atomic incremental update');
    console.log('Current schema relationships:', currentSchema.relationships.length);
    console.log('New schema relationships:', newSchema.relationships.length);
    
    // Compute final state atomically
    const finalState = computeFinalSchemaState(currentSchema, newSchema);
    
    console.log('Final state:', {
      nodes: finalState.nodes.length,
      edges: finalState.edges.length,
      affectedTables: finalState.affectedTableIds.length
    });
    
    // Apply all changes in a single atomic update
    importDiagram({ nodes: finalState.nodes, edges: finalState.edges });
    
    // Trigger visual feedback for all affected tables
    finalState.affectedTableIds.forEach(id => {
      // Use the existing flashTable function from the store
      flashTable(id);
    });
  };

  // Helper function to compute final state atomically
  const computeFinalSchemaState = (currentSchema: DatabaseSchema, newSchema: DatabaseSchema) => {
    const currentTables = new Map(currentSchema.tables.map((t: any) => [t.name, t]));
    const currentNodeMap = new Map(nodes.map((n: any) => [n.data.name, n]));
    
    const affectedTableIds: string[] = [];
    const finalNodes: any[] = [];
    const tableNameToId = new Map<string, string>();
    
    // Process all tables: existing, modified, and new
    newSchema.tables.forEach((newTable: any) => {
      const currentTable = currentTables.get(newTable.name);
      const existingNode = currentNodeMap.get(newTable.name);
      
      if (existingNode && currentTable) {
        // Table exists - modify it while preserving existing column IDs
        const modifiedNode = { ...existingNode };
        const existingColumns = new Map(existingNode.data.columns.map((col: any) => [col.name, col]));
        
        modifiedNode.data = {
          ...modifiedNode.data,
          columns: newTable.columns.map((col: any, colIndex: number) => {
            const existingCol = existingColumns.get(col.name);
            if (existingCol) {
              // Preserve existing column ID and references
              return {
                ...existingCol,
                type: col.type,
                isPrimaryKey: col.isPrimaryKey,
                isNullable: col.isNullable,
                defaultValue: col.defaultValue,
                // Keep existing isForeignKey and references
              };
            } else {
              // New column
              return {
                id: `col-${Date.now()}-${Math.random()}`,
                name: col.name,
                type: col.type,
                isPrimaryKey: col.isPrimaryKey,
                isNullable: col.isNullable,
                defaultValue: col.defaultValue,
                isForeignKey: false,
                references: undefined,
              };
            }
          }),
        };
        
        finalNodes.push(modifiedNode);
        tableNameToId.set(newTable.name, modifiedNode.id);
        affectedTableIds.push(modifiedNode.id);
      } else {
        // New table - create it
        const timestamp = Date.now();
        const tableId = `table-${timestamp}-${finalNodes.length}`;
        const newNode = {
          id: tableId,
          type: 'table',
          position: { 
            x: 100 + (finalNodes.length % 3) * 300, 
            y: 100 + Math.floor(finalNodes.length / 3) * 200 
          },
          data: {
            id: tableId,
            name: newTable.name,
            columns: newTable.columns.map((col: any, colIndex: number) => ({
              id: `col-${timestamp}-${colIndex}`,
              name: col.name,
              type: col.type,
              isPrimaryKey: col.isPrimaryKey,
              isNullable: col.isNullable,
              defaultValue: col.defaultValue,
              isForeignKey: false,
              references: undefined,
            })),
            indexes: newTable.indexes || [],
            foreignKeys: [],
          },
        };
        
        finalNodes.push(newNode);
        tableNameToId.set(newTable.name, tableId);
        affectedTableIds.push(tableId);
      }
    });
    
    // Create edges - preserve existing ones and add new ones
    const currentRelationshipKeys = new Set(
      currentSchema.relationships.map((rel: any) => 
        `${rel.sourceTable}.${rel.sourceColumn}->${rel.targetTable}.${rel.targetColumn}`
      )
    );
    
    const newRelationshipKeys = new Set(
      newSchema.relationships.map((rel: any) => 
        `${rel.sourceTable}.${rel.sourceColumn}->${rel.targetTable}.${rel.targetColumn}`
      )
    );
    
    // Start with existing edges for preserved relationships
    const finalEdges: any[] = [];
    
    // Filter existing edges - keep only those that should be preserved
    edges.forEach(edge => {
      if (!edge.sourceHandle || !edge.targetHandle) {
        console.warn('Edge missing handles:', edge.id);
        return;
      }
      
      // Parse edge to get relationship key
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (!sourceNode || !targetNode) {
        console.warn('Edge references missing nodes:', edge.id);
        return;
      }
      
      // Check if both tables still exist in new schema
      const sourceTableExists = newSchema.tables.some(t => t.name === sourceNode.data.name);
      const targetTableExists = newSchema.tables.some(t => t.name === targetNode.data.name);
      
      if (!sourceTableExists || !targetTableExists) {
        console.log(`Removing edge ${edge.id} - table deleted`);
        return;
      }
      
      const sourceInfo = edge.sourceHandle.split('-');
      const targetInfo = edge.targetHandle.split('-');
      
      if (sourceInfo.length < 4 || targetInfo.length < 4) {
        console.warn('Edge handle format invalid:', edge.id);
        return;
      }
      
      const sourceColumnId = `${sourceInfo[2]}-${sourceInfo[3]}`;
      const targetColumnId = `${targetInfo[2]}-${targetInfo[3]}`;
      
      const sourceCol = sourceNode.data.columns.find((col: any) => col.id === sourceColumnId);
      const targetCol = targetNode.data.columns.find((col: any) => col.id === targetColumnId);
      
      if (!sourceCol || !targetCol) {
        console.warn('Edge references missing columns:', edge.id);
        return;
      }
      
      const relationshipKey = `${sourceNode.data.name}.${sourceCol.name}->${targetNode.data.name}.${targetCol.name}`;
      
      if (newRelationshipKeys.has(relationshipKey)) {
        console.log(`Preserving edge: ${relationshipKey}`);
        finalEdges.push(edge);
      } else {
        console.log(`Removing edge: ${relationshipKey} (not in new schema)`);
      }
    });
    
    // Add new relationships
    newSchema.relationships.forEach((rel: any, index: number) => {
      const relationshipKey = `${rel.sourceTable}.${rel.sourceColumn}->${rel.targetTable}.${rel.targetColumn}`;
      
      // Skip if this relationship already exists
      if (currentRelationshipKeys.has(relationshipKey)) {
        return;
      }
      
      const sourceTableId = tableNameToId.get(rel.sourceTable);
      const targetTableId = tableNameToId.get(rel.targetTable);
      
      if (!sourceTableId || !targetTableId) {
        console.warn(`Could not find table IDs for relationship: ${rel.sourceTable} -> ${rel.targetTable}`);
        return;
      }

      // Find source and target columns
      const sourceTable = finalNodes.find(n => n.id === sourceTableId);
      const targetTable = finalNodes.find(n => n.id === targetTableId);
      
      const sourceColumn = sourceTable?.data.columns.find((col: any) => col.name === rel.sourceColumn);
      const targetColumn = targetTable?.data.columns.find((col: any) => col.name === rel.targetColumn);
      
      if (!sourceColumn || !targetColumn) {
        console.warn(`Could not find columns for relationship: ${rel.sourceColumn} -> ${rel.targetColumn}`);
        return;
      }

      // Mark target column as foreign key
      targetColumn.isForeignKey = true;
      targetColumn.references = {
        table: sourceTableId,
        column: sourceColumn.id,
      };

      const newEdge = {
        id: `edge-${Date.now()}-${index}`,
        type: 'foreign-key',
        source: sourceTableId,
        target: targetTableId,
        sourceHandle: `${sourceTableId}-${sourceColumn.id}-source`,
        targetHandle: `${targetTableId}-${targetColumn.id}-target`,
        data: {
          cardinality: rel.type,
          label: rel.name || `fk_${rel.targetTable}_${rel.targetColumn}`,
          onDelete: rel.onDelete || 'CASCADE',
          onUpdate: rel.onUpdate || 'CASCADE',
        },
      };
      
      finalEdges.push(newEdge);
    });
    
    return { nodes: finalNodes, edges: finalEdges, affectedTableIds };
  };

  // Convert DatabaseSchema to diagram format (atomic full replacement)
  const applySchemaToCanvas = (schema: DatabaseSchema) => {
    console.log('📋 applySchemaToCanvas called with schema:', schema);
    
    if (!schema) {
      console.error('❌ applySchemaToCanvas called with undefined schema!');
      return;
    }
    
    if (!schema.tables) {
      console.error('❌ Schema has no tables property!', schema);
      return;
    }
    
    console.log('📋 Schema has relationships:', schema.relationships);
    
    const timestamp = Date.now();
    
    // Create a mapping of table names to node IDs
    const tableNameToId = new Map<string, string>();
    
    const newNodes = schema.tables.map((table, index) => {
      const tableId = `table-${timestamp}-${index}`;
      tableNameToId.set(table.name, tableId);
      
      return {
        id: tableId,
        type: 'table',
        position: { x: 100 + (index % 3) * 300, y: 100 + Math.floor(index / 3) * 200 },
        data: {
          id: tableId,
          name: table.name,
          columns: table.columns.map((col, colIndex) => ({
            id: `col-${timestamp}-${index}-${colIndex}`,
            name: col.name,
            type: col.type,
            isPrimaryKey: col.isPrimaryKey,
            isNullable: col.isNullable,
            defaultValue: col.defaultValue,
            isForeignKey: false, // Will be updated based on relationships
            references: undefined as any, // Will be set for foreign keys
          })),
          indexes: table.indexes || [],
          foreignKeys: [],
        },
      };
    });

    // Create edges from relationships
    console.log('📋 Creating edges from relationships:', schema.relationships);
    const newEdges = schema.relationships.map((rel, index) => {
      const sourceTableId = tableNameToId.get(rel.sourceTable);
      const targetTableId = tableNameToId.get(rel.targetTable);
      
      if (!sourceTableId || !targetTableId) {
        console.warn(`Could not find table IDs for relationship: ${rel.sourceTable} -> ${rel.targetTable}`);
        return null;
      }

      // Find source and target columns
      const sourceTable = newNodes.find(n => n.id === sourceTableId);
      const targetTable = newNodes.find(n => n.id === targetTableId);
      
      const sourceColumn = sourceTable?.data.columns.find((col: any) => col.name === rel.sourceColumn);
      const targetColumn = targetTable?.data.columns.find((col: any) => col.name === rel.targetColumn);
      
      console.log('📋 Column search in applySchemaToCanvas:', {
        relationship: rel,
        sourceTable: sourceTable?.data.name,
        targetTable: targetTable?.data.name,
        sourceColumns: sourceTable?.data.columns.map((c: any) => ({ name: c.name, id: c.id })),
        targetColumns: targetTable?.data.columns.map((c: any) => ({ name: c.name, id: c.id })),
        foundSourceColumn: sourceColumn,
        foundTargetColumn: targetColumn
      });
      
      if (!sourceColumn || !targetColumn) {
        console.warn(`Could not find columns for relationship: ${rel.sourceColumn} -> ${rel.targetColumn}`);
        return null;
      }

      // Mark target column as foreign key
      targetColumn.isForeignKey = true;
      targetColumn.references = {
        table: sourceTableId,
        column: sourceColumn.id,
      };

      const edgeResult = {
        id: `edge-${timestamp}-${index}`,
        type: 'foreign-key',
        source: sourceTableId,
        target: targetTableId,
        sourceHandle: `${sourceTableId}-${sourceColumn.id}-source`,
        targetHandle: `${targetTableId}-${targetColumn.id}-target`,
        data: {
          cardinality: rel.type,
          label: rel.name || `fk_${rel.targetTable}_${rel.targetColumn}`,
          onDelete: rel.onDelete || 'CASCADE',
          onUpdate: rel.onUpdate || 'CASCADE',
        },
      };
      
      console.log('📋 Created edge with handles:', {
        sourceHandle: edgeResult.sourceHandle,
        targetHandle: edgeResult.targetHandle,
        sourceColumnId: sourceColumn.id,
        targetColumnId: targetColumn.id
      });
      
      return edgeResult;
    }).filter((edge): edge is NonNullable<typeof edge> => edge !== null);

    // Apply both nodes and edges atomically in a single update
    console.log('📋 Final newEdges being applied:', newEdges);
    console.log('📋 Edge count:', newEdges.length);
    console.log('📋 Applying atomic update with nodes and edges together');
    
    importDiagram({ nodes: newNodes, edges: newEdges });
  };

  // Apply process changes to the canvas
  const applyProcessChanges = (processModel: ProcessModel, isModification: boolean = false) => {
    console.log('🔄 applyProcessChanges called:', { isModification, nodeCount: nodes.length, processModel });

    if (!isModification || nodes.length === 0) {
      console.log('📋 Performing full process replacement');
      const newNodes = processModel.elements.map((element) => ({
        id: element.id,
        type: element.type as any,
        position: element.position,
        data: {
          id: element.id,
          nodeType: element.type,
          label: element.label,
          description: element.description,
          ...element.properties
        },
      }));
      const newEdges = processModel.flows.map(flow => ({
        id: flow.id,
        type: flow.type,
        source: flow.source,
        target: flow.target,
        data: {
          label: flow.label,
          condition: flow.condition,
          isDefault: flow.isDefault,
          messageType: flow.messageType
        }
      }));
      importDiagram({ nodes: newNodes, edges: newEdges });
      return;
    }

    const currentProcess = getCurrentProcess();
    if (!currentProcess) {
      // Fallback if we can't get current state
      applyProcessChanges(processModel, false);
      return;
    }
    
    console.log('🔄 Performing atomic incremental update for process model');
    const finalState = computeFinalProcessState(currentProcess, processModel);
    
    console.log('✅ Final state computed:', { nodes: finalState.nodes.length, edges: finalState.edges.length, affected: finalState.affectedElementIds.length });
    importDiagram({ nodes: finalState.nodes, edges: finalState.edges });
    finalState.affectedElementIds.forEach(id => {
      flashTable(id);
    });
  };

  const computeFinalProcessState = (currentProcess: ProcessModel, newProcess: ProcessModel) => {
    // Map existing nodes by their label to preserve position and other properties
    const currentNodeMap = new Map(nodes.map((n) => [n.data.label, n]));
    const currentElementsMap = new Map(currentProcess.elements.map(e => [e.label, e]));
    
    const affectedElementIds: string[] = [];
    const finalNodes: any[] = [];
    const elementLabelToId = new Map<string, string>();

    // Process elements from the new AI-generated model
    newProcess.elements.forEach((newElement) => {
      const existingNode = currentNodeMap.get(newElement.label);

      if (existingNode) {
        // This element exists, merge properties but keep position
        console.log(`🔧 Merging element: ${newElement.label}`);
        const modifiedNode = {
          ...existingNode,
          // Update data from AI, but keep existing position
          data: {
            ...existingNode.data,
            ...newElement.properties, // Apply new properties
            label: newElement.label,
            description: newElement.description,
          },
        };
        finalNodes.push(modifiedNode);
        elementLabelToId.set(newElement.label, modifiedNode.id);
        affectedElementIds.push(modifiedNode.id);
      } else {
        // This is a new element, add it with a default position
        console.log(`+ Adding new element: ${newElement.label}`);
        const newNode = {
          id: newElement.id || `node-${Date.now()}-${finalNodes.length}`,
          type: newElement.type,
          position: {
            x: 150 + (finalNodes.length % 4) * 200,
            y: 150 + Math.floor(finalNodes.length / 4) * 150,
          },
          data: {
            id: newElement.id || `node-${Date.now()}-${finalNodes.length}`,
            nodeType: newElement.type,
            label: newElement.label,
            description: newElement.description,
            ...newElement.properties,
          },
        };
        finalNodes.push(newNode);
        elementLabelToId.set(newElement.label, newNode.id);
        affectedElementIds.push(newNode.id);
      }
    });

    // Create sets of flow signatures for easy comparison
    const getFlowKey = (flow: { source: string; target: string; }) => `${flow.source}->${flow.target}`;
    const currentFlowKeys = new Set(currentProcess.flows.map(getFlowKey));
    const newFlowKeys = new Set(newProcess.flows.map(getFlowKey));

    const finalEdges: any[] = [];

    // Preserve existing edges that are still in the new model
    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      if (sourceNode && targetNode) {
        const sourceElement = currentElementsMap.get(sourceNode.data.label);
        const targetElement = currentElementsMap.get(targetNode.data.label);
        if(sourceElement && targetElement){
          const flowKey = getFlowKey({ source: sourceElement.id, target: targetElement.id });
          if (newFlowKeys.has(flowKey)) {
            console.log(`↻ Preserving flow: ${sourceNode.data.label} -> ${targetNode.data.label}`);
            finalEdges.push(edge);
          }
        }
      }
    });

    // Add new flows from the AI model
    newProcess.flows.forEach((newFlow) => {
        const flowKey = getFlowKey(newFlow);
        if (!currentFlowKeys.has(flowKey)) {
            const sourceElement = newProcess.elements.find(e => e.id === newFlow.source);
            const targetElement = newProcess.elements.find(e => e.id === newFlow.target);
            if (sourceElement && targetElement) {
              const sourceNodeId = elementLabelToId.get(sourceElement.label);
              const targetNodeId = elementLabelToId.get(targetElement.label);
              if (sourceNodeId && targetNodeId) {
                console.log(`+ Adding new flow: ${sourceElement.label} -> ${targetElement.label}`);
                const newEdge = {
                  id: newFlow.id || `edge-${Date.now()}-${finalEdges.length}`,
                  type: newFlow.type,
                  source: sourceNodeId,
                  target: targetNodeId,
                  data: {
                    label: newFlow.label,
                    condition: newFlow.condition,
                    isDefault: newFlow.isDefault,
                    messageType: newFlow.messageType,
                  },
                };
                finalEdges.push(newEdge);
              }
            }
        }
    });

    return { nodes: finalNodes, edges: finalEdges, affectedElementIds };
  };

  const handleSendMessage = async () => {
    if ((!inputMessage.trim() && uploadedImages.length === 0) || isLoading || !currentDiagramId) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage + (uploadedImages.length > 0 ? `[${uploadedImages.length} image(s) attached]` : ''),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    const currentInput = inputMessage;
    const currentImages = uploadedImages;
    setInputMessage('');
    setUploadedImages([]);
    setIsLoading(true);

    try {
      const currentProcess = getCurrentProcess();
      const currentSchema = getCurrentSchema();
      console.log('🎯 Sending message to AI via stateful chat:', currentInput);
      console.log('📊 Current process:', currentProcess);
      console.log('📦 Current schema:', currentSchema);
      console.log('📍 Diagram ID:', currentDiagramId);
      console.log('🖼️ Images attached:', currentImages.length);

      const imageDataUrls = await Promise.all(currentImages.map(img => convertImageToBase64(img.file)));

      // This is the key change: use the stateful endpoint
      const response = await aiService.postChatMessage(currentDiagramId, currentInput, currentProcess, currentSchema, imageDataUrls);
      
      console.log('📦 Response from stateful chat:', response);

      if (response.process) {
        console.log('🎨 Process modification detected!');
        const isModification = !!getCurrentProcess();
        applyProcessChanges(response.process, isModification);
      }

      if (response.content) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.content,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      }

    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const executeTool = async (toolCall: any) => {
    const { function: func } = toolCall;
    const args = JSON.parse(func.arguments);

    try {
      switch (func.name) {
        case 'generate_business_process':
          setIsGenerating(true);
          const currentProcess = getCurrentProcess();
          const process = await aiService.generateProcess(args.description, currentProcess);
          applyProcessChanges(process, !!currentProcess);
          
          const successMessage: ChatMessage = {
            role: 'assistant',
            content: `✅ I've generated and applied a new process to your canvas with ${process.elements.length} elements and ${process.flows.length} flows. The process includes: ${process.elements.map(e => e.label).join(', ')}.`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, successMessage]);
          setIsGenerating(false);
          break;

        case 'generate_database_schema':
          setIsGenerating(true);
          const currentSchemaForGeneration = getCurrentSchema();
          const schema = await aiService.generateSchema(args.description, currentSchemaForGeneration);
          applySchemaChanges(schema, !!currentSchemaForGeneration);
          
          const schemaSuccessMessage: ChatMessage = {
            role: 'assistant',
            content: `✅ I've generated and applied a new schema to your canvas with ${schema.tables.length} tables and ${schema.relationships.length} relationships. The schema includes: ${schema.tables.map(t => t.name).join(', ')}.`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, schemaSuccessMessage]);
          setIsGenerating(false);
          break;

        case 'modify_existing_process':
          setIsGenerating(true);
          const existingProcess = getCurrentProcess();
          const modifiedProcess = await aiService.generateProcess(
            `${args.modification_type}: ${args.description}`, 
            existingProcess
          );
          applyProcessChanges(modifiedProcess, true);
          
          const modifyProcessMessage: ChatMessage = {
            role: 'assistant',
            content: `✅ I've modified your process. Changes: ${args.description}`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, modifyProcessMessage]);
          setIsGenerating(false);
          break;

        case 'modify_existing_schema':
          setIsGenerating(true);
          const existingSchema = getCurrentSchema();
          const modifiedSchema = await aiService.generateSchema(
            `${args.modification_type}: ${args.description}`, 
            existingSchema
          );
          applySchemaChanges(modifiedSchema, true);
          
          const modifyMessage: ChatMessage = {
            role: 'assistant',
            content: `✅ I've modified your schema. Changes: ${args.description}`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, modifyMessage]);
          setIsGenerating(false);
          break;

        case 'analyze_current_process':
          const processToAnalyze = getCurrentProcess();
          if (!processToAnalyze) {
            const errorMessage: ChatMessage = {
              role: 'assistant',
              content: 'No process to analyze. Please create some process elements first.',
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
            return;
          }

          const processAnalysis = await aiService.analyzeProcess(processToAnalyze);
          const processAnalysisMessage: ChatMessage = {
            role: 'assistant',
            content: `📊 **Process Analysis (${args.analysis_type}):**\n\n${processAnalysis}`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, processAnalysisMessage]);
          break;

        case 'analyze_current_schema':
          const schemaToAnalyze = getCurrentSchema();
          if (!schemaToAnalyze) {
            const errorMessage: ChatMessage = {
              role: 'assistant',
              content: 'No schema to analyze. Please create some tables first.',
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
            return;
          }

          const analysis = await aiService.analyzeSchema(schemaToAnalyze);
          const analysisMessage: ChatMessage = {
            role: 'assistant',
            content: `📊 **Schema Analysis (${args.analysis_type}):**\n\n${analysis}`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, analysisMessage]);
          break;

        default:
          const unknownMessage: ChatMessage = {
            role: 'assistant',
            content: `Unknown tool: ${func.name}`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, unknownMessage]);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Failed to execute ${func.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsGenerating(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleGenerateSchema = async (prompt: string) => {
    setIsGenerating(true);
    try {
      const currentSchemaForHandle = getCurrentSchema();
      const schema = await aiService.generateSchema(prompt, currentSchemaForHandle);
      
      // Apply the generated schema to the canvas
      applySchemaToCanvas(schema);

      const successMessage: ChatMessage = {
        role: 'assistant',
        content: `✅ I've generated and applied a new schema to your canvas with ${schema.tables.length} tables and ${schema.relationships.length} relationships. The schema includes: ${schema.tables.map(t => t.name).join(', ')}.`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, successMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Failed to generate schema: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleAnalyzeSchema = async () => {
    const currentSchemaForAnalysis = getCurrentSchema();
    if (!currentSchemaForAnalysis) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'No schema to analyze. Please create some tables first.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    setIsLoading(true);
    try {
      const analysis = await aiService.analyzeSchema(currentSchemaForAnalysis);
      
      const analysisMessage: ChatMessage = {
        role: 'assistant',
        content: `📊 **Schema Analysis:**\n\n${analysis}`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, analysisMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Failed to analyze schema: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateProcess = async (prompt: string) => {
    setIsGenerating(true);
    try {
      const currentProcess = getCurrentProcess();
      const process = await aiService.generateProcess(prompt, currentProcess);
      
      // Apply the generated process to the canvas
      applyProcessChanges(process, !!currentProcess);

      const successMessage: ChatMessage = {
        role: 'assistant',
        content: `✅ I've generated and applied a new process to your canvas with ${process.elements.length} elements and ${process.flows.length} flows. The process includes: ${process.elements.map(e => e.label).join(', ')}.`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, successMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Failed to generate process: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnalyzeProcess = async () => {
    const currentProcess = getCurrentProcess();
    if (!currentProcess) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'No process to analyze. Please create some process elements first.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    setIsLoading(true);
    try {
      const analysis = await aiService.analyzeProcess(currentProcess);
      
      const analysisMessage: ChatMessage = {
        role: 'assistant',
        content: `📊 **Process Analysis:**\n\n${analysis}`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, analysisMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Failed to analyze process: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSummarizeProcess = async () => {
      const currentProcess = getCurrentProcess();
      if (!currentProcess || currentProcess.elements.length === 0) {
          const errorMessage: ChatMessage = {
              role: 'assistant',
              content: 'There is no process on the canvas to summarize. Please add some elements first.',
              timestamp: new Date(),
          };
          setMessages(prev => [...prev, errorMessage]);
          return;
      }

      setIsGenerating(true);
      const thinkingMessage: ChatMessage = {
          role: 'assistant',
          content: 'Analyzing your process to create a summary...',
          timestamp: new Date(),
      };
      setMessages(prev => [...prev, thinkingMessage]);

      try {
          const summary = await aiService.summarizeProcess(currentProcess);

          // Find a good position for the sticky note (e.g., near the start event)
          const startEvent = nodes.find(n => n.type === 'event' && n.data.eventType === 'start');
          const position = startEvent 
              ? { x: startEvent.position.x - 220, y: startEvent.position.y } 
              : { x: 50, y: 50 };

          addStickyNote(position, summary);
          
          const successMessage: ChatMessage = {
              role: 'assistant',
              content: `✅ I've summarized the process and added it to a sticky note on your canvas.`,
              timestamp: new Date(),
          };
          setMessages(prev => [...prev, successMessage]);

      } catch (error) {
          const errorMessage: ChatMessage = {
              role: 'assistant',
              content: `Failed to summarize the process: ${error instanceof Error ? error.message : 'Unknown error'}`,
              timestamp: new Date(),
          };
          setMessages(prev => [...prev, errorMessage]);
      } finally {
          setIsGenerating(false);
      }
  };

  const handleResetChat = async () => {
    if (!currentDiagramId) {
      console.warn('No diagram ID available for resetting chat');
      return;
    }
    if (!window.confirm('Are you sure you want to clear all chat history for this diagram? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await aiService.clearChatHistory(currentDiagramId);
      console.log(`✅ Chat history cleared: ${result.deletedCount} messages deleted`);
      setMessages([{
        role: 'assistant',
        content: "Hi! I'm Process Modeler AI, your intelligent assistant for this visual BPMN process modeling tool. I can help you create business processes, modify tasks and flows on the canvas, and analyze your process designs. I understand the visual connections between your process elements and will help maintain them as we work together. What process would you like to model today?",
        timestamp: new Date()
      }]);
      // Optional: show a temporary success message
      const successMessage: ChatMessage = {
        role: 'assistant',
        content: `🗑️ Chat history cleared! Deleted ${result.deletedCount} messages. Starting fresh conversation.`,
        timestamp: new Date(),
      };
      setTimeout(() => {
        setMessages(prev => [...prev, successMessage]);
      }, 500);
    } catch (error) {
      console.error('❌ Failed to clear chat history:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Failed to clear chat history: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Image handling functions
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const preview = event.target?.result as string;
          setUploadedImages(prev => [...prev, { file, preview }]);
        };
        reader.readAsDataURL(file);
      }
    });

    // Reset file input
    e.target.value = '';
  };

  const handleImagePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    Array.from(items).forEach(item => {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const preview = event.target?.result as string;
            setUploadedImages(prev => [...prev, { file, preview }]);
          };
          reader.readAsDataURL(file);
        }
      }
    });
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const quickActions = [
    {
      label: 'Generate Customer Onboarding Process',
      action: () => handleGenerateProcess('Create a customer onboarding process with registration, verification, and welcome steps'),
    },
    {
      label: 'Generate Order Fulfillment Process',
      action: () => handleGenerateProcess('Create an order fulfillment process with order processing, inventory check, shipping, and delivery'),
    },
    {
      label: 'Analyze Current Process',
      action: handleAnalyzeProcess,
    },
    {
      label: 'Summarize Process on Sticky Note',
      action: handleSummarizeProcess,
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bot size={24} />
          <h2 className="text-lg font-semibold">AI Assistant</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleResetChat}
            disabled={isLoading || isReadOnly}
            className="p-1.5 text-white hover:text-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={isReadOnly ? "Clear chat history is disabled in read-only mode" : "Clear chat history"}
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            ×
          </button>
        </div>
      </div>

      {/* Read-Only Notice */}
      {isReadOnly && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <div className="flex items-center text-yellow-800">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-sm font-medium">AI Assistant is disabled in read-only mode</span>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Actions</h3>
        <div className="space-y-2">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              disabled={isLoading || isGenerating || isReadOnly}
              className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex items-start space-x-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <div className="bg-blue-100 rounded-full p-2">
                <Bot size={16} className="text-blue-600" />
              </div>
            )}
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">{message.content}</div>
              <div className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
            {message.role === 'user' && (
              <div className="bg-gray-100 rounded-full p-2">
                <User size={16} className="text-gray-600" />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 rounded-full p-2">
              <RefreshCw size={16} className="text-blue-600 animate-spin" />
            </div>
            <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
              <div className="text-sm">Thinking...</div>
            </div>
          </div>
        )}

        {isGenerating && (
          <div className="flex items-start space-x-3">
            <div className="bg-purple-100 rounded-full p-2">
              <Sparkles size={16} className="text-purple-600 animate-pulse" />
            </div>
            <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
              <div className="text-sm">Generating schema...</div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Uploaded Images Preview */}
      {uploadedImages.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-2">
            {uploadedImages.map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={image.preview}
                  alt={`Upload ${index + 1}`}
                  className="w-16 h-16 object-cover rounded-lg border border-gray-300"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  disabled={isLoading}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              onPaste={handleImagePaste}
              placeholder={isReadOnly ? "AI Assistant is disabled in read-only mode" : "Ask me about process design, generate workflows, or get BPMN suggestions..."}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
              disabled={isLoading || isReadOnly}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isReadOnly}
              className="absolute right-2 top-2 p-1 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Upload image"
            >
              <Paperclip size={16} />
            </button>
          </div>
          <button
            onClick={handleSendMessage}
            disabled={(!inputMessage.trim() && uploadedImages.length === 0) || isLoading || isReadOnly}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </div>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>
    </div>
  );
};