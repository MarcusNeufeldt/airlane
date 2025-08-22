import React from 'react';
import { PlayCircle, StopCircle, Activity, GitBranch, Building2, Database } from 'lucide-react';
import { useDiagramStore } from '../../stores/diagramStore';

export const ProcessElementsToolbar: React.FC = () => {
  const { addNode, isReadOnly } = useDiagramStore();

  const handleAddStartEvent = () => {
    addNode('event', { x: 400, y: 200 }, { eventType: 'start' });
  };

  const handleAddEndEvent = () => {
    addNode('event', { x: 400, y: 200 }, { eventType: 'end' });
  };

  const handleAddProcess = () => {
    addNode('process', { x: 400, y: 200 });
  };

  const handleAddGateway = () => {
    addNode('gateway', { x: 400, y: 200 });
  };

  const handleAddPool = () => {
    addNode('pool-with-lanes', { x: 400, y: 200 });
  };

  const handleAddDataObject = () => {
    addNode('data-object', { x: 400, y: 200 });
  };

  return (
    <div className="flex items-center space-x-1">
      {/* Core Process Flow - Grouped */}
      <div className="flex items-center space-x-1 bg-gray-50 rounded-lg px-2 py-1">
        <button
          onClick={handleAddStartEvent}
          disabled={isReadOnly}
          className="p-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Add Start Event"
        >
          <PlayCircle size={18} />
        </button>

        <button
          onClick={handleAddProcess}
          disabled={isReadOnly}
          className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Add Process/Task"
        >
          <Activity size={18} />
        </button>
        
        <button
          onClick={handleAddGateway}
          disabled={isReadOnly}
          className="p-2 bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Add Gateway (Decision Point)"
        >
          <GitBranch size={18} />
        </button>

        <button
          onClick={handleAddEndEvent}
          disabled={isReadOnly}
          className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Add End Event"
        >
          <StopCircle size={18} />
        </button>
      </div>

      {/* Organization Elements - Grouped */}
      <div className="flex items-center space-x-1 bg-gray-50 rounded-lg px-2 py-1">
        <button
          onClick={handleAddPool}
          disabled={isReadOnly}
          className="p-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Add Pool/Lanes (Participant Container)"
        >
          <Building2 size={18} />
        </button>

        <button
          onClick={handleAddDataObject}
          disabled={isReadOnly}
          className="p-2 bg-slate-500 text-white rounded hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Add Data Object (Input/Output)"
        >
          <Database size={18} />
        </button>
      </div>
    </div>
  );
};