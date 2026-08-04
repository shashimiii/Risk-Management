import { useEffect, useMemo, useRef, useState } from 'react';
import { MatrixChart, MaterialityChart, Risk3DChart, WeightedBubbleChart } from './charts/RiskCharts';
import { ImportPreviewModal } from './components/ImportPreviewModal';
import { RiskDetailModal, RiskFormModal } from './components/RiskModal';
import { SettingsModal } from './components/SettingsModal';
import { exportRisks, parseExcel, parsePasted, type ImportPreviewRow } from './lib/excel';
import { categoryLabels, hydrateRisk, riskLevelLabels } from './lib/risk';
import { loadRisks, loadSettings, saveRisks, saveSettings } from './lib/storage';
import type { AppSettings, DisplayMode, Filters, RiskItem } from './lib/types';

const tabNames = ['固有风险矩阵', '双重重要性加权气泡矩阵', 'FM × IM 双重重要性矩阵', '3D 风险图'];

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [risks, setRisks] = useState<RiskItem[]>(() => loadRisks(loadSettings()));
  const [filters, setFilters] = useState<Filters>({ category: '', topic: '', riskLevel: '', department: '', search: '' });
  const [activeTab, setActiveTab] = useState(0);
  const [displayMode, setDisplayMode] = useState<DisplayMode>(settings.chart.displayMode);
  const [editingRisk, setEditingRisk] = useState<RiskItem | null | undefined>();
  const [selectedRisk, setSelectedRisk] = useState<RiskItem | null>(null);
  const [previewRows, setPreviewRows] = useState<ImportPreviewRow[] | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => saveRisks(risks), [risks]);
  useEffect(() => saveSettings(settings), [settings]);

  const filteredRisks = useMemo(() => risks.filter((risk) =>
    (!filters.category || risk.esgCategory === filters.category) &&
    (!filters.topic || risk.esgTopic === filters.topic) &&
    (!filters.riskLevel || risk.riskLevel === filters.riskLevel) &&
    (!filters.department || risk.responsibleDepartment === filters.department) &&
    (!filters.search || risk.riskName.includes(filters.search) || risk.esgTopic.includes(filters.search)),
  ).sort((a, b) => b.R - a.R), [filters, risks]);

  const kpi = useMemo(() => ({
    total: filteredRisks.length,
    critical: filteredRisks.filter((risk) => risk.riskLevel === 'CRITICAL').length,
    high: filteredRisks.filter((risk) => risk.riskLevel === 'HIGH').length,
    medium: filteredRisks.filter((risk) => risk.riskLevel === 'MEDIUM').length,
    low: filteredRisks.filter((risk) => risk.riskLevel === 'LOW').length,
    avgR: (filteredRisks.reduce((sum, risk) => sum + risk.R, 0) / filteredRisks.length || 0).toFixed(1),
    avgW: (filteredRisks.reduce((sum, risk) => sum + risk.W, 0) / filteredRisks.length || 0).toFixed(1),
    E: filteredRisks.filter((risk) => risk.esgCategory === 'E').length,
    S: filteredRisks.filter((risk) => risk.esgCategory === 'S').length,
    G: filteredRisks.filter((risk) => risk.esgCategory === 'G').length,
  }), [filteredRisks]);

  const topics = [...new Set(risks.map((risk) => risk.esgTopic))];
  const departments = [...new Set(risks.map((risk) => risk.responsibleDepartment).filter(Boolean))] as string[];

  const saveRisk = (risk: RiskItem) => {
    setRisks((current) => current.some((item) => item.id === risk.id) ? current.map((item) => item.id === risk.id ? risk : item) : [...current, risk]);
    setEditingRisk(undefined);
  };

  const deleteRisk = (id: string) => {
    if (window.confirm('确认删除该风险？')) {
      setRisks((current) => current.filter((risk) => risk.id !== id));
      setSelectedRisk(null);
    }
  };

  const importConfirmedRows = () => {
    if (!previewRows || previewRows.some((row) => row.errors.length > 0)) return;
    setRisks((current) => [...current, ...previewRows.map((row) => row.risk!).filter(Boolean)]);
    setPreviewRows(null);
  };

  const openGroup = (groupRisks: RiskItem[]) => {
    setPreviewRows(groupRisks.map((risk, index) => ({ rowNumber: index + 1, input: risk, risk, errors: [], status: '分组风险' })));
  };

  const chartProps = { risks: filteredRisks, settings, mode: displayMode, onRiskClick: setSelectedRisk, onGroupClick: openGroup };

  return <main>
    <header className="top"><div><h1>ESG风险热力管理系统</h1><p className="muted">风险识别、评分、双重重要性加权、可视化与数据管理</p></div><div className="toolbar"><button className="primary" onClick={() => setEditingRisk(null)}>新增风险</button><button onClick={() => fileInputRef.current?.click()}>Excel导入</button><input ref={fileInputRef} type="file" accept=".xlsx,.xls" hidden onChange={async (event) => { const file = event.target.files?.[0]; if (file) setPreviewRows(await parseExcel(file, settings.thresholds)); }} /><button onClick={() => setPreviewRows(parsePasted(window.prompt('请粘贴Excel复制内容（Tab分隔）') ?? '', settings.thresholds))}>Excel粘贴</button><button onClick={() => exportRisks(risks)}>Excel导出</button><button onClick={() => window.alert('L/I/FM/IM均为1–5整数；R=L×I；W=(FM+IM)/2；风险等级阈值可在系统设置中调整。')}>评分说明</button><button onClick={() => setSettingsOpen(true)}>系统设置</button></div></header>
    <section className="kpi-grid">{[['风险总数', kpi.total], ['极高风险', kpi.critical], ['高风险', kpi.high], ['中风险', kpi.medium], ['低风险', kpi.low], ['平均R', kpi.avgR], ['平均W', kpi.avgW], ['环境风险', kpi.E], ['社会风险', kpi.S], ['治理风险', kpi.G]].map(([label, value]) => <div className="card kpi" key={label}><span>{label}</span><b>{value}</b></div>)}</section>
    <section className="card filters"><select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value as Filters['category'] })}><option value="">全部分类</option><option value="E">E 环境</option><option value="S">S 社会</option><option value="G">G 治理</option></select><select value={filters.topic} onChange={(e) => setFilters({ ...filters, topic: e.target.value })}><option value="">全部议题</option>{topics.map((topic) => <option key={topic}>{topic}</option>)}</select><select value={filters.riskLevel} onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value as Filters['riskLevel'] })}><option value="">全部等级</option>{Object.entries(riskLevelLabels).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select><select value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })}><option value="">全部部门</option>{departments.map((department) => <option key={department}>{department}</option>)}</select><input placeholder="风险名称搜索" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} /><button onClick={() => setFilters({ category: '', topic: '', riskLevel: '', department: '', search: '' })}>清除筛选</button></section>
    <section className="card"><div className="chart-toolbar"><div>{tabNames.map((name, index) => <button key={name} className={activeTab === index ? 'active' : ''} onClick={() => setActiveTab(index)}>{name}</button>)}</div><div className="display-mode">显示方式：<button className={displayMode === 'aggregate' ? 'active' : ''} onClick={() => setDisplayMode('aggregate')}>● 聚合显示</button><button className={displayMode === 'jitter' ? 'active' : ''} onClick={() => setDisplayMode('jitter')}>○ 展开显示</button></div></div>{activeTab === 0 && <MatrixChart {...chartProps} />}{activeTab === 1 && <WeightedBubbleChart {...chartProps} />}{activeTab === 2 && <MaterialityChart {...chartProps} />}{activeTab === 3 && <Risk3DChart risks={filteredRisks} settings={settings} onRiskClick={setSelectedRisk} />}</section>
    <section className="card"><h2>风险清单</h2><div className="table-wrap"><table><thead><tr>{['风险名称', 'ESG议题', 'ESG分类', 'L', 'I', 'R', 'FM', 'IM', 'W', '风险等级', '责任部门', '操作'].map((head) => <th key={head}>{head}</th>)}</tr></thead><tbody>{filteredRisks.map((risk) => <tr key={risk.id}><td><b>{risk.riskName}</b></td><td>{risk.esgTopic}</td><td>{categoryLabels[risk.esgCategory]}</td><td>{risk.L}</td><td>{risk.I}</td><td>{risk.R}</td><td>{risk.FM}</td><td>{risk.IM}</td><td>{risk.W}</td><td>{riskLevelLabels[risk.riskLevel]}</td><td>{risk.responsibleDepartment}</td><td><button onClick={() => setSelectedRisk(risk)}>查看</button><button onClick={() => setEditingRisk(risk)}>编辑</button><button className="danger ghost" onClick={() => deleteRisk(risk.id)}>删除</button></td></tr>)}</tbody></table></div></section>
    {editingRisk !== undefined && <RiskFormModal risk={editingRisk ?? undefined} settings={settings} onClose={() => setEditingRisk(undefined)} onSave={saveRisk} />}
    {selectedRisk && <RiskDetailModal risk={selectedRisk} onClose={() => setSelectedRisk(null)} onEdit={() => { setEditingRisk(selectedRisk); setSelectedRisk(null); }} onDelete={() => deleteRisk(selectedRisk.id)} />}
    {previewRows && <ImportPreviewModal rows={previewRows} onClose={() => setPreviewRows(null)} onConfirm={importConfirmedRows} onViewRisk={(id) => setSelectedRisk(risks.find((risk) => risk.id === id) ?? null)} />}
    {settingsOpen && <SettingsModal settings={settings} onClose={() => setSettingsOpen(false)} onSave={(next) => { setSettings(next); setDisplayMode(next.chart.displayMode); setRisks((current) => current.map((risk) => hydrateRisk(risk, next.thresholds, risk.id))); setSettingsOpen(false); }} />}
  </main>;
}
