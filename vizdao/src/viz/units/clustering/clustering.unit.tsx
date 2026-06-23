// src/viz/units/clustering/clustering.unit.tsx — 聚类单元（课·微）。
// 设(无标签点) → 行(拖K) → 赌(K=3还原真品种吗) → 揭(标红错分,回指赌注) → 行(自由拖K) → 悟(K-Means永远给K个答案)。
import { useRef, useState } from 'react';
import { ClusteringStage } from './ClusteringStage';
import { Player } from '../../engine/Player';
import type { ConceptScript, StageHandle } from '../../engine/types';

const CLUSTERING_CONCEPT: ConceptScript = {
  beats: [
    { kind: 'frame', enter: [{ op: 'showPoints' }], say: '150 朵花的花瓣（长 × 宽），这次不告诉你品种。该把它们分成几组？', cta: '用 K-Means 试试 →' },
    { kind: 'frame', enter: [{ op: 'runKMeans', k: 3 }], say: 'K-Means：你定 K，它就找 K 个中心(★)、把每个点归到最近的中心。拖 K，看簇怎么重组——先看 K=3。', cta: 'K=3 能还原 3 个真品种吗？ →' },
    {
      kind: 'predict', say: 'K=3 找出的三组，正好是三个真实品种吗？',
      commit: { kind: 'choice', id: 'guess', options: [{ value: 'exact', label: '正好' }, { value: 'off', label: '有出入' }] },
    },
    {
      kind: 'reveal', enter: [{ op: 'revealErrors' }], hold: 1600, cta: '换你来拖 K →',
      say: (l) => `看那些红圈——在变色与维吉尼亚的交界，K-Means 分错了不少（右上「错分」）。它找的是几何上紧致的团，不是真品种；你给 K=2 或 5，它照样自信地给你 2、5 组。你刚赌了「${l.guess === 'exact' ? '正好' : '有出入'}」。`,
    },
    { kind: 'frame', say: '你来拖 K：2、4、5……它永远给你 K 个团，每个都「看起来很合理」。哪个才对？数据不会告诉你。', cta: '继续 →' },
    { kind: 'reflect', say: 'K-Means 永远会给你 K 个答案——哪怕 K 是错的。它找的是几何紧致，不是真相。K 是你的假设，不是数据的结论。', cta: '我懂了 →' },
  ],
};

export function ClusteringUnit() {
  const stageRef = useRef<StageHandle>(null);
  const [done, setDone] = useState(false);
  const [runKey, setRunKey] = useState(0);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <ClusteringStage key={`stage-${runKey}`} ref={stageRef} />
      {!done ? (
        <Player
          key={`player-${runKey}`}
          script={CLUSTERING_CONCEPT}
          onBeatEnter={(d) => stageRef.current?.apply(d)}
          onComplete={() => setDone(true)}
        />
      ) : (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'hsl(var(--background) / 0.82)' }}>
          <div className="vz-beat-in" style={{ textAlign: 'center', maxWidth: 'var(--vz-measure)' }}>
            <p style={{ fontSize: 'var(--vz-text-xl)', margin: '0 0 var(--vz-s2)' }}>K，是你的假设。</p>
            <p style={{ fontSize: 'var(--vz-text-base)', color: 'hsl(var(--vz-ink-soft))', margin: '0 0 var(--vz-s4)' }}>
              K-Means 永远给你 K 个答案——哪怕 K 是错的。
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
