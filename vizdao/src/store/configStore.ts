import { create } from 'zustand';
import { setLocale, type Locale } from '../lib/i18n';

export interface ProviderPreset {
  provider: string;
  baseUrl: string;
  model: string;
}

export type ThinkingMode = 'non-thinking' | 'thinking' | 'thinking_max';

// Legacy model names kept for backward compat with agentStore / resolveLegacyModel callers
const V4_LEGACY_MAP: Record<string, string> = {
  'deepseek-chat': 'deepseek-chat',
  'deepseek-reasoner': 'deepseek-reasoner',
};

// Fixed DeepSeek endpoint
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1';

/** Detect if the given model ID is a DeepSeek V4 family model */
export function isDeepSeekV4(model: string): boolean {
  return model.startsWith('deepseek-v4-') || model === 'deepseek-chat' || model === 'deepseek-reasoner';
}

/** Resolve legacy model names to their V4 equivalents */
export function resolveLegacyModel(model: string): string {
  return V4_LEGACY_MAP[model] ?? model;
}

interface ConfigState {
  provider: string;
  apiKey: string;
  model: string;
  baseUrl: string;
  proxyUrl: string;
  locale: Locale;
  thinkingMode: ThinkingMode;
  tier: 'flash' | 'pro';
  setProvider: (provider: string) => void;
  setApiKey: (key: string) => void;
  setModel: (model: string) => void;
  setBaseUrl: (url: string) => void;
  setProxyUrl: (url: string) => void;
  setLocale: (locale: Locale) => void;
  setThinkingMode: (mode: ThinkingMode) => void;
  setTier: (tier: 'flash' | 'pro') => void;
  applyPreset: () => void;
  validate: () => { valid: boolean; errors: string[] };
}

function loadConfig(): Partial<ConfigState> {
  try {
    const saved = localStorage.getItem('jetbot-config');
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
}

function saveConfig(state: Partial<ConfigState>): void {
  try {
    const { provider, apiKey, model, baseUrl, proxyUrl, locale, thinkingMode, tier } = state as ConfigState;
    localStorage.setItem('jetbot-config', JSON.stringify({ provider, apiKey, model, baseUrl, proxyUrl, locale, thinkingMode, tier }));
  } catch { /* private browsing */ }
}

const saved = loadConfig();
const initLocale = (saved.locale as Locale) || (navigator.language.startsWith('zh') ? 'zh' : 'en');
setLocale(initLocale);

// Derive tier from saved model if tier not explicitly saved
function initTier(saved: Partial<ConfigState>): 'flash' | 'pro' {
  if (saved.tier === 'flash' || saved.tier === 'pro') return saved.tier;
  if (saved.model === 'deepseek-reasoner') return 'pro';
  return 'flash';
}

const tier = initTier(saved);
const initModel = tier === 'pro' ? 'deepseek-reasoner' : 'deepseek-chat';

export const useConfigStore = create<ConfigState>((set, get) => ({
  // Fixed to deepseek — kept for backward compat with agentStore/LLM client
  provider: 'deepseek',
  apiKey: saved.apiKey || '',
  model: initModel,
  // Fixed to DeepSeek endpoint — kept in state so agentStore can still read config.baseUrl
  baseUrl: DEEPSEEK_BASE_URL,
  proxyUrl: (saved.proxyUrl ?? (import.meta.env.DEV && typeof window !== 'undefined' ? window.location.origin : '')).trim(),
  locale: initLocale,
  // Keep thinkingMode for backward compat with agentStore/OpenAICompatibleClient
  thinkingMode: (saved.thinkingMode as ThinkingMode) || 'non-thinking',
  tier,

  setProvider: (provider) => set(s => { const n = { ...s, provider }; saveConfig(n); return n; }),
  setApiKey: (apiKey) => set(s => { const n = { ...s, apiKey }; saveConfig(n); return n; }),
  setModel: (model) => set(s => { const n = { ...s, model }; saveConfig(n); return n; }),
  setBaseUrl: (baseUrl) => set(s => { const n = { ...s, baseUrl }; saveConfig(n); return n; }),
  setProxyUrl: (proxyUrl) => set(s => { const n = { ...s, proxyUrl }; saveConfig(n); return n; }),
  setLocale: (locale) => set(s => { setLocale(locale); const n = { ...s, locale }; saveConfig(n); return n; }),
  setThinkingMode: (thinkingMode) => set(s => { const n = { ...s, thinkingMode }; saveConfig(n); return n; }),

  setTier: (tier: 'flash' | 'pro') =>
    set(s => {
      const model = tier === 'flash' ? 'deepseek-chat' : 'deepseek-reasoner';
      const n = { ...s, tier, model };
      saveConfig(n);
      return n;
    }),

  // applyPreset kept for backward compat; always applies deepseek
  applyPreset: () => {
    set(s => {
      const n = { ...s, provider: 'deepseek', baseUrl: DEEPSEEK_BASE_URL };
      saveConfig(n);
      return n;
    });
  },

  validate: () => {
    const state = get();
    const errors: string[] = [];
    if (!state.apiKey) errors.push('API Key is required');
    return { valid: errors.length === 0, errors };
  },
}));
