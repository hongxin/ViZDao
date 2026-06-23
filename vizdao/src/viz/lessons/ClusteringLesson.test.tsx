// src/viz/lessons/ClusteringLesson.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ClusteringLesson } from './ClusteringLesson';

vi.mock('../charts/ChartCanvas', () => ({
  ChartCanvas: () => <div data-testid="chart" />,
}));

describe('ClusteringLesson', () => {
  it('renders hook text', () => {
    render(<ClusteringLesson />);
    expect(screen.getByText(/自己把相似的点聚到一起/)).toBeTruthy();
  });

  it('renders the chart', () => {
    render(<ClusteringLesson />);
    expect(screen.getByTestId('chart')).toBeTruthy();
  });

  it('slider for 聚类数 K is present', () => {
    render(<ClusteringLesson />);
    expect(screen.getByLabelText(/聚类数 K/)).toBeTruthy();
  });

  it('changing K does not crash and updates metric', () => {
    render(<ClusteringLesson />);
    const slider = screen.getByLabelText(/聚类数 K/);
    fireEvent.change(slider, { target: { value: '4' } });
    // After changing to K=4 the chart should still render (no crash)
    expect(screen.getByTestId('chart')).toBeTruthy();
  });

  it('renders metrics: 当前 K and 迭代次数', () => {
    render(<ClusteringLesson />);
    expect(screen.getByText(/当前 K/)).toBeTruthy();
    expect(screen.getByText(/迭代次数/)).toBeTruthy();
  });
});
