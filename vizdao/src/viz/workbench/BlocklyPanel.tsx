// src/viz/workbench/BlocklyPanel.tsx — 积木通道：Blockly 工作区 ↔ workbenchStore.views 双向同步。
// 改积木字段/搭表达式 → 右侧视图即变；AI/GUI 改视图 → 积木回填。三通道共用同一 ViewSpec IR。
// 不用类别 flyout（其打开/关闭会破坏工作区度量致滚动条错位）；改用顶部"加块"按钮在工作区生成块，再拖拽连接。
import { useEffect, useRef } from 'react';
import * as Blockly from 'blockly';
import { defineViewBlock, specsToState, workspaceToSpecs, canon } from './blocks/viewBlocks';
import { useWorkbenchStore, nextViewId } from '../../store/workbenchStore';

const ADDERS: { type: string; label: string; color: string }[] = [
  { type: 'vz_view', label: '+视图', color: '#ef7d22' },
  { type: 'vz_derive', label: '+新列', color: '#a855f7' },
  { type: 'expr_field', label: '字段', color: '#2e7ebb' },
  { type: 'expr_num', label: '数值', color: '#2e7ebb' },
  { type: 'expr_arith', label: '算术', color: '#2e7ebb' },
  { type: 'expr_cmp', label: '比较', color: '#3b9c5a' },
  { type: 'expr_logic', label: '逻辑', color: '#3b9c5a' },
];

export function BlocklyPanel() {
  const ref = useRef<HTMLDivElement>(null);
  const wsRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const addCount = useRef(0);
  const views = useWorkbenchStore((s) => s.views);
  const setViews = useWorkbenchStore((s) => s.setViews);
  const lastSynced = useRef('');
  const applying = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    defineViewBlock();
    const ws = Blockly.inject(ref.current, {
      trashcan: true, scrollbars: true,
      zoom: { controls: true, wheel: true, startScale: 0.9, minScale: 0.5, maxScale: 1.3 },
      grid: { spacing: 22, length: 2, colour: '#eee', snap: true },
    });
    wsRef.current = ws;

    applying.current = true;
    Blockly.serialization.workspaces.load(specsToState(useWorkbenchStore.getState().views), ws);
    lastSynced.current = canon(useWorkbenchStore.getState().views);
    applying.current = false;

    // 注入时左面板宽度可能尚未稳定（刚 320→440）；下一帧按真实尺寸重算。
    requestAnimationFrame(() => { Blockly.svgResize(ws); requestAnimationFrame(() => Blockly.svgResize(ws)); });

    const onChange = (e: Blockly.Events.Abstract) => {
      if (applying.current || e.isUiEvent) return;
      ws.getTopBlocks(false).forEach((b) => { if (b.type === 'vz_view' && !b.data) b.data = nextViewId(); });
      const specs = workspaceToSpecs(ws);
      const c = canon(specs);
      if (c !== lastSynced.current) { lastSynced.current = c; setViews(specs); }
    };
    ws.addChangeListener(onChange);

    const ro = new ResizeObserver(() => Blockly.svgResize(ws));
    ro.observe(ref.current);

    return () => { ro.disconnect(); ws.dispose(); wsRef.current = null; };
  }, [setViews]);

  // 外部（AI/GUI）改了 views → 回填积木。
  useEffect(() => {
    const ws = wsRef.current;
    if (!ws) return;
    const c = canon(views);
    if (c === lastSynced.current) return;
    applying.current = true;
    Blockly.serialization.workspaces.load(specsToState(views), ws);
    lastSynced.current = c;
    setTimeout(() => { applying.current = false; }, 0);
  }, [views]);

  const addBlock = (type: string) => {
    const ws = wsRef.current;
    if (!ws) return;
    const b = ws.newBlock(type) as Blockly.BlockSvg;
    if (type === 'vz_view') { b.data = nextViewId(); b.setFieldValue('scatter', 'chart'); b.setFieldValue('temp', 'x'); b.setFieldValue('cnt', 'y'); }
    if (type === 'vz_derive') b.setFieldValue('占比', 'name');
    b.initSvg();
    b.render();
    const k = addCount.current++;
    b.moveBy(150 + (k % 6) * 18, 18 + (k % 10) * 20);
  };

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '0.35rem var(--vz-s3) 0.45rem', borderBottom: '1px solid hsl(var(--border))' }}>
        <div style={{ fontSize: 'var(--vz-text-sm)', color: 'hsl(var(--vz-ink-soft))', lineHeight: 1.5, marginBottom: '0.35rem' }}>
          积木 = 可编程的分析：加<b style={{ color: '#a855f7' }}>新列</b>派生指标（临时占比 = casual ÷ cnt）、用<b style={{ color: '#3b9c5a' }}>表达式</b>写筛选（yr = 1 解混杂）→ 右图即变。
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', alignItems: 'center' }}>
          {ADDERS.map((a, i) => (
            <span key={a.type} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              {i === 2 && <span style={{ fontSize: 'var(--vz-text-sm)', color: 'hsl(var(--vz-ink-soft))' }}>表达式</span>}
              <button onClick={() => addBlock(a.type)}
                style={{ fontSize: 'var(--vz-text-sm)', padding: '0.15rem 0.5rem', borderRadius: 999, border: `1px solid ${a.color}`, background: 'transparent', color: a.color, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {a.label}
              </button>
            </span>
          ))}
        </div>
      </div>
      <div ref={ref} style={{ flex: 1, minHeight: 0 }} />
    </div>
  );
}
