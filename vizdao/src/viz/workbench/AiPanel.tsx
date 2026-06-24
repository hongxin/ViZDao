// src/viz/workbench/AiPanel.tsx — 工作台左侧「AI 对话」通道：复用 JetBot 的 ChatPanel+InputBar+Agent。
// 布局：消息区 flex 撑满并内部滚动；状态条 + 示例 + 输入框锚定底部不动。
import { useEffect } from 'react';
import { ChatPanel } from '../../components/ChatPanel';
import { InputBar } from '../../components/InputBar';
import { useAgentStore } from '../../store/agentStore';
import { useConfigStore } from '../../store/configStore';
import { useChatStore } from '../../store/chatStore';

const ACCENT = 'hsl(var(--vz-accent))';
const EXAMPLES = [
  '画一张租车量随气温的散点图，按是否工作日着色',
  '把最热的 10% 天框出来，它们的租车量真的最高吗？',
  '工作日和周末，注册用户和临时用户有什么不同？',
];
const STATUS_LABEL: Record<string, string> = {
  thinking: 'AI 思考中…',
  executing_tool: 'AI 正在操作画布…',
  waiting_permission: '等待授权…',
};

export function AiPanel() {
  const agent = useAgentStore((s) => s.agent);
  const initAgent = useAgentStore((s) => s.initAgent);
  const sendMessage = useAgentStore((s) => s.sendMessage);
  const apiKey = useConfigStore((s) => s.apiKey);
  const status = useChatStore((s) => s.status);

  useEffect(() => { if (!agent && apiKey) initAgent(); }, [agent, apiKey, initAgent]);

  if (!apiKey) {
    return (
      <div style={{ padding: 'var(--vz-s3)', fontSize: 'var(--vz-text-sm)', color: 'hsl(var(--vz-ink-soft))', lineHeight: 1.7 }}>
        <p style={{ margin: '0 0 var(--vz-s2)' }}>填一个 <b>DeepSeek API Key</b> 即可启用 <b>AI 协同分析</b>——用自然语言说意图，AI 帮你搭图、刷选、读数。</p>
        <p style={{ margin: 0 }}>在右上「设置」里填写。没有 Key 也没关系：左边「✋ 自己探索」可手动建图、框选联动。</p>
      </div>
    );
  }

  const busy = status !== 'idle' && status !== 'error';

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      {/* 消息区：flex 撑满，内部滚动（ChatPanel 自带 flex-1 overflow-y-auto） */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <ChatPanel />
      </div>

      {/* 底部固定区：状态条 + 示例 + 输入框 */}
      <div style={{ borderTop: '1px solid hsl(var(--border))', flexShrink: 0 }}>
        <div style={{ height: 22, display: 'flex', alignItems: 'center', padding: '0 var(--vz-s3)', fontSize: 'var(--vz-text-sm)', color: busy ? ACCENT : 'hsl(var(--vz-ink-soft))' }}>
          {busy
            ? <span><span className="vz-pulse" style={{ display: 'inline-block', width: 7, height: 7, borderRadius: 999, background: ACCENT, marginRight: 6, verticalAlign: 'middle' }} />{STATUS_LABEL[status] ?? 'AI 辅助中…'}</span>
            : <span>● AI 辅助 · 就绪（说出你的分析意图）</span>}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', padding: '0 var(--vz-s3) 0.3rem' }}>
          {EXAMPLES.map((e) => (
            <button key={e} onClick={() => sendMessage(e)} disabled={busy} title={e}
              style={{ fontSize: 'var(--vz-text-sm)', padding: '0.2rem 0.5rem', borderRadius: 999, border: '1px solid hsl(var(--border))', background: 'transparent', color: 'hsl(var(--vz-ink-soft))', cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.5 : 1, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {e.length > 16 ? e.slice(0, 15) + '…' : e}
            </button>
          ))}
        </div>
        <InputBar />
      </div>
    </div>
  );
}
