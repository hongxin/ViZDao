// src/viz/lessons/DistributionLesson.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DistributionLesson } from './DistributionLesson';

vi.mock('../charts/ChartCanvas', () => ({
  ChartCanvas: () => <div data-testid="chart" />,
}));

describe('DistributionLesson', () => {
  it('renders hook text matching /直方图.*形状/', () => {
    render(<DistributionLesson />);
    expect(screen.getAllByText(/直方图.*形状/).length).toBeGreaterThan(0);
  });

  it('renders the chart', () => {
    render(<DistributionLesson />);
    expect(screen.getByTestId('chart')).toBeTruthy();
  });

  it('renders toggle control 叠加密度曲线', () => {
    render(<DistributionLesson />);
    expect(screen.getByLabelText(/叠加密度曲线/)).toBeTruthy();
  });

  it('renders slider control 直方图桶数', () => {
    render(<DistributionLesson />);
    expect(screen.getByLabelText(/直方图桶数/)).toBeTruthy();
  });

  it('renders slider control KDE 带宽', () => {
    render(<DistributionLesson />);
    expect(screen.getByLabelText(/KDE 带宽/)).toBeTruthy();
  });

  it('changing 直方图桶数 slider does not crash', () => {
    render(<DistributionLesson />);
    const slider = screen.getByLabelText(/直方图桶数/);
    fireEvent.change(slider, { target: { value: '40' } });
    expect(screen.getByTestId('chart')).toBeTruthy();
  });
});
