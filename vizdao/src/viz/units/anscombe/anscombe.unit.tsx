// src/viz/units/anscombe/anscombe.unit.tsx — 安斯库姆开篇单元（课·微）。
// 设(统计量) → 赌(必选) → 揭(四图浮现 → 回归线落下, 回指赌注) → 悟/行(聚焦组 IV, 拖离群点崩塌)。
// Phase A 只含"课"；Phase B 接上"训·开放工作台"。
import { useRef, useState } from 'react';
import { AnscombeStage } from './AnscombeStage';
import { Player } from '../../engine/Player';
import type { ConceptScript, StageHandle } from '../../engine/types';

const ANSCOMBE_CONCEPT: ConceptScript = {
  beats: [
    { kind: 'frame', enter: [{ op: 'showStats' }], say: '四组数据。它们的均值、方差、相关系数——几乎完全相同。', cta: '那画出来呢？ →' },
    {
      kind: 'predict', say: '画出来，四组会长得差不多吗？',
      commit: { kind: 'choice', id: 'guess', options: [{ value: 'same', label: '会一样' }, { value: 'diff', label: '会不同' }] },
    },
    { kind: 'reveal', enter: [{ op: 'morphQuartet' }], say: '看——四种形状，天差地别。', hold: 1100, cta: '再看一眼 →' },
    {
      kind: 'reveal', enter: [{ op: 'dropRegLines' }], hold: 1000, cta: '继续 →',
      say: (l) => `而四条回归线，一模一样。你刚赌了「${l.guess === 'same' ? '会一样' : '会不同'}」——${l.guess === 'same' ? '统计量骗了你' : '统计量骗不过你，却骗得了大多数人'}。`,
    },
    { kind: 'reflect', enter: [{ op: 'focusIV' }], say: '组 IV：整条回归线，被右边那个孤独的点撑着。拖动它，看线崩塌。', cta: '我懂了 →' },
  ],
};

export function AnscombeUnit() {
  const stageRef = useRef<StageHandle>(null);
  const [done, setDone] = useState(false);
  const [runKey, setRunKey] = useState(0);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <AnscombeStage key={`stage-${runKey}`} ref={stageRef} />
      {!done ? (
        <Player
          key={`player-${runKey}`}
          script={ANSCOMBE_CONCEPT}
          onBeatEnter={(d) => stageRef.current?.apply(d)}
          onComplete={() => setDone(true)}
        />
      ) : (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'hsl(var(--background) / 0.82)' }}>
          <div className="vz-beat-in" style={{ textAlign: 'center', maxWidth: 'var(--vz-measure)' }}>
            <p style={{ fontSize: 'var(--vz-text-xl)', margin: '0 0 var(--vz-s2)' }}>先画图，再算数。可视化是建模的眼睛。</p>
            <p style={{ fontSize: 'var(--vz-text-base)', color: 'hsl(var(--vz-ink-soft))', margin: '0 0 var(--vz-s4)' }}>
              下一乐章「训·开放工作台」——和 AI 一起对真数据下手——即将上线。
            </p>
            <button
              onClick={() => { setDone(false); setRunKey((k) => k + 1); }}
              style={{ fontSize: 'var(--vz-text-base)', color: 'hsl(var(--vz-accent))', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 500 }}
            >
              ↻ 重新体验
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
