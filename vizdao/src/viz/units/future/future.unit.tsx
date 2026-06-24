// src/viz/units/future/future.unit.tsx — 「未来 · 自由创作」：回到 JetBot 完整自由度。
// 学过"看见"的方法后，把 AI 当伙伴，用一句话造出想要的可视化与交互模型——
// 左=完整 JetBot 对话(全工具带)，右=PreviewPanel 即时渲染 AI 用 render_html 生成的交互产物。
import { useEffect } from 'react';
import { ChatPanel } from '../../../components/ChatPanel';
import { InputBar } from '../../../components/InputBar';
import { PreviewPanel, RenderPreviewListener, usePreviews } from '../../../components/RenderPreview';
import { useAgentStore } from '../../../store/agentStore';
import { useConfigStore } from '../../../store/configStore';
import { useChatStore } from '../../../store/chatStore';

const ACCENT = 'hsl(var(--vz-accent))';
const EXAMPLES = [
  '做一个可拖动调节频率和振幅的正弦波探索器',
  '用 Canvas 画一个随鼠标流动的粒子动画',
  '可视化斐波那契螺旋，能调圈数',
  '做一个交互式散点图，框选就高亮',
];
const STATUS_LABEL: Record<string, string> = { thinking: 'AI 构思中…', executing_tool: 'AI 正在生成…', waiting_permission: '等待授权…' };

export function FutureUnit() {
  const agent = useAgentStore((s) => s.agent);
  const initAgent = useAgentStore((s) => s.initAgent);
  const sendMessage = useAgentStore((s) => s.sendMessage);
  const apiKey = useConfigStore((s) => s.apiKey);
  const status = useChatStore((s) => s.status);
  const previews = usePreviews();

  useEffect(() => { if (!agent && apiKey) initAgent(); }, [agent, apiKey, initAgent]);
  const busy = status !== 'idle' && status !== 'error';

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: 'hsl(var(--background))' }}>
      <RenderPreviewListener />
      {/* 开场白 */}
      <div style={{ padding: '0.6rem var(--vz-s4)', borderBottom: '1px solid hsl(var(--border))' }}>
        <div style={{ fontSize: 'var(--vz-text-base)', fontWeight: 600, color: 'hsl(var(--foreground))' }}>未来 · 自由创作</div>
        <div style={{ fontSize: 'var(--vz-text-sm)', color: 'hsl(var(--vz-ink-soft))', marginTop: 2, lineHeight: 1.5 }}>
          六堂课，你学会了让数据"被看见"的方法。现在没有旋钮、没有预设——把 AI 当伙伴，用一句话，造出你想要的可视化与交互模型。AI 会现场写代码，右侧即时呈现。
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {/* 左 · 对话 */}
        <div style={{ width: 440, flexShrink: 0, borderRight: '1px solid hsl(var(--border))', display: 'flex', flexDirection: 'column' }}>
          {!apiKey ? (
            <div style={{ padding: 'var(--vz-s3)', fontSize: 'var(--vz-text-sm)', color: 'hsl(var(--vz-ink-soft))', lineHeight: 1.7 }}>
              <p style={{ margin: '0 0 var(--vz-s2)' }}>这一章由 <b>AI 现场创作</b>驱动——填一个 <b>DeepSeek API Key</b> 即可开始。</p>
              <p style={{ margin: 0 }}>在右上「设置」里填写，然后回到这里，对 AI 说出你想造的东西。</p>
            </div>
          ) : (
            <>
              <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}><ChatPanel /></div>
              <div style={{ borderTop: '1px solid hsl(var(--border))', flexShrink: 0 }}>
                <div style={{ height: 22, display: 'flex', alignItems: 'center', padding: '0 var(--vz-s3)', fontSize: 'var(--vz-text-sm)', color: busy ? ACCENT : 'hsl(var(--vz-ink-soft))' }}>
                  {busy ? <span><span className="vz-pulse" style={{ display: 'inline-block', width: 7, height: 7, borderRadius: 999, background: ACCENT, marginRight: 6, verticalAlign: 'middle' }} />{STATUS_LABEL[status] ?? 'AI 创作中…'}</span>
                    : <span>● 想造点什么？一句话告诉 AI</span>}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', padding: '0 var(--vz-s3) 0.3rem' }}>
                  {EXAMPLES.map((e) => (
                    <button key={e} onClick={() => sendMessage(e)} disabled={busy} title={e}
                      style={{ fontSize: 'var(--vz-text-sm)', padding: '0.2rem 0.5rem', borderRadius: 999, border: '1px solid hsl(var(--border))', background: 'transparent', color: 'hsl(var(--vz-ink-soft))', cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.5 : 1, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.length > 14 ? e.slice(0, 13) + '…' : e}
                    </button>
                  ))}
                </div>
                <InputBar />
              </div>
            </>
          )}
        </div>

        {/* 右 · 即时画布 */}
        <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
          {previews.length > 0 ? <PreviewPanel /> : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 'var(--vz-s4)' }}>
              <div style={{ color: 'hsl(var(--vz-ink-soft))', fontSize: 'var(--vz-text-sm)', lineHeight: 1.7, maxWidth: 360 }}>
                <div style={{ fontSize: 28, marginBottom: 'var(--vz-s2)' }}>✦</div>
                你创作的可视化会出现在这里。<br />对左边的 AI 说出你的想法，它会现场写代码、即时渲染。
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
