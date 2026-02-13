import React, { useState } from 'react';
import { X, BarChart3, CheckCircle, ArrowRight, Mail } from 'lucide-react';

interface OnboardingOverlayProps {
  onComplete: (email?: string) => void;
}

export function OnboardingOverlay({ onComplete }: OnboardingOverlayProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [email, setEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);

  const slides = [
    {
      title: "Welcome to Cross-Tabulation Analysis",
      content: (
        <div className="text-center">
          <div className="mb-6">
            <BarChart3 size={80} className="text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Turn Your Survey Data Into Insights
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              Cross-tabs (cross-tabulations) are tables that show how different answers compare across questions—making it easy to spot patterns, differences, and trends in your data.
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-left">
            <h3 className="font-semibold text-blue-800 mb-2">Perfect for:</h3>
            <ul className="text-blue-700 space-y-1">
              <li>• Survey researchers and analysts</li>
              <li>• Market research professionals</li>
              <li>• Anyone with Excel data to analyze</li>
              <li>• No technical background needed!</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "How It Works - Simple 6-Step Process",
      content: (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-2">1</div>
                <h3 className="font-semibold text-green-800">Upload Your Data</h3>
              </div>
              <p className="text-green-700 text-sm">Upload your Excel file with survey responses</p>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-2">2</div>
                <h3 className="font-semibold text-blue-800">AI Detection</h3>
              </div>
              <p className="text-blue-700 text-sm">Our AI automatically detects question types</p>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-2">3</div>
                <h3 className="font-semibold text-purple-800">Review & Adjust</h3>
              </div>
              <p className="text-purple-700 text-sm">Review AI suggestions and make adjustments</p>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <div className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-2">4</div>
                <h3 className="font-semibold text-orange-800">Set Up Tables</h3>
              </div>
              <p className="text-orange-700 text-sm">Choose your rows (side breaks) and columns (top breaks)</p>
            </div>
            
            <div className="bg-indigo-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-2">5</div>
                <h3 className="font-semibold text-indigo-800">Advanced Options</h3>
              </div>
              <p className="text-indigo-700 text-sm">Add filters, custom variables, and AI text coding</p>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <div className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-2">6</div>
                <h3 className="font-semibold text-red-800">Get Results</h3>
              </div>
              <p className="text-red-700 text-sm">Professional Excel report with insights</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Key Terms Made Simple",
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Side Breaks (Rows)</h3>
            <p className="text-blue-700 text-sm">
              The questions or variables that appear as rows in your table. 
              For example: Age groups, satisfaction ratings, or product preferences.
            </p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">Top Breaks/Banner (Columns)</h3>
            <p className="text-green-700 text-sm">
              The questions that appear as columns across the top of your table. 
              For example: Gender, region, or customer type.
            </p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="font-semibold text-purple-800 mb-2">Multi-Select Questions</h3>
            <p className="text-purple-700 text-sm">
              Questions where respondents can choose multiple answers. 
              For example: "Which social media platforms do you use?" (Facebook, Instagram, Twitter, etc.)
            </p>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-4">
            <h3 className="font-semibold text-orange-800 mb-2">Statistical Significance</h3>
            <p className="text-orange-700 text-sm">
              Shows when differences between groups are meaningful (not just by chance). 
              Marked with * for significantly higher and ↓ for significantly lower.
            </p>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      setShowEmailInput(true);
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleComplete = () => {
    onComplete(email || undefined);
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="flex space-x-2">
                {slides.map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full ${
                      index === currentSlide ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500 ml-2">
                {currentSlide + 1} of {slides.length}
              </span>
            </div>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {!showEmailInput ? (
            <>
              <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
                {slides[currentSlide].title}
              </h1>
              
              <div className="mb-8">
                {slides[currentSlide].content}
              </div>

              <div className="flex justify-between items-center">
                <button
                  onClick={handlePrevious}
                  disabled={currentSlide === 0}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleSkip}
                    className="px-6 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Skip Tutorial
                  </button>
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center">
              <CheckCircle size={80} className="text-green-600 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Ready to Start Analyzing!
              </h2>
              <p className="text-gray-600 mb-6">
                Optionally provide your email to help us improve the tool based on your usage patterns.
                This helps our AI learn and provide better suggestions for future users.
              </p>
              
              <div className="max-w-md mx-auto mb-6">
                <div className="flex items-center gap-3">
                  <Mail className="text-gray-400" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com (optional)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  We'll only use this to improve our AI detection algorithms. No spam, ever.
                </p>
              </div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={handleComplete}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Skip Email
                </button>
                <button
                  onClick={handleComplete}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg transition-colors"
                >
                  Start Analyzing
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}