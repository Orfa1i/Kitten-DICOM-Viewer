import React, { createContext, useContext, useState } from 'react';
import { ScreenState, ModelType, CaseRecord, PatientData, AiChatMessage } from '../types';

interface MedicalAppContextType {
  // Navigation & Screen States
  currentScreen: ScreenState;
  setCurrentScreen: (screen: ScreenState) => void;
  isAiDrawerOpen: boolean;
  setIsAiDrawerOpen: (open: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  presentationMode: boolean;
  setPresentationMode: (val: boolean) => void;

  // Selected Clinical Model
  selectedModel: ModelType;
  setSelectedModel: (model: ModelType) => void;

  // Intake / Patient Form State
  patientForm: PatientData;
  setPatientForm: React.Dispatch<React.SetStateAction<PatientData>>;
  uploadedFile: string | null;
  setUploadedFile: (url: string | null) => void;
  uploadedFileName: string;
  setUploadedFileName: (name: string) => void;

  // Cases Records
  cases: CaseRecord[];
  addCase: (newCase: CaseRecord) => void;
  activeCaseId: string;
  setActiveCaseId: (id: string) => void;

  // Search Filter
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Inference & Detection Studio
  isDetecting: boolean;
  detectionProgress: number;
  runInference: () => Promise<void>;
  showBoundingBoxes: boolean;
  setShowBoundingBoxes: (val: boolean) => void;
  brightness: number;
  setBrightness: (val: number) => void;
  contrast: number;
  setContrast: (val: number) => void;
  zoomLevel: number;
  setZoomLevel: (val: number) => void;
  accuracyScore: number;

  // AI Assistant Chat Feed
  chatMessages: AiChatMessage[];
  addChatMessage: (msg: string, sender?: 'user' | 'assistant') => void;

  // Reset/Trigger helpers
  openNewCaseModal: () => void;
  saveCurrentCase: () => void;
  loadCase: (caseId: string) => void;
}

const defaultCases: CaseRecord[] = [
  {
    id: 'kt-523476',
    patientName: 'Mohamad',
    age: 33,
    sex: 'male',
    type: 'Knee Abnormality',
    typeSub: 'CTFS Lateral View',
    date: '2026-08-21',
    status: 'Completed',
    confidence: 98.6,
    findings: [
      'Lateral tibial plateau cortical discontinuity',
      'Soft tissue swelling anterior to proximal fibula',
      'CTFS measurement indicates grade II displacement'
    ]
  },
  {
    id: 'kt-523477',
    patientName: 'Sarah Jenkins',
    age: 45,
    sex: 'female',
    type: 'Knee Osteoarthritis',
    typeSub: 'Bilateral Weight-Bearing AP',
    date: '2026-08-20',
    status: 'Completed',
    confidence: 97.4,
    findings: [
      'Medial joint space narrowing (Kellgren-Lawrence Grade 3)',
      'Subchondral sclerosis of medial tibial plateau',
      'Marginal osteophyte formation along distal femur'
    ]
  },
  {
    id: 'kt-523478',
    patientName: 'Marcus Vance',
    age: 28,
    sex: 'male',
    type: 'Fracture Detection',
    typeSub: 'Forearm / Radius AP-Lat',
    date: '2026-08-19',
    status: 'Completed',
    confidence: 99.1,
    findings: [
      'Complete transverse mid-shaft radial fracture',
      '2.4mm dorsal cortical displacement',
      'Radiocapitellar and distal radioulnar joints intact'
    ]
  }
];

const initialAiMessages: AiChatMessage[] = [
  {
    id: '1',
    sender: 'assistant',
    text: 'Hello Dr. Hassan! Kitten Clinical Copilot is active. You can ask for DICOM measurements, differential diagnoses, or model confidence breakdown.',
    timestamp: '17:20'
  }
];

const MedicalAppContext = createContext<MedicalAppContextType | undefined>(undefined);

const getInitialScreen = (): ScreenState => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('view');
    if (v === 'ai-assistant' || v === 'model-select' || v === 'intake-upload' || v === 'diagnostic-studio') {
      return v as ScreenState;
    }
  }
  return 'dashboard';
};

const getInitialPresentationMode = (): boolean => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    return params.get('frame') === 'true';
  }
  return false;
};

