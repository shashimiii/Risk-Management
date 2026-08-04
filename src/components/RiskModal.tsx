import { useMemo, useState } from 'react';
import { hydrateRisk, riskLevelLabels, validateRiskInput } from '../lib/risk';
import type { AppSettings, RiskInput, RiskItem } from '../lib/types';

const scoreOptions = [1, 2, 3, 4, 5];

export function RiskFormModal({ risk, settings, onClose, onSave }: { risk?: RiskItem; settings: AppSettings; onClose: () => void; onSave: (risk: RiskItem) => void }) {
  const [form, setForm] = useState<RiskInput>(risk ?? { riskName: '', esgTopic: '', esgCategory: 'E', L: 1, I: 1, FM: 1, IM: 1 });
  const derived = useMemo(() => hydrateRisk(form, settings.thresholds, risk?.id), [form, risk?.id, settings.thresholds]);
  const errors = validateRiskInput(form);
  const update = (key: keyof RiskInput, value: string) => setForm((current) => ({ ...current, [key]: ['L', 'I', 'FM', 'IM'].includes(key) ? Number(value) : value }));
  return (
    <div className="modal"><div className="panel wide"><h2>{risk ? '编辑风险' : '新增风险'}</h2><div className="form-grid">
      <label>风险名称*<input value={form.riskName} onChange={(e) => update('riskName', e.target.value)} /></label>
      <label>ESG议题*<input value={form.esgTopic} onChange={(e) => update('esgTopic', e.target.value)} /></label>
      <label>ESG分类*<select value={form.esgCategory} onChange={(e) => update('esgCategory', e.target.value)}><option value="E">E 环境</option><option value="S">S 社会</option><option value="G">G 治理</option></select></label>
      {(['L', 'I', 'FM', 'IM'] as const).map((key) => <label key={key}>{key}*<select value={form[key]} onChange={(e) => update(key, e.target.value)}>{scoreOptions.map((score) => <option key={score} value={score}>{score}</option>)}</select></label>)}
      {(['description', 'responsibleDepartment', 'riskOwner', 'existingControl', 'mitigationAction', 'remarks'] as const).map((key) => <label key={key}>{fieldName[key]}<textarea value={form[key] ?? ''} onChange={(e) => update(key, e.target.value)} /></label>)}
    </div><div className="derived"><b>R={derived.R}</b><b>W={derived.W}</b><b>{riskLevelLabels[derived.riskLevel]}</b></div>{errors.length > 0 && <p className="error">{errors.join('；')}</p>}<div className="actions"><button onClick={onClose}>取消</button><button className="primary" disabled={errors.length > 0} onClick={() => onSave(derived)}>保存</button></div></div></div>
  );
}

const fieldName: Record<string, string> = { description: '风险描述', responsibleDepartment: '责任部门', riskOwner: '风险负责人', existingControl: '现有控制措施', mitigationAction: '风险应对措施', remarks: '备注' };

export function RiskDetailModal({ risk, onClose, onEdit, onDelete }: { risk: RiskItem; onClose: () => void; onEdit: () => void; onDelete: () => void }) {
  return <div className="modal"><div className="panel"><h2>{risk.riskName}</h2><div className="detail-grid">{Object.entries({ ESG议题: risk.esgTopic, ESG分类: risk.esgCategory, 发生可能性L: risk.L, 影响程度I: risk.I, 固有风险R: risk.R, 财务重要性FM: risk.FM, 影响重要性IM: risk.IM, 议题权重W: risk.W, 风险等级: riskLevelLabels[risk.riskLevel], 责任部门: risk.responsibleDepartment, 风险负责人: risk.riskOwner }).map(([key, value]) => <div className="detail" key={key}><span>{key}</span><b>{value || '-'}</b></div>)}</div>{(['description', 'existingControl', 'mitigationAction', 'remarks'] as const).map((key) => <p key={key}><b>{fieldName[key]}：</b>{risk[key] || '-'}</p>)}<div className="actions"><button onClick={onClose}>关闭</button><button onClick={onEdit}>编辑</button><button className="danger" onClick={onDelete}>删除</button></div></div></div>;
}
