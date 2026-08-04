export type ESGCategory='E'|'S'|'G';export type RiskLevel='LOW'|'MEDIUM'|'HIGH'|'CRITICAL';export type DisplayMode='aggregate'|'jitter';
export interface RiskThresholds{lowMax:number;mediumMax:number;highMax:number}export interface ChartSettings{displayMode:DisplayMode;minBubbleSize:number;maxBubbleSize:number}export interface AppSettings{thresholds:RiskThresholds;chart:ChartSettings}
export interface RiskInput{riskName:string;esgTopic:string;esgCategory:ESGCategory;L:number;I:number;FM:number;IM:number;description?:string;responsibleDepartment?:string;riskOwner?:string;existingControl?:string;mitigationAction?:string;remarks?:string}
export interface RiskItem extends RiskInput{id:string;R:number;W:number;riskLevel:RiskLevel}
export interface Filters{category:''|ESGCategory;topic:string;riskLevel:''|RiskLevel;department:string;search:string}
export interface AggregatedPoint{key:string;x:number;y:number;risks:RiskItem[];count:number;maxR:number;avgW:number;maxW:number;levelDistribution:Record<RiskLevel,number>}
