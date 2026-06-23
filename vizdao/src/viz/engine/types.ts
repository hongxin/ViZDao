// src/viz/engine/types.ts — 体验引擎的语法：设·赌·揭·悟。
// 单元 = 一段 ConceptScript（脚本化的"课"）。Beat 永不碰像素，只向 Stage 发"意图(Directive)"。

/** 学员的承诺（预测/下注）。MVP 先支持单选。 */
export type Commitment = {
  kind: 'choice';
  id: string;
  options: { value: string; label: string }[];
};

/** 本单元记下的学员承诺，供 Reveal 个性化回指。 */
export type Ledger = Record<string, string>;

/** Stage 指令：词表每单元自有，Stage 自行解释并平滑过渡。 */
export interface Directive {
  op: string;
  [k: string]: unknown;
}

/** Stage 对外暴露的命令式句柄。 */
export interface StageHandle {
  apply: (directives: Directive[]) => void;
}

/** 一拍。say 可为函数以回指 Ledger（"你刚赌了 X"）。 */
export type Beat =
  | { kind: 'frame'; say: string; enter?: Directive[]; cta?: string }
  | { kind: 'predict'; say: string; commit: Commitment; enter?: Directive[] }
  | { kind: 'reveal'; say: string | ((l: Ledger) => string); enter?: Directive[]; cta?: string; hold?: number }
  | { kind: 'reflect'; say: string | ((l: Ledger) => string); enter?: Directive[]; cta?: string };

export interface ConceptScript {
  beats: Beat[];
}
