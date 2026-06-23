import { useState } from 'react';
import { useConfigStore } from '../store/configStore';
import { useAgentStore } from '../store/agentStore';
import { useUiStore } from '../store/uiStore';
import { useT } from '../lib/i18n';

export function WelcomeScreen() {
  const config = useConfigStore();
  const initAgent = useAgentStore(s => s.initAgent);
  const enter = useUiStore(s => s.enter);
  const [showKey, setShowKey] = useState(false);
  const locale = useConfigStore(s => s.locale);
  const t = useT();

  const canStart = config.apiKey !== '';

  const handleStart = () => {
    const { valid, errors } = config.validate();
    if (!valid) {
      alert(errors.join('\n'));
      return;
    }
    initAgent();
    enter();
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-sm w-full space-y-6">
        <div className="flex justify-end">
          <button
            onClick={() => config.setLocale(locale === 'en' ? 'zh' : 'en')}
            className="text-xs px-2.5 py-1 rounded-lg border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
          >
            {locale === 'en' ? '中文' : 'EN'}
          </button>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">ViZDao · 微知道</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {locale === 'en'
              ? 'Open and use it — jump straight into the lessons. (Optional) add a DeepSeek key to enable the AI tutor.'
              : '打开即用 —— 直接进入课程开始动手。（可选）填 DeepSeek Key 启用 AI 助教。'}
          </p>
        </div>

        <button
          onClick={enter}
          className="w-full py-3 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-medium text-sm hover:opacity-90 transition-opacity"
        >
          {locale === 'en' ? 'Enter the lessons →' : '直接进入课程 →'}
        </button>

        <div className="space-y-3 border-t border-[hsl(var(--border))] pt-5">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            {locale === 'en' ? 'Optional · enable AI tutor' : '可选 · 启用 AI 助教'}
          </p>
          <div>
            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1 block">{t('welcome.apiKey')}</label>
            <div className="flex gap-2">
              <input
                type={showKey ? 'text' : 'password'}
                value={config.apiKey}
                onChange={e => config.setApiKey(e.target.value)}
                className="flex-1 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                placeholder="sk-..."
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              >
                {showKey ? t('welcome.hide') : t('welcome.show')}
              </button>
            </div>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1">
              {t('welcome.apiKeyHint')}
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5 block">
              {locale === 'en' ? 'Model Tier' : '模型档位'}
            </label>
            <div className="flex gap-2">
              {(['flash', 'pro'] as const).map(tier => (
                <button
                  key={tier}
                  onClick={() => config.setTier(tier)}
                  className={`flex-1 px-3 py-2 text-sm rounded-xl border transition-colors ${
                    config.tier === tier
                      ? 'border-[hsl(var(--ring))] bg-[hsl(var(--accent))] font-medium'
                      : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]'
                  }`}
                >
                  {tier === 'flash'
                    ? (locale === 'zh' ? 'Flash 快速' : 'Flash')
                    : (locale === 'zh' ? 'Pro 深度' : 'Pro')}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1">
              {config.tier === 'flash' ? 'deepseek-chat' : 'deepseek-reasoner'}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={handleStart}
            disabled={!canStart}
            className="w-full py-2.5 rounded-xl border border-[hsl(var(--border))] text-sm hover:bg-[hsl(var(--muted))] transition-colors disabled:opacity-30"
          >
            {locale === 'en' ? 'Enable AI tutor & enter' : '启用 AI 助教并进入'}
          </button>
          <p className="text-[10px] text-center text-[hsl(var(--muted-foreground))]">
            {locale === 'en'
              ? 'Proxy URL and other options can be configured in Settings after start.'
              : '代理地址等选项可在启动后进入 Settings 配置。'}
          </p>
        </div>
      </div>
    </div>
  );
}
