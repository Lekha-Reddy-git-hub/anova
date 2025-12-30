import { useState, useEffect, useCallback } from 'react';
import { Clipboard } from 'lucide-react';
import { ParsedData, VarianceRow, FilterState, ProjectSettings, Project, ChatMessage } from './types';
import { generateSampleData } from './utils/sampleData';
import { filterData, exportAnalysis, applyThresholds } from './utils/helpers';
import { getProjects, createProject, updateProject, deleteProject, loadFromCloud, DEFAULT_SETTINGS, isStorageAvailable } from './utils/storage';

import Header from './components/Header';
import LandingPage from './components/LandingPage';
import SummaryCards from './components/SummaryCards';
import FiltersPanel from './components/FiltersPanel';
import VarianceTable from './components/VarianceTable';
import VarianceCharts from './components/VarianceCharts';
import TopVariances from './components/TopVariances';
import SaveProjectModal from './components/SaveProjectModal';
import ProjectsSidebar from './components/ProjectsSidebar';
import AIChat from './components/AIChat';
import ThresholdSettings from './components/ThresholdSettings';
import ExecutiveSummary from './components/ExecutiveSummary';
import ImportWizard from './components/ImportWizard';
import KPIDashboard from './components/KPIDashboard';
import ScreenshotImport from './components/ScreenshotImport';
import WaterfallChart from './components/WaterfallChart';

