import type { Tool } from '../../types/tool';
import type { VirtualFS } from '../VirtualFS';

export function createReadFile(fs: VirtualFS): Tool {
  return {
    definition: {
      type: 'function',
      function: {
        name: 'read_file',
        description: 'Read the contents of a file. Returns the file content with line numbers.',
        parameters: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Absolute path to the file' },
            offset: { type: 'number', description: 'Line number to start reading from (1-based)' },
            limit: { type: 'number', description: 'Maximum number of lines to read' },
          },
          required: ['path'],
        },
      },
    },
    permission: 'safe',
    async execute(params) {
      if (!params.path || typeof params.path !== 'string') {
        throw new Error('Missing required parameter "path". Provide the absolute path to the file to read.');
      }
      const path = params.path as string;
      const content = await fs.readFile(path);
      const lines = content.split('\n');
      const offset = Math.max(1, (params.offset as number) || 1);
      const limit = (params.limit as number) || 500;
      const slice = lines.slice(offset - 1, offset - 1 + limit);
      const numbered = slice.map((line, i) => `${offset + i}\t${line}`).join('\n');
      const truncated = lines.length > offset - 1 + limit
        ? `\n... [${lines.length - offset + 1 - limit} more lines]`
        : '';
      return numbered + truncated;
    },
  };
}
