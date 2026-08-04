import {defaultSettings,hydrateRisk} from './risk';import type{AppSettings,RiskItem}from'./types';
const RISK_KEY='esg-risk-items-v1',SETTINGS_KEY='esg-risk-settings-v1';
export const seedRisks=(s:AppSettings)=>([
{riskName:'碳排放合规风险',esgTopic:'气候变化',esgCategory:'E',L:4,I:5,FM:5,IM:5,responsibleDepartment:'EHS部',riskOwner:'张经理',description:'碳排放政策收紧导致成本与合规压力上升'},
{riskName:'供应链劳工权益风险',esgTopic:'供应链管理',esgCategory:'S',L:3,I:4,FM:4,IM:5,responsibleDepartment:'采购部'},
{riskName:'董事会独立性不足',esgTopic:'公司治理',esgCategory:'G',L:2,I:4,FM:4,IM:3,responsibleDepartment:'董事会办公室'},
{riskName:'水资源短缺',esgTopic:'水资源',esgCategory:'E',L:3,I:4,FM:3,IM:5,responsibleDepartment:'生产运营部'},
{riskName:'员工安全事故',esgTopic:'职业健康安全',esgCategory:'S',L:4,I:4,FM:4,IM:4,responsibleDepartment:'人力资源部'},
{riskName:'商业道德违规',esgTopic:'商业道德',esgCategory:'G',L:3,I:5,FM:5,IM:4,responsibleDepartment:'合规部'}] as any[]).map(x=>hydrateRisk(x,s.thresholds));
export function loadSettings():AppSettings{try{return{...defaultSettings,...JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}'),thresholds:{...defaultSettings.thresholds,...(JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}').thresholds||{})},chart:{...defaultSettings.chart,...(JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}').chart||{})}}}catch{return defaultSettings}}
export function saveSettings(s:AppSettings){localStorage.setItem(SETTINGS_KEY,JSON.stringify(s))}
export function loadRisks(s:AppSettings):RiskItem[]{try{const raw=localStorage.getItem(RISK_KEY);if(!raw)return seedRisks(s);return JSON.parse(raw).map((r:any)=>hydrateRisk(r,s.thresholds,r.id))}catch{return seedRisks(s)}}export function saveRisks(r:RiskItem[]){localStorage.setItem(RISK_KEY,JSON.stringify(r))}
