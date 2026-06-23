import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LessonView } from './LessonView';
import { useLessonStore } from '../../store/lessonStore';

// ECharts 在 jsdom 无法测渲染，mock 掉 ChartCanvas
vi.mock('../charts/ChartCanvas', () => ({ ChartCanvas: () => <div data-testid="chart" /> }));

describe('LessonView', () => {
  beforeEach(() => useLessonStore.getState().resetForTest(7));

  it('渲染 hook（讲）与 takeaway（悟）与一个图', () => {
    render(<LessonView />);
    expect(screen.getByText(/学规律，还是背答案/)).toBeInTheDocument();
    expect(screen.getByText(/背答案而非学规律/)).toBeInTheDocument();
    expect(screen.getByTestId('chart')).toBeInTheDocument();
  });

  it('为每个 slider knob 渲染一个 range 输入', () => {
    render(<LessonView />);
    const sliders = screen.getAllByRole('slider');
    expect(sliders.length).toBeGreaterThanOrEqual(3); // degree/lambda/noise
  });

  it('拖动 degree 滑块更新 store', () => {
    render(<LessonView />);
    const deg = screen.getByLabelText(/多项式阶数/);
    fireEvent.change(deg, { target: { value: '12' } });
    expect(useLessonStore.getState().knobValues.degree).toBe(12);
  });
});
