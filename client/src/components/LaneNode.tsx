import React from 'react';
import { NodeProps, NodeResizer } from 'reactflow';
import { LaneNodeData } from '../types';
import { useDiagramStore } from '../stores/diagramStore';
import { Users } from 'lucide-react';

// CHANGE: This component is now styled as a horizontal strip with a header.
export const LaneNode: React.FC<NodeProps<LaneNodeData>> = ({ id, data, selected }) => {
  const { updateNode } = useDiagramStore();

  const handleResize = (event: any, params: any) => {
    updateNode(id, { width: params.width, height: params.height });
  };

  return (
    <>
      <NodeResizer
        color="#0d9488"
        isVisible={selected}
        minWidth={200}
        minHeight={100}
        onResize={handleResize}
      />
      <div
        className={`border-2 rounded-lg flex flex-col transition-all duration-150 ${
          selected ? 'border-teal-500' : 'border-gray-300'
        }`}
        style={{
          backgroundColor: data.backgroundColor || '#fafafa',
          width: data.width || 300,
          height: data.height || 150,
        }}
      >
        {/* Lane Header */}
        <div className="border-b-2 border-gray-300 p-2 rounded-t-lg bg-white/50">
          <div className="flex items-center space-x-2">
            <Users size={14} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-700">{data.label || 'Lane'}</span>
          </div>
        </div>
        {/* Content area where tasks will be rendered */}
        <div className="flex-1 p-2 text-center text-xs text-gray-400 opacity-50">
          {data.assignee ? `Assignee: ${data.assignee}` : ''}
        </div>
      </div>
    </>
  );
};