// src/viz/lessons/DimReductionLesson.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DimReductionLesson } from './DimReductionLesson';

vi.mock('../charts/ChartCanvas', () => ({ ChartCanvas: () => <div data-testid="chart" /> }));

describe('DimReductionLesson', () => {
  it('renders hook text about 压扁着看 or 方差最大的方向', () => {
    render(<DimReductionLesson />);
    expect(screen.getAllByText(/压扁着看|方差最大的方向/).length).toBeGreaterThan(0);
  });

  it('renders the chart', () => {
    render(<DimReductionLesson />);
    expect(screen.getByTestId('chart')).toBeTruthy();
  });

  it('changing X 主成分 select does not crash', () => {
    render(<DimReductionLesson />);
    const select = screen.getByLabelText(/X 主成分/);
    expect(() => fireEvent.change(select, { target: { value: '2' } })).not.toThrow();
  });
});
