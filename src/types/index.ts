export type ScreenState = 
  | 'dashboard'         // Screen 1: Workspace with Setting + Cases Log
  | 'ai-assistant'      // Screen 2: Workspace with AI Assistant Drawer open
  | 'model-select'      // Screen 3: New Case Model Selection Modal
  | 'intake-upload'     // Screen 4: New Case Drag & Drop + Patient Metadata
  | 'diagnostic-studio';// Screen 5: Diagnostic Results Studio (Viewport + Report + Gauge)

export type ModelType = 
  | 'knee-osteoarthritis'
  | 'knee-abnormality'
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
  findings?: string[];
  diagnosisTitle?: string;
  recommendation?: string;
}

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  attachment?: string;
  modelUsed?: string;
}
