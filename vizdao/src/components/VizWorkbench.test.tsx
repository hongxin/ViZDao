import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VizWorkbench } from './VizWorkbench';
import { useNavStore } from '../store/navStore';
import { LESSON_META } from '../viz/lessons/order';

vi.mock('../viz/charts/ChartCanvas', () => ({ ChartCanvas: () => <div data-testid="chart" /> }));

describe('VizWorkbench 多单元导航', () => {
  beforeEach(() => useNavStore.setState({ index: 0 }));

  it('渲染全部单元的导航 tab', () => {
    render(<VizWorkbench />);
    for (const m of LESSON_META) {
      expect(screen.getByTitle(new RegExp(m.title))).toBeInTheDocument();
    }
  });

  it('默认在开场单元 → 渲染安斯库姆内容', () => {
    render(<VizWorkbench />);
    expect(screen.getByText(/统计量完全相同/)).toBeInTheDocument();
  });

  it('未建成单元（收束）显示课堂讲授占位', () => {
    useNavStore.setState({ index: LESSON_META.length - 1 });
    render(<VizWorkbench />);
    expect(screen.getByText(/课堂讲授/)).toBeInTheDocument();
  });

  it('点"过拟合"tab → 渲染过拟合单元内容', () => {
    render(<VizWorkbench />);
    fireEvent.click(screen.getByTitle(/过拟合 · 拟合→正则/));
    expect(screen.getByText(/学规律，还是背答案/)).toBeInTheDocument();
    expect(useNavStore.getState().index).toBe(1);
  });

  it('下一单元按钮推进 index', () => {
    render(<VizWorkbench />);
    fireEvent.click(screen.getByRole('button', { name: /下一单元/ }));
    expect(useNavStore.getState().index).toBe(1);
  });
});
