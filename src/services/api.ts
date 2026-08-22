import { LlmConfig } from '../types';

const API_BASE_URL = 'http://localhost:8000';

export interface KneeOAApiResponse {
  success: boolean;
  overall_kl_grade: number;
  overall_confidence: number;
  overall_diagnosis: string;
  num_joints_detected: number;
  joints: Array<{
    side: string;
    detection_confidence: number;
    bounding_box: number[];
    classification: {
      kl_grade: number;
      kl_grade_simplified: string;
      confidence: number;
      is_uncertain: boolean;
      probabilities: Record<string, number>;
      findings: string[];
      title: string;
      recommendation: string;
    };
  }>;
  annotated_image_filename?: string;
  image_url?: string;
  clinical_report: {
    diagnosis: string;
    kl_grade: number;
    findings: string[];
    recommendation: string;
    joint_summary?: Array<{
      side: string;
      grade: string;
      confidence: string;
      status: string;
    }>;
  };
  patient_info?: {
    id: string;
    name: string;
    age: number | string;
    sex: string;
    study_date?: string;
    body_part?: string;
  };
}

export interface BoneFractureItem {
  bounding_box: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  confidence: number;
}

export interface BoneFractureApiResponse {
  status: string;
  fractures_found: number;
  data: BoneFractureItem[];
}

export interface LlmTestResult {
  success: boolean;
  provider: string;
  model: string;
  latency_ms?: number;
  sample_reply?: string;
  error?: string;
}

export const apiService = {
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  },

  async getModels() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/models`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API getModels fallback', e);
    }
    return null;
  },

  async testLlmConnection(config: {
    provider: string;
    model_version: string;
    api_key: string;
    base_url?: string;
  }): Promise<LlmTestResult> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/settings/llm/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        return await res.json();
      }
      return {
        success: false,
        provider: config.provider,
        model: config.model_version,
        error: `Server responded with HTTP ${res.status}`,
      };
    } catch (e) {
      return {
        success: false,
        provider: config.provider,
        model: config.model_version,
        error: e instanceof Error ? e.message : 'Network error connecting to backend',
      };
    }
  },

  async runKneeOADetection(
    fileBlobOrUrl: Blob | string,
    patient: { id: string; name: string; age: number | string; sex: string }
  ): Promise<KneeOAApiResponse | null> {
    try {
      const formData = new FormData();
      
      if (typeof fileBlobOrUrl === 'string') {
        const imageRes = await fetch(fileBlobOrUrl);
        const blob = await imageRes.blob();
        formData.append('file', blob, 'study_scan.png');
      } else {
        formData.append('file', fileBlobOrUrl, 'study_scan.png');
      }

      formData.append('patient_id', patient.id);
      formData.append('patient_name', patient.name);
      formData.append('age', String(patient.age));
      formData.append('sex', patient.sex);

      const res = await fetch(`${API_BASE_URL}/api/detect/knee-oa`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error('API runKneeOADetection error:', e);
    }
    return null;
  },

  async runBoneFractureDetection(
    fileBlobOrUrl: Blob | File | string
  ): Promise<BoneFractureApiResponse | null> {
    try {
      const formData = new FormData();
      if (fileBlobOrUrl instanceof File) {
        formData.append('file', fileBlobOrUrl, fileBlobOrUrl.name);
      } else if (fileBlobOrUrl instanceof Blob) {
        formData.append('file', fileBlobOrUrl, 'fracture_study.png');
      } else if (typeof fileBlobOrUrl === 'string') {
        const imageRes = await fetch(fileBlobOrUrl);
        const blob = await imageRes.blob();
        formData.append('file', blob, 'fracture_study.png');
      }

      const res = await fetch(`${API_BASE_URL}/api/detect/bone-fracture`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const json: BoneFractureApiResponse = await res.json();
        return json;
      } else {
        console.error(`Bone fracture detection failed: HTTP ${res.status}`);
      }
    } catch (e) {
      console.error('API runBoneFractureDetection network failure:', e);
    }
    return null;
  },

  async sendChatMessage(
    message: string,
    config?: LlmConfig,
    context?: Record<string, any>
  ): Promise<{ reply: string; modelUsed?: string } | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, config, context }),
      });
      if (res.ok) {
        const data = await res.json();
        return {
          reply: data.reply,
          modelUsed: data.modelUsed,
        };
      }
    } catch (e) {
      console.warn('API sendChatMessage fallback', e);
    }
    return null;
  }
};
