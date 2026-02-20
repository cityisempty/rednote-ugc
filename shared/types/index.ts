// ==================== Enums ====================

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export enum NoteStatus {
  DRAFT = 'DRAFT',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED'
}

export enum TransactionType {
  RECHARGE = 'RECHARGE',
  GENERATE_OUTLINE = 'GENERATE_OUTLINE',
  GENERATE_NOTE = 'GENERATE_NOTE',
  GENERATE_IMAGE = 'GENERATE_IMAGE',
  ADMIN_ADJUSTMENT = 'ADMIN_ADJUSTMENT'
}

// ==================== Models ====================

export interface User {
  id: string;
  email: string;
  username: string;
  role: Role;
  credits: number;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  userId: string;
  productName: string;
  style: string;
  title: string;
  content: string;
  tags: string[];
  images: string[];
  outline?: NoteOutline;
  templateId?: string;
  status: NoteStatus;
  creditsUsed: number;
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  category: string;
  titlePattern: string;
  contentStructure: TemplateStructure;
  styleGuide: StyleGuide;
  hashtagStrategy: string[];
  isOfficial: boolean;
  isPublic: boolean;
  usageCount: number;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  balance: number;
  description: string;
  relatedNoteId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ==================== Nested Types ====================

export interface NoteOutline {
  titleSuggestions: string[];
  hook: string;
  mainPoints: string[];
  imagePrompts: string[];
}

export interface TemplateSection {
  type: 'intro' | 'body' | 'conclusion';
  placeholder: string;
  guidelines: string;
}

export interface TemplateStructure {
  sections: TemplateSection[];
  estimatedLength: number;
}

export interface StyleGuide {
  tone: string;
  emojiFrequency: 'high' | 'medium' | 'low';
  emojiPlacement: 'start' | 'end' | 'both' | 'inline';
  paragraphStyle: 'short-punchy' | 'medium-balanced' | 'long-detailed';
  keywords: string[];
}

// ==================== API Types ====================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ==================== Auth ====================

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ==================== Generation ====================

export interface ProductInfo {
  name: string;
  audience: string;
  description: string;
  features: string;
  style: string;
}

export interface GenerateOutlineRequest extends ProductInfo {
  templateId?: string;
}

export interface GenerateNoteRequest {
  outline: NoteOutline;
  productInfo: ProductInfo;
  templateId?: string;
}

export interface GenerateNoteResponse {
  title: string;
  content: string;
  tags: string[];
}

export interface GenerateImageRequest {
  prompt: string;
  noteId?: string;
}

export interface GenerateImageResponse {
  imageUrl: string;
}

// ==================== Recharge ====================

export interface RedeemCardRequest {
  code: string;
}

export interface RedeemCardResponse {
  credits: number;
  newBalance: number;
}

// ==================== Template Imitation ====================

export interface AnalyzeNoteRequest {
  url: string;
}

export interface AnalyzeNoteResponse {
  template: Omit<Template, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>;
  analysis: {
    titlePattern: string;
    contentFlow: string;
    emojiUsage: string;
    hashtagStrategy: string;
    writingStyle: string;
  };
}

// ==================== Admin ====================

export interface GenerateCardsRequest {
  count: number;
  credits: number;
  expiresAt?: string;
}

export interface GenerateCardsResponse {
  cards: string[];
}

export interface AdminStats {
  totalUsers: number;
  totalNotes: number;
  totalCreditsUsed: number;
  totalCardsGenerated: number;
  totalCardsRedeemed: number;
  recentUsers: User[];
}

// ==================== Credit Costs ====================

export const CREDIT_COSTS = {
  GENERATE_OUTLINE: 5,
  GENERATE_NOTE: 10,
  GENERATE_IMAGE: 15,
  ANALYZE_NOTE: 8,
} as const;

export const WELCOME_CREDITS = 10;
