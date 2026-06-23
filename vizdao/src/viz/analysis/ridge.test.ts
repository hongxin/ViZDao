import { describe, it, expect } from 'vitest';
import { normalize, solve, ridgeFit, metrics, roughness, XMIN, XMAX } from './ridge';
import { genSinNoise } from '../datasets/sinNoise';

describe('solve（高斯消元）', () => {
  it('解 2x2 已知系统', () => {
    // [2 1; 1 3] w = [3; 5] → w = [4/5, 7/5]
    const w = solve([[2, 1], [1, 3]], [3, 5]);
    expect(w[0]).toBeCloseTo(0.8, 6);
    expect(w[1]).toBeCloseTo(1.4, 6);
  });
});

describe('normalize', () => {
  it('端点映射到 [-1,1]', () => {
    expect(normalize(XMIN)).toBeCloseTo(-1, 9);
    expect(normalize(XMAX)).toBeCloseTo(1, 9);
  });
});

describe('ridgeFit 数值行为（对齐 overfitting.html 已验证基线）', () => {
  // 固定种子，确定性数据，断言"关系"而非随机run的绝对值
  const data = genSinNoise(20, 0.3, 12345);
  const xn = data.map((d) => normalize(d.x));
  const y = data.map((d) => d.y);

  it('过拟合：高阶 λ=0 → 训练MSE 远低于 真值MSE', () => {
    const w = ridgeFit(xn, y, 12, 0);
    const m = metrics(w, data);
    expect(m.trainMSE).toBeLessThan(m.trueMSE);
    expect(m.trainMSE).toBeLessThan(0.1);
    expect(m.trueMSE).toBeGreaterThan(m.trainMSE * 2);
  });

  it('正则救回：同阶加 λ → 真值MSE 显著下降、曲线更平滑', () => {
    const wOver = ridgeFit(xn, y, 12, 0);
    const wReg = ridgeFit(xn, y, 12, 0.1);
    const mOver = metrics(wOver, data);
    const mReg = metrics(wReg, data);
    expect(mReg.trueMSE).toBeLessThan(mOver.trueMSE);
    expect(roughness(wReg)).toBeLessThan(roughness(wOver));
  });

  it('低阶欠拟合：直线 λ=0 → 训练与真值MSE 都不算低且接近', () => {
    const w = ridgeFit(xn, y, 1, 0);
    const m = metrics(w, data);
    expect(m.trainMSE).toBeGreaterThan(0.05);
  });
});
