import type { Tool } from '../../types/tool';
import type { VirtualFS } from '../VirtualFS';

export function createListDir(fs: VirtualFS): Tool {
  return {
    definition: {
      type: 'function',
      function: {
        name: 'list_dir',
        description: 'List files and directories in the given path.',
        parameters: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Directory path (default: /workspace)' },
          },
        },
      },
    },
    permission: 'safe',
    async execute(params) {
      if (params.path !== undefined && typeof params.path !== 'string') {
        throw new Error('Parameter "path" must be a string. Provide a directory path to list.');
      }
      const path = (params.path as string) || '/workspace';
      const entries = await fs.listDir(path);
      if (entries.length === 0) return `(empty directory: ${path})`;
      const sorted = entries.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
        return a.path.localeCompare(b.path);
      });
      return sorted.map(e => {
        const name = e.path.split('/').pop();
        return e.type === 'directory' ? `📁 ${name}/` : `📄 ${name} (${e.size}B)`;
      }).join('\n');
    },
  };
}
