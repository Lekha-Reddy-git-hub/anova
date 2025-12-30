import { useState, useEffect } from 'react';
import { X, Key, ExternalLink, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { getApiKey, setApiKey, removeApiKey } from '../utils/gemini';

interface APISettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function APISettings({ isOpen, onClose }: APISettingsProps) {
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [hasExistingKey, setHasExistingKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const existingKey = getApiKey();
      setHasExistingKey(!!existingKey);
      setKey(existingKey || '');
      setSaved(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (key.trim()) {
      setApiKey(key.trim());
      setHasExistingKey(true);
      setSaved(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  };

  const handleRemove = () => {
    removeApiKey();
    setKey('');
    setHasExistingKey(false);
    setSaved(false);
  };

  const maskKey = (k: string) => {
    if (k.length <= 8) return '••••••••';
    return k.slice(0, 4) + '••••••••••••••••' + k.slice(-4);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-[#0F0F12] rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#1F1F23]">
          <div className="flex items-center gap-3">
            <Key className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Settings</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1F1F23]">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {saved ? (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-400">API key saved successfully!</span>
            </div>
          ) : (
            <>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Enter your Google Gemini API key to enable AI-powered features like smart chat, narrative generation, and image data extraction.
                </p>
                
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mb-4"
                >
                  Get a free API key from Google AI Studio
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Gemini API Key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="AIza..."
                    className="w-full px-4 py-2.5 pr-10 bg-gray-50 dark:bg-[#1F1F23] border border-gray-200 dark:border-[#2A2A2E] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Your API key is stored locally in your browser and never sent to our servers. It's only used to communicate directly with Google's Gemini API.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!saved && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-[#1F1F23] bg-gray-50 dark:bg-[#1F1F23]/50">
            <div>
              {hasExistingKey && (
                <button
                  onClick={handleRemove}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Remove Key
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2A2A2E] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!key.trim()}
                className="btn-primary disabled:opacity-50"
              >
                Save Key
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
