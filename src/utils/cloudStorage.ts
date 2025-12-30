import { supabase, getDeviceId } from './supabase';
import { Project, ParsedData, ProjectSettings, ChatMessage } from '../types';

const LOCAL_STORAGE_KEY = 'anova-pro-projects';

export const DEFAULT_SETTINGS: ProjectSettings = {
  varianceThresholdPercent: 10,
  varianceThresholdDollar: 50000,
  groupBy: 'none',
  viewMode: 'full',
};

// Check if Supabase table exists and is accessible
let supabaseAvailable: boolean | null = null;

const checkSupabase = async (): Promise<boolean> => {
  if (supabaseAvailable !== null) return supabaseAvailable;
  
  try {
    const { error } = await supabase
      .from('projects')
      .select('id')
      .limit(1);
    
    supabaseAvailable = !error;
    return supabaseAvailable;
  } catch {
    supabaseAvailable = false;
    return false;
  }
};

// Local storage fallback functions
const getLocalProjects = (): Project[] => {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
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

const saveLocalProjects = (projects: Project[]): void => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(projects));
};

// Cloud storage functions
export const getProjects = async (): Promise<Project[]> => {
  const isCloud = await checkSupabase();
  
  if (isCloud) {
    try {
      const deviceId = getDeviceId();
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('device_id', deviceId)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        data: p.data as ParsedData,
        settings: p.settings as ProjectSettings,
        chatHistory: p.chat_history as ChatMessage[],
        createdAt: new Date(p.created_at),
        updatedAt: new Date(p.updated_at),
      }));
    } catch (e) {
      console.warn('Supabase error, falling back to localStorage:', e);
      return getLocalProjects();
    }
  }
  
  return getLocalProjects();
};

// Sync version for initial load (uses cached local data)
export const getProjectsSync = (): Project[] => {
  return getLocalProjects();
};

export const createProject = async (
  name: string,
  data: ParsedData,
  settings: ProjectSettings = DEFAULT_SETTINGS,
  chatHistory: ChatMessage[] = []
): Promise<Project> => {
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
  
  // Always save to localStorage first for immediate availability
  const localProjects = getLocalProjects();
  localProjects.unshift(project);
  saveLocalProjects(localProjects);
  
  // Try to save to Supabase
  const isCloud = await checkSupabase();
  if (isCloud) {
    try {
      const deviceId = getDeviceId();
      await supabase.from('projects').insert({
        id: project.id,
        device_id: deviceId,
        name: project.name,
        data: project.data,
        settings: project.settings,
        chat_history: project.chatHistory,
        created_at: project.createdAt.toISOString(),
        updated_at: project.updatedAt.toISOString(),
      });
    } catch (e) {
      console.warn('Failed to save to cloud:', e);
    }
  }
  
  return project;
};

export const updateProject = async (
  projectId: string,
  updates: Partial<Project>
): Promise<Project | null> => {
  const now = new Date();
  
  // Update localStorage
  const localProjects = getLocalProjects();
  const index = localProjects.findIndex(p => p.id === projectId);
  if (index === -1) return null;
  
  localProjects[index] = { ...localProjects[index], ...updates, updatedAt: now };
  saveLocalProjects(localProjects);
  
  // Try to update Supabase
  const isCloud = await checkSupabase();
  if (isCloud) {
    try {
      const updateData: any = { updated_at: now.toISOString() };
      if (updates.name) updateData.name = updates.name;
      if (updates.data) updateData.data = updates.data;
      if (updates.settings) updateData.settings = updates.settings;
      if (updates.chatHistory) updateData.chat_history = updates.chatHistory;
      
      await supabase
        .from('projects')
        .update(updateData)
        .eq('id', projectId);
    } catch (e) {
      console.warn('Failed to update in cloud:', e);
    }
  }
  
  return localProjects[index];
};

export const deleteProject = async (projectId: string): Promise<void> => {
  // Delete from localStorage
  const projects = getLocalProjects().filter(p => p.id !== projectId);
  saveLocalProjects(projects);
  
  // Try to delete from Supabase
  const isCloud = await checkSupabase();
  if (isCloud) {
    try {
      await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);
    } catch (e) {
      console.warn('Failed to delete from cloud:', e);
    }
  }
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

// For checking storage mode
export const isCloudStorageEnabled = async (): Promise<boolean> => {
  return await checkSupabase();
};
