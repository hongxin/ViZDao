import type { Tool } from '../../types/tool';
import type { VirtualFS } from '../VirtualFS';

export function createSearchText(fs: VirtualFS): Tool {
  return {
    definition: {
      type: 'function',
      function: {
        name: 'search_text',
        description: 'Search for a text pattern (regex) across files in the virtual filesystem.',
        parameters: {
          type: 'object',
          properties: {
            pattern: { type: 'string', description: 'Regex pattern to search for' },
            path: { type: 'string', description: 'Base directory to search in (default: /workspace)' },
          },
          required: ['pattern'],
        },
      },
    },
    permission: 'safe',
    async execute(params) {
      if (!params.pattern || typeof params.pattern !== 'string') {
        throw new Error('Missing required parameter "pattern". Provide a regex pattern to search for.');
      }
      const pattern = params.pattern as string;
      const basePath = (params.path as string) || '/workspace';
      const results = await fs.search(pattern, basePath);
      if (results.length === 0) return `No matches found for "${pattern}"`;
      return results.slice(0, 50).map(r => `${r.path}:${r.line}: ${r.content}`).join('\n')
        + (results.length > 50 ? `\n... [${results.length - 50} more matches]` : '');
    },
  };
}
