import React, { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, Save, Edit2, FileText, Plus, Trash2 } from 'lucide-react';
import { ProjectContext } from '../types';

interface ProjectContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialContext?: ProjectContext | null;
  onSave: (context: ProjectContext) => void;
}

export const ProjectContextModal: React.FC<ProjectContextModalProps> = ({
  isOpen,
  onClose,
  initialContext,
  onSave
}) => {
  const [rawInput, setRawInput] = useState('');
  const [parsedContext, setParsedContext] = useState<ProjectContext | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Editable fields
  const [projectName, setProjectName] = useState('');
  const [industry, setIndustry] = useState('');
  const [processType, setProcessType] = useState('');
  const [businessObjective, setBusinessObjective] = useState('');
  const [stakeholders, setStakeholders] = useState<string[]>([]);
  const [businessRules, setBusinessRules] = useState<string[]>([]);
  const [systemIntegrations, setSystemIntegrations] = useState<string[]>([]);
  const [complianceRequirements, setComplianceRequirements] = useState<string[]>([]);
  const [customTerminology, setCustomTerminology] = useState<Record<string, string>>({});
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Load initial context if provided
  useEffect(() => {
    if (initialContext && isOpen) {
      setRawInput(initialContext.rawInput);
      setParsedContext(initialContext);
      loadContextIntoFields(initialContext);
    } else if (isOpen && !initialContext) {
      // Reset on open if no initial context
      resetFields();
    }
  }, [initialContext, isOpen]);

  const resetFields = () => {
    setRawInput('');
    setParsedContext(null);
    setProjectName('');
    setIndustry('');
    setProcessType('');
    setBusinessObjective('');
    setStakeholders([]);
    setBusinessRules([]);
    setSystemIntegrations([]);
    setComplianceRequirements([]);
    setCustomTerminology({});
    setAdditionalNotes('');
    setIsEditing(false);
    setParseError(null);
  };

  const loadContextIntoFields = (context: ProjectContext) => {
    setProjectName(context.projectName);
    setIndustry(context.industry || '');
    setProcessType(context.processType || '');
    setBusinessObjective(context.businessObjective || '');
    setStakeholders(context.stakeholders || []);
    setBusinessRules(context.businessRules || []);
    setSystemIntegrations(context.systemIntegrations || []);
    setComplianceRequirements(context.complianceRequirements || []);
    setCustomTerminology(context.customTerminology || {});
    setAdditionalNotes(context.additionalNotes || '');
  };

  const handleParseWithAI = async () => {
    if (!rawInput.trim()) {
      setParseError('Please enter some context information first');
      return;
    }

    setIsParsing(true);
    setParseError(null);

    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
      const response = await fetch(`${API_BASE_URL}/parse-project-context`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawInput }),
      });

      if (!response.ok) {
        throw new Error(`Failed to parse context: ${response.statusText}`);
      }

      const parsed = await response.json();
      console.log('✅ Parsed context:', parsed);

      const now = new Date().toISOString();
      const fullContext: ProjectContext = {
        rawInput,
        ...parsed,
        createdAt: initialContext?.createdAt || now,
        updatedAt: now,
        lastParsedAt: now,
      };

      setParsedContext(fullContext);
      loadContextIntoFields(fullContext);
      setIsEditing(true);
    } catch (error) {
      console.error('❌ Parse error:', error);
      setParseError('Failed to parse context. Please try again or edit manually.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSave = () => {
    if (!projectName.trim()) {
      setParseError('Project name is required');
      return;
    }

    const now = new Date().toISOString();
    const context: ProjectContext = {
      rawInput,
      projectName: projectName.trim(),
      industry: industry.trim() || undefined,
      processType: processType.trim() || undefined,
      businessObjective: businessObjective.trim() || undefined,
      stakeholders: stakeholders.filter(s => s.trim()),
      businessRules: businessRules.filter(r => r.trim()),
      systemIntegrations: systemIntegrations.filter(s => s.trim()),
      complianceRequirements: complianceRequirements.filter(c => c.trim()),
      customTerminology,
      additionalNotes: additionalNotes.trim() || undefined,
      createdAt: parsedContext?.createdAt || initialContext?.createdAt || now,
      updatedAt: now,
      lastParsedAt: parsedContext?.lastParsedAt,
    };

    onSave(context);
    onClose();
  };

  const addArrayItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => [...prev, '']);
  };

  const updateArrayItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string
  ) => {
    setter(prev => prev.map((item, i) => (i === index ? value : item)));
  };

  const removeArrayItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number
  ) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Project Context</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Help AI understand your process better
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {!isEditing ? (
              /* Step 1: Text Dump Area */
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tell us about your process
                  </label>
                  <textarea
                    value={rawInput}
                    onChange={(e) => setRawInput(e.target.value)}
                    rows={12}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                    placeholder="Paste or type everything about your process here...

Example:
This is an insurance claims processing workflow. The main stakeholders are Claims Adjusters who review submissions, Senior Managers who approve high-value claims over $50k, and Customer Service who handles inquiries. We need to comply with HIPAA regulations. The business goal is to reduce processing time from 5 days to 2 days. We integrate with Salesforce CRM and SAP Finance. Key terms: FNOL means First Notice of Loss, LOB means Line of Business."
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Tip: Include stakeholders, business rules, systems, compliance requirements, and any domain-specific terminology
                  </p>
                </div>

                {parseError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {parseError}
                  </div>
                )}

                <button
                  onClick={handleParseWithAI}
                  disabled={isParsing || !rawInput.trim()}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-medium"
                >
                  {isParsing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>AI is parsing your context...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Parse with AI</span>
                    </>
                  )}
                </button>

                {initialContext && (
                  <button
                    onClick={() => {
                      loadContextIntoFields(initialContext);
                      setIsEditing(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit Existing Context</span>
                  </button>
                )}
              </div>
            ) : (
              /* Step 2: Structured Fields */
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    ✅ AI has parsed your context! Review and edit the fields below, then save.
                  </p>
                </div>

                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-purple-500 rounded-full"></span>
                    Basic Information
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Name *
                    </label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g., Insurance Claims Processing"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Industry
                      </label>
                      <input
                        type="text"
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="e.g., Insurance, Healthcare"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Process Type
                      </label>
                      <input
                        type="text"
                        value={processType}
                        onChange={(e) => setProcessType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="e.g., Approval, Fulfillment"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Objective
                    </label>
                    <textarea
                      value={businessObjective}
                      onChange={(e) => setBusinessObjective(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g., Reduce processing time from 5 days to 2 days"
                    />
                  </div>
                </div>

                {/* Stakeholders */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                      Stakeholders
                    </h3>
                    <button
                      onClick={() => addArrayItem(setStakeholders)}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {stakeholders.map((stakeholder, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={stakeholder}
                          onChange={(e) => updateArrayItem(setStakeholders, index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Claims Adjuster, Senior Manager"
                        />
                        <button
                          onClick={() => removeArrayItem(setStakeholders, index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Business Rules */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <span className="w-1.5 h-6 bg-yellow-500 rounded-full"></span>
                      Business Rules
                    </h3>
                    <button
                      onClick={() => addArrayItem(setBusinessRules)}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-md transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {businessRules.map((rule, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={rule}
                          onChange={(e) => updateArrayItem(setBusinessRules, index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          placeholder="e.g., Claims >$50k require senior approval"
                        />
                        <button
                          onClick={() => removeArrayItem(setBusinessRules, index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Integrations */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <span className="w-1.5 h-6 bg-green-500 rounded-full"></span>
                      System Integrations
                    </h3>
                    <button
                      onClick={() => addArrayItem(setSystemIntegrations)}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {systemIntegrations.map((system, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={system}
                          onChange={(e) => updateArrayItem(setSystemIntegrations, index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="e.g., Salesforce CRM, SAP Finance"
                        />
                        <button
                          onClick={() => removeArrayItem(setSystemIntegrations, index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Compliance Requirements */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <span className="w-1.5 h-6 bg-red-500 rounded-full"></span>
                      Compliance Requirements
                    </h3>
                    <button
                      onClick={() => addArrayItem(setComplianceRequirements)}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {complianceRequirements.map((req, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={req}
                          onChange={(e) => updateArrayItem(setComplianceRequirements, index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                          placeholder="e.g., HIPAA, SOX, GDPR"
                        />
                        <button
                          onClick={() => removeArrayItem(setComplianceRequirements, index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-gray-500 rounded-full"></span>
                    Additional Notes
                  </h3>
                  <textarea
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                    placeholder="Any other context the AI should know..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            {isEditing && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setParseError(null);
                  }}
                  className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
                >
                  <Save className="w-4 h-4" />
                  Save Context
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
