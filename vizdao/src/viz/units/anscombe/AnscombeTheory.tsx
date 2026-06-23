// src/viz/units/anscombe/AnscombeTheory.tsx — 安斯库姆的理论内容（注入共享 TheoryDrawer）。
// 最小二乘闭式解 / 皮尔逊相关系数 / 为什么四组统计量恒等（只依赖五个矩）。
import type { CSSProperties } from 'react';
import { ANSCOMBE } from '../../datasets/anscombe';
import { Tex, Section, NOTE, TheoryDrawer } from '../../engine/theory';

const GROUPS = ['I', 'II', 'III', 'IV'] as const;

function moments(pts: { x: number; y: number }[]) {
  const n = pts.length;
  const mx = pts.reduce((s, p) => s + p.x, 0) / n;
  const my = pts.reduce((s, p) => s + p.y, 0) / n;
  let Sxx = 0, Syy = 0, Sxy = 0;
  for (const p of pts) { Sxx += (p.x - mx) ** 2; Syy += (p.y - my) ** 2; Sxy += (p.x - mx) * (p.y - my); }
  return { mx, my, Sxx, Syy, Sxy, r: Sxy / Math.sqrt(Sxx * Syy) };
}

export function AnscombeTheory({ onClose }: { onClose: () => void }) {
  const rows = GROUPS.map((g) => ({ g, ...moments(ANSCOMBE[g]) }));
  const cell: CSSProperties = { padding: '0.2rem 0.7rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 'var(--vz-text-sm)', fontFamily: 'ui-monospace, monospace' };
  const head: CSSProperties = { ...cell, color: 'hsl(var(--vz-ink-soft))', fontFamily: 'inherit' };
  return (
    <TheoryDrawer onClose={onClose}>
      <Section label="简单线性回归 · 最小二乘闭式解">
        <Tex block tex={'\\hat{b}=\\frac{\\sum_i (x_i-\\bar{x})(y_i-\\bar{y})}{\\sum_i (x_i-\\bar{x})^2}=\\frac{S_{xy}}{S_{xx}},\\qquad \\hat{a}=\\bar{y}-\\hat{b}\\,\\bar{x}'} />
      </Section>

      <Section label="皮尔逊相关系数">
        <Tex block tex={'r=\\frac{S_{xy}}{\\sqrt{S_{xx}\\,S_{yy}}}=\\frac{\\operatorname{cov}(x,y)}{\\sigma_x\\,\\sigma_y}'} />
      </Section>

      <div style={{ height: 1, background: 'hsl(var(--border))', margin: 'var(--vz-s4) 0 var(--vz-s5)' }} />

      <Section label="为什么四组的统计量完全相同？">
        <p style={NOTE}>均值、方差、相关系数、回归线——全都只是这五个量的函数：</p>
        <Tex block tex={'\\bar{x},\\ \\ \\bar{y},\\ \\ S_{xx},\\ \\ S_{yy},\\ \\ S_{xy}'} />
        <p style={NOTE}>安斯库姆刻意构造四组数据，让这五个矩两两相等——于是一切摘要统计量都相同，尽管形状天差地别：</p>
        <table style={{ borderCollapse: 'collapse', marginTop: 'var(--vz-s2)' }}>
          <thead>
            <tr>
              <th style={head} />
              <th style={head}><Tex tex={'\\bar{x}'} /></th>
              <th style={head}><Tex tex={'S_{xx}'} /></th>
              <th style={head}><Tex tex={'S_{xy}'} /></th>
              <th style={head}><Tex tex={'r'} /></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.g}>
                <td style={{ ...head, textAlign: 'left' }}>组 {r.g}</td>
                <td style={cell}>{r.mx.toFixed(1)}</td>
                <td style={cell}>{r.Sxx.toFixed(1)}</td>
                <td style={cell}>{r.Sxy.toFixed(1)}</td>
                <td style={cell}>{r.r.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section label="结论">
        <p style={{ ...NOTE, marginTop: 0 }}>二阶矩相同 ≠ 分布相同。摘要统计量活在低维的「矩空间」里，看不见形状——所以必须画图。这正是<Tex tex={'\\text{Anscombe (1973)}'} /> 的本意。</p>
      </Section>
    </TheoryDrawer>
  );
}
