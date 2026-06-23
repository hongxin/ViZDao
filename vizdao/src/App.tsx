import { useConfigStore } from './store/configStore';
import { useAgentStore } from './store/agentStore';
import { WelcomeScreen } from './components/WelcomeScreen';
import { StatusBar } from './components/StatusBar';
import { PermissionDialog } from './components/PermissionDialog';
import { RenderPreviewListener } from './components/RenderPreview';
import { ExportListener } from './components/FileBridge';
import { VizWorkbench } from './components/VizWorkbench';

export default function App() {
  const isConfigured = useConfigStore(s => s.validate().valid);
  const agent = useAgentStore(s => s.agent);

  if (!isConfigured || !agent) {
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
