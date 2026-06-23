// src/viz/units/closing/ClosingTheory.tsx — 收束的理论（注入共享 TheoryDrawer）。
// 一条数学暗线：偏差-方差权衡，串起几乎每一课的"那个旋钮"。
import type { CSSProperties } from 'react';
import { Tex, Section, NOTE, TheoryDrawer } from '../../engine/theory';

const KNOBS: [string, string, string, string][] = [
  ['过拟合', '多项式阶数 d', '欠拟合·高偏差', '过拟合·高方差'],
  ['分布 KDE', '带宽 h', '过平·高偏差', '过尖·高方差'],
  ['聚类', '簇数 K', '太粗·高偏差', '太碎·高方差'],
  ['降维 t-SNE', 'perplexity', '重局部', '重全局'],
];

export function ClosingTheory({ onClose }: { onClose: () => void }) {
  const cell: CSSProperties = { fontSize: 'var(--vz-text-sm)', padding: '0.3rem 0.5rem', color: 'hsl(var(--foreground))' };
  const head: CSSProperties = { ...cell, color: 'hsl(var(--vz-ink-soft))', fontWeight: 400 };
  return (
    <TheoryDrawer onClose={onClose}>
      <Section label="一条数学暗线：偏差-方差权衡">
        <Tex block tex={'\\mathbb{E}\\bigl[(\\hat{y}-y)^2\\bigr]=\\underbrace{\\mathrm{Bias}^2}_{\\text{太简单}}+\\underbrace{\\mathrm{Var}}_{\\text{太复杂}}+\\underbrace{\\sigma^2}_{\\text{噪声}}'} />
        <p style={{ ...NOTE, marginTop: 0 }}>几乎每一课，都有一个你必须亲手选的「旋钮」（超参数）。它都在<b>偏差 ↔ 方差</b>之间权衡——拧太小、太大都不对：</p>
      </Section>

      <Section label="各课的「那个旋钮」">
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr><th style={{ ...head, textAlign: 'left' }}>课</th><th style={{ ...head, textAlign: 'left' }}>旋钮</th><th style={{ ...head, textAlign: 'left' }}>调小→</th><th style={{ ...head, textAlign: 'left' }}>调大→</th></tr>
          </thead>
          <tbody>
            {KNOBS.map((r) => (
              <tr key={r[0]} style={{ borderTop: '1px solid hsl(var(--border))' }}>
                <td style={{ ...cell, fontWeight: 600, whiteSpace: 'nowrap' }}>{r[0]}</td>
                <td style={{ ...cell, fontFamily: 'ui-monospace, monospace', color: 'hsl(var(--vz-ink-soft))' }}>{r[1]}</td>
                <td style={cell}>{r[2]}</td>
                <td style={cell}>{r[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section label="所以——">
        <p style={{ ...NOTE, marginTop: 0 }}>没有「自动正确」的旋钮位置：它是<b>判断</b>，不是计算。这正是「人」不可替代之处，也是你指挥 AI 协同分析时，最该把关的地方。可视化，是你做这个判断时的眼睛。</p>
      </Section>
    </TheoryDrawer>
  );
}
