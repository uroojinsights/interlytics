import React, { useState } from 'react';
import { X, Edit3, Save } from 'lucide-react';

interface TableNamingModalProps {
  tables: Array<{ variable: string; banners: string[]; suggestedName: string }>;
  onConfirm: (tableNames: Record<string, string>) => void;
  onCancel: () => void;
}

export function TableNamingModal({ tables, onConfirm, onCancel }: TableNamingModalProps) {
  const [tableNames, setTableNames] = useState<Record<string, string>>(
    tables.reduce((acc, table) => {
      acc[table.variable] = table.suggestedName;
      return acc;
    }, {} as Record<string, string>)
  );

  const handleNameChange = (variable: string, name: string) => {
    setTableNames(prev => ({
      ...prev,
      [variable]: name
    }));
  };

  const handleConfirm = () => {
    onConfirm(tableNames);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <Edit3 className="text-blue-600" size={28} />
            Name Your Tables
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-blue-700 text-sm">
            Customize the names for your cross-tabulation tables. These names will appear in the output, 
            index sheet, and Excel tab titles. Use descriptive names that clearly identify each analysis.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          {tables.map((table, index) => (
            <div key={table.variable} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Table Name
                    </label>
                    <input
                      type="text"
                      value={tableNames[table.variable] || ''}
                      onChange={(e) => handleNameChange(table.variable, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter table name..."
                    />
                  </div>
                  <div className="text-sm text-gray-600">
                    <p><strong>Variable:</strong> {table.variable}</p>
                    <p><strong>Cross-tabulated by:</strong> {table.banners.join(', ')}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Save size={20} />
            Confirm Names
          </button>
        </div>
      </div>
    </div>
  );
}