import React from 'react';
import { Play, Pause, Square, SkipForward, RotateCcw, Zap, Clock, Activity, TrendingUp, X, Shuffle, Target } from 'lucide-react';
import { useDiagramStore } from '../stores/diagramStore';
import { Dialog, DialogContent } from './ui/dialog';

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
    simulationRandomness,
    simulationActiveNodes,
    simulationActiveEdges,
    startSimulation,
    pauseSimulation,
    stopSimulation,
    stepSimulation,
    resetSimulation,
    setSimulationSpeed,
    setSimulationRandomness
  } = useDiagramStore();

  const activeTokens = simulationTokens.filter(token => token.status === 'active');
  const completedTokens = simulationTokens.filter(token => token.status === 'completed');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Process Simulation</h2>
              <p className="text-blue-100 text-sm">Control and monitor your process execution</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2 mb-0">
            <div className={`w-2 h-2 rounded-full ${
              isSimulating && !simulationPaused ? 'bg-green-400 animate-pulse' :
              isSimulating && simulationPaused ? 'bg-yellow-400' :
              'bg-gray-300'
            }`} />
            <span className="text-sm font-medium">
              {isSimulating && !simulationPaused ? 'Running' :
               isSimulating && simulationPaused ? 'Paused' :
               'Ready to Start'}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Control Panel */}
          <div className="bg-gray-50 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity size={18} />
              Simulation Controls
            </h3>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Primary Control */}
              {!isSimulating ? (
                <button
                  onClick={startSimulation}
                  className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-[1.02] shadow-lg"
                >
                  <Play size={20} />
                  <span className="font-medium">Start Simulation</span>
                </button>
              ) : (
                <>
                  {simulationPaused ? (
                    <button
                      onClick={startSimulation}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-md"
                    >
                      <Play size={18} />
                      <span className="font-medium">Resume</span>
                    </button>
                  ) : (
                    <button
                      onClick={pauseSimulation}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-md"
                    >
                      <Pause size={18} />
                      <span className="font-medium">Pause</span>
                    </button>
                  )}
                  
                  <button
                    onClick={stopSimulation}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-lg hover:from-red-600 hover:to-rose-600 transition-all shadow-md"
                  >
                    <Square size={18} />
                    <span className="font-medium">Stop</span>
                  </button>
                </>
              )}
            </div>

            {/* Secondary Controls */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={stepSimulation}
                disabled={!isSimulating}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SkipForward size={16} />
                <span className="font-medium">Step</span>
              </button>
              
              <button
                onClick={resetSimulation}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                <RotateCcw size={16} />
                <span className="font-medium">Reset</span>
              </button>
            </div>
          </div>

          {/* Speed Control */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock size={18} />
              Speed Control
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Slow</span>
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">{simulationSpeed}ms</span>
                <span>Fast</span>
              </div>
              <input
                type="range"
                min="100"
                max="3000"
                step="100"
                value={simulationSpeed}
                onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>

          {/* Gateway Behavior Control */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              {simulationRandomness ? <Shuffle size={18} /> : <Target size={18} />}
              Gateway Behavior
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${simulationRandomness ? 'bg-purple-100' : 'bg-blue-100'}`}>
                    {simulationRandomness ? 
                      <Shuffle className={`w-5 h-5 ${simulationRandomness ? 'text-purple-600' : 'text-blue-600'}`} /> :
                      <Target className={`w-5 h-5 ${simulationRandomness ? 'text-purple-600' : 'text-blue-600'}`} />
                    }
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {simulationRandomness ? 'Random Path Selection' : 'Deterministic Path Selection'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {simulationRandomness 
                        ? 'XOR gateways randomly choose different paths each time' 
                        : 'XOR gateways always choose the same path (predictable)'
                      }
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setSimulationRandomness(!simulationRandomness)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    simulationRandomness ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      simulationRandomness ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600">
                  <strong>💡 Tip:</strong> Toggle between random and deterministic modes to test different scenarios. 
                  Random mode helps explore all possible paths, while deterministic mode ensures consistent results.
                </p>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Active Tokens</p>
                  <p className="text-blue-900 text-2xl font-bold">{activeTokens.length}</p>
                </div>
                <div className="p-2 bg-blue-200 rounded-lg">
                  <Activity className="w-5 h-5 text-blue-700" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Completed</p>
                  <p className="text-green-900 text-2xl font-bold">{completedTokens.length}</p>
                </div>
                <div className="p-2 bg-green-200 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-700" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Active Elements</p>
                  <p className="text-purple-900 text-2xl font-bold">{simulationActiveNodes.length}</p>
                </div>
                <div className="p-2 bg-purple-200 rounded-lg">
                  <Zap className="w-5 h-5 text-purple-700" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-600 text-sm font-medium">Active Flows</p>
                  <p className="text-indigo-900 text-2xl font-bold">{simulationActiveEdges.length}</p>
                </div>
                <div className="p-2 bg-indigo-200 rounded-lg">
                  <Activity className="w-5 h-5 text-indigo-700" />
                </div>
              </div>
            </div>
          </div>

          {/* Token Details */}
          {simulationTokens.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity size={18} />
                Token Details
              </h3>
              
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {simulationTokens.map(token => (
                  <div key={token.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xs font-mono text-gray-600">
                          {token.id.slice(-2)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Token {token.id.slice(-4)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {token.path.length} steps completed
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      token.status === 'active' ? 'bg-blue-100 text-blue-700' :
                      token.status === 'completed' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {token.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Guide */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Play className="w-5 h-5" />
              Quick Start Guide
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-800">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>Connect Start and End events with sequence flows</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>Add tasks and gateways between them</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>Click "Start" to watch tokens flow through</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>Use "Step" for manual control over execution</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
