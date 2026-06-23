import type { Tool } from '../../types/tool';

/**
 * Render HTML/CSS content into a sandboxed iframe preview.
 *
 * The rendered output is injected into the DOM as a collapsible preview panel.
 * Returns a text confirmation with the preview dimensions.
 */
export function createRenderHtml(): Tool {
  return {
    definition: {
      type: 'function',
      function: {
        name: 'render_html',
        description:
          'Render HTML content in a sandboxed preview panel within the chat. ' +
          'Use this for creating visual output: styled documents, charts (with inline SVG or Canvas), ' +
          'diagrams, data tables, interactive widgets, or any visual content. ' +
          'The HTML is rendered in a sandboxed iframe. You can include inline CSS and JavaScript. ' +
          'Returns a confirmation message. The user will see the rendered result in the chat.',
        parameters: {
          type: 'object',
          properties: {
            html: {
              type: 'string',
              description: 'Complete HTML content to render. Can include <style> and <script> tags.',
            },
            title: {
              type: 'string',
              description: 'Title for the preview panel (optional).',
            },
            height: {
              type: 'number',
              description: 'Height of the preview in pixels (default: 300).',
            },
          },
          required: ['html'],
        },
      },
    },
    permission: 'risky',
    requires: ['dom'],

    async execute(params) {
      const html = params.html as string | undefined;
      if (!html || typeof html !== 'string' || html.trim().length === 0) {
        throw new Error('Missing required parameter "html". Provide a complete HTML string to render.');
      }
      const title = (params.title as string) || 'Preview';
      const height = (params.height as number) || 300;

      // Create the preview container
      const containerId = `render-preview-${Date.now()}`;

      // Dispatch a custom event that the UI layer can listen to
      const event = new CustomEvent('jetbot:render', {
        detail: { id: containerId, html, title, height },
      });
      document.dispatchEvent(event);

      return `Rendered "${title}" (${html.length} bytes, ${height}px height). The preview is displayed in the chat.`;
    },
  };
}
