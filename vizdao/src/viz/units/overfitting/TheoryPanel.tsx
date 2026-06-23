// src/viz/units/overfitting/TheoryPanel.tsx — 「理论深探」抽屉：三岁不觉深之外，给六十岁教授的纵深。
// 公式用 KaTeX 渲染（LaTeX 级）。模型 / 岭回归目标 / 闭式解 + 泛化曲线（偏差-方差·对数纵轴）+ 实时系数范数。
import type { CSSProperties, ReactNode } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { ridgeFit, metrics } from '../../analysis/ridge';
import type { Point } from '../../datasets/sinNoise';

const ACCENT = '#ef7d22';
const DANGER = '#dc2626';

/** KaTeX 渲染。block=true 为独立居中公式。 */
function Tex({ tex, block }: { tex: string; block?: boolean }) {
  const html = katex.renderToString(tex, { throwOnError: false, displayMode: block });
  if (block) {
    return <div style={{ overflowX: 'auto', padding: '0.35rem 0', textAlign: 'center', color: 'hsl(var(--foreground))' }} dangerouslySetInnerHTML={{ __html: html }} />;
  }
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 'var(--vz-s4)' }}>
      <div style={{ fontSize: 'var(--vz-text-sm)', color: 'hsl(var(--vz-ink-soft))', marginBottom: '0.25rem', letterSpacing: '0.01em' }}>{label}</div>
      {children}
    </div>
  );
}

const NOTE: CSSProperties = { fontSize: 'var(--vz-text-sm)', color: 'hsl(var(--vz-ink-soft))', lineHeight: 1.7, margin: '0.25rem 0 0' };

function GeneralizationCurve({ xn, ys, data, degree, lambda }: { xn: number[]; ys: number[]; data: Point[]; degree: number; lambda: number }) {
  const DMAX = 14;
  const rows = Array.from({ length: DMAX }, (_, i) => {
    const d = i + 1;
    const m = metrics(ridgeFit(xn, ys, d, lambda), data);
    return { d, train: m.trainMSE, true: m.trueMSE };
  });
  const W = 330, H = 168, padL = 26, padR = 10, padT = 12, padB = 20;
  // 对数纵轴：真值误差高阶爆几个数量级，取 log 让单调↓与 U 形全程可见、不被截断。
  const LOGMIN = Math.log(0.01), LOGMAX = Math.log(100);
  const xAt = (d: number) => padL + ((d - 1) / (DMAX - 1)) * (W - padL - padR);
  const yAt = (e: number) => padT + (1 - (Math.min(Math.max(Math.log(Math.max(e, 0.01)), LOGMIN), LOGMAX) - LOGMIN) / (LOGMAX - LOGMIN)) * (H - padT - padB);
  const poly = (key: 'train' | 'true') => rows.map((r) => `${xAt(r.d).toFixed(1)},${yAt(r[key]).toFixed(1)}`).join(' ');
  return (
    <div style={{ border: '1px solid hsl(var(--border))', borderRadius: 8, padding: '0.3rem' }}>
      <svg width={W} height={H} style={{ display: 'block' }}>
        {[0.01, 0.1, 1, 10, 100].map((e) => (
          <line key={e} x1={padL} y1={yAt(e)} x2={W - padR} y2={yAt(e)} stroke="hsl(0 0% 93%)" />
        ))}
        <line x1={padL} y1={padT} x2={padL} y2={H - padB} stroke="hsl(0 0% 82%)" />
        <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke="hsl(0 0% 82%)" />
        <line x1={xAt(degree)} y1={padT} x2={xAt(degree)} y2={H - padB} stroke="hsl(0 0% 72%)" strokeDasharray="3 3" />
        <polyline points={poly('train')} fill="none" stroke={ACCENT} strokeWidth={2} />
        <polyline points={poly('true')} fill="none" stroke={DANGER} strokeWidth={2} />
        <circle cx={xAt(degree)} cy={yAt(rows[degree - 1].true)} r={3} fill={DANGER} />
        <text x={padL} y={H - 6} fontSize={9} fill="hsl(0 0% 55%)">1</text>
        <text x={W - padR - 18} y={H - 6} fontSize={9} fill="hsl(0 0% 55%)">阶数</text>
        <text x={2} y={padT + 7} fontSize={8} fill="hsl(0 0% 60%)">误差</text>
      </svg>
    </div>
  );
}

