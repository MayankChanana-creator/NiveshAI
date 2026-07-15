"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/Navbar';
import Chatbot from '../../components/Chatbot';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import useUser from '@/lib/authClient';
import { 
  ArrowLeft, 
  Check, 
  X, 
  ArrowRight, 
  Target,
  Zap,
  Flame,
  BookOpen,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

const DIFFICULTY_CONFIG = {
  easy:   { label: 'Beginner',     color: '#10b981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', points: 5 },
  medium: { label: 'Intermediate', color: '#38bdf8', bg: 'bg-sky-500/10',     border: 'border-sky-500/20',     text: 'text-sky-400',     points: 10 },
  hard:   { label: 'Advanced',     color: '#a78bfa', bg: 'bg-violet-500/10',  border: 'border-violet-500/20',  text: 'text-violet-400',  points: 20 },
};

export default function QuizzesPage() {
  const { user, isSignedIn } = useUser();
  
  // Quiz state
  const [difficulty, setDifficulty] = useState('medium');
  const [portfolio, setPortfolio] = useState([]);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [history, setHistory] = useState([]); // track correct/wrong per question
  const [sessionStarted, setSessionStarted] = useState(false);

  // Fetch portfolio on mount
  useEffect(() => {
    if (isSignedIn && user) {
      fetchPortfolio();
    }
  }, [isSignedIn, user]);

  const fetchPortfolio = async () => {
    try {
      const userId = encodeURIComponent(user?.sub || '');
      if (!userId) return;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/portfolio/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setPortfolio(data.map(item => ({ symbol: item.symbol, name: item.name, item_type: item.item_type })));
      }
    } catch (err) {
      console.error("Failed to fetch portfolio for quizzes:", err);
    }
  };

  const fetchQuestion = useCallback(async () => {
    setLoading(true);
    setSelectedAnswer(null);
    setIsRevealed(false);
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/learn/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty, portfolio }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setCurrentQuiz(data);
        setQuestionNumber(prev => prev + 1);
      }
    } catch (err) {
      console.error("Quiz fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [difficulty, portfolio]);

  const startSession = () => {
    setSessionStarted(true);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setQuestionNumber(0);
    setHistory([]);
    fetchQuestion();
  };

  const handleAnswer = (answer) => {
    if (isRevealed || !currentQuiz) return;
    setSelectedAnswer(answer);
    setIsRevealed(true);
    
    const isCorrect = answer === currentQuiz.correct_answer;
    const config = DIFFICULTY_CONFIG[difficulty];
    
    if (isCorrect) {
      const multiplier = streak >= 3 ? 2 : 1; // streak bonus
      setScore(prev => prev + config.points * multiplier);
      setStreak(prev => {
        const newStreak = prev + 1;
        if (newStreak > maxStreak) setMaxStreak(newStreak);
        return newStreak;
      });
    } else {
      setStreak(0);
    }
    
    setHistory(prev => [...prev, { correct: isCorrect, topic: currentQuiz.topic }]);
  };

  const getOptionStyle = (option) => {
    if (!isRevealed) {
      return selectedAnswer === option 
        ? 'border-sky-500/50 bg-sky-500/10' 
        : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20';
    }
    
    if (option === currentQuiz?.correct_answer) {
      return 'border-emerald-500/50 bg-emerald-500/10';
    }
    if (option === selectedAnswer && option !== currentQuiz?.correct_answer) {
      return 'border-rose-500/50 bg-rose-500/10';
    }
    return 'border-white/5 bg-white/[0.02] opacity-50';
  };

  const getOptionIcon = (option) => {
    if (!isRevealed) return null;
    if (option === currentQuiz?.correct_answer) {
      return <Check className="w-4 h-4 text-emerald-400" />;
    }
    if (option === selectedAnswer && option !== currentQuiz?.correct_answer) {
      return <X className="w-4 h-4 text-rose-400" />;
    }
    return null;
  };

  const correctCount = history.filter(h => h.correct).length;
  const accuracy = history.length > 0 ? Math.round((correctCount / history.length) * 100) : 0;
  const config = DIFFICULTY_CONFIG[difficulty];

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-24 pb-20 px-4 md:px-8 bg-[#020617] text-white font-sans">
        
        {/* Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-sky-500/5 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="flex items-center gap-4 mb-10">
            <Link href="/Learn" className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-black tracking-tight">Finance Quizzes</h1>
              <p className="text-sm text-slate-400">AI-generated questions tailored to your portfolio</p>
            </div>
          </div>

          {!sessionStarted ? (
            /* ─── SESSION START SCREEN ─── */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Difficulty Selection */}
              <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-8">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Select Difficulty</h2>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(DIFFICULTY_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setDifficulty(key)}
                      className={`p-6 rounded-xl border transition-all text-left ${
                        difficulty === key 
                          ? `${cfg.bg} ${cfg.border} scale-[1.02]` 
                          : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className={`text-lg font-bold mb-1 ${difficulty === key ? cfg.text : 'text-white'}`}>
                        {cfg.label}
                      </div>
                      <div className="text-[11px] text-slate-500">{cfg.points} pts per correct answer</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Portfolio Badge */}
              {portfolio.length > 0 && (
                <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 flex items-center gap-4">
                  <div className="p-3 bg-sky-500/10 rounded-xl">
                    <Target className="w-5 h-5 text-sky-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white">Portfolio-Aware Mode Active</div>
                    <div className="text-xs text-slate-500">{portfolio.length} assets detected — questions will adapt to your holdings</div>
                  </div>
                  <div className="px-3 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-bold uppercase">Active</div>
                </div>
              )}

              {/* Start Button */}
              <button
                onClick={startSession}
                className="w-full py-5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-black text-base shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3"
              >
                <Zap className="w-5 h-5" />
                Start Quiz Session
              </button>
            </motion.div>
          ) : (
            /* ─── QUIZ SESSION ─── */
            <div className="space-y-6">
              
              {/* Stats Bar */}
              <div className="flex items-center gap-3 justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Score</span>
                    <span className="text-lg font-black text-white">{score}</span>
                  </div>
                  <div className="bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Q</span>
                    <span className="text-lg font-black text-white">{questionNumber}</span>
                  </div>
                  <div className="bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Accuracy</span>
                    <span className={`text-lg font-black ${accuracy >= 70 ? 'text-emerald-400' : accuracy >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>{accuracy}%</span>
                  </div>
                </div>
                {streak >= 2 && (
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5"
                  >
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-black text-amber-400">{streak} Streak</span>
                    {streak >= 3 && <span className="text-[9px] text-amber-500 font-bold">2x BONUS</span>}
                  </motion.div>
                )}
              </div>

              {/* Question Card */}
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-white/[0.04] border border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center gap-4"
                  >
                    <div className="w-8 h-8 border-2 border-white/20 border-t-sky-400 rounded-full animate-spin" />
                    <span className="text-sm text-slate-400">Generating question...</span>
                  </motion.div>
                ) : currentQuiz ? (
                  <motion.div
                    key={questionNumber}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  >
                    <div className="bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden">
                      
                      {/* Question Header */}
                      <div className="p-8 pb-6">
                        <div className="flex items-center gap-3 mb-5">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${config.bg} ${config.border} ${config.text} border`}>
                            {config.label}
                          </span>
                          <span className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/5 text-slate-500 border border-white/5">
                            {currentQuiz.topic}
                          </span>
                          {currentQuiz.is_portfolio_based && (
                            <span className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20">
                              Portfolio
                            </span>
                          )}
                        </div>
                        
                        <h2 className="text-xl font-bold text-white leading-relaxed">
                          {currentQuiz.question}
                        </h2>
                      </div>
                      
                      {/* Options */}
                      <div className="px-8 pb-4 space-y-3">
                        {currentQuiz.options?.map((option, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleAnswer(option)}
                            disabled={isRevealed}
                            className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center gap-4 group ${getOptionStyle(option)}`}
                          >
                            <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-slate-400 flex-shrink-0 group-hover:border-white/20 transition-colors">
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span className="text-sm font-medium text-slate-200 flex-1">{option}</span>
                            {getOptionIcon(option)}
                          </button>
                        ))}
                      </div>

                      {/* Explanation (revealed after answering) */}
                      <AnimatePresence>
                        {isRevealed && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="mx-8 mb-6 p-5 rounded-xl bg-white/[0.03] border border-white/5">
                              <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${
                                selectedAnswer === currentQuiz.correct_answer ? 'text-emerald-400' : 'text-rose-400'
                              }`}>
                                {selectedAnswer === currentQuiz.correct_answer ? 'Correct' : 'Incorrect'} — Explanation
                              </div>
                              <p className="text-sm text-slate-300 leading-relaxed">{currentQuiz.explanation}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Next Question Button */}
                      {isRevealed && (
                        <div className="px-8 pb-8">
                          <button
                            onClick={fetchQuestion}
                            className="w-full py-4 rounded-xl bg-white/[0.06] border border-white/10 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                          >
                            Next Question <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {/* Session Progress */}
              {history.length > 0 && (
                <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-slate-500 uppercase font-bold tracking-widest">Session Progress</span>
                    <button 
                      onClick={() => { setSessionStarted(false); }}
                      className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Reset
                    </button>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {history.map((h, i) => (
                      <div
                        key={i}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold border ${
                          h.correct
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        }`}
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Correct</div>
                      <div className="text-lg font-black text-emerald-400">{correctCount}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Best Streak</div>
                      <div className="text-lg font-black text-amber-400">{maxStreak}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Total Points</div>
                      <div className="text-lg font-black text-sky-400">{score}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Chatbot />
    </>
  );
}
