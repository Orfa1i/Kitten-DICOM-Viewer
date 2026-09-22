import React, { useState } from 'react';
import { useMedicalApp } from '../../context/MedicalAppContext';
import { X, User, Mail, Camera, Save } from 'lucide-react';
import { SparkleIcon } from '../ui/LottieIcon';

export const ProfileManagementModal: React.FC = () => {
  const { isProfileModalOpen, setIsProfileModalOpen, userProfile, setUserProfile } = useMedicalApp();
  
  const [formData, setFormData] = useState({
    name: userProfile?.name || 'Dr.Mohammad',
    email: userProfile?.email || 'Dr-Mohamad@kitten.medical',
    avatar: userProfile?.avatar || '/assets/images/doctor_avatar.jpg'
  });
  
  const [saveSuccess, setSaveSuccess] = useState(false);

  React.useEffect(() => {
    if (isProfileModalOpen && userProfile) {
      setFormData(userProfile);
    }
  }, [isProfileModalOpen, userProfile]);

  if (!isProfileModalOpen) return null;

  const handleSave = () => {
    setUserProfile(formData);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsProfileModalOpen(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-lg animate-in fade-in duration-500">
      
      {/* Vibrant blurred colorful shapes for glass enhancement */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-rose-500/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-1/3 right-1/3 w-[600px] h-[600px] bg-[#8D321F]/30 rounded-full blur-[140px] pointer-events-none mix-blend-screen" />

      {/* Frosted glass container */}
      <div className="relative w-full max-w-[420px] overflow-hidden rounded-[32px] border border-white/10 bg-white/10 backdrop-blur-2xl shadow-[0_16px_40px_rgba(0,0,0,0.5),inset_0_1.5px_2px_rgba(255,255,255,0.25)] animate-in zoom-in-95 duration-400 flex flex-col font-outfit text-white">
        
        {/* Subtle top inner light glare for the entire modal */}
        <div className="absolute top-0 left-0 w-full h-[150px] bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="px-8 py-7 flex items-center justify-between border-b border-white/10 bg-white/5 relative z-10">
          <div>
            <h2 className="text-[22px] font-display font-semibold tracking-tight flex items-center gap-2.5 text-white">
              <SparkleIcon className="w-5 h-5 text-rose-300 drop-shadow-[0_0_12px_rgba(251,113,133,0.8)]" />
              Profile Customization
            </h2>
            <p className="text-[13px] text-white/60 mt-1 font-light tracking-wide">Manage your professional identity</p>
          </div>
          {/* Circular Jelly Button for Close */}
          <button
            onClick={() => setIsProfileModalOpen(false)}
            className="relative overflow-hidden bg-gradient-to-b from-white/20 to-white/5 text-white/80 hover:text-white w-9 h-9 rounded-full font-medium transition-all duration-300 active:scale-95 shadow-[0_4px_10px_rgba(0,0,0,0.2),inset_0_2px_2px_rgba(255,255,255,0.3)] flex items-center justify-center border border-white/20 hover:bg-white/10 group"
          >
            <div className="absolute top-0 left-0 w-full h-[45%] bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-full" />
            <span className="relative z-10 flex items-center justify-center">
              <X className="w-4 h-4 drop-shadow-md" />
            </span>
          </button>
        </div>

        {/* Body */}
        <div className="p-8 flex flex-col gap-8 relative z-10">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div 
              className="relative group cursor-pointer" 
              onClick={() => document.getElementById('avatar-upload')?.click()}
            >
              <input 
                id="avatar-upload"
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      if (event.target?.result) {
                        setFormData({ ...formData, avatar: event.target.result as string });
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              
              {/* Premium Gradient Ring */}
              <div className="w-[116px] h-[116px] rounded-full p-[3px] bg-gradient-to-tr from-[#8D321F]/80 via-rose-400/60 to-indigo-500/60 shadow-[0_0_20px_rgba(251,113,133,0.2),inset_0_2px_4px_rgba(255,255,255,0.4)] group-hover:scale-105 transition-transform duration-300 ease-out relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-full" />
                <div className="w-full h-full rounded-full bg-black/40 p-1 backdrop-blur-md relative z-10">
                  <img 
                    src={formData.avatar} 
                    alt="Profile Avatar" 
                    className="w-full h-full rounded-full object-cover border border-white/20"
                  />
                </div>
              </div>

              {/* Glass Overlay on Hover */}
              <div 
                className="absolute inset-[4px] bg-black/60 backdrop-blur-md rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 border border-white/10 shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]"
                title="Click to Upload Avatar"
              >
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-t-full" />
                <Camera className="w-7 h-7 text-white/90 drop-shadow-md mb-1 relative z-10" />
                <span className="text-[10px] font-medium text-white/80 tracking-wider relative z-10">CHANGE</span>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-white/70 ml-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-rose-300/80" /> Display Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-3.5 text-[15px] text-white placeholder:text-white/30 focus:outline-none focus:border-rose-400/50 focus:bg-white/5 focus:ring-4 focus:ring-rose-500/15 transition-all shadow-[inset_0_2px_6px_rgba(0,0,0,0.3),0_1px_1px_rgba(255,255,255,0.05)]"
                  placeholder="Enter your name"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-white/70 ml-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-rose-300/80" /> Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-3.5 text-[15px] text-white placeholder:text-white/30 focus:outline-none focus:border-rose-400/50 focus:bg-white/5 focus:ring-4 focus:ring-rose-500/15 transition-all shadow-[inset_0_2px_6px_rgba(0,0,0,0.3),0_1px_1px_rgba(255,255,255,0.05)]"
                  placeholder="doctor@medical.com"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-white/10 bg-black/20 flex justify-end gap-4 relative z-10">
          
          

          {/* Neutral Jelly Button for Cancel */}
          <button
            type="button"
            onClick={() => setIsProfileModalOpen(false)}
            className="relative overflow-hidden bg-gradient-to-b from-white/10 to-white/5 text-white/90 py-2.5 px-6 rounded-full font-medium text-[14px] transition-all duration-300 active:scale-95 shadow-[0_8px_20px_rgba(0,0,0,0.2),inset_0_2px_2px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2 border border-white/20 hover:bg-white/10 group"
          >
            <div className="absolute top-0 left-0 w-full h-[45%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-t-full" />
            <span className="relative z-10 flex items-center gap-2">
              Cancel
            </span>
          </button>
          
          {/* Red Jelly Button for Save Changes */}
          <button
            type="button"
            onClick={handleSave}
            className="relative overflow-hidden bg-gradient-to-b from-[#b34027] to-[#8D321F] text-white py-2.5 px-8 rounded-full font-semibold text-[14px] transition-all duration-300 active:scale-95 shadow-[0_8px_20px_rgba(141,50,31,0.5),inset_0_2px_2px_rgba(255,255,255,0.5)] flex items-center gap-2 border border-[#d65538]/50 hover:brightness-110 group"
          >
            {/* Extremely pronounced top inner glow/glare */}
            <div className="absolute top-0 left-0 w-full h-[45%] bg-gradient-to-b from-white/40 to-transparent pointer-events-none rounded-t-full" />
            <span className="relative z-10 flex items-center gap-2 drop-shadow-md">
              {saveSuccess ? 'Saved ✓' : <><Save className="w-4 h-4" /> Save Changes</>}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};


