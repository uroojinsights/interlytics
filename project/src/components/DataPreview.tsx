import React from 'react';
import { ExcelData } from '../types';
import { Eye, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';

interface DataPreviewProps {
  data: ExcelData;
  isCollapsible?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function DataPreview({ data, isCollapsible = false, isCollapsed = false, onToggleCollapse }: DataPreviewProps) {
  const previewRows = data.rows.slice(0, 5);

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <Eye className="text-green-600" size={28} />
          Data Preview
        </h2>
        {isCollapsible && (
          <button
            onClick={onToggleCollapse}
            className="flex items-center gap-2 text-green-600 hover:text-green-700 px-3 py-1 rounded-lg hover:bg-green-50 transition-colors"
          >
            {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
            {isCollapsed ? 'Show' : 'Hide'} Preview
          </button>
        )}
      </div>
      
      {!isCollapsed && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{data.headers.length}</div>
              <div className="text-sm text-gray-600">Columns</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{data.rows.length}</div>
              <div className="text-sm text-gray-600">Rows</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{data.fileName}</div>
              <div className="text-sm text-gray-600">File Name</div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  {data.headers.map((header, index) => (
                    <th
                      key={index}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewRows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50">
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="px-4 py-3 text-sm text-gray-900 border-b"
                      >
                        {String(cell || '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {data.rows.length > 5 && (
            <p className="text-sm text-gray-500 mt-4 text-center">
              Showing first 5 rows of {data.rows.length} total rows
            </p>
          )}
        </>
      )}
      
      {isCollapsed && (
        <div className="text-center py-4 text-gray-500">
          <p className="text-sm">
            {data.headers.length} columns • {data.rows.length} rows • {data.fileName}
          </p>
        </div>
      )}
    </div>
  );
}