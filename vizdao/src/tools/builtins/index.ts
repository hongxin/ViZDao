import type { ToolRegistry } from '../ToolRegistry';
import { createReadFile } from './readFile';
import { createWriteFile } from './writeFile';
import { createEditFile } from './editFile';
import { createListDir } from './listDir';
import { createSearchText } from './searchText';
import { createHttpGet } from './httpGet';
import { createShellExecute } from './shellExecute';
import { createJsEval } from './jsEval';
import { createRenderHtml } from './renderHtml';
import { createExportFile } from './exportFile';
import { createGetTime } from './getTime';
import { createGetSysinfo } from './getSysinfo';
import { registerVizTools } from '../../viz/tutor/vizTools';
import { registerAnalysisTools } from '../../viz/analysis/analysisTools';

export function registerBuiltins(registry: ToolRegistry): void {
  const fs = registry.fs;

  // Virtual filesystem tools (always available)
  registry.register(createReadFile(fs));
  registry.register(createWriteFile(fs));
  registry.register(createEditFile(fs));
  registry.register(createListDir(fs));
  registry.register(createSearchText(fs));
  registry.register(createShellExecute(fs));

  // Network
  registry.register(createHttpGet());

  // Environment awareness (always available)
  registry.register(createGetTime());
  registry.register(createGetSysinfo());

  // Browser-native tools (loaded only if capabilities are present)
  registry.register(createJsEval());
  registry.register(createRenderHtml());
  registry.register(createExportFile(fs));

  // ViZDao tutor tools — read-only experiment state inspection
  registerVizTools(registry);

  // 训·知道工作台 — AI 协同分析者的工具带（搭图/刷选/读数，改 workbenchStore）
  registerAnalysisTools(registry);
}
