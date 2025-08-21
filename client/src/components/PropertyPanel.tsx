import React from 'react';
import { X, Play, Activity, GitBranch, Users, Building2, Database } from 'lucide-react';
import { useDiagramStore } from '../stores/diagramStore';
import { DiagramNodeData, EventNodeData, ProcessNodeData, GatewayNodeData, LaneNodeData, PoolNodeData, DataObjectNodeData } from '../types';

export const PropertyPanel: React.FC = () => {
  const { 
    nodes, 
    selectedNodeId, 
    updateNode, 
    selectNode 
  } = useDiagramStore();

  const selectedNode = nodes.find((node) => node.id === selectedNodeId);

  if (!selectedNode || !selectedNodeId) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4">
        <p className="text-gray-500 text-center">Select an element to edit properties</p>
      </div>
    );
  }

  const nodeData = selectedNode.data as DiagramNodeData;

  // Handle different node types
  const renderProcessProperties = (data: ProcessNodeData) => {
    // Find all lanes in the diagram for assignment options
    const lanes = nodes.filter(n => n.type === 'lane');
    
    return (
      <>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Task Name
          </label>
          <input
            type="text"
            value={data.label}
            onChange={(e) => updateNode(selectedNodeId, { label: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Review Document, Process Payment"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Activity Type
          </label>
          <select
            value={data.processType}
            onChange={(e) => updateNode(selectedNodeId, { processType: e.target.value as 'task' | 'subprocess' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="task">Atomic Task (cannot be broken down)</option>
            <option value="subprocess">Subprocess (contains other activities)</option>
          </select>
        </div>

        {data.processType === 'task' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Type
            </label>
            <select
              value={data.taskType || 'user'}
              onChange={(e) => updateNode(selectedNodeId, { taskType: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="user">User Task (human interaction)</option>
              <option value="service">Service Task (automated)</option>
              <option value="manual">Manual Task (no system support)</option>
              <option value="script">Script Task (automated script)</option>
              <option value="business-rule">Business Rule Task</option>
              <option value="send">Send Task (message sending)</option>
              <option value="receive">Receive Task (waiting for message)</option>
            </select>
          </div>
        )}

        {lanes.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assigned to Lane/Role
            </label>
            <select
              value={data.assignedLane || ''}
              onChange={(e) => updateNode(selectedNodeId, { 
                assignedLane: e.target.value,
                performer: lanes.find(l => l.id === e.target.value)?.data?.label || ''
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No lane assignment</option>
              {lanes.map(lane => (
                <option key={lane.id} value={lane.id}>
                  {lane.data?.label || 'Unnamed Lane'}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="font-medium text-blue-800 mb-2">BPMN Task Properties:</h4>
            <div className="text-sm text-blue-700">
              <p>• <strong>Atomic:</strong> Tasks cannot be broken down further at this diagram level</p>
              <p>• <strong>Sequential:</strong> Connected by sequence flows in order</p>
              <p>• <strong>Single Assignment:</strong> Usually assigned to one lane/role</p>
              {data.taskType === 'user' && <p>• <strong>User Task:</strong> Requires human interaction to complete</p>}
              {data.taskType === 'service' && <p>• <strong>Service Task:</strong> Automated by system/service</p>}
              {data.taskType === 'manual' && <p>• <strong>Manual Task:</strong> Performed outside the system</p>}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Task Description
          </label>
          <textarea
            value={data.description || ''}
            onChange={(e) => updateNode(selectedNodeId, { description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe what work is done in this task..."
          />
        </div>
      </>
    );
  };

  const renderEventProperties = (data: EventNodeData) => (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Event Name
        </label>
        <input
          type="text"
          value={data.label}
          onChange={(e) => updateNode(selectedNodeId, { label: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder={data.eventType === 'start' ? 'e.g., Order Received' : data.eventType === 'end' ? 'e.g., Order Delivered' : 'e.g., Payment Confirmed'}
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Event Type
        </label>
        <select
          value={data.eventType}
          onChange={(e) => updateNode(selectedNodeId, { eventType: e.target.value as 'start' | 'intermediate' | 'end' })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="start">Start Event - Triggers the process</option>
          <option value="intermediate">Intermediate Event - Occurs during process</option>
          <option value="end">End Event - Completes the process</option>
        </select>
      </div>

      <div className="mb-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <h4 className="font-medium text-green-800 mb-2">Event Behavior:</h4>
          {data.eventType === 'start' && (
            <div className="text-sm text-green-700">
              <p>• <strong>Triggers the process:</strong> The process cannot begin without a start event</p>
              <p>• <strong>No incoming flows:</strong> Can only send flows to activate the first activity or gateway</p>
              <p>• <strong>Business meaning:</strong> Represents what initiates the business process</p>
              <p>• <strong>Examples:</strong> Customer order, request received, scheduled time reached</p>
            </div>
          )}
          {data.eventType === 'intermediate' && (
            <div className="text-sm text-yellow-700">
              <p>• <strong>Occurs during the process:</strong> Represents interactions or changes mid-flow</p>
              <p>• <strong>Both incoming and outgoing flows:</strong> Can receive and send connections</p>
              <p>• <strong>Business meaning:</strong> Important milestones or waiting points</p>
              <p>• <strong>Examples:</strong> Message received, timer expired, condition met</p>
            </div>
          )}
          {data.eventType === 'end' && (
            <div className="text-sm text-red-700">
              <p>• <strong>Completes the process:</strong> Represents the business goal achievement</p>
              <p>• <strong>No outgoing flows:</strong> Can only receive flows to terminate the process</p>
              <p>• <strong>Business meaning:</strong> Successful completion, failure, or alternative ending</p>
              <p>• <strong>Examples:</strong> Order fulfilled, request denied, process cancelled</p>
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Event Details
        </label>
        <textarea
          value={data.description || ''}
          onChange={(e) => updateNode(selectedNodeId, { description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder={data.eventType === 'start' ? 'What triggers this process to begin?' : data.eventType === 'end' ? 'What outcome does this represent?' : 'What happens at this point in the process?'}
        />
      </div>
    </>
  );

  const renderGatewayProperties = (data: GatewayNodeData) => (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Gateway Label (Question)
        </label>
        <input
          type="text"
          value={data.label}
          onChange={(e) => updateNode(selectedNodeId, { label: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
          placeholder="e.g., Approved?"
        />
        <p className="text-xs text-gray-500 mt-1">
          For splitting gateways, use a question. Merging gateways usually remain unlabeled.
        </p>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Gateway Type
        </label>
        <select
          value={data.gatewayType}
          onChange={(e) => updateNode(selectedNodeId, { gatewayType: e.target.value as 'exclusive' | 'parallel' | 'inclusive' | 'event-based' | 'complex' })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
        >
          <option value="exclusive">Exclusive (XOR) - Choose one path</option>
          <option value="parallel">Parallel (AND) - All paths simultaneously</option>
          <option value="inclusive">Inclusive (OR) - One or more paths</option>
          <option value="event-based">Event-Based - Wait for events</option>
          <option value="complex">Complex - Advanced synchronization</option>
        </select>
      </div>

      <div className="mb-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <h4 className="font-medium text-yellow-800 mb-2">Gateway Behavior:</h4>
          {data.gatewayType === 'exclusive' && (
            <div className="text-sm text-yellow-700">
              <p>• <strong>Splitting:</strong> Routes flow based on conditions - only one outgoing path is chosen</p>
              <p>• <strong>Merging:</strong> Waits for one incoming flow before continuing</p>
              <p>• Label outgoing flows with mutually exclusive conditions (Yes/No, Approved/Rejected)</p>
            </div>
          )}
          {data.gatewayType === 'parallel' && (
            <div className="text-sm text-yellow-700">
              <p>• <strong>Splitting:</strong> Activates all outgoing paths simultaneously</p>
              <p>• <strong>Merging:</strong> Waits until ALL incoming flows arrive before continuing</p>
              <p>• Used for concurrent activities that must be synchronized</p>
            </div>
          )}
          {data.gatewayType === 'inclusive' && (
            <div className="text-sm text-yellow-700">
              <p>• <strong>Splitting:</strong> Activates one or more outgoing paths based on conditions</p>
              <p>• <strong>Merging:</strong> Waits for all activated incoming flows</p>
              <p>• More complex than exclusive - multiple conditions can be true</p>
            </div>
          )}
          {data.gatewayType === 'event-based' && (
            <div className="text-sm text-yellow-700">
              <p>• <strong>Purpose:</strong> Waits for one of multiple possible events to occur</p>
              <p>• <strong>Behavior:</strong> Process pauses until ONE event happens, then continues on that path</p>
              <p>• <strong>Use Case:</strong> "Wait for customer response OR timeout after 24 hours"</p>
              <p>• Cannot be used for merging - only splitting based on events</p>
            </div>
          )}
          {data.gatewayType === 'complex' && (
            <div className="text-sm text-yellow-700">
              <p>• <strong>Purpose:</strong> Advanced synchronization scenarios with custom logic</p>
              <p>• <strong>Behavior:</strong> Complex conditions involving multiple inputs/outputs</p>
              <p>• <strong>Use Case:</strong> "Continue when 2 out of 3 approvals received"</p>
              <p>• Requires detailed specification of synchronization rules</p>
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Decision Criteria
        </label>
        <textarea
          value={data.description || ''}
          onChange={(e) => updateNode(selectedNodeId, { description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
          placeholder="Describe the decision logic or conditions..."
        />
      </div>
    </>
  );

  const renderLaneProperties = (data: LaneNodeData) => (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Lane Name
        </label>
        <input
          type="text"
          value={data.label}
          onChange={(e) => updateNode(selectedNodeId, { label: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Assignee
        </label>
        <input
          type="text"
          value={data.assignee || ''}
          onChange={(e) => updateNode(selectedNodeId, { assignee: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter assignee name..."
        />
      </div>

      <div className="mb-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={data.locked || false}
            onChange={(e) => updateNode(selectedNodeId, { locked: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            Lock lane in position (background mode)
          </span>
        </label>
        <p className="text-xs text-gray-500 mt-1">
          Locked lanes cannot be moved or resized and appear in the background
        </p>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Background Color
        </label>
        <input
          type="color"
          value={data.backgroundColor || '#dbeafe'}
          onChange={(e) => updateNode(selectedNodeId, { backgroundColor: e.target.value })}
          className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
        />
        <p className="text-xs text-gray-500 mt-1">
          Choose a background color for the lane
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Width
          </label>
          <input
            type="number"
            value={data.width}
            onChange={(e) => updateNode(selectedNodeId, { width: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="200"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Height
          </label>
          <input
            type="number"
            value={data.height}
            onChange={(e) => updateNode(selectedNodeId, { height: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="100"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={data.description || ''}
          onChange={(e) => updateNode(selectedNodeId, { description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter lane description..."
        />
      </div>
    </>
  );

  const renderPoolProperties = (data: PoolNodeData) => (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pool Name
        </label>
        <input
          type="text"
          value={data.label}
          onChange={(e) => updateNode(selectedNodeId, { label: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Participant
        </label>
        <input
          type="text"
          value={data.participant}
          onChange={(e) => updateNode(selectedNodeId, { participant: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Enter participant name..."
        />
      </div>

      <div className="mb-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={data.isCollapsed || false}
            onChange={(e) => updateNode(selectedNodeId, { isCollapsed: e.target.checked })}
            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
          <span className="text-sm font-medium text-gray-700">Collapsed</span>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Width
          </label>
          <input
            type="number"
            value={data.width}
            onChange={(e) => updateNode(selectedNodeId, { width: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            min="300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Height
          </label>
          <input
            type="number"
            value={data.height}
            onChange={(e) => updateNode(selectedNodeId, { height: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            min="150"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={data.description || ''}
          onChange={(e) => updateNode(selectedNodeId, { description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Enter pool description..."
        />
      </div>
    </>
  );

  const renderDataObjectProperties = (data: DataObjectNodeData) => (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Data Object Name
        </label>
        <input
          type="text"
          value={data.label}
          onChange={(e) => updateNode(selectedNodeId, { label: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Data Type
        </label>
        <select
          value={data.dataType}
          onChange={(e) => updateNode(selectedNodeId, { dataType: e.target.value as 'input' | 'output' | 'collection' })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="input">Input</option>
          <option value="output">Output</option>
          <option value="collection">Collection</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          State
        </label>
        <input
          type="text"
          value={data.state || ''}
          onChange={(e) => updateNode(selectedNodeId, { state: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="Enter state (e.g., created, in progress, completed)..."
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={data.description || ''}
          onChange={(e) => updateNode(selectedNodeId, { description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="Enter data object description..."
        />
      </div>
    </>
  );

  const renderGenericProperties = () => (
    <div className="mb-4">
      <p className="text-gray-500 text-sm">
        {selectedNode.type === 'sticky-note' ? 'Double-click the note to edit its content.' :
         selectedNode.type === 'shape' ? 'Double-click the shape to edit its label.' :
         'Use the controls on the element to edit its properties.'}
      </p>
    </div>
  );

  const getNodeIcon = () => {
    switch (selectedNode.type) {
      case 'process': return <Activity className="w-5 h-5" />;
      case 'event': return <Play className="w-5 h-5" />;
      case 'gateway': return <GitBranch className="w-5 h-5" />;
      case 'lane': return <Users className="w-5 h-5" />;
      case 'pool': return <Building2 className="w-5 h-5" />;
      case 'data-object': return <Database className="w-5 h-5" />;
      default: return null;
    }
  };

  const getNodeTypeName = () => {
    switch (selectedNode.type) {
      case 'process': return 'Process Task';
      case 'event': return 'Event';
      case 'gateway': return 'Gateway';
      case 'lane': return 'Lane';
      case 'pool': return 'Pool';
      case 'data-object': return 'Data Object';
      case 'sticky-note': return 'Sticky Note';
      case 'shape': return 'Shape';
      default: return 'Element';
    }
  };

  const isProcessNode = selectedNode.type === 'process' || selectedNode.type === 'event' || selectedNode.type === 'gateway' || selectedNode.type === 'lane' || selectedNode.type === 'pool' || selectedNode.type === 'data-object';

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {getNodeIcon()}
          <h3 className="text-lg font-semibold text-gray-800">
            {getNodeTypeName()}
          </h3>
        </div>
        <button
          onClick={() => selectNode(null)}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="space-y-4">
        {isProcessNode ? (
          <>
            {selectedNode.type === 'process' && renderProcessProperties(nodeData as ProcessNodeData)}
            {selectedNode.type === 'event' && renderEventProperties(nodeData as EventNodeData)}
            {selectedNode.type === 'gateway' && renderGatewayProperties(nodeData as GatewayNodeData)}
            {selectedNode.type === 'lane' && renderLaneProperties(nodeData as LaneNodeData)}
            {selectedNode.type === 'pool' && renderPoolProperties(nodeData as PoolNodeData)}
            {selectedNode.type === 'data-object' && renderDataObjectProperties(nodeData as DataObjectNodeData)}
          </>
        ) : (
          renderGenericProperties()
        )}
      </div>
    </div>
  );
};