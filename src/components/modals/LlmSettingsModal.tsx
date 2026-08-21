import React, { useState } from 'react';
import { useMedicalApp } from '../../context/MedicalAppContext';
import { LlmConfig, LlmProvider } from '../../types';
import { apiService, LlmTestResult } from '../../services/api';
import { SparkleIcon } from '../ui/LottieIcon';
import { X, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, Zap, Sliders, KeyRound, Bot, Globe } from 'lucide-react';

const PROVIDER_PRESETS: Record<LlmProvider, { name: string; defaultModel: string; models: string[]; hint: string }> = {
  gemini: {
    name: 'Google Gemini',
    defaultModel: 'gemini-2.5-flash',
    models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    hint: 'Get your API key from Google AI Studio (aistudio.google.com)'
  },
  anthropic: {
    name: 'Anthropic Claude',
    defaultModel: 'claude-3-7-sonnet-20250219',
    models: ['claude-3-7-sonnet-20250219', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
    hint: 'Get your API key from Anthropic Console (console.anthropic.com)'
  },
  openai: {
    name: 'OpenAI GPT',
    defaultModel: 'gpt-4o',
    models: ['gpt-4o', 'gpt-4o-mini', 'o1-mini', 'gpt-4-turbo'],
    hint: 'Get your API key from OpenAI Platform (platform.openai.com)'
  },
  ollama: {
    name: 'Ollama (Local LLM)',
    defaultModel: 'llama3.2',
    models: ['llama3.2', 'meditron', 'mistral', 'deepseek-r1'],
    hint: 'Ensure Ollama is running locally on http://localhost:11434'
  },
  custom: {
    name: 'Custom Endpoint',
    defaultModel: 'custom-model',
    models: ['custom-v1', 'v1/chat/completions'],
    hint: 'Compatible with OpenAI-standard or vLLM / LiteLLM server endpoints'
  }
};

export const LlmSettingsModal: React.FC = () => {
  const { 
    isLlmSettingsOpen, 
    setIsLlmSettingsOpen, 
    llmConfig, 
    setLlmConfig 
  } = useMedicalApp();

  const [formData, setFormData] = useState<LlmConfig>({ ...llmConfig });
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<LlmTestResult | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isLlmSettingsOpen) return null;

  const handleProviderChange = (provider: LlmProvider) => {
    const preset = PROVIDER_PRESETS[provider];
    setFormData(prev => ({
      ...prev,
      provider,
      modelName: preset.name,
      modelVersion: preset.defaultModel,
      baseUrl: provider === 'ollama' ? 'http://localhost:11434/api/generate' : prev.baseUrl
    }));
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    const result = await apiService.testLlmConnection({
      provider: formData.provider,
      model_version: formData.modelVersion,
      api_key: formData.apiKey,
      base_url: formData.baseUrl
    });

    setTestResult(result);
    setIsTesting(false);
  };

  const handleSave = () => {
    setLlmConfig(formData);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsLlmSettingsOpen(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 select-none">
      {/* Modal Container */}
      <div className="w-full max-w-[760px] bg-white rounded-[32px] border-[2.5px] border-[#1F1F1F] shadow-modal overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="bg-[#8D321F] px-8 py-4 flex items-center justify-between text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-[24px] font-display font-semibold tracking-tight">
              LLM Model & Copilot Settings
            </h2>
            <SparkleIcon className="w-6 h-6 text-white" />
          </div>
          <button
            onClick={() => setIsLlmSettingsOpen(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 active:scale-95 transition"
          >
            <div className="w-6 h-6 border-2 border-white rounded-full flex items-center justify-center p-0.5">
              <X className="w-4 h-4 text-white stroke-[2.5]" />
            </div>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
          {/* Provider Selection Tabs */}
          <div>
            <label className="block text-[14px] font-bold text-zinc-800 mb-2.5 flex items-center gap-2">
              <Bot className="w-4.5 h-4.5 text-[#8D321F]" />
              Select LLM Provider
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
              {(Object.keys(PROVIDER_PRESETS) as LlmProvider[]).map((pKey) => (
                <button
                  key={pKey}
                  type="button"
                  onClick={() => handleProviderChange(pKey)}
                  className={`py-2.5 px-3 rounded-2xl border text-[13px] font-semibold transition-all duration-150 text-center flex flex-col items-center justify-center gap-1 ${
                    formData.provider === pKey
                      ? 'border-[#8D321F] bg-[#8D321F] text-white shadow-sm scale-[1.02]'
                      : 'border-zinc-300 text-zinc-700 bg-zinc-50/50 hover:bg-zinc-100'
                  }`}
                >
                  <span>{PROVIDER_PRESETS[pKey].name.split(' ')[0]}</span>
                  <span className={`text-[10.5px] ${formData.provider === pKey ? 'text-white/80' : 'text-zinc-400'}`}>
                    {pKey === 'ollama' ? 'Local' : pKey === 'custom' ? 'API' : 'Cloud'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Model Name & Version */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13.5px] font-semibold text-zinc-700 mb-1">
                Model Name / Display Label
              </label>
              <input
                type="text"
                value={formData.modelName}
                onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                className="w-full rounded-2xl border border-dashed border-zinc-400 px-4 py-2.5 text-[14px] text-zinc-800 focus:outline-none focus:border-[#8D321F] focus:border-solid bg-zinc-50/50 font-medium"
                placeholder="e.g. Gemini 2.5 Flash"
              />
            </div>

            <div>
              <label className="block text-[13.5px] font-semibold text-zinc-700 mb-1">
                Model Technical ID / Version
              </label>
              <input
                type="text"
                value={formData.modelVersion}
                onChange={(e) => setFormData({ ...formData, modelVersion: e.target.value })}
                className="w-full rounded-2xl border border-dashed border-zinc-400 px-4 py-2.5 text-[14px] text-zinc-800 focus:outline-none focus:border-[#8D321F] focus:border-solid bg-zinc-50/50 font-mono"
                placeholder="e.g. gemini-2.5-flash"
              />
            </div>
          </div>

          {/* Version Quick Presets */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <span className="text-[12px] font-medium text-zinc-400">Presets:</span>
            {PROVIDER_PRESETS[formData.provider].models.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setFormData({ ...formData, modelVersion: m })}
                className={`text-[11.5px] px-3 py-1 rounded-full border transition font-mono ${
                  formData.modelVersion === m
                    ? 'border-[#8D321F] bg-[#8D321F]/10 text-[#8D321F] font-bold'
                    : 'border-zinc-300 text-zinc-600 hover:border-zinc-400 bg-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* API Key Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[13.5px] font-semibold text-zinc-700 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-[#8D321F]" />
                API Key
              </label>
              <span className="text-[11.5px] text-zinc-400">
                {PROVIDER_PRESETS[formData.provider].hint}
              </span>
            </div>
            <div className="relative flex items-center">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                className="w-full rounded-2xl border border-dashed border-zinc-400 px-4 py-2.5 pr-12 text-[14px] text-zinc-800 focus:outline-none focus:border-[#8D321F] focus:border-solid bg-zinc-50/50 font-mono"
                placeholder={formData.provider === 'ollama' ? 'Optional for local Ollama' : 'AIzaSy... or sk-ant-... or sk-...'}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3.5 text-zinc-400 hover:text-zinc-700 transition"
              >
                {showApiKey ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>

          {/* Base URL (for Ollama / Custom) */}
          {(formData.provider === 'ollama' || formData.provider === 'custom') && (
            <div>
              <label className="block text-[13.5px] font-semibold text-zinc-700 mb-1 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-[#8D321F]" />
                Endpoint Base URL
              </label>
              <input
                type="text"
                value={formData.baseUrl || ''}
                onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                className="w-full rounded-2xl border border-dashed border-zinc-400 px-4 py-2.5 text-[14px] text-zinc-800 focus:outline-none focus:border-[#8D321F] focus:border-solid bg-zinc-50/50 font-mono"
                placeholder="http://localhost:11434/api/generate or https://api.custom.com/v1"
              />
            </div>
          )}

          {/* Temperature & System Prompt Presets */}
          <div className="space-y-4 pt-2 border-t border-zinc-200">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[13.5px] font-semibold text-zinc-700 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-[#8D321F]" />
                  Temperature (Creativity / Determinism)
                </label>
                <span className="font-mono text-[13px] font-bold text-[#8D321F]">
                  {formData.temperature}
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                className="w-full accent-[#8D321F]"
              />
              <div className="flex justify-between text-[11px] text-zinc-400 font-mono mt-0.5">
                <span>0.0 (Precise / Clinical)</span>
                <span>0.5 (Balanced)</span>
                <span>1.0 (Creative)</span>
              </div>
            </div>

            <div>
              <label className="block text-[13.5px] font-semibold text-zinc-700 mb-1">
                System Prompt Instructions
              </label>
              <textarea
                rows={2}
                value={formData.systemPrompt}
                onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                className="w-full rounded-2xl border border-dashed border-zinc-400 p-3 text-[13px] text-zinc-800 focus:outline-none focus:border-[#8D321F] focus:border-solid bg-zinc-50/50 leading-relaxed custom-scrollbar"
                placeholder="System instructions for Kitten AI Copilot..."
              />
            </div>
          </div>

          {/* Live Test Diagnostic Banner */}
          {testResult && (
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 text-[13px] animate-in fade-in duration-150 ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="font-bold flex items-center gap-2">
                  {testResult.success ? 'Connection Successful!' : 'Connection Failed'}
                  {testResult.latency_ms && (
                    <span className="font-mono text-xs font-normal text-emerald-700">
                      ({testResult.latency_ms} ms latency)
                    </span>
                  )}
                </div>
                <p className="text-[12.5px] leading-relaxed">
                  {testResult.success ? testResult.sample_reply : testResult.error}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-[#FAF7F6] px-8 py-4 border-t border-zinc-200 flex items-center justify-between flex-shrink-0">
          {/* Test Connection Button */}
          <button
            type="button"
            disabled={isTesting}
            onClick={handleTestConnection}
            className="flex items-center gap-2 py-2.5 px-5 rounded-full border border-zinc-400 text-[14px] font-semibold text-zinc-800 hover:border-[#8D321F] hover:text-[#8D321F] hover:bg-white transition active:scale-95 disabled:opacity-50 shadow-2xs"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#8D321F]" />
                <span>Testing...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-[#8D321F]" />
                <span>Test Connection</span>
              </>
            )}
          </button>

          {/* Right Action Group */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsLlmSettingsOpen(false)}
              className="py-2.5 px-5 rounded-full text-[14px] font-medium text-zinc-600 hover:text-zinc-900 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="bg-[#8D321F] hover:bg-[#7D2A18] text-white py-2.5 px-7 rounded-full font-semibold text-[15px] transition-all duration-150 active:scale-95 shadow-sm hover:shadow"
            >
              {saveSuccess ? 'Saved ✓' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
