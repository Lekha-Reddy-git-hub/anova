import { Moon, Sun, FolderOpen, ChevronLeft, TrendingUp } from 'lucide-react';

interface HeaderProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onShowProjects: () => void;
  projectCount: number;
  showBackButton: boolean;
  onBack: () => void;
}

export default function Header({
  isDarkMode,
  onToggleDarkMode,
  onShowProjects,
  projectCount,
  showBackButton,
  onBack,
}: HeaderProps) {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-[#0F0F12] border-b border-gray-200 dark:border-[#1F1F23]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            {showBackButton && (
              <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1F1F23] transition-colors">
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            )}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#1e40af]">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Anova AI</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">FP&A Variance Analyzer</p>
              </div>
            </div>

            {/* Navigation - show only on landing page */}
            {!showBackButton && (
              <nav className="hidden md:flex items-center gap-6 ml-8">
                <button 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Product
                </button>
                <button 
                  onClick={() => scrollToSection('how-it-works')}
                  className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  How it works
                </button>
              </nav>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={onShowProjects} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1F1F23] transition-colors">
              <FolderOpen className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-300">Projects</span>
              {projectCount > 0 && (
                <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-[#1e40af] dark:bg-blue-900/30 dark:text-blue-400">
                  {projectCount}
                </span>
              )}
            </button>
            
            <button onClick={onToggleDarkMode} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1F1F23] transition-colors">
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-gray-600" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
