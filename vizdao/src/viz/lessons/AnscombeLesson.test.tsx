// src/viz/lessons/AnscombeLesson.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AnscombeLesson } from './AnscombeLesson';

vi.mock('../charts/ChartCanvas', () => ({
  ChartCanvas: () => <div data-testid="chart" />,
}));

describe('AnscombeLesson', () => {
  it('renders hook text and chart', () => {
    render(<AnscombeLesson />);
    expect(screen.getByText(/统计量完全相同/)).toBeTruthy();
    expect(screen.getByTestId('chart')).toBeTruthy();
  });

  it('renders metrics', () => {
    render(<AnscombeLesson />);
    expect(screen.getByText(/均值 x/)).toBeTruthy();
    expect(screen.getByText(/均值 y/)).toBeTruthy();
    expect(screen.getByText(/相关系数 r/)).toBeTruthy();
    expect(screen.getAllByText(/回归线/).length).toBeGreaterThan(0);
  });

  it('switches to group IV without crashing, metrics still render', () => {
    render(<AnscombeLesson />);
    const select = screen.getByLabelText(/切换数据组/);
    fireEvent.change(select, { target: { value: 'IV' } });
    expect(screen.getByTestId('chart')).toBeTruthy();
    expect(screen.getByText(/均值 x/)).toBeTruthy();
  });
});
