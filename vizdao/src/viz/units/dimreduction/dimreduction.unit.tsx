// src/viz/units/dimreduction/dimreduction.unit.tsx — 降维单元（课·微）。
// 设(PCA·相叠) → 赌(线性够吗) → 揭(t-SNE动画解团成10孤岛,回指赌注) → 悟(降维是选择看哪一面;t-SNE距离不可信)。
import { useRef, useState } from 'react';
import { DimReductionStage } from './DimReductionStage';
import { Player } from '../../engine/Player';
import type { ConceptScript, StageHandle } from '../../engine/types';

const DIMRED_CONCEPT: ConceptScript = {
  beats: [
    { kind: 'frame', enter: [{ op: 'showPCA' }], say: '200 张手写数字，每张 8×8 = 64 维。纸只有 2 维——先用 PCA 线性压到 2 维。同色（同数字）有点聚，但好几个数字糊在一起（看右上：前 2 主成分只解释了很小一部分方差）。', cta: '线性投影够分开 10 个数字吗？ →' },
    {
      kind: 'predict', say: '只靠线性投影（PCA），能把 10 个数字清清楚楚分开吗？',
      commit: { kind: 'choice', id: 'guess', options: [{ value: 'no', label: '不够' }, { value: 'yes', label: '够' }] },
    },
    {
      kind: 'reveal', enter: [{ op: 'runTSNE' }], hold: 4200, cta: '继续 →',
      say: (l) => `换 t-SNE（非线性）——看它一步步把缠在一起的点解开，10 个数字慢慢散成 10 座孤岛。线性投影看不见的，非线性看见了。你刚赌了「${l.guess === 'no' ? '不够' : '够'}」。`,
    },
    { kind: 'reflect', say: '降维不是压缩，而是选择「看哪一面」：PCA 保全局方差、t-SNE 保邻里关系。但记住——t-SNE 的簇间距离和大小都不可信，它只保证「邻居还是邻居」。', cta: '我懂了 →' },
  ],
};

export function DimReductionUnit() {
  const stageRef = useRef<StageHandle>(null);
  const [done, setDone] = useState(false);
  const [runKey, setRunKey] = useState(0);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <DimReductionStage key={`stage-${runKey}`} ref={stageRef} />
      {!done ? (
        <Player
          key={`player-${runKey}`}
          script={DIMRED_CONCEPT}
          onBeatEnter={(d) => stageRef.current?.apply(d)}
          onComplete={() => setDone(true)}
        />
      ) : (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'hsl(var(--background) / 0.82)' }}>
          <div className="vz-beat-in" style={{ textAlign: 'center', maxWidth: 'var(--vz-measure)' }}>
            <p style={{ fontSize: 'var(--vz-text-xl)', margin: '0 0 var(--vz-s2)' }}>投影，决定你看见哪一面。</p>
            <p style={{ fontSize: 'var(--vz-text-base)', color: 'hsl(var(--vz-ink-soft))', margin: '0 0 var(--vz-s4)' }}>
              PCA 看全局，t-SNE 显邻里——降维是选择，不是压缩。
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
