// src/viz/units/highdim/IrisTheory.tsx — 高维困境的理论（注入共享 TheoryDrawer）。
// 投影组合数 / Fisher 判别比 / 6 个特征对的可分性条形（花瓣对最佳）。
import { IRIS_FEATURE_LABELS } from '../../datasets/iris';
import { separability } from './IrisStage';
import { Tex, Section, NOTE, TheoryDrawer } from '../../engine/theory';

const ACCENT = '#ef7d22';
const PAIRS: [number, number][] = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];

export function IrisTheory({ onClose }: { onClose: () => void }) {
  const rows = PAIRS.map(([a, b]) => ({ a, b, J: separability(a, b) })).sort((x, y) => y.J - x.J);
  const maxJ = rows[0].J;
  return (
    <TheoryDrawer onClose={onClose}>
      <Section label="把 4 维投到 2 维">
        <p style={{ ...NOTE, marginTop: 0 }}>4 个特征，任选 2 个作轴，共有</p>
        <Tex block tex={'\\binom{4}{2}=6 \\quad\\text{种 2D 视图}'} />
        <p style={NOTE}>一般 <Tex tex={'d'} /> 维有 <Tex tex={'\\binom{d}{2}'} /> 种二维投影——维度越高，随手一选越可能"看偏"。这就是维度灾难的一个侧面。</p>
      </Section>

      <Section label="可分性 · Fisher 判别比">
        <Tex block tex={'J=\\frac{\\operatorname{tr}(S_B)}{\\operatorname{tr}(S_W)}'} />
        <p style={NOTE}>
          类间散度 <Tex tex={'S_B=\\sum_c n_c(\\mu_c-\\mu)(\\mu_c-\\mu)^{\\top}'} />，
          类内散度 <Tex tex={'S_W=\\sum_c\\sum_{i\\in c}(x_i-\\mu_c)(x_i-\\mu_c)^{\\top}'} />。
          <Tex tex={'J'} /> 越大：类与类离得越远、各自越紧——越好分。
        </p>
      </Section>

      <div style={{ height: 1, background: 'hsl(var(--border))', margin: 'var(--vz-s4) 0 var(--vz-s5)' }} />

      <Section label="六种特征对的可分性">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {rows.map((r) => {
            const isPetal = (r.a === 2 && r.b === 3) || (r.a === 3 && r.b === 2);
            return (
              <div key={`${r.a}-${r.b}`} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: 'var(--vz-text-sm)', color: 'hsl(var(--vz-ink-soft))', width: '7.5rem', textAlign: 'right', whiteSpace: 'nowrap' }}>{IRIS_FEATURE_LABELS[r.a]}×{IRIS_FEATURE_LABELS[r.b]}</span>
                <div style={{ flex: 1, height: 10, background: 'hsl(var(--muted))', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${(r.J / maxJ) * 100}%`, height: '100%', background: isPetal ? ACCENT : 'hsl(0 0% 70%)' }} />
                </div>
                <span style={{ fontSize: 'var(--vz-text-sm)', fontFamily: 'ui-monospace, monospace', color: isPetal ? ACCENT : 'hsl(var(--foreground))', width: '2.4rem', textAlign: 'right' }}>{r.J.toFixed(1)}</span>
              </div>
            );
          })}
        </div>
        <p style={NOTE}>花瓣长×花瓣宽 远胜其余：花瓣的类间方差大、类内方差小。<b>看不见结构，往往是没选对投影</b>——而这正是「降维」要替你自动找的事。</p>
      </Section>
    </TheoryDrawer>
  );
}
