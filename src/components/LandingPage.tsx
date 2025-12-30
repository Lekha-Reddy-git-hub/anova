import { useState, useCallback, useRef } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  AlertCircle, 
  Loader2,
  Clock,
  ChevronRight,
  Sparkles,
  BarChart3,
  Files,
  Camera,
  TrendingUp,
  Search,
  Zap
} from 'lucide-react';
import { ParsedData, Project } from '../types';
import { parseFile } from '../utils/fileParser';
import MultiFileUpload from './MultiFileUpload';
import ScreenshotImport from './ScreenshotImport';

interface LandingPageProps {
  onDataLoaded: (data: ParsedData) => void;
  onLoadSampleData: () => void;
  isLoading: boolean;
  recentProjects: Project[];
  onLoadProject: (project: Project) => void;
}

export default function LandingPage({ 
  onDataLoaded, 
  onLoadSampleData, 
  isLoading,
  recentProjects,
  onLoadProject
}: LandingPageProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [showMultiUpload, setShowMultiUpload] = useState(false);
  const [showScreenshotImport, setShowScreenshotImport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setIsParsing(true);
    setError(null);
    try {
      const data = await parseFile(file);
      onDataLoaded(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
    } finally {
      setIsParsing(false);
    }
  }, [onDataLoaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const features = [
    {
      icon: BarChart3,
      title: 'Smart Variance Detection',
      description: 'Automatically flag significant variances based on customizable thresholds',
    },
    {
      icon: Search,
      title: 'Multi-Dimensional Analysis',
      description: 'Slice data by cost center, GL account, period, or custom dimensions',
    },
    {
      icon: Zap,
      title: 'AI-Powered Insights',
      description: 'Ask questions in plain English and get instant answers about your data',
    },
  ];

  const steps = [
    {
      icon: Upload,
      title: 'Upload Your Data',
      description: 'Drop your CSV or Excel file with budget and actual figures',
    },
    {
      icon: TrendingUp,
      title: 'Review Variances',
      description: 'See calculated variances with sorting, filtering, and grouping',
    },
    {
      icon: Sparkles,
      title: 'Get AI Insights',
      description: 'Ask questions and receive intelligent analysis of your data',
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <div className="pt-12 pb-8 bg-white dark:bg-[#0A0A0C]">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight whitespace-nowrap">
            Unlock AI-Powered Insights <span className="text-[#0d9488]">Instantly</span>
          </h1>
          <p className="mt-5 text-xl text-gray-600 dark:text-gray-400">
            The quickest way to decode budget discrepancies and drive better decisions.
          </p>
        </div>
      </div>

      {/* Upload Section - Clean & Professional */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="hidden"
        />

        {/* Upload Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`bg-[#f8fafc] dark:bg-[#1F1F23] rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-all ${
            isDragActive 
              ? 'border-[#0d9488] bg-teal-50 dark:bg-teal-900/10' 
              : 'border-[#e2e8f0] dark:border-[#2A2A2E] hover:border-[#0d9488]'
          }`}
        >
          {isParsing || isLoading ? (
            <Loader2 className="w-14 h-14 text-[#0d9488] animate-spin mx-auto mb-4" />
          ) : (
            <Upload className={`w-14 h-14 mx-auto mb-4 ${isDragActive ? 'text-[#0d9488]' : 'text-gray-400'}`} />
          )}
          
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Drop your budget file here
          </h3>
          <p className="text-base text-gray-500 dark:text-gray-400">
            CSV or Excel supported • Budget and Actual columns required
          </p>
        </div>

        {/* Three Buttons Row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto px-6 py-3 text-base font-medium rounded-lg bg-[#0d9488] text-white hover:bg-[#0f766e] transition-colors"
          >
            <FileSpreadsheet className="w-5 h-5 mr-2 inline" />
            Browse Files
          </button>
          <button 
            onClick={() => setShowMultiUpload(true)}
            className="w-full sm:w-auto px-6 py-3 text-base font-medium rounded-lg bg-gray-100 dark:bg-[#2A2A2E] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#3A3A3E] hover:bg-gray-200 dark:hover:bg-[#3A3A3E] transition-colors"
          >
            <Files className="w-5 h-5 mr-2 inline" />
            Upload Multiple
          </button>
          <button 
            onClick={() => setShowScreenshotImport(true)}
            className="w-full sm:w-auto px-6 py-3 text-base font-medium rounded-lg bg-gray-100 dark:bg-[#2A2A2E] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#3A3A3E] hover:bg-gray-200 dark:hover:bg-[#3A3A3E] transition-colors"
          >
            <Camera className="w-5 h-5 mr-2 inline" />
            Import Screenshot
          </button>
        </div>

        {/* Sample Data Link */}
        <div className="text-center mt-6">
          <span className="text-base text-gray-500">or </span>
          <button 
            onClick={onLoadSampleData}
            disabled={isLoading || isParsing}
            className="text-base font-medium text-[#0d9488] hover:text-[#0f766e] hover:underline disabled:opacity-50"
          >
            try with sample data
          </button>
        </div>

        {/* Max File Size */}
        <p className="text-center text-sm text-gray-400 mt-4">
          Max file size: 10MB
        </p>

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Recent Projects */}
        {recentProjects.length > 0 && (
          <div className="mt-10">
            <h3 className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
              <Clock className="w-4 h-4" />
              Recent Projects
            </h3>
            <div className="bg-white dark:bg-[#0F0F12] rounded-xl border border-gray-200 dark:border-[#1F1F23] overflow-hidden">
              {recentProjects.slice(0, 3).map((project, index) => (
                <button
                  key={project.id}
                  onClick={() => onLoadProject(project)}
                  className={`w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#1F1F23] transition-colors text-left ${
                    index !== 0 ? 'border-t border-gray-200 dark:border-[#1F1F23]' : ''
                  }`}
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{project.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{project.data.rows.length} items • {new Date(project.updatedAt).toLocaleDateString()}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Features */}
      <div id="features" className="py-16 bg-gray-50 dark:bg-[#0A0A0C]">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-10">
            Everything you need for variance analysis
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div 
                key={feature.title} 
                className="bg-white dark:bg-[#0F0F12] rounded-xl p-6 border border-gray-200 dark:border-[#1F1F23] text-center"
              >
                <div className="w-14 h-14 rounded-xl bg-[#1e40af]/10 dark:bg-[#1e40af]/20 flex items-center justify-center mb-4 mx-auto">
                  <feature.icon className="w-7 h-7 text-[#1e40af]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-base text-gray-600 dark:text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div id="how-it-works" className="py-16 bg-white dark:bg-[#0F0F12]">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-3">
            How it works
          </h2>
          <p className="text-center text-lg text-gray-600 dark:text-gray-400 mb-12">
            From upload to insights in under 30 seconds
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {steps.map((step, index) => (
              <div key={step.title} className="text-center">
                <div className="relative inline-flex mb-5">
                  <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-[#1F1F23] flex items-center justify-center">
                    <step.icon className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 bg-[#1e40af] text-white text-sm font-bold rounded-lg flex items-center justify-center">
                    {index + 1}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-base text-gray-600 dark:text-gray-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-8 border-t border-gray-200 dark:border-[#1F1F23] bg-gray-50 dark:bg-[#0A0A0C]">
        <p className="text-center text-base text-gray-500 dark:text-gray-400">
          Built for FP&A professionals • Your data stays in your browser
        </p>
      </div>

      {/* Modals */}
      <MultiFileUpload 
        isOpen={showMultiUpload} 
        onClose={() => setShowMultiUpload(false)} 
        onImport={onDataLoaded} 
      />
      <ScreenshotImport
        isOpen={showScreenshotImport}
        onClose={() => setShowScreenshotImport(false)}
        onImport={onDataLoaded}
      />
    </div>
  );
}