function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'analysis'>('landing');
  const [data, setData] = useState<ParsedData | null>(null);
  const [settings, setSettings] = useState<ProjectSettings>(DEFAULT_SETTINGS);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    costCenters: [],
    glAccounts: [],
    periods: [],
    showOnlySignificant: false,
    showOnlyStarred: false,
    statuses: [],
    owners: [],
  });
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [showProjectsSidebar, setShowProjectsSidebar] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [showScreenshotImport, setShowScreenshotImport] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [storageAvailable] = useState(isStorageAvailable());
  const [activeTab, setActiveTab] = useState<'overview' | 'details'>('overview');

  useEffect(() => {
    if (storageAvailable) {
      // Load local first (instant)
      setProjects(getProjects());
      // Then sync with cloud (background)
      loadFromCloud().then(cloudProjects => {
        setProjects(cloudProjects);
      });
    }
  }, [storageAvailable]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // Apply thresholds and then filter
  const dataWithThresholds = data ? applyThresholds(data.rows, settings.varianceThresholdPercent, settings.varianceThresholdDollar) : [];
  const filteredData = filterData(dataWithThresholds, filters);

  const handleDataLoaded = useCallback((parsedData: ParsedData) => {
    setData(parsedData);
    setCurrentView('analysis');
    setCurrentProject(null);
    setChatHistory([]);
    setFilters({ search: '', costCenters: [], glAccounts: [], periods: [], showOnlySignificant: false, showOnlyStarred: false, statuses: [], owners: [] });
  }, []);

  const handleLoadSampleData = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      handleDataLoaded(generateSampleData());
      setIsLoading(false);
    }, 500);
  }, [handleDataLoaded]);

  const handleUpdateRow = useCallback((rowId: string, updates: Partial<VarianceRow>) => {
    if (!data) return;
    const updatedRows = data.rows.map(row => row.id === rowId ? { ...row, ...updates } : row);
    setData({ ...data, rows: updatedRows });
  }, [data]);

  const handleSaveProject = useCallback((name: string) => {
    if (!data) return;
    if (currentProject) {
      const updated = updateProject(currentProject.id, { name, data, settings, chatHistory });
      if (updated) { setCurrentProject(updated); setProjects(getProjects()); }
    } else {
      const newProject = createProject(name, data, settings, chatHistory);
      setCurrentProject(newProject);
      setProjects(getProjects());
    }
  }, [data, settings, chatHistory, currentProject]);

  const handleLoadProject = useCallback((project: Project) => {
    setData(project.data);
    setSettings(project.settings);
    setChatHistory(project.chatHistory);
    setCurrentProject(project);
    setCurrentView('analysis');
    setShowProjectsSidebar(false);
    setFilters({ search: '', costCenters: [], glAccounts: [], periods: [], showOnlySignificant: false, showOnlyStarred: false, statuses: [], owners: [] });
  }, []);

  const handleDeleteProject = useCallback((projectId: string) => {
    deleteProject(projectId);
    setProjects(getProjects());
    if (currentProject?.id === projectId) setCurrentProject(null);
  }, [currentProject]);

  const costCenters = data ? [...new Set(data.rows.map(r => r.costCenter).filter(Boolean))] as string[] : [];
  const glAccounts = data ? [...new Set(data.rows.map(r => r.glAccount).filter(Boolean))] as string[] : [];
  const owners = data ? [...new Set(data.rows.map(r => r.owner).filter(Boolean))] as string[] : [];

  const handleExport = () => {
    if (data) exportAnalysis(dataWithThresholds);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0C] transition-colors">
      <Header
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onShowProjects={() => setShowProjectsSidebar(true)}
        projectCount={projects.length}
        showBackButton={currentView === 'analysis'}
        onBack={() => setCurrentView('landing')}
      />
      
      <main className="relative">
        {currentView === 'landing' ? (
          <LandingPage 
            onDataLoaded={handleDataLoaded} 
            onLoadSampleData={handleLoadSampleData} 
            isLoading={isLoading}
            recentProjects={projects}
            onLoadProject={handleLoadProject}
          />
        ) : data && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {/* Tab Navigation */}
            <div className="flex items-center gap-4 border-b border-gray-200 dark:border-[#1F1F23]">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'overview' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview & KPIs
              </button>
              <button
                onClick={() => setActiveTab('details')}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'details' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Variance Details
              </button>
              <div className="flex-1" />
              <button
                onClick={() => setShowImportWizard(true)}
                className="mb-3 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <Clipboard className="w-4 h-4" />
                Paste Data
              </button>
            </div>

            {activeTab === 'overview' && (
              <>
                <ThresholdSettings settings={settings} onUpdateSettings={(u) => setSettings(p => ({ ...p, ...u }))} />
                <KPIDashboard data={dataWithThresholds} />
                <ExecutiveSummary data={dataWithThresholds} />
                <SummaryCards data={filteredData} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <VarianceCharts data={filteredData} />
                  <WaterfallChart data={filteredData} />
                </div>
              </>
            )}

            {activeTab === 'details' && (
              <>
                <FiltersPanel
                  filters={filters}
                  settings={settings}
                  onUpdateFilters={(u) => setFilters(p => ({ ...p, ...u }))}
                  onUpdateSettings={(u) => setSettings(p => ({ ...p, ...u }))}
                  costCenters={costCenters}
                  glAccounts={glAccounts}
                  hasCostCenter={data.hasCostCenter}
                  hasGLAccount={data.hasGLAccount}
                  totalRows={data.rows.length}
                  filteredRows={filteredData.length}
                  onSaveProject={() => setShowSaveModal(true)}
                  onExport={handleExport}
                />
                <TopVariances data={filteredData} />
                <VarianceTable data={filteredData} groupBy={settings.groupBy} onUpdateRow={handleUpdateRow} />
              </>
            )}

            <AIChat data={dataWithThresholds} />
          </div>
        )}
      </main>
      
      <SaveProjectModal isOpen={showSaveModal} onClose={() => setShowSaveModal(false)} onSave={handleSaveProject} currentProjectName={currentProject?.name} />
      <ProjectsSidebar isOpen={showProjectsSidebar} onClose={() => setShowProjectsSidebar(false)} projects={projects} currentProjectId={currentProject?.id} onLoadProject={handleLoadProject} onDeleteProject={handleDeleteProject} />
      <ImportWizard isOpen={showImportWizard} onClose={() => setShowImportWizard(false)} onImport={handleDataLoaded} />
      <ScreenshotImport isOpen={showScreenshotImport} onClose={() => setShowScreenshotImport(false)} onImport={handleDataLoaded} />
    </div>
  );
}

export default App;
