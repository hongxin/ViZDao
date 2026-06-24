// src/viz/units/closing/closing.unit.tsx — 收束单元（coda）。
// 暗线收口：逐行揭出六课「谎言→视觉解药」，终拍点题——模型都会骗你，可视化是拨开迷雾的建模工具；未来你指挥 AI 一起看。
import { useRef, useState } from 'react';
import { ClosingStage } from './ClosingStage';
import { Player } from '../../engine/Player';
import { Workbench } from '../../workbench/Workbench';
import type { ConceptScript, StageHandle } from '../../engine/types';

const CLOSING_CONCEPT: ConceptScript = {
  beats: [
    { kind: 'frame', say: '六堂课，一条暗线：每个模型、每个统计量，都会在某处骗你；而可视化，是你拨开迷雾的建模工具。', cta: '一条条回看 →' },
    { kind: 'frame', enter: [{ op: 'revealRow', n: 1 }], say: '统计量说四组一样——画出来，形状天差地别。', cta: '→' },
    { kind: 'frame', enter: [{ op: 'revealRow', n: 2 }], say: '训练误差≈0 说「完美」——真值误差揭穿：它在背答案。', cta: '→' },
    { kind: 'frame', enter: [{ op: 'revealRow', n: 3 }], say: '桶数决定「形状」——KDE 换成连续可控的带宽。', cta: '→' },
    { kind: 'frame', enter: [{ op: 'revealRow', n: 4 }], say: '坐标轴藏住了结构——换对投影，三种花豁然分开。', cta: '→' },
    { kind: 'frame', enter: [{ op: 'revealRow', n: 5 }], say: 'K-Means 自信地给你 K 个团——K 是你的假设，不是真相。', cta: '→' },
    { kind: 'frame', enter: [{ op: 'revealRow', n: 6 }], say: '线性投影压不开 64 维——t-SNE 非线性解团（但它的距离不可信）。', cta: '看穿了吗？ →' },
    { kind: 'reflect', say: '没有哪个模型是真理——每个都在某处撒谎。可视化，是你拨开迷雾的建模工具；而真正的实战，是你指挥 AI 这位会操作工具的协同分析者，一起对真数据下手、一起看、一起质疑。这，就是「微知道」要带你去的地方。', cta: '完成 →' },
  ],
};

export function ClosingUnit() {
  const stageRef = useRef<StageHandle>(null);
  const [done, setDone] = useState(false);
  const [runKey] = useState(0);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <ClosingStage key={`stage-${runKey}`} ref={stageRef} />
      {!done ? (
        <Player
          key={`player-${runKey}`}
          script={CLOSING_CONCEPT}
          onBeatEnter={(d) => stageRef.current?.apply(d)}
          onComplete={() => setDone(true)}
        />
      ) : (
        // 暗线收口 → 交棒 → 「训·知道」工作台：轮到学员对真数据出手。
        <Workbench key={`wb-${runKey}`} />
      )}
    </div>
  );
}
