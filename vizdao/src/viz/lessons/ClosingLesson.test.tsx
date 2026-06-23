import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ClosingLesson } from './ClosingLesson';

describe('ClosingLesson', () => {
  it('展示主线一句话与旅程回顾与 AI CTA', () => {
    render(<ClosingLesson />);
    expect(screen.getByText(/看一眼就知道/)).toBeInTheDocument();
    expect(screen.getByText(/过拟合 → 正则/)).toBeInTheDocument();
    expect(screen.getByText(/降维 · PCA/)).toBeInTheDocument();
    expect(screen.getByText(/AI 助教/)).toBeInTheDocument();
  });
  it('未配置 AI 时提示去设置填 key', () => {
    render(<ClosingLesson />);
    expect(screen.getByText(/填入 DeepSeek Key/)).toBeInTheDocument();
  });
});
