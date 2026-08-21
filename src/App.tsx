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
    <div className="w-full min-h-[660px] bg-[#FDF9F9] flex flex-col relative overflow-hidden">
      {/* Top Global Navigation Bar */}
      <TopNavbar />

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col relative">
        {renderActiveScreen()}
      </main>

      {/* Floating State Navigator for Quick Auditing & Presentation Switch */}
      <ScreenStateNavigator />
    </div>
  );

  if (presentationMode) {
    return (
      <div className="min-h-screen bg-[#ECE7E6] py-6 px-4 flex flex-col items-center justify-center">
        <LaptopMockupFrame>
          {appView}
        </LaptopMockupFrame>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ECE7E6] flex flex-col">
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
