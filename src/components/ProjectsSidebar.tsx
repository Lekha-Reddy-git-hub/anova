import { X, FolderOpen, Clock, Trash2, ChevronRight } from 'lucide-react';
import { Project } from '../types';

interface ProjectsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  currentProjectId?: string;
  onLoadProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
}

export default function ProjectsSidebar({ isOpen, onClose, projects, currentProjectId, onLoadProject, onDeleteProject }: ProjectsSidebarProps) {
  const formatDate = (date: Date) => {
    const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />}
      <div className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-[#0F0F12] shadow-xl z-50 transform transition-transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-[#1F1F23]">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My Projects</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1F1F23]">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="h-[calc(100%-4rem)] overflow-y-auto p-3 space-y-2">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <FolderOpen className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-900 dark:text-white font-medium">No saved projects</p>
              <p className="text-sm text-gray-500">Upload data and save to see it here</p>
            </div>
          ) : (
            projects.map(project => (
              <div key={project.id} className={`rounded-lg border transition-all ${currentProjectId === project.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-[#1F1F23] hover:border-gray-300'}`}>
                <button onClick={() => onLoadProject(project)} className="w-full p-3 text-left">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">{project.name}</h3>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(project.updatedAt)}</span>
                    <span>{project.data.rows.length} rows</span>
                  </div>
                </button>
                <div className="px-3 pb-3 flex justify-end">
                  <button onClick={() => onDeleteProject(project.id)} className="px-2 py-1 text-xs rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-1">
                    <Trash2 className="w-3 h-3" />Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
