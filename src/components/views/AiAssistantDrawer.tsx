import React, { useState } from 'react';
import { useMedicalApp } from '../../context/MedicalAppContext';
import { LottieIcon, SparkleIcon } from '../ui/LottieIcon';
import { Search } from 'lucide-react';

export const AiAssistantDrawer: React.FC = () => {
  const { 
    chatMessages, 
    addChatMessage, 
    setUploadedFile, 
    setUploadedFileName 
  } = useMedicalApp();
  
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (!inputText.trim()) return;
    addChatMessage(inputText.trim(), 'user');
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedFile(url);
      setUploadedFileName(file.name);
      addChatMessage(`Attached DICOM study: ${file.name}`, 'user');
    }
  };

  return (
    <div className="flex-1 flex gap-8 w-full max-w-[1360px] mx-auto h-full items-stretch select-none overflow-hidden">
      {/* Left: Ai Assitant Card */}
      <aside className="w-[360px] flex-shrink-0 flex flex-col h-full">
        <div className="bg-white rounded-[32px] border-[3.5px] border-[#8D321F] p-4 shadow-sm h-full flex flex-col justify-between overflow-hidden">
          {/* Header with scaled sparkle icon to 30px */}
          <div className="flex items-center gap-3 px-2 pt-1 pb-3 flex-shrink-0">
            <div className="text-[#8D321F]">
              <SparkleIcon className="w-7 h-7 text-[#8D321F]" />
            </div>
            <h2 className="text-[24px] font-display font-semibold text-[#1F1F1F] tracking-tight">
              Ai Assitant
            </h2>
          </div>

          {/* Chat Feed Body */}
          <div className="flex-1 bg-[#F9F6F6] rounded-[24px] p-4 flex flex-col justify-between overflow-hidden border border-zinc-200/70">
            {/* Scrollable Message List */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 custom-scrollbar flex flex-col justify-start">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed shadow-2xs ${
                      msg.sender === 'user'
                        ? 'bg-[#8D321F] text-white rounded-br-xs'
                        : 'bg-white text-zinc-800 border border-zinc-200 rounded-bl-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-1 px-1 font-mono">
                    {msg.timestamp}
                  </span>
                </div>
              ))}
            </div>

            {/* Bottom Prompt Bar Capsule */}
            <div className="pt-3 flex items-center gap-2.5 flex-shrink-0">
              {/* Upload Trigger Scaled Up to 34px */}
              <label className="cursor-pointer p-2 rounded-full hover:bg-zinc-200/70 transition text-[#8D321F] group">
                <input
                  type="file"
                  accept="image/*,.dicom,.dcm"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <div className="w-8 h-8 flex items-center justify-center group-hover:scale-115 transition-transform">
                  <LottieIcon name="file-upload" size={34} />
                </div>
              </label>

              {/* Search / Text Input Capsule */}
              <div className="flex-1 bg-white border border-[#8D321F]/40 rounded-full px-3.5 py-2 flex items-center shadow-2xs focus-within:ring-1 focus-within:ring-[#8D321F]">
                <Search className="w-4.5 h-4.5 text-zinc-400 mr-2 flex-shrink-0" />
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask assistant..."
                  className="w-full bg-transparent text-[14px] text-zinc-800 placeholder-zinc-400 focus:outline-none"
                />
              </div>

              {/* Send Button Scaled Up to 36px */}
              <button
                onClick={handleSend}
                className="p-2 rounded-full text-[#8D321F] hover:bg-[#8D321F]/10 active:scale-95 transition group"
              >
                <div className="w-9 h-9 flex items-center justify-center group-hover:scale-115 transition-transform">
                  <LottieIcon name="send" size={36} />
                </div>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Right: Workspace Backdrop */}
      <div className="flex-1 bg-[#FAF6F6] rounded-[32px] border border-zinc-200/70 p-6 flex items-center justify-center text-zinc-400 shadow-inner h-full">
        <div className="text-center space-y-2">
          <p className="text-[16px] font-medium text-zinc-400">
            Select a case from the dashboard or launch a new diagnostic scan.
          </p>
        </div>
      </div>
    </div>
  );
};
