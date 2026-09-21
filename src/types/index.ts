export type ScreenState = 
  | 'landing'
  | 'login'
  | 'dashboard'
  | 'ai-assistant'
  | 'model-select'
  | 'intake-upload'
  | 'preview-phase'
  | 'review-approval'
  | 'iframe-viewer'
  | 'mock-pacs'
  | 'configuration'
  | 'knowledge-sources'
  | 'medgemma-chat'
  | 'final-report'; // Screen 5: Diagnostic Results Studio (Viewport + Report + Gauge)

export type ModelType = 
  | 'knee-osteoarthritis'
  | 'fracture-detection';

export type LlmProvider = 'gemini' | 'anthropic' | 'openai' | 'ollama' | 'custom';

export interface LlmConfig {
  provider: LlmProvider;
  modelName: string;
  modelVersion: string;
  apiKey: string;
  baseUrl?: string;
  temperature: number;
  systemPrompt: string;
}

export interface ModelCardData {
  id: ModelType;
  title: string;
  subtitle: string;
  image: string;
  modality: string;
  accuracy: string;
  tag: string;
}

export interface PatientData {
  id: string;
  name: string;
  age: number | string;
  sex: 'male' | 'female';
  studyDate?: string;
  modality?: string;
  bodyPart?: string;
}

export interface DiagnosticReportData {
  diagnosis: string;
  klGrade?: number;
  findings: string[];
  recommendation?: string;
  confidenceGrade?: string;
}

export interface CaseRecord {
  id: string;
  patientName: string;
  age: number | string;
  sex: 'male' | 'female';
  type: string;
  typeSub?: string;
  date: string;
  status: 'Completed' | 'Pending' | 'Review';
  confidence: number;
  image?: string;
  findings?: string[] | string;
  diagnosisTitle?: string;
  recommendation?: string;
}

export interface PubMedCitation {
  pmid: string;
  title: string;
  authors: string;
  journal: string;
  url?: string;
  takeaway?: string;
}

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  attachment?: string;
  modelUsed?: string;
  pubmedArticles?: PubMedCitation[];
}
