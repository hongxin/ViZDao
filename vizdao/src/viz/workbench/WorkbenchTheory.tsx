// src/viz/workbench/WorkbenchTheory.tsx — 工作台的理论深探：刷选-联动 + 聚合悖论 + 多视图之必要。
import { Tex, Section, NOTE, TheoryDrawer } from '../engine/theory';

export function WorkbenchTheory({ onClose }: { onClose: () => void }) {
  return (
    <TheoryDrawer onClose={onClose}>
      <Section label="刷选-联动（brushing & linking）">
        <p style={{ ...NOTE, marginTop: 0 }}>在一个视图里框选一组记录，<b>同一组记录</b>在所有视图里同时高亮。这是视觉分析最核心的动作——让你从多个切面同时审视同一群数据，比任何单图都更逼近真相。（Becker &amp; Cleveland, 1987）</p>
      </Section>

      <Section label="聚合悖论（Simpson）">
        <p style={{ ...NOTE, marginTop: 0 }}>整体均值只是各组的加权平均：</p>
        <Tex block tex={'\\bar{y}=\\sum_{g} w_g\\,\\bar{y}_g,\\qquad w_g=\\frac{n_g}{n}'} />
        <p style={NOTE}>组内的趋势，可以和整体趋势<b>完全相反</b>。本数据里：注册用户工作日高峰、临时用户周末高峰——两种相反节奏，被总量 <Tex tex={'cnt'} /> 抹平了。<b>这正是安斯库姆，搬进真实业务</b>：聚合会骗你，拆开才见真章。</p>
      </Section>

      <Section label="为什么多视图 > 单视图">
        <p style={{ ...NOTE, marginTop: 0 }}>一张图=一个投影或一次聚合，只是数据的<b>一个切面</b>（呼应"高维困境"那一课）。任何单一切面都可能藏住结构。多视图联动让你把"框选的这群天"在时间、气温、天气、用户类型上同时定位——结构无处可藏。</p>
      </Section>

      <Section label="任务">
        <p style={{ ...NOTE, marginTop: 0 }}>找出一条<b>最反直觉</b>的规律，并用多视图为它辩护。提示：盯住"看起来理所当然"的地方——框选它，看它在别的视图里是否露馅。</p>
      </Section>
    </TheoryDrawer>
  );
}
