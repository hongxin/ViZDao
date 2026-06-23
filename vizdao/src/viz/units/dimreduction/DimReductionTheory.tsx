// src/viz/units/dimreduction/DimReductionTheory.tsx — 降维的理论（注入共享 TheoryDrawer）。
// PCA 特征分解/解释方差条 + t-SNE KL 散度/perplexity + "距离不可信"告诫。
import { PCA_RES } from './DimReductionStage';
import { Tex, Section, NOTE, TheoryDrawer } from '../../engine/theory';

const ACCENT = '#ef7d22';

function VarianceBars() {
  const ex = PCA_RES.explained.slice(0, 10);
  const max = ex[0];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      {ex.map((v, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: 'var(--vz-text-sm)', color: 'hsl(var(--vz-ink-soft))', width: '2.6rem', textAlign: 'right' }}>PC{i + 1}</span>
          <div style={{ flex: 1, height: 9, background: 'hsl(var(--muted))', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${(v / max) * 100}%`, height: '100%', background: i < 2 ? ACCENT : 'hsl(0 0% 72%)' }} />
          </div>
          <span style={{ fontSize: 'var(--vz-text-sm)', fontFamily: 'ui-monospace, monospace', color: i < 2 ? ACCENT : 'hsl(var(--foreground))', width: '2.6rem', textAlign: 'right' }}>{(v * 100).toFixed(0)}%</span>
        </div>
      ))}
    </div>
  );
}

export function DimReductionTheory({ onClose }: { onClose: () => void }) {
  return (
    <TheoryDrawer onClose={onClose}>
      <Section label="PCA · 线性投影（保全局方差）">
        <p style={{ ...NOTE, marginTop: 0 }}>找一组正交轴，使投影后方差最大——即协方差矩阵的特征分解：</p>
        <Tex block tex={'\\Sigma=\\frac{1}{n}\\sum_i (x_i-\\mu)(x_i-\\mu)^{\\top},\\quad \\Sigma v_k=\\lambda_k v_k'} />
        <p style={NOTE}>取最大的两个特征向量当 2D 轴。第 <Tex tex={'k'} /> 轴的解释方差比 <Tex tex={'\\lambda_k/\\sum_j\\lambda_j'} />：</p>
        <VarianceBars />
        <p style={NOTE}>前 2 个主成分只占很小一部分方差——64 维里的结构，线性投影压不进 2 维。</p>
      </Section>

      <div style={{ height: 1, background: 'hsl(var(--border))', margin: 'var(--vz-s4) 0 var(--vz-s5)' }} />

      <Section label="t-SNE · 非线性（保邻里）">
        <p style={{ ...NOTE, marginTop: 0 }}>把高维的「谁挨着谁」搬到低维：高维亲和 <Tex tex={'p_{ij}'} />（高斯）、低维 <Tex tex={'q_{ij}'} />（Student-t 重尾），最小化 KL 散度：</p>
        <Tex block tex={'\\mathrm{KL}(P\\Vert Q)=\\sum_{i\\neq j} p_{ij}\\log\\frac{p_{ij}}{q_{ij}}'} />
        <p style={NOTE}>perplexity ≈ 每个点"有效邻居数"。重尾 <Tex tex={'q'} /> 让远点更敢分开——于是缠在一起的团被解开。</p>
      </Section>

      <Section label="一个重要的告诫">
        <p style={{ ...NOTE, marginTop: 0 }}>t-SNE 只保证<b>邻居还是邻居</b>：簇<b>之间</b>的距离、簇的<b>大小</b>都不可解读。它是一面好用但会"撒谎"的镜子——好看 ≠ 真实几何。</p>
      </Section>
    </TheoryDrawer>
  );
}
