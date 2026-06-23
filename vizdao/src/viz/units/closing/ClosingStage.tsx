// src/viz/units/closing/ClosingStage.tsx — 收束的"舞台"：逐行揭出六课的「谎言 → 视觉解药」贯穿表。
// 指令：revealRow{n}（揭到第 n 行）/ showAll。无算法，纯收口。
import { forwardRef, useImperativeHandle, useState } from 'react';
import type { StageHandle, Directive } from '../../engine/types';
import { TheoryToggle } from '../../engine/theory';
import { ClosingTheory } from './ClosingTheory';

const ACCENT = 'hsl(var(--vz-accent))';
const INK_SOFT = 'hsl(var(--vz-ink-soft))';

export const ROWS = [
  { course: '开场 · 安斯库姆', lie: '统计量说四组一样', cure: '画出来：形状天差地别' },
  { course: '过拟合', lie: '训练误差≈0 说「完美」', cure: '真值误差：它在背答案' },
  { course: '分布 · KDE', lie: '桶数决定「形状」', cure: 'KDE：连续可控的带宽' },
  { course: '高维 · Iris', lie: '坐标轴藏住了结构', cure: '换投影：三簇豁然分开' },
  { course: '聚类 · K-Means', lie: '自信地给你 K 个团', cure: 'K 是你的假设，非真相' },
  { course: '降维 · PCA/t-SNE', lie: '线性投影压不开', cure: 't-SNE 解团（距离不可信）' },
];

export const ClosingStage = forwardRef<StageHandle>(function ClosingStage(_props, ref) {
  const [revealed, setRevealed] = useState(0);
  const [theoryOpen, setTheoryOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    apply(directives: Directive[]) {
      for (const d of directives) {
        if (d.op === 'revealRow' && typeof d.n === 'number') setRevealed((r) => Math.max(r, d.n as number));
        else if (d.op === 'showAll') setRevealed(ROWS.length);
      }
    },
  }), []);

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'hsl(var(--background))' }}>
      <div style={{ width: 'min(46rem, 86%)', paddingBottom: '6rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto 1fr', columnGap: 'var(--vz-s4)', rowGap: 'var(--vz-s3)', alignItems: 'baseline' }}>
          {ROWS.slice(0, revealed).map((r) => (
            <div key={r.course} className="vz-beat-in" style={{ display: 'contents' }}>
              <div style={{ fontSize: 'var(--vz-text-base)', fontWeight: 600, color: 'hsl(var(--foreground))', whiteSpace: 'nowrap' }}>{r.course}</div>
              <div style={{ fontSize: 'var(--vz-text-base)', color: INK_SOFT }}>{r.lie}</div>
              <div style={{ fontSize: 'var(--vz-text-base)', color: ACCENT }}>→</div>
              <div style={{ fontSize: 'var(--vz-text-base)', color: 'hsl(var(--foreground))' }}>{r.cure}</div>
            </div>
          ))}
        </div>
      </div>
      {!theoryOpen && <TheoryToggle onOpen={() => setTheoryOpen(true)} />}
      {theoryOpen && <ClosingTheory onClose={() => setTheoryOpen(false)} />}
    </div>
  );
});
