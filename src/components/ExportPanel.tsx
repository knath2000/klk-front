'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface ExportOptions {
  format: 'json' | 'csv' | 'pdf';
  includeMetadata: boolean;
  includeTimestamps: boolean;
  dateRange?: {
    start?: string;
    end?: string;
  };
}

const ExportPanel: React.FC<{ conversationId: string }> = ({ conversationId }) => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'json',
    includeMetadata: true,
    includeTimestamps: true
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportResult(null);

      const response = await fetch(`/api/analytics/export/conversations/${conversationId}/${exportOptions.format}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        if (exportOptions.format === 'json' || exportOptions.format === 'csv') {
          const blob = exportOptions.format === 'json' 
            ? new Blob([JSON.stringify(await response.json(), null, 2)], { type: 'application/json' })
            : new Blob([await response.text()], { type: 'text/csv' });
          
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `conversation-${conversationId.substring(0, 8)}.${exportOptions.format}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }

        setExportResult({
          success: true,
          message: `Successfully exported conversation as ${exportOptions.format.toUpperCase()}`
        });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      setExportResult({
        success: false,
        message: 'Failed to export conversation. Please try again.'
      });
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Export Conversation</h3>
      
      <div className="space-y-6">
        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Export Format
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['json', 'csv', 'pdf'] as const).map((format) => (
              <button
                key={format}
                type="button"
                onClick={() => setExportOptions({ ...exportOptions, format })}
                className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                  exportOptions.format === format
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                {format.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="includeMetadata"
              checked={exportOptions.includeMetadata}
              onChange={(e) => setExportOptions({ ...exportOptions, includeMetadata: e.target.checked })}
              className="h-4 w-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="includeMetadata" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Include conversation metadata
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="includeTimestamps"
              checked={exportOptions.includeTimestamps}
              onChange={(e) => setExportOptions({ ...exportOptions, includeTimestamps: e.target.checked })}
              className="h-4 w-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="includeTimestamps" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Include message timestamps
            </label>
          </div>
        </div>

        {/* Export Button */}
        <div>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className={`w-full px-4 py-2 rounded-md text-white transition-colors ${
              isExporting
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isExporting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Exporting...
              </div>
            ) : (
              `Export as ${exportOptions.format.toUpperCase()}`
            )}
          </button>
        </div>

        {/* Result Message */}
        {exportResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-md text-sm ${
              exportResult.success
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
            }`}
          >
            {exportResult.message}
          </motion.div>
        )}

        {/* Format Information */}
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          <p className="font-medium mb-1">Format Information:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>JSON</strong>: Complete structured data with all conversation details</li>
            <li><strong>CSV</strong>: Tabular format with messages in rows</li>
            <li><strong>PDF</strong>: Formatted document (requires additional processing)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ExportPanel;