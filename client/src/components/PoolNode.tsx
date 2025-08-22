import React from 'react';
import { NodeProps, NodeResizer } from 'reactflow';
import { PoolNodeData } from '../types';
import { useDiagramStore } from '../stores/diagramStore';
import { Building2 } from 'lucide-react';

// CHANGE: This component will now be a simple container that holds other nodes (the lanes).
export const PoolNode: React.FC<NodeProps<PoolNodeData>> = ({ id, data, selected }) => {
  const { updateNode } = useDiagramStore();

  const handleResize = (event: any, params: any) => {
    updateNode(id, { width: params.width, height: params.height });
  };

  return (
    <>
      <NodeResizer
        color="#4f46e5"
        isVisible={selected}
        minWidth={300}
        minHeight={200}
        onResize={handleResize}
      />
      <div
        className={`bg-white/50 border-2 rounded-lg flex transition-all duration-150 ${
          selected ? 'border-indigo-600' : 'border-gray-400'
        }`}
        style={{
          width: data.width || 400,
          height: data.height || 200,
        }}
      >
        {/* Vertical Label */}
        <div className="bg-gray-100 border-r-2 border-gray-400 flex items-center justify-center p-2 rounded-l-lg" style={{ width: '40px' }}>
          <div className="transform -rotate-90 whitespace-nowrap flex items-center space-x-2 text-sm font-semibold text-gray-700">
            <Building2 size={14} />
            <span>{data.participant || 'Participant'}</span>
          </div>
        </div>
        {/* The content area where lanes will be rendered by ReactFlow */}
        <div className="flex-1"></div>
      </div>
    </>
  );
};