import type { Tool } from '../../types/tool';
import type { VirtualFS } from '../VirtualFS';

export function createShellExecute(fs: VirtualFS): Tool {
  return {
    definition: {
      type: 'function',
      function: {
        name: 'shell_execute',
        description: 'Execute a shell command in the virtual environment. Supports: ls, cat, echo, pwd, mkdir, rm, mv, cp, grep, head, tail, wc.',
        parameters: {
          type: 'object',
          properties: {
            command: { type: 'string', description: 'Shell command to execute' },
          },
          required: ['command'],
        },
      },
    },
    permission: 'dangerous',
    async execute(params) {
      if (!params.command || typeof params.command !== 'string') {
        throw new Error('Missing required parameter "command". Provide a shell command to execute.');
      }
      const command = (params.command as string).trim();
      const parts = parseCommand(command);
      if (parts.length === 0) throw new Error('Empty command');

      const cmd = parts[0];
      const args = parts.slice(1);

      switch (cmd) {
        case 'pwd':
          return '/workspace';
        case 'echo':
          return args.join(' ');
        case 'ls':
          return execLs(fs, args);
        case 'cat':
          return execCat(fs, args);
        case 'mkdir':
          return execMkdir(fs, args);
        case 'rm':
          return execRm(fs, args);
        case 'grep':
          return execGrep(fs, args);
        case 'head':
          return execHead(fs, args);
        case 'tail':
          return execTail(fs, args);
        case 'wc':
          return execWc(fs, args);
        default:
          throw new Error(`Unsupported command: ${cmd}`);
      }
    },
  };
}

function parseCommand(cmd: string): string[] {
  const parts: string[] = [];
  let current = '';
  let inQuote = '';
  for (const ch of cmd) {
    if (inQuote) {
      if (ch === inQuote) { inQuote = ''; continue; }
      current += ch;
    } else if (ch === '"' || ch === "'") {
      inQuote = ch;
    } else if (ch === ' ' || ch === '\t') {
      if (current) { parts.push(current); current = ''; }
    } else {
      current += ch;
    }
  }
  if (current) parts.push(current);
  return parts;
}

function resolvePath(p: string): string {
  if (p.startsWith('/')) return p;
  return '/workspace/' + p;
}

async function execLs(fs: VirtualFS, args: string[]): Promise<string> {
  const path = args[0] ? resolvePath(args[0]) : '/workspace';
  const entries = await fs.listDir(path);
  return entries.map(e => e.path.split('/').pop()).join('\n') || '(empty)';
}

async function execCat(fs: VirtualFS, args: string[]): Promise<string> {
  if (args.length === 0) throw new Error('cat: missing file');
  const results: string[] = [];
  for (const a of args) {
    results.push(await fs.readFile(resolvePath(a)));
  }
  return results.join('\n');
}

async function execMkdir(fs: VirtualFS, args: string[]): Promise<string> {
  for (const a of args.filter(a => !a.startsWith('-'))) {
    await fs.mkdir(resolvePath(a));
  }
  return '';
}

async function execRm(fs: VirtualFS, args: string[]): Promise<string> {
  for (const a of args.filter(a => !a.startsWith('-'))) {
    await fs.deleteFile(resolvePath(a));
  }
  return '';
}

async function execGrep(fs: VirtualFS, args: string[]): Promise<string> {
  if (args.length < 2) throw new Error('grep: usage: grep PATTERN FILE');
  const pattern = args[0];
  const results = await fs.search(pattern, resolvePath(args[1]));
  return results.map(r => `${r.path}:${r.line}: ${r.content}`).join('\n') || 'No matches';
}

async function execHead(fs: VirtualFS, args: string[]): Promise<string> {
  const n = args[0] === '-n' ? parseInt(args[1]) : 10;
  const file = args[args.length - 1];
  const content = await fs.readFile(resolvePath(file));
  return content.split('\n').slice(0, n).join('\n');
}

async function execTail(fs: VirtualFS, args: string[]): Promise<string> {
  const n = args[0] === '-n' ? parseInt(args[1]) : 10;
  const file = args[args.length - 1];
  const content = await fs.readFile(resolvePath(file));
  const lines = content.split('\n');
  return lines.slice(Math.max(0, lines.length - n)).join('\n');
}

async function execWc(fs: VirtualFS, args: string[]): Promise<string> {
  const file = args.filter(a => !a.startsWith('-'))[0];
  if (!file) throw new Error('wc: missing file');
  const content = await fs.readFile(resolvePath(file));
  const lines = content.split('\n').length;
  const words = content.split(/\s+/).filter(Boolean).length;
  const chars = content.length;
  return `  ${lines}  ${words}  ${chars} ${file}`;
}
