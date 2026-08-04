import { useState } from 'react';
import type { AppSettings, DisplayMode } from '../lib/types';

export function SettingsModal({ settings, onClose, onSave }: { settings: AppSettings; onClose: () => void; onSave: (settings: AppSettings) => void }) {
  const [draft, setDraft] = useState(settings);
  return <div className="modal"><div className="panel"><h2>系统设置</h2><div className="form-grid settings-grid">
    {(['lowMax', 'mediumMax', 'highMax'] as const).map((key) => <label key={key}>{thresholdLabel[key]}<input type="number" value={draft.thresholds[key]} onChange={(e) => setDraft({ ...draft, thresholds: { ...draft.thresholds, [key]: Number(e.target.value) } })} /></label>)}
    <label>默认显示模式<select value={draft.chart.displayMode} onChange={(e) => setDraft({ ...draft, chart: { ...draft.chart, displayMode: e.target.value as DisplayMode } })}><option value="aggregate">聚合显示</option><option value="jitter">展开显示</option></select></label>
    <label>最小气泡大小<input type="number" value={draft.chart.minBubbleSize} onChange={(e) => setDraft({ ...draft, chart: { ...draft.chart, minBubbleSize: Number(e.target.value) } })} /></label>
    <label>最大气泡大小<input type="number" value={draft.chart.maxBubbleSize} onChange={(e) => setDraft({ ...draft, chart: { ...draft.chart, maxBubbleSize: Number(e.target.value) } })} /></label>
  </div><div className="actions"><button onClick={onClose}>取消</button><button className="primary" onClick={() => onSave(draft)}>保存</button></div></div></div>;
}

const thresholdLabel = { lowMax: '低风险最大值', mediumMax: '中风险最大值', highMax: '高风险最大值' };
