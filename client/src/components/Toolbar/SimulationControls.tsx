import React from 'react';
import { Play, Settings } from 'lucide-react';
import { useDiagramStore } from '../../stores/diagramStore';

interface SimulationControlsProps {
  onOpenSimulation?: () => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({ onOpenSimulation }) => {
  const {
    isReadOnly,
    isSimulating,
    simulationPaused,
    startSimulationBackground
  } = useDiagramStore();

  return (
    <div className="flex items-center space-x-2">
      {/* Simulation Status - Compact */}
      {isSimulating && (
        <div className="flex items-center space-x-1.5 px-2 py-1 bg-gray-50 border border-gray-200 rounded-full">
          <div className={`w-2 h-2 rounded-full animate-pulse ${
            simulationPaused ? 'bg-amber-400' : 'bg-emerald-400'
          }`} />
          <span className="text-xs font-medium text-gray-600">
            {simulationPaused ? 'Paused' : 'Active'}
          </span>
        </div>
      )}

      {/* Simulation Controls - Grouped */}
      <div className="flex items-center space-x-1 bg-gray-50 rounded-lg p-1">
        <button
          onClick={() => startSimulationBackground()}
          disabled={isReadOnly}
          className="p-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
          title={isReadOnly ? "Simulation disabled in read-only mode" : "Start simulation"}
        >
          <Play size={18} />
        </button>

        {onOpenSimulation && (
          <button
            onClick={onOpenSimulation}
            disabled={isReadOnly}
            className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
            title={isReadOnly ? "Simulation disabled in read-only mode" : "Open simulation panel"}
          >
            <Settings size={18} />
          </button>
        )}
      </div>
    </div>
  );
};