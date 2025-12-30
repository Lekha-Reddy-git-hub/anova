import { Project, ParsedData, ProjectSettings, ChatMessage } from '../types';
import { supabase, getDeviceId } from './supabase';

const STORAGE_KEY = 'anova-pro-projects';

export const DEFAULT_SETTINGS: ProjectSettings = {
  varianceThresholdPercent: 10,
  varianceThresholdDollar: 50000,
  groupBy: 'none',
  viewMode: 'full',
};

export const isStorageAvailable = (): boolean => {
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    return true;
  } catch {
    return false;
  }
};

// Local storage functions (synchronous)
export const getProjects = (): Project[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored).map((p: Project) => ({
      ...p,
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt),
    }));
  } catch {
    return [];
  }
};

export const saveProjects = (projects: Project[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
};

// Cloud sync (background)
const syncToCloud = async (project: Project, action: 'upsert' | 'delete') => {
  try {
    const deviceId = getDeviceId();
    
    if (action === 'delete') {
      await supabase.from('projects').delete().eq('id', project.id);
    } else {
      await supabase.from('projects').upsert({
        id: project.id,
        device_id: deviceId,
        name: project.name,
        data: project.data,
        settings: project.settings,
        chat_history: project.chatHistory,
        created_at: project.createdAt.toISOString(),
        updated_at: project.updatedAt.toISOString(),
      });
    }
  } catch (e) {
    // Silently fail cloud sync - localStorage is primary
    console.log('Cloud sync skipped (table may not exist yet)');
  }
};

// Load from cloud on startup (merge with local)
export const loadFromCloud = async (): Promise<Project[]> => {
  try {
    const deviceId = getDeviceId();
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('device_id', deviceId)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    
    const cloudProjects = (data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      data: p.data as ParsedData,
      settings: p.settings as ProjectSettings,
      chatHistory: p.chat_history as ChatMessage[] || [],
      createdAt: new Date(p.created_at),
      updatedAt: new Date(p.updated_at),
    }));
    
    // Merge with local (cloud takes precedence for same IDs)
    const localProjects = getProjects();
    const merged = new Map<string, Project>();
    
    localProjects.forEach(p => merged.set(p.id, p));
    cloudProjects.forEach(p => merged.set(p.id, p));
    
    const allProjects = Array.from(merged.values())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    
    saveProjects(allProjects);
    return allProjects;
  } catch (e) {
    console.log('Cloud load skipped');
    return getProjects();
  }
};

export const createProject = (
  name: string,
  data: ParsedData,
  settings: ProjectSettings = DEFAULT_SETTINGS,
  chatHistory: ChatMessage[] = []
): Project => {
  const now = new Date();
  const project: Project = {
    id: `proj_${Date.now()}`,
    name,
    createdAt: now,
    updatedAt: now,
    data,
    settings,
    chatHistory,
  };
  const projects = getProjects();
  projects.unshift(project);
  saveProjects(projects);
  
  // Background cloud sync
  syncToCloud(project, 'upsert');
  
  return project;
};

export const updateProject = (projectId: string, updates: Partial<Project>): Project | null => {
  const projects = getProjects();
  const index = projects.findIndex(p => p.id === projectId);
  if (index === -1) return null;
  projects[index] = { ...projects[index], ...updates, updatedAt: new Date() };
  saveProjects(projects);
  
  // Background cloud sync
  syncToCloud(projects[index], 'upsert');
  
  return projects[index];
};

export const deleteProject = (projectId: string): void => {
  const project = getProjects().find(p => p.id === projectId);
  const projects = getProjects().filter(p => p.id !== projectId);
  saveProjects(projects);
  
  // Background cloud sync
  if (project) syncToCloud(project, 'delete');
};
