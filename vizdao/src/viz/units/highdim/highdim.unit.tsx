// src/viz/units/highdim/highdim.unit.tsx — 高维困境单元（课·微）。
// 设(花萼对·糊成团) → 赌(分得开吗) → 揭(花瓣对·豁然分开,回指赌注) → 行(自选特征对找最佳) → 悟(坐标轴决定你看见什么)。
import { useRef, useState } from 'react';
import { IrisStage } from './IrisStage';
import { Player } from '../../engine/Player';
import type { ConceptScript, StageHandle } from '../../engine/types';

const HIGHDIM_CONCEPT: ConceptScript = {
  beats: [
    { kind: 'frame', enter: [{ op: 'showPair', x: 0, y: 1 }], say: '150 朵鸢尾、3 个品种、4 个测量特征。纸只有 2 维——先用「花萼长 × 花萼宽」画出来。蓝、绿两种几乎叠在一起，难分。', cta: '分得开吗？ →' },
    {
      kind: 'predict', say: '在这张图上，这三种花分得开吗？',
      commit: { kind: 'choice', id: 'guess', options: [{ value: 'no', label: '分不开' }, { value: 'yes', label: '分得开' }] },
    },
    {
      kind: 'reveal', enter: [{ op: 'showPair', x: 2, y: 3 }], hold: 1500, cta: '换你来选 →',
      say: (l) => `只换两个特征——「花瓣长 × 花瓣宽」——三簇豁然分开（看右上「可分性」也跳高了）。花没变，是你选的坐标轴藏住了结构。你刚赌了「${l.guess === 'no' ? '分不开' : '分得开'}」。`,
    },
    { kind: 'frame', enter: [{ op: 'freeExplore' }], say: '你来当分析师：给 X、Y 各挑一个特征，找出最能把三种花分开的那一对——盯住右上角的「可分性」。', cta: '继续 →' },
    { kind: 'reflect', say: '你选的坐标轴，决定了你能看见什么。高维里「看不见」，常常不是数据没结构，而是你没选对投影——这正是「降维」要替你解决的事。', cta: '我懂了 →' },
  ],
};

export function HighdimUnit() {
  const stageRef = useRef<StageHandle>(null);
  const [done, setDone] = useState(false);
  const [runKey, setRunKey] = useState(0);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <IrisStage key={`stage-${runKey}`} ref={stageRef} />
      {!done ? (
        <Player
          key={`player-${runKey}`}
          script={HIGHDIM_CONCEPT}
          onBeatEnter={(d) => stageRef.current?.apply(d)}
          onComplete={() => setDone(true)}
        />
      ) : (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'hsl(var(--background) / 0.82)' }}>
          <div className="vz-beat-in" style={{ textAlign: 'center', maxWidth: 'var(--vz-measure)' }}>
            <p style={{ fontSize: 'var(--vz-text-xl)', margin: '0 0 var(--vz-s2)' }}>坐标轴，藏住了结构。</p>
            <p style={{ fontSize: 'var(--vz-text-base)', color: 'hsl(var(--vz-ink-soft))', margin: '0 0 var(--vz-s4)' }}>
              看不见，常常不是没有，而是没选对投影。
            </p>
            <button onClick={() => { setDone(false); setRunKey((k) => k + 1); }} style={{ fontSize: 'var(--vz-text-base)', color: 'hsl(var(--vz-accent))', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
              ↻ 重新体验
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
