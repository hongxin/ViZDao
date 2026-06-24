// src/viz/engine/theory.tsx — 「理论深探」抽屉的共享骨架（分层深度：六十岁教授的那一层）。
// KaTeX 渲染 LaTeX 级公式；统一的区块节奏与留白，供各单元注入自己的理论内容。
import type { CSSProperties, ReactNode } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/** KaTeX 渲染。block=true 为独立居中公式。 */
export function Tex({ tex, block }: { tex: string; block?: boolean }) {
  const html = katex.renderToString(tex, { throwOnError: false, displayMode: block });
  if (block) {
    return <div style={{ overflowX: 'auto', padding: '0.5rem 0', textAlign: 'center', color: 'hsl(var(--foreground))' }} dangerouslySetInnerHTML={{ __html: html }} />;
  }
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

export const NOTE: CSSProperties = { fontSize: 'var(--vz-text-sm)', color: 'hsl(var(--vz-ink-soft))', lineHeight: 1.8, margin: '0.4rem 0 0' };

/** 一节：留白充裕的标签 + 内容。 */
export function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 'var(--vz-s5)' }}>
      <div style={{ fontSize: 'var(--vz-text-sm)', color: 'hsl(var(--vz-ink-soft))', marginBottom: '0.5rem', letterSpacing: '0.02em' }}>{label}</div>
      {children}
    </div>
  );
}

/** 右侧抽屉外壳：内容与边界都留足空。 */
export function TheoryDrawer({ onClose, children, title = '理论深探' }: { onClose: () => void; children: ReactNode; title?: string }) {
  return (
    <div className="vz-beat-in" style={{
      position: 'absolute', top: 0, right: 0, bottom: 0, width: 416, zIndex: 50,
      background: 'hsl(var(--background))', borderLeft: '1px solid hsl(var(--foreground) / 0.14)',
      boxShadow: '-10px 0 30px hsl(var(--foreground) / 0.10)',
      padding: 'var(--vz-s5) var(--vz-s6) var(--vz-s6)', overflowY: 'auto',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--vz-s5)' }}>
        <span style={{ fontSize: 'var(--vz-text-lg)', fontWeight: 600 }}>{title}</span>
        <button onClick={onClose} style={{ border: 'none', background: 'transparent', color: 'hsl(var(--vz-ink-soft))', cursor: 'pointer', fontSize: 'var(--vz-text-sm)' }}>收起 ✕</button>
      </div>
      {children}
    </div>
  );
}

/** 角落里克制的「∂ 理论深探」开关。 */
export function TheoryToggle({ onOpen }: { onOpen: () => void }) {
  return (
    <button onClick={onOpen} style={{
      position: 'absolute', top: 'var(--vz-s3)', right: 'var(--vz-s4)', zIndex: 40,
      border: 'none', background: 'transparent', color: 'hsl(var(--vz-accent))', cursor: 'pointer',
      fontSize: 'var(--vz-text-sm)', fontWeight: 500,
    }}>∂ 理论深探</button>
  );
}
