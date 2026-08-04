import type { AppSettings, DisplayMode, RiskItem, RiskLevel } from '../lib/types';
import { aggregatePoints, calculateBubbleSize, esgColors, jitteredPoints, riskBgColors, riskColors, riskLevelLabels } from '../lib/risk';

interface ChartProps {
  risks: RiskItem[];
  settings: AppSettings;
  mode: DisplayMode;
  onRiskClick: (risk: RiskItem) => void;
  onGroupClick: (risks: RiskItem[]) => void;
}

const axis = [1, 2, 3, 4, 5];
const levelByDefaultThreshold = (score: number): RiskLevel => (score <= 4 ? 'LOW' : score <= 9 ? 'MEDIUM' : score <= 16 ? 'HIGH' : 'CRITICAL');
const W = 820;
const H = 520;
const M = 64;
const STEP = (Math.min(W, H) - M * 2) / 5;
const sx = (value: number) => M + (value - 0.5) * STEP;
const sy = (value: number) => H - M - (value - 0.5) * STEP;

function RiskTooltip({ risk }: { risk: RiskItem }) {
  return (
    <title>{`${risk.riskName}\nESG议题：${risk.esgTopic}\nESG分类：${risk.esgCategory}\nL：${risk.L} I：${risk.I} R：${risk.R}\nFM：${risk.FM} IM：${risk.IM} W：${risk.W}\n风险等级：${riskLevelLabels[risk.riskLevel]}`}</title>
  );
}

export function MatrixChart({ risks, settings, mode, onRiskClick, onGroupClick }: ChartProps) {
  return <BubbleMatrix title="固有风险矩阵" subtitle="基于发生可能性L与影响程度I识别固有风险水平" risks={risks} settings={settings} mode={mode} onRiskClick={onRiskClick} onGroupClick={onGroupClick} sizeByWeight={false} colorByCategory={false} getX={(risk) => risk.I} getY={(risk) => risk.L} showHeatmap />;
}

export function WeightedBubbleChart(props: ChartProps) {
  return <BubbleMatrix title="双重重要性加权气泡矩阵" subtitle="以议题重要性权重W反映ESG议题对企业长期发展的重要程度" {...props} sizeByWeight colorByCategory={false} getX={(risk) => risk.I} getY={(risk) => risk.L} showHeatmap />;
}

export function MaterialityChart(props: ChartProps) {
  return <BubbleMatrix title="FM × IM 双重重要性矩阵" subtitle="展示财务重要性与影响重要性的分布" {...props} sizeByWeight colorByCategory getX={(risk) => risk.FM} getY={(risk) => risk.IM} showHeatmap={false} xName="FM 财务重要性" yName="IM 影响重要性" />;
}

function BubbleMatrix({ title, subtitle, risks, settings, mode, getX, getY, onRiskClick, onGroupClick, sizeByWeight, colorByCategory, showHeatmap, xName = 'I 影响程度', yName = 'L 发生可能性' }: ChartProps & { title: string; subtitle: string; getX: (risk: RiskItem) => number; getY: (risk: RiskItem) => number; sizeByWeight: boolean; colorByCategory: boolean; showHeatmap: boolean; xName?: string; yName?: string }) {
  const grouped = aggregatePoints(risks, getX, getY);
  const jittered = jitteredPoints(risks, getX, getY);
  return (
    <div>
      <h2>{title}</h2>
      <p className="muted">{subtitle}</p>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
        {showHeatmap && axis.flatMap((i) => axis.map((l) => <rect key={`${i}-${l}`} className="cell" x={sx(i) - STEP / 2} y={sy(l) - STEP / 2} width={STEP} height={STEP} fill={riskBgColors[levelByDefaultThreshold(i * l)]} opacity="0.7" />))}
        {axis.map((value) => <g key={value}><text className="axis" x={sx(value)} y={H - 24} textAnchor="middle">{value}</text><text className="axis" x={28} y={sy(value) + 5}>{value}</text></g>)}
        <text className="axis" x={W / 2} y={H - 6} textAnchor="middle">{xName}</text>
        <text className="axis" transform={`translate(16 ${H / 2}) rotate(-90)`} textAnchor="middle">{yName}</text>
        {mode === 'aggregate' ? grouped.map((point) => {
          const topRisk = point.risks.reduce((a, b) => (a.R > b.R ? a : b));
          const color = colorByCategory ? esgColors[topRisk.esgCategory] : riskColors[topRisk.riskLevel];
          const radius = (sizeByWeight ? calculateBubbleSize(point.maxW, settings.chart) : 14) + Math.max(0, point.count - 1) * 2;
          return <g key={point.key} onClick={() => onGroupClick(point.risks)} className="clickable"><circle className="pt" cx={sx(point.x)} cy={sy(point.y)} r={radius} fill={color}><title>{`该位置共有${point.count}个风险点\n最高R：${point.maxR}\n平均W：${point.avgW}\n低/中/高/极高：${point.levelDistribution.LOW}/${point.levelDistribution.MEDIUM}/${point.levelDistribution.HIGH}/${point.levelDistribution.CRITICAL}`}</title></circle>{point.count > 1 && <text x={sx(point.x)} y={sy(point.y) + 5} textAnchor="middle" fontWeight="900">{point.count}</text>}</g>;
        }) : jittered.map(({ risk, displayX, displayY }) => <circle key={risk.id} className="pt clickable" cx={sx(displayX)} cy={sy(displayY)} r={sizeByWeight ? calculateBubbleSize(risk.W, settings.chart) : 12} fill={colorByCategory ? esgColors[risk.esgCategory] : riskColors[risk.riskLevel]} onClick={() => onRiskClick(risk)}><RiskTooltip risk={risk} /></circle>)}
      </svg>
    </div>
  );
}

export function Risk3DChart({ risks, settings, onRiskClick }: Omit<ChartProps, 'mode' | 'onGroupClick'>) {
  const project = (risk: RiskItem) => {
    const angle = Math.PI / 4;
    const px = (risk.I - 3) * 82;
    const py = (risk.L - 3) * 72;
    const pz = (risk.W - 3) * 68;
    return { x: 410 + px * Math.cos(angle) - py * Math.sin(angle), y: 260 + px * Math.sin(angle) * 0.35 + py * Math.cos(angle) * 0.35 - pz };
  };
  return (
    <div>
      <h2>3D 风险图</h2>
      <p className="muted">从影响程度、发生可能性和议题重要性三个维度观察风险分布</p>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="3D 风险图">
        <line x1="410" y1="260" x2="700" y2="360" stroke="#64748b" /><line x1="410" y1="260" x2="120" y2="360" stroke="#64748b" /><line x1="410" y1="260" x2="410" y2="40" stroke="#64748b" />
        <text x="706" y="365">I</text><text x="104" y="365">L</text><text x="420" y="45">W</text>
        {risks.map((risk) => { const p = project(risk); return <circle key={risk.id} className="pt clickable" cx={p.x} cy={p.y} r={calculateBubbleSize(risk.W, settings.chart) / 2} fill={riskColors[risk.riskLevel]} onClick={() => onRiskClick(risk)}><RiskTooltip risk={risk} /></circle>; })}
      </svg>
    </div>
  );
}
