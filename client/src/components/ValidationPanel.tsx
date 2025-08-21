import React, { useState, useEffect } from 'react';
import { useDiagramStore } from '../stores/diagramStore';
import { validateProcess, ValidationIssue } from '../utils/processValidator';
import { AlertCircle, AlertTriangle, Info, CheckCircle, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react';

export const ValidationPanel: React.FC = () => {
  const { nodes, edges } = useDiagramStore();
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidation, setLastValidation] = useState<Date | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const runValidation = async () => {
    setIsValidating(true);
    
    // Add small delay to show loading state
    setTimeout(() => {
      const validationResults = validateProcess(nodes, edges);
      setIssues(validationResults);
      setLastValidation(new Date());
      setIsValidating(false);
    }, 500);
  };

  // Auto-validate when diagram changes
  useEffect(() => {
    runValidation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges]);

  const getIssueIcon = (type: ValidationIssue['type']) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getIssueColor = (type: ValidationIssue['type']) => {
    switch (type) {
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
    }
  };

  const handleIssueClick = (issue: ValidationIssue) => {
    if (issue.nodeId) {
      // Could highlight the node in the future
      console.log('Issue with node:', issue.nodeId);
    }
  };

  const errorCount = issues.filter(i => i.type === 'error').length;
  const warningCount = issues.filter(i => i.type === 'warning').length;
  const infoCount = issues.filter(i => i.type === 'info').length;

  const getSummaryIcon = () => {
    if (errorCount > 0) return <AlertCircle className="w-5 h-5 text-red-500" />;
    if (warningCount > 0) return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    return <CheckCircle className="w-5 h-5 text-green-500" />;
  };

  const getSummaryText = () => {
    if (errorCount > 0) return `${errorCount} error${errorCount > 1 ? 's' : ''} found`;
    if (warningCount > 0) return `${warningCount} warning${warningCount > 1 ? 's' : ''} found`;
    return 'Process validation passed';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Collapsed Header - Always Visible */}
      <div 
        className="px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getSummaryIcon()}
            <span className="text-sm font-medium text-gray-900">Validation</span>
            {issues.length > 0 && (
              <div className="flex space-x-1">
                {errorCount > 0 && (
                  <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                    {errorCount}
                  </span>
                )}
                {warningCount > 0 && (
                  <span className="px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">
                    {warningCount}
                  </span>
                )}
                {infoCount > 0 && (
                  <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                    {infoCount}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-1">
            {isValidating && <RefreshCw className="w-3 h-3 animate-spin text-gray-400" />}
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div>
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getSummaryIcon()}
                <h3 className="font-medium text-gray-900">Process Validation</h3>
              </div>
              <button
                onClick={runValidation}
                disabled={isValidating}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                title="Refresh validation"
              >
                <RefreshCw className={`w-4 h-4 ${isValidating ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            {/* Summary */}
            <div className="mt-2 text-sm text-gray-600">
              {getSummaryText()}
              {lastValidation && (
                <span className="ml-2 text-xs text-gray-400">
                  (Last checked: {lastValidation.toLocaleTimeString()})
                </span>
              )}
            </div>

            {/* Counters */}
            {issues.length > 0 && (
              <div className="mt-2 flex space-x-4 text-xs">
                {errorCount > 0 && (
                  <span className="flex items-center space-x-1 text-red-600">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errorCount} error{errorCount > 1 ? 's' : ''}</span>
                  </span>
                )}
                {warningCount > 0 && (
                  <span className="flex items-center space-x-1 text-yellow-600">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{warningCount} warning{warningCount > 1 ? 's' : ''}</span>
                  </span>
                )}
                {infoCount > 0 && (
                  <span className="flex items-center space-x-1 text-blue-600">
                    <Info className="w-3 h-3" />
                    <span>{infoCount} suggestion{infoCount > 1 ? 's' : ''}</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Issues List */}
          <div className="max-h-80 overflow-y-auto">
            {isValidating ? (
              <div className="p-4 text-center text-gray-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p>Validating process...</p>
              </div>
            ) : issues.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                {nodes.length === 0 ? (
                  <>
                    <p className="font-medium">Ready to validate</p>
                    <p className="text-sm mt-1">Add elements to start process validation.</p>
                  </>
                ) : (
                  <>
                    <p className="font-medium">Process looks good!</p>
                    <p className="text-sm mt-1">No validation issues found.</p>
                  </>
                )}
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {issues.map((issue) => (
                  <div
                    key={issue.id}
                    className={`p-3 border rounded-lg cursor-pointer hover:shadow-sm transition-shadow ${getIssueColor(issue.type)}`}
                    onClick={() => handleIssueClick(issue)}
                  >
                    <div className="flex items-start space-x-3">
                      {getIssueIcon(issue.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {issue.message}
                        </p>
                        <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
                          <span className="capitalize">{issue.category.replace('-', ' ')}</span>
                          {issue.nodeId && (
                            <>
                              <span>•</span>
                              <span>Click to select element</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Help Text */}
          {issues.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
              <p>
                <strong>Tip:</strong> Click on an issue to select the related element in the diagram.
                Validation helps ensure your process follows BPMN best practices.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};