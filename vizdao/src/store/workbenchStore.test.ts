import { describe, it, expect, beforeEach } from 'vitest';
import { useWorkbenchStore } from './workbenchStore';

describe('workbenchStore · ViewBus', () => {
  beforeEach(() => useWorkbenchStore.getState().setDataset('bike'));

  it('初始装四视图、无选区', () => {
    const s = useWorkbenchStore.getState();
    expect(s.views).toHaveLength(4);
    expect(s.selection).toBeNull();
  });

  it('addView 追加；removeView 按 id 删', () => {
    const { addView, removeView } = useWorkbenchStore.getState();
    addView({ id: 'x1', chart: 'hist', by: 'temp' });
    expect(useWorkbenchStore.getState().views).toHaveLength(5);
    removeView('x1');
    expect(useWorkbenchStore.getState().views.map((v) => v.id)).not.toContain('x1');
  });

  it('updateView 局部改一个视图的编码', () => {
    const { updateView } = useWorkbenchStore.getState();
    updateView('v1', { color: 'workingday' });
    const v1 = useWorkbenchStore.getState().views.find((v) => v.id === 'v1');
    expect(v1?.color).toBe('workingday');
    expect(v1?.x).toBe('temp'); // 其余不变
  });

  it('setSelection：空数组归一为 null', () => {
    const { setSelection } = useWorkbenchStore.getState();
    setSelection([3, 5, 8]);
    expect(useWorkbenchStore.getState().selection).toEqual([3, 5, 8]);
    setSelection([]);
    expect(useWorkbenchStore.getState().selection).toBeNull();
  });

  it('reset 回到初始四视图', () => {
    const s = useWorkbenchStore.getState();
    s.addView({ id: 'z', chart: 'bar', by: 'season', y: 'cnt', agg: 'mean' });
    s.setSelection([1]);
    s.reset();
    expect(useWorkbenchStore.getState().views).toEqual(useWorkbenchStore.getState().dataset.initialViews);
    expect(useWorkbenchStore.getState().selection).toBeNull();
  });

  it('setDataset 切到税务：换数据集与初始视图', () => {
    const s = useWorkbenchStore.getState();
    s.setDataset('tax');
    const st = useWorkbenchStore.getState();
    expect(st.dataset.id).toBe('tax');
    expect(st.dataset.name).toBe('企业税负');
    expect(st.views).toBe(st.dataset.initialViews);
    expect(st.selection).toBeNull();
  });
});
