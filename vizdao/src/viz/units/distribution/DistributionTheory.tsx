// src/viz/units/distribution/DistributionTheory.tsx — 分布的理论内容（注入共享 TheoryDrawer）。
// 直方图=分段常数密度估计 / KDE 公式 / 带宽 h 的偏差-方差 + 多带宽诊断图。
import { gaussianKDE } from '../../analysis/kde';
import { Tex, Section, NOTE, TheoryDrawer } from '../../engine/theory';

const COLORS = ['#dc2626', '#ef7d22', '#3b82f6']; // 小h(尖) / 中h / 大h(糊)
const HS = [0.12, 0.35, 0.9];

function BandwidthFamily({ values }: { values: number[] }) {
  const W = 352, H = 150, padL = 8, padR = 8, padT = 10, padB = 18;
  const vmin = Math.min(...values), vmax = Math.max(...values);
  const lo = vmin - 1, hi = vmax + 1;
  const curves = HS.map((h) => gaussianKDE(values, h, 120));
  const ymax = Math.max(...curves.flat().map((p) => p.density)) * 1.05;
  const xAt = (x: number) => padL + ((x - lo) / (hi - lo)) * (W - padL - padR);
  const yAt = (d: number) => padT + (1 - d / ymax) * (H - padT - padB);
  return (
    <div style={{ border: '1px solid hsl(var(--border))', borderRadius: 8, padding: '0.4rem' }}>
      <svg width={W} height={H} style={{ display: 'block' }}>
        <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke="hsl(0 0% 82%)" />
        {curves.map((pts, i) => (
          <polyline key={i} points={pts.map((p) => `${xAt(p.x).toFixed(1)},${yAt(p.density).toFixed(1)}`).join(' ')} fill="none" stroke={COLORS[i]} strokeWidth={1.8} />
        ))}
        <text x={padL} y={H - 5} fontSize={9} fill="hsl(0 0% 55%)">y 值 →</text>
      </svg>
      <div style={{ display: 'flex', gap: 'var(--vz-s3)', fontSize: 'var(--vz-text-sm)', color: 'hsl(var(--vz-ink-soft))', marginTop: '0.3rem' }}>
        {HS.map((h, i) => (
          <span key={h}><i style={{ display: 'inline-block', width: 14, height: 2, background: COLORS[i], marginRight: 5, verticalAlign: 'middle' }} />h={h}{i === 0 ? '(过尖)' : i === 2 ? '(过平)' : '(恰好)'}</span>
        ))}
      </div>
    </div>
  );
}

export function DistributionTheory({ values, onClose }: { values: number[]; onClose: () => void }) {
  return (
    <TheoryDrawer onClose={onClose}>
      <Section label="直方图 · 分段常数密度估计">
        <Tex block tex={'\\hat{f}_{\\text{hist}}(x)=\\frac{\\#\\{x_i \\in \\text{bin}(x)\\}}{n\\cdot w}'} />
        <p style={NOTE}>桶宽 <Tex tex={'w'} /> 由桶数决定；它是一个**离散、武断**的选择，形状随之跳变。</p>
      </Section>

      <Section label="核密度估计 (KDE)">
        <Tex block tex={'\\hat{f}(x)=\\frac{1}{nh}\\sum_{i=1}^{n} K\\!\\left(\\frac{x-x_i}{h}\\right)'} />
        <p style={NOTE}>高斯核 <Tex tex={'K(u)=\\frac{1}{\\sqrt{2\\pi}}e^{-u^2/2}'} />：每个数据点摊成一个小钟形再叠加。带宽 <Tex tex={'h'} /> 把"武断的桶数"换成**连续可调**的旋钮。</p>
      </Section>

      <div style={{ height: 1, background: 'hsl(var(--border))', margin: 'var(--vz-s4) 0 var(--vz-s5)' }} />

      <Section label="带宽 h = 偏差-方差权衡">
        <BandwidthFamily values={values} />
        <p style={NOTE}>小 <Tex tex={'h'} />→ 高方差（过尖、追噪声）；大 <Tex tex={'h'} />→ 高偏差（过平、糊掉真峰）。与过拟合同一母题。经验法则（Silverman）：</p>
        <Tex block tex={'h \\approx 1.06\\,\\hat{\\sigma}\\,n^{-1/5}'} />
      </Section>
    </TheoryDrawer>
  );
}
