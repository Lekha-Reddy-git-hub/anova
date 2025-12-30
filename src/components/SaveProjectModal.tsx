import { useState, useEffect, useRef } from 'react';
import { X, Save, Check } from 'lucide-react';

interface SaveProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  currentProjectName?: string;
}

export default function SaveProjectModal({ isOpen, onClose, onSave, currentProjectName }: SaveProjectModalProps) {
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(currentProjectName || `Analysis ${new Date().toLocaleDateString()}`);
      setSaved(false);
      setTimeout(() => inputRef.current?.select(), 100);
    }
  }, [isOpen, currentProjectName]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim());
    setSaved(true);
    setTimeout(onClose, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-[#0F0F12] rounded-xl shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-[#1F1F23]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{currentProjectName ? 'Update' : 'Save'} Project</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1F1F23]">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-5">
          {saved ? (
            <div className="flex flex-col items-center py-6">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
                <Check className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-lg font-medium text-gray-900 dark:text-white">Project saved!</p>
            </div>
          ) : (
            <>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Project Name</label>
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                className="input-field"
                autoFocus
              />
            </>
          )}
        </div>
        
        {!saved && (
          <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-200 dark:border-[#1F1F23]">
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={!name.trim()} className="btn-primary flex items-center gap-2">
              <Save className="w-4 h-4" />{currentProjectName ? 'Update' : 'Save'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
