
export enum AppView {
  OUTLINE_GENERATOR = 'OUTLINE_GENERATOR',
  PUBLISH_PLAN = 'PUBLISH_PLAN',
  SETTINGS = 'SETTINGS'
}

export interface ProductInfo {
  name: string;
  audience: string;
  description: string;
  features: string;
  style: string;
}

export interface NoteOutline {
  titleSuggestions: string[];
  hook: string;
  mainPoints: string[];
  imagePrompts: string[];
}

export type TaskStatus = 'draft' | 'running' | 'paused' | 'aborted' | 'completed';

export interface GeneratedNote {
  id: string;
  productName: string;
  style: string;
  title: string;
  content: string;
  tags: string[];
  images: string[];
  createdAt: string;
  
  // 计划相关
  publishFrequency: number; // 每天发布几次
  durationDays: number;     // 持续几天
  order: number;            // 排序权重
  status: TaskStatus;
  successCount: number;     // 已成功生成/发布的次数
  startDate?: string;       // 计算出的开始日期
  endDate?: string;         // 计算出的结束日期
}
