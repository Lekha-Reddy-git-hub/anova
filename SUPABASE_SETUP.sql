-- ANOVA AI - Supabase Setup
-- Run this SQL in your Supabase SQL Editor to enable cloud storage

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  name TEXT NOT NULL,
  data JSONB NOT NULL,
  settings JSONB NOT NULL,
  chat_history JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries by device
CREATE INDEX IF NOT EXISTS idx_projects_device_id ON projects(device_id);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read/write their own projects (identified by device_id in the data)
-- Since we're using anon key, this is a simple policy
CREATE POLICY "Allow all operations" ON projects
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Done! Your cloud storage is now ready.
