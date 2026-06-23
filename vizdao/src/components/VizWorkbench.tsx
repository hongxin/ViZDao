// src/components/VizWorkbench.tsx — 多单元工作台：顶部单元导航 + 当前单元 + 上/下一单元。
// 未建成的单元显示"课堂讲授"占位，主线不断。
import { useNavStore } from '../store/navStore';
import { LESSON_META, ACT_LABEL } from '../viz/lessons/order';
import { LESSON_COMPONENTS } from '../viz/lessons/registry';

export function VizWorkbench() {
  const index = useNavStore((s) => s.index);
  const goTo = useNavStore((s) => s.goTo);
  const next = useNavStore((s) => s.next);
  const prev = useNavStore((s) => s.prev);

  const meta = LESSON_META[index];
  const Comp = LESSON_COMPONENTS[meta.id];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 单元导航 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 4px', borderBottom: '1px solid hsl(var(--border))', overflowX: 'auto' }}>
        {LESSON_META.map((m, i) => {
          const built = Boolean(LESSON_COMPONENTS[m.id]);
          const active = i === index;
          return (
            <button
              key={m.id}
              onClick={() => goTo(i)}
              aria-current={active ? 'true' : undefined}
              title={built ? m.title : `${m.title}（课堂讲授）`}
              style={{
                fontSize: 12, padding: '4px 8px', whiteSpace: 'nowrap', borderRadius: 6,
                border: '1px solid hsl(var(--border))', cursor: 'pointer',
                background: active ? 'hsl(var(--primary))' : 'transparent',
                color: active ? 'hsl(var(--primary-foreground))' : 'inherit',
                opacity: built ? 1 : 0.55,
              }}
            >
              {m.title}{built ? '' : ' 🖥️'}
            </button>
          );
        })}
      </div>

      {/* 当前单元（体验单元全幅自带留白；占位讲授页自带内距） */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {Comp ? (
          <Comp />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8, opacity: 0.65, padding: 12 }}>
            <div style={{ fontSize: 20 }}>🖥️ 本单元课堂讲授</div>
            <div style={{ fontSize: 14 }}>{meta.title}</div>
            <div style={{ fontSize: 12 }}>此单元用课件 / 现场演示讲授；交互版后续上线。</div>
          </div>
        )}
      </div>

      {/* 上/下一单元 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 4px', borderTop: '1px solid hsl(var(--border))' }}>
        <button onClick={prev} disabled={index === 0} style={{ cursor: index === 0 ? 'default' : 'pointer' }}>← 上一单元</button>
        <span style={{ fontSize: 12, opacity: 0.6 }}>第{ACT_LABEL[meta.act]}幕 · {index + 1}/{LESSON_META.length}</span>
        <button onClick={next} disabled={index === LESSON_META.length - 1} style={{ cursor: index === LESSON_META.length - 1 ? 'default' : 'pointer' }}>下一单元 →</button>
      </div>
    </div>
  );
}
