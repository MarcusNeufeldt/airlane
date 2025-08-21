import React from 'react';
import { Play, Pause, Square, SkipForward, RotateCcw } from 'lucide-react';
import { useDiagramStore } from '../stores/diagramStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface SimulationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SimulationPanel: React.FC<SimulationPanelProps> = ({ isOpen, onClose }) => {
  const {
    isSimulating,
    simulationPaused,
    simulationTokens,
    simulationSpeed,
    simulationActiveNodes,
    simulationActiveEdges,
    startSimulation,
    pauseSimulation,
    stopSimulation,
    stepSimulation,
    resetSimulation,
    setSimulationSpeed
  } = useDiagramStore();

  const activeTokens = simulationTokens.filter(token => token.status === 'active');
  const completedTokens = simulationTokens.filter(token => token.status === 'completed');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Process Simulation
          </DialogTitle>
        </DialogHeader>

        <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Process Simulation</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            isSimulating && !simulationPaused ? 'bg-green-500 animate-pulse' :
            isSimulating && simulationPaused ? 'bg-yellow-500' :
            'bg-gray-400'
          }`} />
          <span className="text-sm text-gray-600">
            {isSimulating && !simulationPaused ? 'Running' :
             isSimulating && simulationPaused ? 'Paused' :
             'Stopped'}
          </span>
        </div>
      </div>

      {/* Simulation Controls */}
      <div className="space-y-3">
        <div className="flex items-center justify-center space-x-2">
          {!isSimulating ? (
            <button
              onClick={startSimulation}
              className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Play size={16} />
              <span>Start</span>
            </button>
          ) : (
            <>
              {simulationPaused ? (
                <button
                  onClick={startSimulation}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Play size={16} />
                  <span>Resume</span>
                </button>
              ) : (
                <button
                  onClick={pauseSimulation}
                  className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  <Pause size={16} />
                  <span>Pause</span>
                </button>
              )}
              <button
                onClick={stepSimulation}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <SkipForward size={16} />
                <span>Step</span>
              </button>
              <button
                onClick={stopSimulation}
                className="flex items-center space-x-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <Square size={16} />
                <span>Stop</span>
              </button>
            </>
          )}
        </div>

        <button
          onClick={resetSimulation}
          className="flex items-center space-x-2 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          <RotateCcw size={16} />
          <span>Reset</span>
        </button>
      </div>

      {/* Speed Control */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Simulation Speed
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="100"
            max="3000"
            step="100"
            value={simulationSpeed}
            onChange={(e) => setSimulationSpeed(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm text-gray-600 min-w-[60px]">
            {simulationSpeed}ms
          </span>
        </div>
      </div>

      {/* Simulation Status */}
      <div className="mt-4 space-y-2">
        <div className="text-sm">
          <span className="font-medium">Active Tokens: </span>
          <span className="text-blue-600">{activeTokens.length}</span>
        </div>
        <div className="text-sm">
          <span className="font-medium">Completed: </span>
          <span className="text-green-600">{completedTokens.length}</span>
        </div>
        <div className="text-sm">
          <span className="font-medium">Active Elements: </span>
          <span className="text-purple-600">{simulationActiveNodes.length}</span>
        </div>
        <div className="text-sm">
          <span className="font-medium">Active Flows: </span>
          <span className="text-green-600">{simulationActiveEdges.length}</span>
        </div>
      </div>

      {/* Token Details */}
      {simulationTokens.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Tokens</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {simulationTokens.map(token => (
              <div key={token.id} className="text-xs p-2 bg-gray-50 rounded border">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-gray-600">{token.id.slice(-4)}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    token.status === 'active' ? 'bg-blue-100 text-blue-700' :
                    token.status === 'completed' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {token.status}
                  </span>
                </div>
                <div className="text-gray-600 mt-1">
                  Path: {token.path.length} steps
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

          {/* Help Text */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">How to Use Simulation</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Create a process with Start and End events</li>
              <li>• Connect elements with sequence flows</li>
              <li>• Click "Start" to begin simulation</li>
              <li>• Watch tokens flow with green highlights</li>
              <li>• See animated edges during transitions</li>
              <li>• Use "Step" for manual control</li>
              <li>• Different gateway types are supported</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
