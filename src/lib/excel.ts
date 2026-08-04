import * as XLSX from 'xlsx';
import { hydrateRisk, normalizeCategory, riskLevelLabels, validateRiskInput } from './risk';
import type { RiskInput, RiskItem, RiskThresholds } from './types';

export interface ImportPreviewRow {
  rowNumber: number;
  input: Partial<RiskInput>;
  risk: RiskItem | null;
  errors: string[];
  status: string;
}

const defaultColumns = [
  '风险名称',
  'ESG议题',
  'ESG分类',
  '发生可能性L',
  '影响程度I',
  '财务重要性FM',
  '影响重要性IM',
  '风险描述',
  '责任部门',
  '风险负责人',
  '现有控制措施',
  '风险应对措施',
  '备注',
];

function pick(row: Record<string, unknown>, names: string[]) {
  for (const name of names) {
    if (row[name] !== undefined) return row[name];
  }
  return '';
}

function toInput(row: Record<string, unknown>): Partial<RiskInput> {
  return {
    riskName: String(pick(row, ['风险名称', 'riskName']) || '').trim(),
    esgTopic: String(pick(row, ['ESG议题', 'esgTopic']) || '').trim(),
    esgCategory: normalizeCategory(String(pick(row, ['ESG分类', 'esgCategory']) || '')) ?? undefined,
    L: Number(pick(row, ['发生可能性L', 'L'])),
    I: Number(pick(row, ['影响程度I', 'I'])),
    FM: Number(pick(row, ['财务重要性FM', 'FM'])),
    IM: Number(pick(row, ['影响重要性IM', 'IM'])),
    description: String(pick(row, ['风险描述', 'description']) || ''),
    responsibleDepartment: String(pick(row, ['责任部门', 'responsibleDepartment']) || ''),
    riskOwner: String(pick(row, ['风险负责人', 'riskOwner']) || ''),
    existingControl: String(pick(row, ['现有控制措施', 'existingControl']) || ''),
    mitigationAction: String(pick(row, ['风险应对措施', 'mitigationAction']) || ''),
    remarks: String(pick(row, ['备注', 'remarks']) || ''),
  };
}

export function previewRows(rows: Record<string, unknown>[], thresholds: RiskThresholds): ImportPreviewRow[] {
  return rows.map((row, index) => {
    const input = toInput(row);
    const errors = validateRiskInput(input);
    const risk = errors.length ? null : hydrateRisk(input as RiskInput, thresholds);
    return {
      rowNumber: index + 2,
      input,
      risk,
      errors,
      status: errors.length ? errors.join('；') : '可导入',
    };
  });
}

export async function parseExcel(file: File, thresholds: RiskThresholds) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });
  return previewRows(rows, thresholds);
}

export function parsePasted(text: string, thresholds: RiskThresholds) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const cells = lines.map((line) => line.split('\t'));
  const hasHeader = cells[0].some((cell) => defaultColumns.includes(cell.trim()) || ['L', 'I', 'FM', 'IM'].includes(cell.trim()));
  const headers = hasHeader ? cells.shift()! : defaultColumns;
  return previewRows(
    cells.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? '']))),
    thresholds,
  );
}

export function exportRisks(risks: RiskItem[]) {
  const data = risks.map((risk) => ({
    风险名称: risk.riskName,
    ESG议题: risk.esgTopic,
    ESG分类: risk.esgCategory,
    L: risk.L,
    I: risk.I,
    R: risk.R,
    FM: risk.FM,
    IM: risk.IM,
    W: risk.W,
    风险等级: riskLevelLabels[risk.riskLevel],
    风险描述: risk.description ?? '',
    责任部门: risk.responsibleDepartment ?? '',
    风险负责人: risk.riskOwner ?? '',
    现有控制措施: risk.existingControl ?? '',
    风险应对措施: risk.mitigationAction ?? '',
    备注: risk.remarks ?? '',
  }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(data), 'ESG风险清单');
  XLSX.writeFile(workbook, 'ESG风险清单.xlsx');
}
