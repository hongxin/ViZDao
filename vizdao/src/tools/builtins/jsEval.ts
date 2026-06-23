import type { Tool } from '../../types/tool';

/**
 * Execute JavaScript code in the browser.
 *
 * Uses Function constructor (not eval) for slightly better isolation.
 * Captures console.log output and return value.
 * Timeout protection via AbortController-like mechanism.
 */
export function createJsEval(): Tool {
  return {
    definition: {
      type: 'function',
      function: {
        name: 'js_eval',
        description:
          'Execute JavaScript code in the browser and return the result. ' +
          'Use this for computation, data transformation, algorithm testing, ' +
          'JSON manipulation, regex testing, math, and any general-purpose programming. ' +
          'Console output (console.log) is captured and returned along with the expression result. ' +
          'Has access to all browser APIs (DOM, fetch, Canvas, etc). ' +
          'Code runs synchronously by default; use `await` for async operations (the code is wrapped in an async function).',
        parameters: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'JavaScript code to execute. The last expression is returned as the result.',
            },
          },
          required: ['code'],
        },
      },
    },
    permission: 'risky',
    requires: ['js-eval'],

    async execute(params) {
      if (!params.code || typeof params.code !== 'string') {
        throw new Error('Missing required parameter "code". Provide JavaScript code to execute.');
      }
      const code = params.code as string;
      const logs: string[] = [];
      const maxOutputLength = 8192;

      // Capture console output
      const origLog = console.log;
      const origWarn = console.warn;
      const origError = console.error;

      console.log = (...args: unknown[]) => {
        logs.push(args.map(a => formatValue(a)).join(' '));
      };
      console.warn = (...args: unknown[]) => {
        logs.push(`[warn] ${args.map(a => formatValue(a)).join(' ')}`);
      };
      console.error = (...args: unknown[]) => {
        logs.push(`[error] ${args.map(a => formatValue(a)).join(' ')}`);
      };

      try {
        // Wrap in async function to allow await
        const fn = new Function('return (async () => {\n' + code + '\n})()');

        // Timeout protection: 10 seconds
        const result = await Promise.race([
          fn(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Execution timed out (10s limit)')), 10_000)
          ),
        ]);

        const output: string[] = [];
        if (logs.length > 0) {
          output.push('--- console output ---');
          output.push(logs.join('\n'));
        }
        if (result !== undefined) {
          output.push('--- result ---');
          output.push(formatValue(result));
        }
        if (output.length === 0) {
          output.push('(no output)');
        }

        let text = output.join('\n');
        if (text.length > maxOutputLength) {
          text = text.slice(0, maxOutputLength) + '\n... [truncated]';
        }
        return text;
      } catch (err: any) {
        const output: string[] = [];
        if (logs.length > 0) {
          output.push('--- console output before error ---');
          output.push(logs.join('\n'));
        }
        output.push(`--- error ---`);
        output.push(`${err.name ?? 'Error'}: ${err.message}`);
        if (err.stack) {
          // Extract just the relevant stack line
          const stackLines = err.stack.split('\n').slice(0, 3);
          output.push(stackLines.join('\n'));
        }
        return output.join('\n');
      } finally {
        console.log = origLog;
        console.warn = origWarn;
        console.error = origError;
      }
    },
  };
}

function formatValue(val: unknown): string {
  if (val === undefined) return 'undefined';
  if (val === null) return 'null';
  if (typeof val === 'string') return val;
  if (typeof val === 'function') return `[Function: ${val.name || 'anonymous'}]`;
  if (val instanceof Error) return `${val.name}: ${val.message}`;
  if (val instanceof HTMLElement) return `<${val.tagName.toLowerCase()}${val.id ? '#' + val.id : ''}>`;
  try {
    return JSON.stringify(val, null, 2);
  } catch {
    return String(val);
  }
}
