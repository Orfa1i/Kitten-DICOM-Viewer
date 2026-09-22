import React, { useState } from 'react';
import { useMedicalApp } from '../../context/MedicalAppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Activity, ShieldCheck, Database, Building2 } from 'lucide-react';
import DitherEffect2 from '../originkit/ui/dither-effect-2-custom-style344';

export const LoginView: React.FC = () => {
  const { setCurrentScreen, login } = useMedicalApp();
  const [isLogin, setIsLogin] = useState(true);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate authentication process
    setTimeout(() => {
      setIsLoading(false);
      login(isLogin ? (email.split('@')[0] || 'Dr. Mohammad') : name, 'admin');
      setCurrentScreen('dashboard');
    }, 1200);
  };

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center relative overflow-hidden font-inter selection:bg-[#8D321F]/20 selection:text-[#8D321F]">
      
      {/* Top Left GitHub Logo in Black Square */}
        <div className="absolute top-8 left-10 z-50 flex items-center">
          <a href="#" className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shadow-lg hover:bg-zinc-800 transition-colors">
            <img 
              src="/assets/images/github.svg" 
              alt="GitHub Logo" 
              className="w-7 h-7 filter brightness-0 invert" 
            />
          </a>
        </div>

      {/* Background Decorators (Art Deco Geometric Lines) */}
      <div className="absolute inset-0 z-0">
        <DitherEffect2
          background="#ffffff"
          color="#8D321F"
          size={34}
          speed={40}
          scale={42}
        />
      </div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 flex items-center justify-center opacity-10">
        <div className="w-[1200px] h-[1200px] rounded-full border-[1px] border-[#8D321F] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-[0.6] opacity-30" />
        <div className="w-[1200px] h-[1200px] rounded-full border-[1px] border-[#8D321F] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-[0.8] opacity-20" />
        <div className="w-[1200px] h-[1200px] rounded-full border-[1px] border-[#8D321F] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-[1.0] opacity-10" />
      </div>

      

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-[1100px] flex rounded-[40px] shadow-[0_30px_100px_rgba(0,0,0,0.1)] bg-transparent overflow-hidden mx-6 h-[720px] border border-white/40">
        
        {/* Left Side: Branding & Info */}
        <div className="hidden lg:flex w-[45%] bg-[#8D321F] p-12 flex-col justify-between relative overflow-hidden text-white">
          {/* Subtle noise/texture overlay */}
          <div className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />
          
          <div className="relative z-10">
            
            
            <h1 className="text-[38px] font-spartan font-bold leading-[1.15] mb-6">
              Clinical Diagnostic<br />Intelligence
            </h1>
            <p className="text-[16px] text-white/80 leading-relaxed font-light max-w-sm mb-12">
              Empowering radiologists with high-precision AI decision support, multi-modal analysis, and comprehensive reporting.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-[14px] mb-1">State-of-the-Art Accuracy</h4>
                  <p className="text-[13px] text-white/70 leading-relaxed">Multi-ensemble vision models calibrated for definitive triaging.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-[14px] mb-1">HIPAA Compliant Protocol</h4>
                  <p className="text-[13px] text-white/70 leading-relaxed">End-to-end encryption with local DICOM processing capabilities.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-auto flex flex-col items-center text-center">
              <div className="mb-6 w-full flex justify-center">
                <img 
                  src="/assets/images/doctor.gif" 
                  alt="Doctor AI Assistant" 
                  className="w-[300px] max-w-full h-auto object-contain" 
                />
              </div>
              <div className="text-[11.5px] text-white/50 font-spartan tracking-wider uppercase">
                © 2026 Kitten Medical Systems
              </div>
            </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full lg:w-[55%] p-10 md:p-16 flex flex-col justify-center relative bg-white shadow-[-10px_0_40px_rgba(0,0,0,0.05)] overflow-hidden">
          
          <button 
            onClick={() => setCurrentScreen('landing')}
            className="absolute top-8 right-8 text-[13px] font-semibold text-zinc-400 hover:text-[#8D321F] transition-colors"
          >
            &larr; Back to Home
          </button>

          <AnimatePresence>
              {isLogin && (
                <motion.div
                  initial={{ x: -500, opacity: 0 }}
                  animate={{ x: "-50%", opacity: 1 }}
                  exit={{ x: -500, opacity: 0 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="absolute top-12 w-full max-w-[420px] left-1/2 flex justify-center lg:justify-start px-6 lg:px-0"
                >
                  <span className="font-spartan font-bold text-[44px] tracking-tight text-[#8D321F] leading-none mt-[4px]">
                    Kitten
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="max-w-[420px] w-full mx-auto">
            
            
              <div className="mb-10 text-center lg:text-left">
              <h2 className="text-[32px] font-spartan font-bold text-zinc-900 tracking-tight mb-2">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-[15px] text-zinc-500">
                {isLogin 
                  ? 'Access the Kitten Diagnostic Workstation.' 
                  : 'Register your organization for clinical access.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <AnimatePresence mode="popLayout">
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -20 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -20 }}
                    className="space-y-5 overflow-hidden"
                  >
                    <div className="space-y-2">
                      <label className="text-[13px] font-semibold text-zinc-700 font-spartan">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
                        <input 
                          type="text" 
                          required={!isLogin}
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="Dr. Sarah Jenkins"
                          className="w-full pl-11 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-[14px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#8D321F]/20 focus:border-[#8D321F]/50 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-semibold text-zinc-700 font-spartan">Organization</label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
                        <input 
                          type="text" 
                          required={!isLogin}
                          value={organization}
                          onChange={e => setOrganization(e.target.value)}
                          placeholder="General Hospital"
                          className="w-full pl-11 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-[14px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#8D321F]/20 focus:border-[#8D321F]/50 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-zinc-700 font-spartan">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="doctor@hospital.org"
                    className="w-full pl-11 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-[14px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#8D321F]/20 focus:border-[#8D321F]/50 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[13px] font-semibold text-zinc-700 font-spartan">Password</label>
                  {isLogin && (
                    <a href="#" className="text-[12px] font-medium text-[#8D321F] hover:underline">Forgot password?</a>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-[14px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#8D321F]/20 focus:border-[#8D321F]/50 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="relative overflow-hidden w-full bg-gradient-to-b from-[#b34027] to-[#8D321F] text-white py-3.5 mt-4 rounded-xl font-bold text-[15px] transition-all duration-300 active:scale-95 shadow-[0_4px_15px_rgba(141,50,31,0.4),inset_0_1.5px_1px_rgba(255,255,255,0.4)] flex items-center justify-center gap-2 border border-[#d65538]/50 hover:brightness-110 group disabled:opacity-80"
              >
                <div className="absolute top-0 left-0 w-full h-[45%] bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-xl" />
                <span className="relative z-10 flex items-center gap-2 drop-shadow-md">
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{isLogin ? 'Sign In' : 'Register Account'}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-zinc-100 flex items-center justify-center gap-2 text-[14px]">
              <span className="text-zinc-500">
                {isLogin ? "Don't have an account?" : "Already registered?"}
              </span>
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="font-bold text-[#8D321F] hover:underline"
              >
                {isLogin ? 'Create one now' : 'Sign in instead'}
              </button>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

