// src/viz/units/overfitting/overfitting.unit.tsx — 过拟合单元（课·微）。
// 设(噪声点) → 行(拉阶数,训练误差→0,陷阱) → 赌(零误差是好模型吗) → 揭(真曲线+真值误差暴涨,回指赌注)
//   → 行(拉正则λ救回) → 悟(低训练误差≠好;在没见过的数据上验证)。
import { useRef, useState } from 'react';
import { OverfittingStage } from './OverfittingStage';
import { Player } from '../../engine/Player';
import type { ConceptScript, StageHandle } from '../../engine/types';

const OVERFITTING_CONCEPT: ConceptScript = {
  beats: [
    { kind: 'frame', enter: [{ op: 'showPoints' }], say: '这些点来自一条真实的曲线，却被噪声打乱了。你的任务：找出那条藏起来的规律。', cta: '我来当建模师 →' },
    { kind: 'frame', enter: [{ op: 'raiseDegree' }], say: '拉动「模型复杂度」，让曲线尽量穿过每一个点——盯住右上角的「训练误差」，把它压到最小。', cta: '压到最小了 →' },
    {
      kind: 'predict', say: '训练误差几乎为 0，曲线穿过了每个点。这是个好模型吗？',
      commit: { kind: 'choice', id: 'guess', options: [{ value: 'good', label: '是好模型' }, { value: 'bad', label: '不是' }] },
    },
    {
      kind: 'reveal', enter: [{ op: 'revealTruth' }], hold: 1600, cta: '那怎么救？ →',
      say: (l) => `看——灰色虚线才是真曲线。你的曲线在点与点之间疯狂乱窜，「真值误差」瞬间暴涨。你刚赌了「${l.guess === 'good' ? '是好模型' : '不是'}」——${l.guess === 'good' ? '可惜' : '没错'}，它没在学规律，是在背答案。`,
    },
    { kind: 'frame', enter: [{ op: 'regularize' }], say: '给模型一点纪律——拉动「正则 λ」，看那条疯狂的曲线被驯回平滑，真值误差跟着掉下来。', cta: '驯服了 →' },
    { kind: 'reflect', say: '建模第二课：训练误差低 ≠ 好模型——它可能只是在背答案。真正的考验，永远在它没见过的数据上。正则，就是让模型「少记一点」的纪律。', cta: '我懂了 →' },
  ],
};

export function OverfittingUnit() {
  const stageRef = useRef<StageHandle>(null);
  const [done, setDone] = useState(false);
  const [runKey, setRunKey] = useState(0);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <OverfittingStage key={`stage-${runKey}`} ref={stageRef} />
      {!done ? (
        <Player
          key={`player-${runKey}`}
          script={OVERFITTING_CONCEPT}
          onBeatEnter={(d) => stageRef.current?.apply(d)}
          onComplete={() => setDone(true)}
        />
      ) : (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'hsl(var(--background) / 0.82)' }}>
          <div className="vz-beat-in" style={{ textAlign: 'center', maxWidth: 'var(--vz-measure)' }}>
            <p style={{ fontSize: 'var(--vz-text-xl)', margin: '0 0 var(--vz-s2)' }}>学规律，还是背答案？</p>
            <p style={{ fontSize: 'var(--vz-text-base)', color: 'hsl(var(--vz-ink-soft))', margin: '0 0 var(--vz-s4)' }}>
              低训练误差会骗人。真正的考验，在模型没见过的数据上。
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
