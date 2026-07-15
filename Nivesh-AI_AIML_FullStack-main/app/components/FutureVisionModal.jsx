"use client";
import React, { useState, useEffect } from "react";

export default function FutureVisionModal({ isOpen, onClose, children }) {
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState("Running AI prediction models…");
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setLoading(true);
      setLoadingProgress(0);
      return;
    }
    
    const texts = [
      "Running AI prediction models…",
      "Analyzing historical patterns…",
      "Calculating probability scenarios…",
      "Generating trade predictions…"
    ];
    let textIdx = 0;

    const textInterval = setInterval(() => {
      textIdx = (textIdx + 1) % texts.length;
      setLoadingText(texts[textIdx]);
    }, 1200);

    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => Math.min(prev + 2, 100));
    }, 80);

    const timeout = setTimeout(() => {
      setLoading(false);
      clearInterval(textInterval);
      clearInterval(progressInterval);
    }, 4000);

    return () => {
      clearInterval(textInterval);
      clearInterval(progressInterval);
      clearTimeout(timeout);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={onClose}>
      <div 
        className="bg-gradient-to-br from-[#0a0e1a] via-[#0d1225] to-[#0b0f1e] border border-cyan-700/30 rounded-2xl shadow-[0_0_80px_rgba(34,211,238,0.12),0_0_30px_rgba(139,92,246,0.1)] overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col relative"
        style={{ width: '80vw', height: '80vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-cyan-800/30 flex justify-between items-center bg-gradient-to-r from-[#111827] via-[#0f172a] to-[#111827] relative overflow-hidden">
          {/* Animated gradient line at top */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
          
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">
              Trade Prediction
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">AI-Powered Market Analysis</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-white/10 p-2.5 rounded-xl transition-all duration-200 hover:rotate-90"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto w-full p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-8">
              {/* Animated orb */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                  <div className="w-20 h-20 border-[3px] border-cyan-900/30 border-t-cyan-400 rounded-full animate-spin"></div>
                  <div className="w-14 h-14 border-[3px] border-purple-900/30 border-b-purple-400 rounded-full animate-spin absolute" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                  <div className="w-8 h-8 border-[3px] border-emerald-900/30 border-t-emerald-400 rounded-full animate-spin absolute" style={{ animationDuration: '2s' }}></div>
                </div>
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-full bg-cyan-400/10 blur-xl animate-pulse"></div>
              </div>
              
              {/* Progress bar */}
              <div className="w-64">
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 rounded-full transition-all duration-200 ease-out"
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">{loadingProgress}%</p>
              </div>

              <div className="text-lg font-medium text-cyan-200/80 animate-pulse text-center px-4 tracking-wide">
                {loadingText}
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in duration-700 w-full">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
