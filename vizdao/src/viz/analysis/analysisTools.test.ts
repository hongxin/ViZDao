import { describe, it, expect, beforeEach } from 'vitest';
import { registerAnalysisTools } from './analysisTools';
import { useWorkbenchStore } from '../../store/workbenchStore';
import type { Tool } from '../../types/tool';

// 极简 fake registry：收集工具，按名取出直调 execute（不需真 LLM / 完整 ToolRegistry）。
const tools = new Map<string, Tool>();
registerAnalysisTools({ register: (t: Tool) => tools.set(t.definition.function.name, t) } as never);
const run = (name: string, params: Record<string, unknown> = {}) => tools.get(name)!.execute(params);

describe('analysisTools · AI 工具带改 workbenchStore', () => {
  beforeEach(() => useWorkbenchStore.getState().reset());

  it('八个工具都注册了', () => {
    for (const n of ['add_view', 'update_view', 'remove_view', 'list_views', 'select_where', 'select_extreme', 'clear_selection', 'summarize']) {
      expect(tools.has(n)).toBe(true);
    }
  });

  it('add_view 增视图', async () => {
    const before = useWorkbenchStore.getState().views.length;
    const r = await run('add_view', { chart: 'scatter', x: 'temp', y: 'cnt', title: 'T' });
    expect(useWorkbenchStore.getState().views.length).toBe(before + 1);
    expect(r).toMatch(/已添加视图/);
  });

  it('select_where temp>30 设选区', async () => {
    await run('select_where', { field: 'temp', cmp: '>', value: 30 });
    const sel = useWorkbenchStore.getState().selection;
    expect(sel && sel.length).toBeGreaterThan(0);
  });

  it('select_extreme temp top 10% ≈ 73 天', async () => {
    await run('select_extreme', { field: 'temp', end: 'top', fraction: 0.1 });
    const sel = useWorkbenchStore.getState().selection!;
    expect(sel.length).toBeGreaterThan(60);
    expect(sel.length).toBeLessThan(85);
  });

  it('summarize by workingday 返回注册/临时分组', async () => {
    const r = await run('summarize', { by: 'workingday' });
    expect(r).toMatch(/注册/);
    expect(r).toMatch(/临时/);
  });

  it('clear_selection 归零', async () => {
    await run('select_where', { field: 'temp', cmp: '>', value: 30 });
    await run('clear_selection');
    expect(useWorkbenchStore.getState().selection).toBeNull();
  });
});
