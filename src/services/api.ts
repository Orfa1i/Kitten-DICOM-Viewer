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

  async runKneeOADetection(
    fileBlobOrUrl: Blob | string,
    patient: { id: string; name: string; age: number | string; sex: string }
  ): Promise<KneeOAApiResponse | null> {
    try {
      const formData = new FormData();
      
      if (typeof fileBlobOrUrl === 'string') {
        // Fetch image as blob if it is a local URL
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
      console.warn('API runKneeOADetection fallback', e);
    }
    return null;
  },

  async sendChatMessage(message: string): Promise<string | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.reply;
      }
    } catch (e) {
      console.warn('API sendChatMessage fallback', e);
    }
    return null;
  }
};
