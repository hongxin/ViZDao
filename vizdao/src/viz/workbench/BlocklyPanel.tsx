// src/viz/workbench/BlocklyPanel.tsx — 积木通道：Blockly 工作区 ↔ workbenchStore.views 双向同步。
// 改一个积木字段 → 右侧视图即变；AI/GUI 改视图 → 积木回填。三通道共用同一 ViewSpec IR。
// 不用常驻 flyout（窄面板会被它占满），改用「+ 新视图」按钮加块。
import { useEffect, useRef } from 'react';
import * as Blockly from 'blockly';
import { defineViewBlock, specsToState, workspaceToSpecs, canon } from './blocks/viewBlocks';
import { useWorkbenchStore, nextViewId } from '../../store/workbenchStore';

export function BlocklyPanel() {
  const ref = useRef<HTMLDivElement>(null);
  const wsRef = useRef<Blockly.WorkspaceSvg | null>(null);
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

    const onChange = (e: Blockly.Events.Abstract) => {
      if (applying.current || e.isUiEvent) return;
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

  const addBlock = () => {
    const ws = wsRef.current;
    if (!ws) return;
    const b = ws.newBlock('vz_view') as Blockly.BlockSvg;
    b.data = nextViewId();
    b.setFieldValue('scatter', 'chart');
    b.setFieldValue('temp', 'x');
    b.setFieldValue('cnt', 'y');
    b.initSvg();
    b.render();
    b.moveBy(16, 16 + ws.getTopBlocks(false).length * 8);
  };

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', padding: '0.35rem var(--vz-s3)', borderBottom: '1px solid hsl(var(--border))' }}>
        <span style={{ fontSize: 'var(--vz-text-sm)', color: 'hsl(var(--vz-ink-soft))' }}>积木 = 看得见的分析意图：改字段，右图即变</span>
        <button onClick={addBlock} style={{ fontSize: 'var(--vz-text-sm)', padding: '0.2rem 0.6rem', borderRadius: 6, border: '1px solid hsl(var(--border))', background: 'transparent', color: 'hsl(var(--vz-accent))', cursor: 'pointer', whiteSpace: 'nowrap' }}>+ 新视图</button>
      </div>
      <div ref={ref} style={{ flex: 1, minHeight: 0 }} />
    </div>
  );
}
