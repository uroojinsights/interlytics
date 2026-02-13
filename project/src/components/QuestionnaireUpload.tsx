import React, { useState } from 'react';
import { FileText, Upload, ArrowRight, SkipBack as Skip } from 'lucide-react';

interface QuestionnaireUploadProps {
  onContinue: () => void;
}

export function QuestionnaireUpload({ onContinue }: QuestionnaireUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      // Here you would process the questionnaire file
      // For now, we'll just simulate processing
      setIsUploading(true);
      setTimeout(() => {
        setIsUploading(false);
      }, 2000);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const docFile = files.find(file => 
      file.name.toLowerCase().endsWith('.docx') || 
      file.name.toLowerCase().endsWith('.doc') ||
      file.name.toLowerCase().endsWith('.pdf')
    );
    
    if (docFile) {
      setUploadedFile(docFile);
      setIsUploading(true);
      setTimeout(() => {
        setIsUploading(false);
      }, 2000);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <FileText className="text-green-600" size={28} />
        Upload Your Questionnaire (Optional)
      </h2>
      
      <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
        <h3 className="text-lg font-semibold text-green-800 mb-2">Why Upload Your Questionnaire?</h3>
        <ul className="text-green-700 text-sm space-y-1">
          <li>• <strong>Better AI Detection:</strong> We can map question types more accurately</li>
          <li>• <strong>Visual Question Mapping:</strong> See how your questions relate to data columns</li>
          <li>• <strong>Automatic Multi-Select Detection:</strong> Identify "select all that apply" questions</li>
          <li>• <strong>Improved Text Analysis:</strong> Better context for open-ended responses</li>
        </ul>
        <p className="text-green-600 text-sm mt-2 font-medium">
          This step is completely optional - you can skip it and still get great results!
        </p>
      </div>

      {!uploadedFile ? (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-green-400 hover:bg-green-50 transition-all duration-300 cursor-pointer"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => document.getElementById('questionnaire-input')?.click()}
        >
          <Upload className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-lg text-gray-600 mb-2">
            Drop your questionnaire here or click to browse
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Supports Word documents (.docx, .doc) and PDF files
          </p>
          
          <input
            id="questionnaire-input"
            type="file"
            accept=".docx,.doc,.pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={() => document.getElementById('questionnaire-input')?.click()}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <Upload size={20} />
              Choose File
            </button>
            <span className="text-gray-400">or</span>
            <button
              onClick={onContinue}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Skip size={20} />
              Skip This Step
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-3">
              <FileText className="text-blue-600" size={24} />
              <div>
                <h4 className="font-semibold text-blue-800">{uploadedFile.name}</h4>
                <p className="text-blue-600 text-sm">
                  {isUploading ? 'Processing questionnaire...' : 'Questionnaire processed successfully!'}
                </p>
              </div>
            </div>
          </div>

          {!isUploading && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2">Questionnaire Analysis Complete</h4>
              <ul className="text-green-700 text-sm space-y-1">
                <li>• ✓ Question types automatically detected</li>
                <li>• ✓ Multi-select questions identified</li>
                <li>• ✓ Question-to-column mapping established</li>
                <li>• ✓ Context prepared for AI text analysis</li>
              </ul>
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={onContinue}
              disabled={isUploading}
              className="flex items-center gap-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg"
            >
              {isUploading ? 'Processing...' : 'Continue to Multi-Select Setup'}
              <ArrowRight size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}