import React from 'react';
import { Node, useReactFlow } from 'reactflow';

interface AlignmentGuidesProps {
  nodes: Node[];
  isDragging: boolean;
  draggingNodeId?: string | null;
}

interface AlignmentLine {
  id: string;
  orientation: 'horizontal' | 'vertical';
  position: number;
  start: number;
  end: number;
  nodeIds: string[];
}

export const AlignmentGuides: React.FC<AlignmentGuidesProps> = ({ nodes, isDragging, draggingNodeId }) => {
  const { getViewport } = useReactFlow();
  const viewport = getViewport();
  
  if (!isDragging || !draggingNodeId || nodes.length < 2) {
    return null;
  }

  // Find the node being dragged
  const draggingNode = nodes.find(node => node.id === draggingNodeId);
  if (!draggingNode) return null;

  const otherNodes = nodes.filter(node => node.id !== draggingNode.id && node.type !== 'sticky-note');

  // Calculate potential alignment lines
  const alignmentLines: AlignmentLine[] = [];
  const threshold = 15; // Snap threshold in pixels (should match snap distance)

  // Get node bounds for the dragging node
  const dragNodeBounds = {
    left: draggingNode.position.x,
    right: draggingNode.position.x + (draggingNode.width || 150),
    top: draggingNode.position.y,
    bottom: draggingNode.position.y + (draggingNode.height || 80),
    centerX: draggingNode.position.x + (draggingNode.width || 150) / 2,
    centerY: draggingNode.position.y + (draggingNode.height || 80) / 2,
  };

  otherNodes.forEach(node => {
    const nodeBounds = {
      left: node.position.x,
      right: node.position.x + (node.width || 150),
      top: node.position.y,
      bottom: node.position.y + (node.height || 80),
      centerX: node.position.x + (node.width || 150) / 2,
      centerY: node.position.y + (node.height || 80) / 2,
    };

    // Horizontal center alignment (Y position)
    if (Math.abs(dragNodeBounds.centerY - nodeBounds.centerY) <= threshold) {
      alignmentLines.push({
        id: `h-center-${node.id}`,
        orientation: 'horizontal',
        position: nodeBounds.centerY,
        start: Math.min(nodeBounds.left, dragNodeBounds.left) - 100,
        end: Math.max(nodeBounds.right, dragNodeBounds.right) + 100,
        nodeIds: [node.id, draggingNode.id],
      });
    }

    // Vertical center alignment (X position)
    if (Math.abs(dragNodeBounds.centerX - nodeBounds.centerX) <= threshold) {
      alignmentLines.push({
        id: `v-center-${node.id}`,
        orientation: 'vertical',
        position: nodeBounds.centerX,
        start: Math.min(nodeBounds.top, dragNodeBounds.top) - 100,
        end: Math.max(nodeBounds.bottom, dragNodeBounds.bottom) + 100,
        nodeIds: [node.id, draggingNode.id],
      });
    }
  });

  // Remove duplicate lines
  const uniqueLines = alignmentLines.filter((line, index, self) =>
    index === self.findIndex(l => 
      l.orientation === line.orientation && 
      Math.abs(l.position - line.position) < 2
    )
  );

  return (
    <svg
      className="react-flow__edges"
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      <defs>
        <pattern
          id="alignment-line-pattern"
          patternUnits="userSpaceOnUse"
          width="6"
          height="6"
        >
          <circle cx="3" cy="3" r="1" fill="#3b82f6" opacity="0.8" />
        </pattern>
      </defs>
      
      {uniqueLines.map(line => (
        <g key={line.id}>
          {line.orientation === 'horizontal' ? (
            <line
              x1={(line.start * viewport.zoom) + viewport.x}
              y1={(line.position * viewport.zoom) + viewport.y}
              x2={(line.end * viewport.zoom) + viewport.x}
              y2={(line.position * viewport.zoom) + viewport.y}
              stroke="#ef4444"
              strokeWidth="2"
              strokeDasharray="8,4"
              opacity="0.9"
            />
          ) : (
            <line
              x1={(line.position * viewport.zoom) + viewport.x}
              y1={(line.start * viewport.zoom) + viewport.y}
              x2={(line.position * viewport.zoom) + viewport.x}
              y2={(line.end * viewport.zoom) + viewport.y}
              stroke="#ef4444"
              strokeWidth="2"
              strokeDasharray="8,4"
              opacity="0.9"
            />
          )}
        </g>
      ))}
    </svg>
  );
};
