// src/viz/analysis/embed.ts — 非线性降维封装：UMAP（umap-js，干净 ESM）。
// 播种以保证可复现（同参数→同布局）。
// 注：t-SNE（tsne-js）在 Vite/rolldown 下有打包 bug（_inherits super undefined），
//     暂不在交互版启用，课堂用 PPT/录屏演示对比。
import { UMAP } from 'umap-js';
import { makeRng } from '../datasets/sinNoise';

/** UMAP：高维 → 2D。umap-js 接受 random 函数，直接播种。 */
export function umapEmbed(data: number[][], nNeighbors: number, seed = 42): [number, number][] {
  const umap = new UMAP({
    nNeighbors: Math.min(nNeighbors, data.length - 1),
    minDist: 0.1,
    nComponents: 2,
    random: makeRng(seed),
  });
  return umap.fit(data) as [number, number][];
}
