import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Upload, Download, FileText, AlertCircle } from 'lucide-react';
import { BPMNService } from '../services/bpmnService';
import { useDiagramStore } from '../stores/diagramStore';
// Import types for BPMN service
// import { Node, Edge } from 'reactflow'; // Removed unused imports

interface ImportExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportExportDialog({ isOpen, onClose }: ImportExportDialogProps) {
  const { nodes, edges, importDiagram } = useDiagramStore();
  const [activeTab, setActiveTab] = useState('import');
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [exportStatus, setExportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [processName, setProcessName] = useState('Imported Process');

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.bpmn')) {
      setErrorMessage('Please select a valid BPMN file (.bpmn extension)');
      setImportStatus('error');
      return;
    }

    setImportStatus('loading');
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const xmlContent = await file.text();
      const { nodes: importedNodes, edges: importedEdges } = await BPMNService.importBPMN(xmlContent);
      
      // Clear existing diagram and import new one
      importDiagram({
        nodes: importedNodes,
        edges: importedEdges
      });
      
      setImportStatus('success');
      setSuccessMessage(`Successfully imported ${importedNodes.length} elements and ${importedEdges.length} flows from ${file.name}`);
      
      // Auto-close after successful import
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Import failed:', error);
      setImportStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to import BPMN file');
    }

    // Reset file input
    event.target.value = '';
  };

  const handleExport = async () => {
    if (nodes.length === 0) {
      setErrorMessage('No process elements to export');
      setExportStatus('error');
      return;
    }

    setExportStatus('loading');
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const bpmnXml = BPMNService.exportBPMN(nodes, edges, processName);
      
      // Create and download file
      const blob = new Blob([bpmnXml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${processName.replace(/\s+/g, '_')}.bpmn`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportStatus('success');
      setSuccessMessage(`Successfully exported process as ${processName.replace(/\s+/g, '_')}.bpmn`);
      
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to export BPMN file');
    }
  };

  const resetStatus = () => {
    setImportStatus('idle');
    setExportStatus('idle');
    setErrorMessage('');
    setSuccessMessage('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            BPMN Import/Export
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value: string) => { setActiveTab(value); resetStatus(); }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Import
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium mb-2">Import BPMN Process</h3>
              <p className="text-sm text-gray-600 mb-4">
                Import a BPMN 2.0 XML file from Signavio or other BPMN tools. This will replace your current process.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Select BPMN File (.bpmn)
                  </label>
                  <input
                    type="file"
                    accept=".bpmn,.xml"
                    onChange={handleFileImport}
                    disabled={importStatus === 'loading'}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                {importStatus === 'loading' && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    Importing BPMN file...
                  </div>
                )}

                {importStatus === 'success' && successMessage && (
                  <div className="flex items-center gap-2 text-green-600">
                    <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    {successMessage}
                  </div>
                )}

                {importStatus === 'error' && errorMessage && (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    {errorMessage}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Supported Features</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Start, End, and Intermediate Events</li>
                <li>• User, Service, Script, and other Task types</li>
                <li>• Exclusive, Parallel, and Inclusive Gateways</li>
                <li>• Sequence Flows with conditions</li>
                <li>• Message Flows</li>
                <li>• Lanes and Pools</li>
                <li>• Data Objects</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium mb-2">Export BPMN Process</h3>
              <p className="text-sm text-gray-600 mb-4">
                Export your current process as a BPMN 2.0 XML file compatible with Signavio and other BPMN tools.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Process Name
                  </label>
                  <input
                    type="text"
                    value={processName}
                    onChange={(e) => setProcessName(e.target.value)}
                    placeholder="Enter process name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="text-sm text-gray-600">
                  Current process contains:
                  <ul className="mt-1 space-y-1">
                    <li>• {nodes.length} elements</li>
                    <li>• {edges.length} flows</li>
                  </ul>
                </div>

                <Button
                  onClick={handleExport}
                  disabled={exportStatus === 'loading' || nodes.length === 0}
                  className="w-full"
                >
                  {exportStatus === 'loading' ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Export as BPMN
                    </>
                  )}
                </Button>

                {exportStatus === 'success' && successMessage && (
                  <div className="flex items-center gap-2 text-green-600">
                    <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    {successMessage}
                  </div>
                )}

                {exportStatus === 'error' && errorMessage && (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    {errorMessage}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Export Features</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• BPMN 2.0 compliant XML format</li>
                <li>• Signavio-compatible metadata</li>
                <li>• Visual layout information preserved</li>
                <li>• Supports all element types in your process</li>
                <li>• Can be imported into Signavio, Camunda, etc.</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}