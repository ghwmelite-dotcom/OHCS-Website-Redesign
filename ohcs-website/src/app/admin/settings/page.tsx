'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Settings,
  Bot,
  Shield,
  Database,
  Globe,
  CheckCircle,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Server,
  Sparkles,
  Lock,
} from 'lucide-react';

interface SystemSetting {
  key: string;
  label: string;
  description: string;
  icon: typeof Bot;
  gradient: string;
  category: string;
}

const SETTINGS_CONFIG: SystemSetting[] = [
  {
    key: 'ohcs_ai_demo_mode',
    label: 'AI Analyst Mode',
    description: 'Demo mode uses pre-built responses. Live mode connects to Cloudflare Workers AI (Llama 3.3 70B) for real-time analysis.',
    icon: Sparkles,
    gradient: 'from-amber-500 to-yellow-600',
    category: 'AI Services',
  },
  {
    key: 'ohcs_auth_demo_mode',
    label: 'Authentication Mode',
    description: 'Demo mode uses local credentials. Live mode authenticates against the Cloudflare Worker API with D1 database.',
    icon: Lock,
    gradient: 'from-blue-500 to-indigo-600',
    category: 'Authentication',
  },
  {
    key: 'ohcs_api_live',
    label: 'API Connection',
    description: 'Demo mode uses sample data stored locally. Live mode fetches real data from the OHCS Worker API.',
    icon: Server,
    gradient: 'from-green-500 to-emerald-600',
    category: 'Data Sources',
  },
  {
    key: 'ohcs_recruitment_notifications',
    label: 'Recruitment Notifications',
    description: 'When enabled, sends real email/SMS notifications to candidates at each pipeline stage.',
    icon: Globe,
    gradient: 'from-purple-500 to-violet-600',
    category: 'Communications',
  },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    // Load settings from localStorage
    const loaded: Record<string, boolean> = {};
    SETTINGS_CONFIG.forEach((s) => {
      const stored = localStorage.getItem(s.key);
      // Default: all demo mode (true = demo, false = live)
      loaded[s.key] = stored === null ? true : stored === 'true';
    });
    setSettings(loaded);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const toggleSetting = async (key: string) => {
    setSaving(key);
    // Simulate save delay
    await new Promise((r) => setTimeout(r, 500));

    const newValue = !settings[key];
    localStorage.setItem(key, String(newValue));
    setSettings((prev) => ({ ...prev, [key]: newValue }));

    const config = SETTINGS_CONFIG.find((s) => s.key === key);
    const modeName = newValue ? 'Demo' : 'Live';
    setToast(`${config?.label} switched to ${modeName} mode.`);
    setSaving(null);
  };

  const demoCount = Object.values(settings).filter(Boolean).length;
  const liveCount = Object.values(settings).filter((v) => !v).length;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shadow-sm">
          <Settings className="h-6 w-6 text-white" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-primary-dark">System Settings</h2>
          <p className="text-sm text-text-muted mt-0.5">Control system modes, API connections, and service configurations.</p>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="flex items-center gap-3 bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
          <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
          <span className="text-sm text-green-700">{toast}</span>
        </div>
      )}

      {/* Status Overview */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-amber-800 font-display">{demoCount}</p>
          <p className="text-sm text-amber-700 font-medium">Demo Mode</p>
        </div>
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-green-800 font-display">{liveCount}</p>
          <p className="text-sm text-green-700 font-medium">Live Mode</p>
        </div>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-8">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-900">Caution</p>
          <p className="text-sm text-amber-700">Switching to Live mode requires the Cloudflare Worker API to be deployed and configured. Ensure all services are operational before enabling live mode in production.</p>
        </div>
      </div>

      {/* Settings Cards */}
      <div className="space-y-4">
        {SETTINGS_CONFIG.map((config) => {
          const isDemo = settings[config.key] ?? true;
          const isSaving = saving === config.key;

          return (
            <div
              key={config.key}
              className="bg-white rounded-2xl border-2 border-border/40 p-6 hover:border-border/60 transition-colors"
            >
              <div className="flex items-start gap-5">
                <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm shrink-0', config.gradient)}>
                  <config.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-base text-primary-dark">{config.label}</h3>
                    <span className={cn(
                      'text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider',
                      isDemo ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800',
                    )}>
                      {isDemo ? 'Demo' : 'Live'}
                    </span>
                  </div>
                  <p className="text-sm text-text-muted leading-relaxed mb-3">{config.description}</p>
                  <p className="text-xs text-text-muted/50">Category: {config.category}</p>
                </div>

                <button
                  onClick={() => toggleSetting(config.key)}
                  disabled={isSaving}
                  className="shrink-0 mt-1"
                  aria-label={`Toggle ${config.label} to ${isDemo ? 'Live' : 'Demo'} mode`}
                >
                  {isSaving ? (
                    <div className="w-12 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : isDemo ? (
                    <ToggleLeft className="h-10 w-10 text-text-muted/40 hover:text-amber-500 transition-colors cursor-pointer" />
                  ) : (
                    <ToggleRight className="h-10 w-10 text-green-500 hover:text-green-600 transition-colors cursor-pointer" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-text-muted/40">
          Settings are stored locally. In production, these will be managed via environment variables on Cloudflare.
        </p>
      </div>
    </div>
  );
}
