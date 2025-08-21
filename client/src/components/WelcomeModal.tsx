import React, { useState, useEffect } from 'react';
import { X, Activity, Users, Upload, GitBranch } from 'lucide-react';

export const WelcomeModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Show welcome modal on first visit
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('hasSeenWelcome', 'true');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">
              Welcome to Airlane
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6">
            <p className="text-gray-600">
              A professional BPMN 2.0 process modeling platform with Signavio compatibility, AI-powered process generation, and universal format support.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <Activity className="text-blue-500" size={24} />
                  <h3 className="font-semibold">BPMN Elements</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Create complete business processes with events, tasks, gateways, lanes, and pools using our comprehensive BPMN 2.0 toolbar.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <Users className="text-green-500" size={24} />
                  <h3 className="font-semibold">Lane Organization</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Visualize organizational roles and responsibilities with color-coded lanes and toggle-able visual indicators.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <Upload className="text-purple-500" size={24} />
                  <h3 className="font-semibold">Universal Import</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Import BPMN files from Signavio, Camunda, Bizagi, and other tools with intelligent parsing and layout preservation.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <GitBranch className="text-orange-500" size={24} />
                  <h3 className="font-semibold">AI Process Generation</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Generate complete business processes from natural language descriptions using our integrated AI assistant.
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Quick Start Tips:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Start with a Start Event, add Tasks and connect them with sequence flows</li>
                <li>• Try importing the test-with-lanes.bpmn file to see lane visualization</li>
                <li>• Use View → Show/Hide Lane Colors to toggle organizational indicators</li>
                <li>• Double-click any element to edit its label inline</li>
                <li>• Access the AI assistant in the sidebar for intelligent process generation</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
