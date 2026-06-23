// src/viz/tutor/vizTools.ts — 助教受限工具：只读实验状态 + 转交开放题，不改 lesson、不跳检查点。
import type { Tool } from '../../types/tool';
import type { ToolRegistry } from '../../tools/ToolRegistry';
import { useLessonStore } from '../../store/lessonStore';

export function createReadVizState(): Tool {
  return {
    definition: {
      type: 'function',
      function: {
        name: 'read_viz_state',
        description: '读取学员当前实验状态：lesson、各 knob 值、拟合指标(训练MSE/真值MSE/粗糙度)、检查点是否达成。用于针对性讲解。',
        parameters: { type: 'object', properties: {}, required: [] },
      },
    },
    permission: 'safe',
    async execute() {
      const s = useLessonStore.getState();
      return JSON.stringify({
        lessonId: s.lesson.id,
        title: s.lesson.title,
        knobValues: s.knobValues,
        metrics: s.fit ? { trainMSE: s.fit.trainMSE, trueMSE: s.fit.trueMSE, roughness: s.fit.roughness } : null,
        checkpointPassed: s.checkpointPassed,
      });
    },
  };
}

export function createGradeOpen(): Tool {
  return {
    definition: {
      type: 'function',
      function: {
        name: 'grade_open',
        description: '对开放题给启发式点评（不判对错、不阻塞）。传入学员答案，返回学员答案 + 当前实验状态以便你点评。',
        parameters: {
          type: 'object',
          properties: { answer: { type: 'string', description: '学员的开放题作答' } },
          required: ['answer'],
        },
      },
    },
    permission: 'safe',
    async execute(params) {
      const s = useLessonStore.getState();
      return JSON.stringify({
        answer: String(params.answer ?? ''),
        context: { lessonId: s.lesson.id, knobValues: s.knobValues, checkpointPassed: s.checkpointPassed },
        note: '请以启发、鼓励探索的语气点评，不要判对错。',
      });
    },
  };
}

export function registerVizTools(registry: ToolRegistry): void {
  registry.register(createReadVizState());
  registry.register(createGradeOpen());
}
