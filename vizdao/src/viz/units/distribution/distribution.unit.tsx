// src/viz/units/distribution/distribution.unit.tsx — 分布单元（课·微）。
// 设(rug) → 行(拖桶数,5桶单峰) → 赌(换桶数会变吗) → 揭(40桶露两峰,回指赌注) → 行(KDE带宽) → 悟(桶数在骗你)。
import { useRef, useState } from 'react';
import { DistributionStage } from './DistributionStage';
import { Player } from '../../engine/Player';
import type { ConceptScript, StageHandle } from '../../engine/types';

const DISTRIBUTION_CONCEPT: ConceptScript = {
  beats: [
    { kind: 'frame', enter: [{ op: 'showRug' }], say: '180 个一维数据点，平铺成底部的一条「rug」。它的分布——是什么形状？', cta: '用直方图看 →' },
    { kind: 'frame', enter: [{ op: 'showHist', bins: 6 }], say: '直方图：把数据装进桶里数高度。先用 6 个桶——一个山包，像是单峰。拖滑杆，换换桶数。', cta: '它真是单峰吗？ →' },
    {
      kind: 'predict', say: '把桶数调大，这个「形状」会变吗？',
      commit: { kind: 'choice', id: 'guess', options: [{ value: 'change', label: '会变' }, { value: 'same', label: '不会变' }] },
    },
    {
      kind: 'reveal', enter: [{ op: 'showHist', bins: 12 }], hold: 1500, cta: '那有更稳的看法吗？ →',
      say: (l) => `看——12 个桶就露出了**两座峰**；再往多调，它还会碎成更多假峰。形状是你选的桶数的产物，不是数据的性质。你刚赌了「${l.guess === 'change' ? '会变' : '不会变'}」——${l.guess === 'change' ? '对了' : '其实它会变'}。`,
    },
    { kind: 'frame', enter: [{ op: 'showKDE', bw: 0.3 }], say: '密度图(KDE)把离散的「桶」换成连续的「带宽」：每个点摊成一个小钟形再叠加。拖带宽，平滑、不再跳变。', cta: '继续 →' },
    { kind: 'reflect', say: '直方图把连续的真相切成离散的桶；桶数是你的选择，不是数据的性质。KDE 把这选择换成连续可控的带宽——但带宽太小会过尖、太大会糊成一团。', cta: '我懂了 →' },
  ],
};

export function DistributionUnit() {
  const stageRef = useRef<StageHandle>(null);
  const [done, setDone] = useState(false);
  const [runKey, setRunKey] = useState(0);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <DistributionStage key={`stage-${runKey}`} ref={stageRef} />
      {!done ? (
        <Player
          key={`player-${runKey}`}
          script={DISTRIBUTION_CONCEPT}
          onBeatEnter={(d) => stageRef.current?.apply(d)}
          onComplete={() => setDone(true)}
        />
      ) : (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'hsl(var(--background) / 0.82)' }}>
          <div className="vz-beat-in" style={{ textAlign: 'center', maxWidth: 'var(--vz-measure)' }}>
            <p style={{ fontSize: 'var(--vz-text-xl)', margin: '0 0 var(--vz-s2)' }}>桶数，也在骗你。</p>
            <p style={{ fontSize: 'var(--vz-text-base)', color: 'hsl(var(--vz-ink-soft))', margin: '0 0 var(--vz-s4)' }}>
              分布的形状，一半是数据，一半是你怎么切它。
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
