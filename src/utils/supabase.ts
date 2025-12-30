import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://frfssmaauinuceeutlkj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyZnNzbWFhdWludWNlZXV0bGtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMTA4MzksImV4cCI6MjA4MjY4NjgzOX0.4pcIHQmSeLvZSxjg6kRKs_OTb1RzDhlxw_40l2ZPgzA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Generate or retrieve device ID for anonymous users
export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('anova_device_id');
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('anova_device_id', deviceId);
  }
  return deviceId;
};
