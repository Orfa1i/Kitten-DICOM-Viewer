import React from 'react';
import { MedicalAppProvider, useMedicalApp } from './context/MedicalAppContext';
import { TopNavbar } from './components/layout/TopNavbar';
import { DashboardView } from './components/views/DashboardView';
import { ModelSelectionModal } from './components/views/ModelSelectionModal';
import { IntakeUploadModal } from './components/views/IntakeUploadModal';
import { MockPacsView } from './components/views/MockPacsView';
import { LandingPageView } from './components/views/LandingPageView';
import { ScreenStateNavigator } from './components/interactive/ScreenStateNavigator';
import { LaptopMockupFrame } from './components/layout/LaptopMockupFrame';
import MagicCursor from './components/originkit/ui/spin-cursor-cusor-me';
import { DashboardBackground } from './components/ui/DashboardBackground';

import { IframeViewerView } from './components/views/IframeViewerView';
import { FinalReportView } from './components/views/FinalReportView';
import { KnowledgeSourcesView } from './components/views/KnowledgeSourcesView';
import { LoginView } from './components/views/LoginView';
import { MedGemmaChatbotView } from './components/views/MedGemmaChatbotView';
import { StudioWorkstationView } from './components/views/StudioWorkstationView';

import { MedGemmaTestModal } from './components/modals/MedGemmaTestModal';
import { ProfileManagementModal } from './components/modals/ProfileManagementModal';
import { WorklistModal } from './components/modals/WorklistModal';

const MainContent: React.FC = () => {
  const { currentScreen, presentationMode, isAuthenticated } = useMedicalApp();

  if (!isAuthenticated && currentScreen !== 'login' && currentScreen !== 'landing') {
    return <LoginView />;
  }

  if (currentScreen === 'login') {
    return <LoginView />;
  }
  if (currentScreen === 'landing') {
    return <LandingPageView />;
  }
  if (currentScreen === 'iframe-viewer') {
    return <IframeViewerView />;
  }
  if (currentScreen === 'final-report') {
    return <FinalReportView />;
  }

  const renderActiveScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
      case 'configuration':
        return <DashboardView />;
      case 'knowledge-sources':
        return <KnowledgeSourcesView />;
      case 'model-select':
        return <ModelSelectionModal />;
      case 'intake-upload':
        return <IntakeUploadModal />;
      case 'mock-pacs':
        return <MockPacsView />;
      default:
        return <DashboardView />;
    }
  };

  const appView = (
    <div className="w-full h-full bg-transparent flex flex-col relative overflow-hidden flex-1">
      <DashboardBackground />
      <TopNavbar />
      <main className="flex-1 flex flex-col relative overflow-hidden p-6 md:p-8">
        {renderActiveScreen()}
      </main>
      <ScreenStateNavigator />
      <MedGemmaTestModal />
      <ProfileManagementModal />
      <WorklistModal />
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
      <div className="fixed inset-0 pointer-events-none z-[999999] overflow-hidden">
        <MagicCursor />
      </div>
    </MedicalAppProvider>
  );
}

export default App;
