import type { Tool } from '../../types/tool';
import type { VirtualFS } from '../VirtualFS';

export function createEditFile(fs: VirtualFS): Tool {
  return {
    definition: {
      type: 'function',
      function: {
        name: 'edit_file',
        description: 'Edit a file by replacing an exact string match. The old_text must be unique in the file.',
        parameters: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Absolute path to the file' },
            old_text: { type: 'string', description: 'Exact text to find and replace' },
            new_text: { type: 'string', description: 'Replacement text' },
          },
          required: ['path', 'old_text', 'new_text'],
        },
      },
    },
    permission: 'risky',
    async execute(params) {
      if (!params.path || typeof params.path !== 'string') {
        throw new Error('Missing required parameter "path". Provide the absolute path to the file to edit.');
      }
      if (!params.old_text || typeof params.old_text !== 'string') {
        throw new Error('Missing required parameter "old_text". Provide the exact text to find and replace.');
      }
      if (params.new_text === undefined || params.new_text === null || typeof params.new_text !== 'string') {
        throw new Error('Missing required parameter "new_text". Provide the replacement text.');
      }
      const path = params.path as string;
      const oldText = params.old_text as string;
      const newText = params.new_text as string;
      const content = await fs.readFile(path);
      const count = content.split(oldText).length - 1;
      if (count === 0) throw new Error(`old_text not found in ${path}`);
      if (count > 1) throw new Error(`old_text found ${count} times in ${path}. Must be unique.`);
      const updated = content.replace(oldText, newText);
      await fs.writeFile(path, updated);
      return `File edited: ${path}`;
    },
  };
}
