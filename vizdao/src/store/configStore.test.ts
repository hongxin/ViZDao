import { describe, it, expect, beforeEach } from 'vitest';
import { useConfigStore } from './configStore';

describe('configStore（DeepSeek 单 provider）', () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useConfigStore.setState({ apiKey: '', tier: 'flash' } as any);
  });
  it('tier=flash → model=deepseek-chat', () => {
    useConfigStore.getState().setTier('flash');
    expect(useConfigStore.getState().model).toBe('deepseek-chat');
  });
  it('tier=pro → model=deepseek-reasoner', () => {
    useConfigStore.getState().setTier('pro');
    expect(useConfigStore.getState().model).toBe('deepseek-reasoner');
  });
  it('baseUrl 固定为 deepseek', () => {
    expect(useConfigStore.getState().baseUrl).toBe('https://api.deepseek.com/v1');
  });
  it('无 key 时 validate 失败', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useConfigStore.setState({ apiKey: '' } as any);
    expect(useConfigStore.getState().validate().valid).toBe(false);
  });
});
