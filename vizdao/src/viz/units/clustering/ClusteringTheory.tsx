// src/viz/units/clustering/ClusteringTheory.tsx — 聚类的理论（注入共享 TheoryDrawer）。
// 簇内平方和目标 / Lloyd 算法 / J-vs-K 肘部曲线（呼应泛化曲线母题）。
import { evalK } from './ClusteringStage';
import { Tex, Section, NOTE, TheoryDrawer } from '../../engine/theory';

const ACCENT = '#ef7d22';

function ElbowCurve() {
  const KS = [2, 3, 4, 5, 6];
  const rows = KS.map((k) => ({ k, J: evalK(k).J }));
  const W = 330, H = 150, padL = 30, padR = 10, padT = 12, padB = 22;
  const jmax = rows[0].J;
  const xAt = (k: number) => padL + ((k - 2) / 4) * (W - padL - padR);
  const yAt = (j: number) => padT + (1 - j / jmax) * (H - padT - padB);
  return (
    <div style={{ border: '1px solid hsl(var(--border))', borderRadius: 8, padding: '0.4rem' }}>
      <svg width={W} height={H} style={{ display: 'block' }}>
        <line x1={padL} y1={padT} x2={padL} y2={H - padB} stroke="hsl(0 0% 82%)" />
        <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke="hsl(0 0% 82%)" />
        <polyline points={rows.map((r) => `${xAt(r.k).toFixed(1)},${yAt(r.J).toFixed(1)}`).join(' ')} fill="none" stroke={ACCENT} strokeWidth={2} />
        {rows.map((r) => <circle key={r.k} cx={xAt(r.k)} cy={yAt(r.J)} r={3} fill={ACCENT} />)}
        {/* K=3 肘部标注 */}
        <line x1={xAt(3)} y1={padT} x2={xAt(3)} y2={H - padB} stroke="hsl(0 0% 72%)" strokeDasharray="3 3" />
        {KS.map((k) => <text key={k} x={xAt(k) - 3} y={H - 7} fontSize={9} fill="hsl(0 0% 55%)">{k}</text>)}
        <text x={padL - 6} y={padT + 8} fontSize={9} fill="hsl(0 0% 55%)" textAnchor="end">J</text>
        <text x={W / 2 - 6} y={H - 7} fontSize={9} fill="hsl(0 0% 45%)">K →</text>
      </svg>
    </div>
  );
}

export function ClusteringTheory({ onClose }: { onClose: () => void }) {
  return (
    <TheoryDrawer onClose={onClose}>
      <Section label="目标：最小化簇内平方和">
        <Tex block tex={'J=\\sum_{k=1}^{K}\\sum_{i\\in C_k}\\lVert x_i-\\mu_k\\rVert^2'} />
        <p style={NOTE}><Tex tex={'\\mu_k'} /> 是第 <Tex tex={'k'} /> 簇的中心（均值）。<Tex tex={'J'} /> 越小，各簇越紧致。</p>
      </Section>

      <Section label="Lloyd 算法（分配 ↔ 更新）">
        <p style={{ ...NOTE, marginTop: 0 }}>
          ① 分配：每点归到最近的中心　<Tex tex={'c_i=\\arg\\min_k\\lVert x_i-\\mu_k\\rVert^2'} />；<br />
          ② 更新：中心移到簇均值　<Tex tex={'\\mu_k=\\frac{1}{|C_k|}\\sum_{i\\in C_k}x_i'} />；<br />
          ③ 重复直到不再变动。保证 <Tex tex={'J'} /> 单调下降、收敛到局部最优。
        </p>
      </Section>

      <div style={{ height: 1, background: 'hsl(var(--border))', margin: 'var(--vz-s4) 0 var(--vz-s5)' }} />

      <Section label="选 K：肘部法则（J vs K）">
        <ElbowCurve />
        <p style={NOTE}><Tex tex={'K'} /> 越大 <Tex tex={'J'} /> 必然越小（极端时每点自成一簇 <Tex tex={'J=0'} />）。看「肘部」——下降骤缓处（此处约 <Tex tex={'K=3'} />）。但这只是启发式：<b>数据不会告诉你正确的 K</b>。K-Means 还假设簇是球形、等大——假设不符时，它照样自信地给你 K 个团。</p>
      </Section>
    </TheoryDrawer>
  );
}
