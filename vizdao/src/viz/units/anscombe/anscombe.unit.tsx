// src/viz/units/anscombe/anscombe.unit.tsx — 安斯库姆开篇单元（课·微）。
// 设(统计量) → 赌(必选) → 揭(四图浮现 → 回归线落下, 回指赌注) → 悟/行(聚焦组 IV, 拖离群点崩塌)。
// Phase A 只含"课"；Phase B 接上"训·开放工作台"。
import { useRef, useState } from 'react';
import { AnscombeStage } from './AnscombeStage';
import { Player } from '../../engine/Player';
import type { ConceptScript, StageHandle } from '../../engine/types';

const ANSCOMBE_CONCEPT: ConceptScript = {
  beats: [
    { kind: 'frame', enter: [{ op: 'showRawData' }], say: '四组真实数据，每组 11 个点。先用最朴素的可视化——一张表——摆出来。看得出每组的形状吗？', cta: '看不出？那动手试试 →' },
    { kind: 'frame', enter: [{ op: 'fitLine' }], say: '你先来当建模师：拖动直线的两端，把它拟合到第一组点上——盯住右上角的「误差」，让它尽量小。', cta: '我拟合好了 →' },
    { kind: 'frame', say: '这就是「拟合一个模型」——调直线，让它和数据的误差最小。计算机算出的最优线是 y = 3.00 + 0.50x；你的手感，应该八九不离十。', cta: '继续 →' },
    { kind: 'frame', enter: [{ op: 'showStats' }], say: '关键来了：这四组数据，均值、方差、相关系数——几乎完全相同，连最优拟合线都是 y = 3.00 + 0.50x。', cta: '那画出来呢？ →' },
    {
      kind: 'predict', say: '四组的模型一模一样。那画出来，四组会长得差不多吗？',
      commit: { kind: 'choice', id: 'guess', options: [{ value: 'same', label: '会一样' }, { value: 'diff', label: '会不同' }] },
    },
    { kind: 'reveal', enter: [{ op: 'morphQuartet' }], say: '看——四种形状，天差地别。', hold: 1900, cta: '再看一眼 →' },
    {
      kind: 'reveal', enter: [{ op: 'dropRegLines' }], hold: 1200, cta: '继续 →',
      say: (l) => `连回归方程都一样：y = 3.00 + 0.50x。一条你亲手拟合过的线，竟对四种截然不同的现实给出同一个答案。你刚赌了「${l.guess === 'same' ? '会一样' : '会不同'}」——模型骗了你。`,
    },
    { kind: 'reflect', enter: [{ op: 'focusIV' }], say: '建模第一课：模型是简化，而简化会藏住真相。组 IV——整条线被右边那个孤独的点撑着。拖动它，看模型崩塌。', cta: '我懂了 →' },
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
