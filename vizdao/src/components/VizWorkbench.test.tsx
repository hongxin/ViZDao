import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VizWorkbench } from './VizWorkbench';
import { useLessonStore } from '../store/lessonStore';

vi.mock('../viz/charts/ChartCanvas', () => ({ ChartCanvas: () => <div data-testid="chart" /> }));

describe('VizWorkbench 两态', () => {
  beforeEach(() => useLessonStore.getState().resetForTest(3));
  it('默认展开：可见 lesson 标题', () => {
    render(<VizWorkbench />);
    expect(screen.getByText(/拟合 → 过拟合 → 正则/)).toBeInTheDocument();
  });
  it('点折叠键 → leftCollapsed 置真', () => {
    render(<VizWorkbench />);
    fireEvent.click(screen.getByRole('button', { name: /折叠|collapse/i }));
    expect(useLessonStore.getState().leftCollapsed).toBe(true);
  });
});
