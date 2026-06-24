// src/viz/workbench/AiPanel.tsx — 工作台左侧「AI 对话」通道：复用 JetBot 的 ChatPanel+InputBar+Agent。
// 学员说意图 → AI 调分析工具带按同一 ViewSpec 在右侧搭图/刷选/读数。
import { useEffect } from 'react';
import { ChatPanel } from '../../components/ChatPanel';
import { InputBar } from '../../components/InputBar';
import { useAgentStore } from '../../store/agentStore';
import { useConfigStore } from '../../store/configStore';

const EXAMPLES = [
  '画一张租车量随气温的散点图，按是否工作日着色',
  '把最热的 10% 天框出来，它们的租车量真的最高吗？',
  '工作日和周末，注册用户和临时用户有什么不同？',
];

export function AiPanel() {
  const agent = useAgentStore((s) => s.agent);
  const initAgent = useAgentStore((s) => s.initAgent);
  const sendMessage = useAgentStore((s) => s.sendMessage);
  const apiKey = useConfigStore((s) => s.apiKey);

  useEffect(() => { if (!agent && apiKey) initAgent(); }, [agent, apiKey, initAgent]);

  if (!apiKey) {
    return (
      <div style={{ padding: 'var(--vz-s3)', fontSize: 'var(--vz-text-sm)', color: 'hsl(var(--vz-ink-soft))', lineHeight: 1.7 }}>
        <p style={{ margin: '0 0 var(--vz-s2)' }}>填一个 <b>DeepSeek API Key</b> 即可启用 <b>AI 协同分析</b>——用自然语言说意图，AI 帮你搭图、刷选、读数。</p>
        <p style={{ margin: 0 }}>在右上「设置」里填写。没有 Key 也没关系：左边「✋ 自己探索」可手动建图、框选联动。</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}><ChatPanel /></div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', padding: '0.4rem var(--vz-s3) 0' }}>
        {EXAMPLES.map((e) => (
          <button key={e} onClick={() => sendMessage(e)} title={e}
            style={{ fontSize: 'var(--vz-text-sm)', padding: '0.2rem 0.5rem', borderRadius: 999, border: '1px solid hsl(var(--border))', background: 'transparent', color: 'hsl(var(--vz-ink-soft))', cursor: 'pointer', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {e.length > 16 ? e.slice(0, 15) + '…' : e}
          </button>
        ))}
      </div>
      <InputBar />
    </div>
  );
}
