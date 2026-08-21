import React from 'react';
import { MedicalAppProvider, useMedicalApp } from './context/MedicalAppContext';
import { TopNavbar } from './components/layout/TopNavbar';
import { DashboardView } from './components/views/DashboardView';
import { AiAssistantDrawer } from './components/views/AiAssistantDrawer';
import { ModelSelectionModal } from './components/views/ModelSelectionModal';
import { IntakeUploadModal } from './components/views/IntakeUploadModal';
import { DiagnosticStudioView } from './components/views/DiagnosticStudioView';
import { ScreenStateNavigator } from './components/interactive/ScreenStateNavigator';
import { LaptopMockupFrame } from './components/layout/LaptopMockupFrame';
import { LlmSettingsModal } from './components/modals/LlmSettingsModal';

const MainContent: React.FC = () => {
  const { currentScreen, presentationMode } = useMedicalApp();

  const renderActiveScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <DashboardView />;
      case 'ai-assistant':
        return <AiAssistantDrawer />;
      case 'model-select':
        return <ModelSelectionModal />;
      case 'intake-upload':
        return <IntakeUploadModal />;
      case 'diagnostic-studio':
        return <DiagnosticStudioView />;
      default:
        return <DashboardView />;
    }
  };

  const appView = (
    <div className="w-full h-full bg-[#FDF9F9] flex flex-col relative overflow-hidden flex-1">
      {/* Top Global Navigation Bar */}
      <TopNavbar />

      {/* Main Workspace Area filling remaining height */}
      <main className="flex-1 flex flex-col relative overflow-hidden p-6 md:p-8">
        {renderActiveScreen()}
      </main>

      {/* Floating State Navigator (Left Drawer Chevron & Settings Gear) */}
      <ScreenStateNavigator />

      {/* LLM Model & API Key Settings Modal */}
      <LlmSettingsModal />
    </div>
  );

  if (presentationMode) {
    return (
      <div className="h-screen w-screen bg-[#ECE7E6] p-4 flex flex-col items-center justify-center overflow-hidden">
        <LaptopMockupFrame>
          {appView}
        </LaptopMockupFrame>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#FDF9F9] flex flex-col overflow-hidden">
      {appView}
    </div>
  );
};

export function App() {
  return (
    <MedicalAppProvider>
      <MainContent />
    </MedicalAppProvider>
  );
}

export default App;
