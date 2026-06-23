// src/viz/lessons/ClosingLesson.tsx — 收束·可视化×AI：回顾旅程 + 主线升华 + AI 助教 CTA。
// 纯展示页（无图表/算法），让 7 单元全程闭环。
import { useAgentStore } from '../../store/agentStore';

const JOURNEY: { title: string; takeaway: string }[] = [
  { title: '看见胜过计算', takeaway: '统计量骗了你——先画图，再算数' },
  { title: '过拟合 → 正则', takeaway: '训练误差低 ≠ 好模型' },
  { title: '分布 · KDE', takeaway: '形状不该靠分桶的武断' },
  { title: '高维困境', takeaway: '挑哪两维，本身就是建模' },
  { title: '聚类 · K-Means', takeaway: '参数即你看世界的粒度' },
  { title: '降维 · PCA', takeaway: '信息主要集中在前几个主成分' },
];

const HOOKS = ['插值族：Hermite / Catmull-Rom / LOESS', '多维关系：散点图矩阵 / 平行坐标', '可视化 × 知识图谱（Cosmos 的方向）'];

export function ClosingLesson() {
  const agent = useAgentStore((s) => s.agent);

  return (
    <div style={{ height: '100%', overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
      <div style={{ maxWidth: 760, padding: '8px 16px 32px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 20, margin: '8px 0 4px' }}>收束 · 可视化是 AI 的眼睛</h2>
        <blockquote
          style={{
            margin: '16px auto', maxWidth: 560, fontSize: 18, lineHeight: 1.6,
            padding: '14px 18px', borderLeft: '3px solid hsl(var(--primary))',
            background: 'hsl(var(--muted))', borderRadius: 8, textAlign: 'left',
          }}
        >
          「我建了一个模型，它好不好？—— 看一眼就知道。」
        </blockquote>
        <p style={{ fontSize: 14, opacity: 0.85 }}>
          今天每一步——拟合、聚类、降维——都是「建模 + 看见」。这正是 AI 理解世界的方式。
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10, margin: '20px 0' }}>
          {JOURNEY.map((j, i) => (
            <div key={j.title} style={{ border: '1px solid hsl(var(--border))', borderRadius: 8, padding: '10px 12px', textAlign: 'left' }}>
              <div style={{ fontSize: 12, opacity: 0.5 }}>{i + 1}</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{j.title}</div>
              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>{j.takeaway}</div>
            </div>
          ))}
        </div>

        <div
          style={{
            border: '1px dashed hsl(var(--primary))', borderRadius: 10, padding: '14px 16px',
            background: 'hsl(var(--accent))', textAlign: 'left',
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>🤖 把图丢给 AI 助教</div>
          <p style={{ fontSize: 13, opacity: 0.85, margin: 0 }}>
            {agent
              ? '✓ AI 助教已就绪——把今天任意一张看不懂的图丢给它，让它讲清楚每个簇、每条曲线背后的意思。'
              : '想让 AI 帮你解读图？点右上角「设置」填入 DeepSeek Key，即可启用可视化助教。'}
          </p>
        </div>

        <p style={{ fontSize: 14, marginTop: 20, fontWeight: 500 }}>
          建模让数据有结构，可视化让结构被看见，AI 让看见可对话。<br />这就是可视化建模的未来。
        </p>

        <div style={{ marginTop: 18, textAlign: 'left' }}>
          <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 6 }}>三个延伸钩子（3 小时之外）</div>
          {HOOKS.map((h) => (
            <div key={h} style={{ fontSize: 13, opacity: 0.8, padding: '3px 0' }}>· {h}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
