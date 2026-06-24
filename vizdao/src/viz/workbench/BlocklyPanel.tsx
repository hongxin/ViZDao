// src/viz/workbench/BlocklyPanel.tsx — 积木通道：Blockly 工作区 ↔ workbenchStore.views 双向同步。
// 改积木字段/搭表达式 → 右侧视图即变；AI/GUI 改视图 → 积木回填。三通道共用同一 ViewSpec IR。
import { useEffect, useRef } from 'react';
import * as Blockly from 'blockly';
import { defineViewBlock, TOOLBOX, specsToState, workspaceToSpecs, canon } from './blocks/viewBlocks';
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
      toolbox: TOOLBOX, trashcan: true, scrollbars: true,
      zoom: { controls: true, wheel: true, startScale: 0.9, minScale: 0.5, maxScale: 1.3 },
      grid: { spacing: 22, length: 2, colour: '#eee', snap: true },
    });
    wsRef.current = ws;

    applying.current = true;
    Blockly.serialization.workspaces.load(specsToState(useWorkbenchStore.getState().views), ws);
    lastSynced.current = canon(useWorkbenchStore.getState().views);
    applying.current = false;

    // 注入时左面板宽度可能尚未稳定（刚 320→440）；下一帧按真实尺寸重算，修滚动条/度量错位。
    requestAnimationFrame(() => { Blockly.svgResize(ws); requestAnimationFrame(() => Blockly.svgResize(ws)); });

    const onChange = (e: Blockly.Events.Abstract) => {
      if (applying.current || e.isUiEvent) return;
      // 给新拖入/缺 id 的视图块补稳定 id（避免每次编辑重生 id 致视图重建）
      ws.getTopBlocks(false).forEach((b) => { if (b.type === 'vz_view' && !b.data) b.data = nextViewId(); });
      const specs = workspaceToSpecs(ws);
      const c = canon(specs);
      if (c !== lastSynced.current) { lastSynced.current = c; setViews(specs); }
    };
    ws.addChangeListener(onChange);

    // 按真实宽度重算度量，修竖直滚动条错位到画布中间（flyout 开/关后 Blockly 不自动复位）。
    let resizePending = false;
    const scheduleResize = () => {
      if (resizePending) return;
      resizePending = true;
      requestAnimationFrame(() => { resizePending = false; if (wsRef.current) Blockly.svgResize(ws); });
    };
    ws.addChangeListener(scheduleResize);                  // 加块/拖拽等事件
    ref.current.addEventListener('pointerup', scheduleResize); // flyout 点开又点空白关闭（无加块事件）
    const host = ref.current;

    const ro = new ResizeObserver(() => Blockly.svgResize(ws));
    ro.observe(ref.current);

    return () => { ro.disconnect(); host.removeEventListener('pointerup', scheduleResize); ws.dispose(); wsRef.current = null; };
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

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '0.35rem var(--vz-s3)', fontSize: 'var(--vz-text-sm)', color: 'hsl(var(--vz-ink-soft))', borderBottom: '1px solid hsl(var(--border))', lineHeight: 1.5 }}>
        积木 = 可编程的分析：从工具箱拖<b style={{ color: '#a855f7' }}>新列</b>派生指标（临时占比 = casual ÷ cnt）、拖<b style={{ color: '#3b9c5a' }}>表达式</b>写筛选（yr = 1 解混杂）→ 右图即变。
      </div>
      <div ref={ref} style={{ flex: 1, minHeight: 0 }} />
    </div>
  );
}
