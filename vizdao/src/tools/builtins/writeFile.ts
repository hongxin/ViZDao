import type { Tool } from '../../types/tool';
import type { VirtualFS } from '../VirtualFS';

export function createWriteFile(fs: VirtualFS): Tool {
  return {
    definition: {
      type: 'function',
      function: {
        name: 'write_file',
        description: 'Write content to a file. Creates parent directories automatically.',
        parameters: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Absolute path to the file' },
            content: { type: 'string', description: 'Content to write' },
          },
          required: ['path', 'content'],
        },
      },
    },
    permission: 'risky',
    async execute(params) {
      if (!params.path || typeof params.path !== 'string') {
        throw new Error('Missing required parameter "path". Provide the absolute path to the file to write.');
      }
      if (params.content === undefined || params.content === null || typeof params.content !== 'string') {
        throw new Error('Missing required parameter "content". Provide the content to write to the file.');
      }
      await fs.writeFile(params.path as string, params.content as string);
      return `File written: ${params.path} (${(params.content as string).length} bytes)`;
    },
  };
}
