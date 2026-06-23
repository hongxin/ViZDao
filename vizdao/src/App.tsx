import { useAgentStore } from './store/agentStore';
import { useUiStore } from './store/uiStore';
import { WelcomeScreen } from './components/WelcomeScreen';
import { StatusBar } from './components/StatusBar';
import { PermissionDialog } from './components/PermissionDialog';
import { RenderPreviewListener } from './components/RenderPreview';
import { ExportListener } from './components/FileBridge';
import { VizWorkbench } from './components/VizWorkbench';

export default function App() {
  const agent = useAgentStore(s => s.agent);
  const entered = useUiStore(s => s.entered);

  // 课程单元纯客户端、无需 AI；只有当用户既未进入、也未配置 AI 助教时才显示欢迎页。
  if (!entered && !agent) {
    return (
      <div className="flex flex-col h-dvh bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
        <WelcomeScreen />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <StatusBar />

      {/* Main content area — slice 1: VizWorkbench (两态布局) */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <VizWorkbench />
      </div>

      <RenderPreviewListener />
      <ExportListener />
      <PermissionDialog />
    </div>
  );
}