function Legend() {
  const dot = (c: string): CSSProperties => ({ display: 'inline-block', width: 14, height: 2, background: c, marginRight: 5, verticalAlign: 'middle' });
  return (
    <div style={{ display: 'flex', gap: 'var(--vz-s3)', fontSize: 'var(--vz-text-sm)', color: 'hsl(var(--vz-ink-soft))', marginTop: '0.3rem' }}>
      <span><i style={dot(ACCENT)} />训练误差</span>
      <span><i style={dot(DANGER)} />真值误差</span>
    </div>
  );
}

export function TheoryPanel({ xn, ys, data, degree, lambda, onClose }: {
  xn: number[]; ys: number[]; data: Point[]; degree: number; lambda: number; onClose: () => void;
}) {
  const w = ridgeFit(xn, ys, degree, lambda);
  const maxCoef = Math.max(...w.slice(1).map(Math.abs)); // 截距不计
  return (
    <div className="vz-beat-in" style={{
      position: 'absolute', top: 0, right: 0, bottom: 0, width: 384, zIndex: 50,
      background: 'hsl(var(--background) / 0.98)', borderLeft: '1px solid hsl(var(--border))',
      padding: 'var(--vz-s4) var(--vz-s4) var(--vz-s5)', overflowY: 'auto', backdropFilter: 'blur(6px)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--vz-s4)' }}>
        <span style={{ fontSize: 'var(--vz-text-lg)', fontWeight: 600 }}>理论深探</span>
        <button onClick={onClose} style={{ border: 'none', background: 'transparent', color: 'hsl(var(--vz-ink-soft))', cursor: 'pointer', fontSize: 'var(--vz-text-sm)' }}>收起 ✕</button>
      </div>

      <Section label={`多项式模型（阶数 d = ${degree}）`}>
        <Tex block tex={'\\hat{y}(x)=w_0+w_1x+w_2x^2+\\cdots+w_dx^d'} />
      </Section>

      <Section label="目标：最小二乘 + 岭正则">
        <Tex block tex={'J(\\mathbf{w})=\\frac{1}{n}\\sum_{i=1}^{n}\\bigl(y_i-\\hat{y}(x_i)\\bigr)^2+\\lambda\\sum_{j=1}^{d}w_j^2'} />
        <p style={NOTE}>第二项惩罚大权重；截距 <Tex tex={'w_0'} /> 不罚。<Tex tex={'\\lambda'} /> 越大，模型越「克制」。</p>
      </Section>

      <Section label="闭式解（正规方程）">
        <Tex block tex={'\\hat{\\mathbf{w}}=(X^{\\top}X+\\lambda I)^{-1}X^{\\top}y'} />
      </Section>

      <div style={{ height: 1, background: 'hsl(var(--border))', margin: 'var(--vz-s3) 0 var(--vz-s4)' }} />

      <Section label={`泛化曲线 · 偏差-方差权衡（λ = ${lambda.toFixed(2)}）`}>
        <GeneralizationCurve xn={xn} ys={ys} data={data} degree={degree} lambda={lambda} />
        <Legend />
        <p style={NOTE}>训练误差随阶数单调↓，真值误差先降后升呈 U 形——缺口即过拟合：</p>
        <Tex block tex={'\\mathbb{E}\\bigl[(\\hat{y}-y)^2\\bigr]=\\mathrm{Bias}^2+\\mathrm{Var}+\\sigma^2'} />
        <p style={NOTE}>阶数↑使偏差↓、方差↑；<Tex tex={'\\lambda'} /> 以一点偏差换取更小方差。最优在 U 形谷底。</p>
      </Section>

      <Section label="系数范数（过拟合的指纹）">
        <p style={{ margin: 0, display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
          <Tex tex={'\\max_j |w_j|='} />
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 'var(--vz-text-xl)', fontWeight: 600, color: maxCoef > 50 ? DANGER : 'hsl(var(--foreground))' }}>
            {maxCoef >= 1000 ? maxCoef.toExponential(1) : maxCoef.toFixed(1)}
          </span>
        </p>
        <p style={NOTE}>过拟合时系数暴涨；<Tex tex={'\\lambda'} /> 把它们压回——这就是「纪律」的数学含义。</p>
      </Section>
    </div>
  );
}