export const MedicalAppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>(getInitialScreen);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);
  const [presentationMode, setPresentationMode] = useState<boolean>(getInitialPresentationMode);

  const [selectedModel, setSelectedModel] = useState<ModelType>('fracture-detection');
  
  const [patientForm, setPatientForm] = useState<PatientData>({
    id: 'kt-523476',
    name: 'Mohamad',
    age: '33',
    sex: 'male',
    studyDate: '2026-08-21',
    modality: 'Digital Radiography (DX)',
    bodyPart: 'Forearm / Radius AP-Lateral'
  });

  const [uploadedFile, setUploadedFile] = useState<string | null>('/assets/images/xray_fracture.png');
  const [uploadedFileName, setUploadedFileName] = useState('xray_scan_series_04.dicom');

  const [cases, setCases] = useState<CaseRecord[]>(defaultCases);
  const [activeCaseId, setActiveCaseId] = useState('kt-523476');
  const [searchQuery, setSearchQuery] = useState('');

  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionProgress, setDetectionProgress] = useState(0);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [accuracyScore, setAccuracyScore] = useState(98.6);

  const [chatMessages, setChatMessages] = useState<AiChatMessage[]>(initialAiMessages);

  const addChatMessage = (msg: string, sender: 'user' | 'assistant' = 'user') => {
    const newMsg: AiChatMessage = {
      id: Date.now().toString(),
      sender,
      text: msg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, newMsg]);

    if (sender === 'user') {
      setTimeout(() => {
        let reply = "I've analyzed the radiograph. The highlighted region confirms a diaphyseal fracture with 98.6% model certainty. Would you like me to draft the clinical report?";
        if (msg.toLowerCase().includes('accuracy') || msg.toLowerCase().includes('score')) {
          reply = `The current model classification confidence is ${accuracyScore}% with a false positive rate < 0.2% on our test cohort.`;
        } else if (msg.toLowerCase().includes('treatment') || msg.toLowerCase().includes('recommend')) {
          reply = "Recommended management: Closed reduction under hematoma block, sugar-tong splint immobilization, and repeat orthogonal radiographs in 7 days.";
        }
        setChatMessages(curr => [
          ...curr,
          {
            id: (Date.now() + 1).toString(),
            sender: 'assistant',
            text: reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }, 700);
    }
  };

  const addCase = (newCase: CaseRecord) => {
    setCases(prev => [newCase, ...prev]);
  };

  const openNewCaseModal = () => {
    setCurrentScreen('model-select');
  };

  const runInference = async () => {
    setIsDetecting(true);
    setDetectionProgress(0);

    for (let i = 10; i <= 100; i += 15) {
      await new Promise(r => setTimeout(r, 120));
      setDetectionProgress(i);
    }

    setIsDetecting(false);
    setAccuracyScore(98.6);
    setCurrentScreen('diagnostic-studio');
  };

  const saveCurrentCase = () => {
    const existingIndex = cases.findIndex(c => c.id === patientForm.id);
    const updatedRecord: CaseRecord = {
      id: patientForm.id || `kt-${Math.floor(100000 + Math.random() * 900000)}`,
      patientName: patientForm.name || 'Anonymous',
      age: patientForm.age || '30',
      sex: patientForm.sex,
      type: selectedModel === 'fracture-detection' ? 'Fracture Detection' : selectedModel === 'knee-osteoarthritis' ? 'Knee Osteoarthritis' : 'Knee Abnormality',
      typeSub: 'Orthogonal View',
      date: new Date().toISOString().split('T')[0],
      status: 'Completed',
      confidence: accuracyScore,
      findings: [
        'Complete cortical fracture line visualized with sharp demarcation',
        'Minimal comminution at dorsal cortex',
        'Surrounding soft-tissue edema noted'
      ]
    };

    if (existingIndex >= 0) {
      setCases(prev => {
        const next = [...prev];
        next[existingIndex] = updatedRecord;
        return next;
      });
    } else {
      setCases(prev => [updatedRecord, ...prev]);
    }

    setCurrentScreen('dashboard');
  };

  const loadCase = (caseId: string) => {
    const c = cases.find(item => item.id === caseId);
    if (c) {
      setActiveCaseId(caseId);
      setPatientForm({
        id: c.id,
        name: c.patientName,
        age: c.age,
        sex: c.sex,
        studyDate: c.date,
        modality: 'Digital Radiography (DX)',
        bodyPart: c.type.includes('Knee') ? 'Knee AP/Lateral' : 'Forearm / Radius-Ulna'
      });
      setAccuracyScore(c.confidence);
      setCurrentScreen('diagnostic-studio');
    }
  };

  return (
    <MedicalAppContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        isAiDrawerOpen,
        setIsAiDrawerOpen,
        isSettingsOpen,
        setIsSettingsOpen,
        presentationMode,
        setPresentationMode,
        selectedModel,
        setSelectedModel,
        patientForm,
        setPatientForm,
        uploadedFile,
        setUploadedFile,
        uploadedFileName,
        setUploadedFileName,
        cases,
        addCase,
        activeCaseId,
        setActiveCaseId,
        searchQuery,
        setSearchQuery,
        isDetecting,
        detectionProgress,
        runInference,
        showBoundingBoxes,
        setShowBoundingBoxes,
        brightness,
        setBrightness,
        contrast,
        setContrast,
        zoomLevel,
        setZoomLevel,
        accuracyScore,
        chatMessages,
        addChatMessage,
        openNewCaseModal,
        saveCurrentCase,
        loadCase,
      }}
    >
      {children}
    </MedicalAppContext.Provider>
  );
};

export const useMedicalApp = () => {
  const context = useContext(MedicalAppContext);
  if (!context) {
    throw new Error('useMedicalApp must be used within a MedicalAppProvider');
  }
  return context;
};
