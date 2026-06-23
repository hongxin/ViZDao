// src/viz/lessons/HighdimLesson.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HighdimLesson } from './HighdimLesson';

vi.mock('../charts/ChartCanvas', () => ({
  ChartCanvas: () => <div data-testid="chart" />,
}));

describe('HighdimLesson', () => {
  it('renders hook text and chart', () => {
    render(<HighdimLesson />);
    expect(screen.getByText(/4 维的花怎么画/)).toBeTruthy();
    expect(screen.getByTestId('chart')).toBeTruthy();
  });

  it('changing X 轴特征 select does not crash', () => {
    render(<HighdimLesson />);
    const select = screen.getByLabelText(/X 轴特征/);
    fireEvent.change(select, { target: { value: '1' } });
    expect(screen.getByTestId('chart')).toBeTruthy();
  });
});
