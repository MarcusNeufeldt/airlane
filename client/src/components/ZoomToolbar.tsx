import React from 'react';
import { useReactFlow } from 'reactflow';
import { ZoomIn, ZoomOut, Maximize, RotateCcw } from 'lucide-react';

export const ZoomToolbar: React.FC = () => {
  const { zoomIn, zoomOut, fitView, setCenter } = useReactFlow();

  const handleZoomIn = () => {
    zoomIn({ duration: 300 });
  };

  const handleZoomOut = () => {
    zoomOut({ duration: 300 });
  };

  const handleFitView = () => {
    fitView({ duration: 500, padding: 0.1 });
  };

  const handleResetView = () => {
    setCenter(0, 0, { zoom: 1, duration: 500 });
  };

  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col bg-white border border-gray-200 rounded-lg shadow-lg">
      <button
        onClick={handleZoomIn}
        className="p-2 hover:bg-gray-100 transition-colors border-b border-gray-200 rounded-t-lg"
        title="Zoom In (Ctrl + +)"
      >
        <ZoomIn className="w-4 h-4 text-gray-600" />
      </button>
      
      <button
        onClick={handleZoomOut}
        className="p-2 hover:bg-gray-100 transition-colors border-b border-gray-200"
        title="Zoom Out (Ctrl + -)"
      >
        <ZoomOut className="w-4 h-4 text-gray-600" />
      </button>
      
      <button
        onClick={handleFitView}
        className="p-2 hover:bg-gray-100 transition-colors border-b border-gray-200"
        title="Fit to View (Ctrl + 0)"
      >
        <Maximize className="w-4 h-4 text-gray-600" />
      </button>
      
      <button
        onClick={handleResetView}
        className="p-2 hover:bg-gray-100 transition-colors rounded-b-lg"
        title="Reset View (Ctrl + R)"
      >
        <RotateCcw className="w-4 h-4 text-gray-600" />
      </button>
    </div>
  );
};