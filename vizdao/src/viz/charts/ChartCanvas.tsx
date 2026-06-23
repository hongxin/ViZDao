// src/viz/charts/ChartCanvas.tsx — ECharts 6 封装：option 变 → 重绘。
import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { LineChart, ScatterChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([LineChart, ScatterChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer]);

export function ChartCanvas({ option }: { option: object }) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    chartRef.current = echarts.init(ref.current);
    const onResize = () => chartRef.current?.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    // ECBasicOption requires an index signature; cast via unknown to satisfy strict TS.
    chartRef.current?.setOption(option as Parameters<echarts.ECharts['setOption']>[0], true);
  }, [option]);

  return <div ref={ref} style={{ width: '100%', height: '100%', minHeight: 360 }} />;
}
