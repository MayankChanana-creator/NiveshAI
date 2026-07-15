"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Chatbot from "../components/Chatbot";
import { Bot, User, Send, Sparkles, Brain, Trophy, ArrowRight, RotateCcw, Clock, BarChart3, Target } from "lucide-react";

export default function LearnPage() {
  // AI Tutor state
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I'm WealthWise, your AI Financial Tutor. I can help you understand complex financial terms or test your knowledge with interactive quizzes. What would you like to explore today?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [quizFeedback, setQuizFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/learn/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, history: messages }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiResponseText = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        aiResponseText += chunk;
        
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          return [...prev.slice(0, -1), { ...lastMsg, content: aiResponseText }];
        });
      }
    } catch (error) {
      console.error("error:", error);
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const startQuiz = async () => {
    setIsQuizMode(true);
    setIsTyping(true);
    setQuizFeedback(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/learn/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      setCurrentQuiz(data);
    } catch (error) {
      console.error("Quiz Error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuizAnswer = (answer) => {
    if (quizFeedback) return;

    const isCorrect = answer === currentQuiz.correct_answer;
    if (isCorrect) setScore((prev) => prev + 10);
    
    setQuizFeedback({
      isCorrect,
      explanation: currentQuiz.explanation
    });

    setMessages((prev) => [
      ...prev,
      { role: "user", content: `My answer: ${answer}` },
      { role: "assistant", content: isCorrect ? "Excellent! That's correct." : "Not quite. " + currentQuiz.explanation }
    ]);
  };

  const features = [
    {
      title: "What-If Simulator",
      description: "See how different investor personalities — Panic Seller, Calm Investor, Greedy Trader — would have performed on any stock or mutual fund over the past year.",
      href: "/Learn/simulator",
      gradient: "from-violet-500/20 to-fuchsia-500/20",
      borderColor: "border-violet-500/30",
      iconBg: "bg-violet-500/20",
      iconColor: "text-violet-400",
      icon: <BarChart3 className="w-7 h-7" />,
      tags: ["Behaviour Analysis", "Risk Simulation", "Portfolio Comparison"],
    },
    {
      title: "Historical Trade Practice",
      description: "Relive legendary market crashes — 2008 GFC, 2020 Covid, 2021 Crypto Mania, 2024 AI Rush. Trade through real historical data with breaking news alerts.",
      href: "/Learn/historical-replay",
      gradient: "from-sky-500/20 to-indigo-500/20",
      borderColor: "border-sky-500/30",
      iconBg: "bg-sky-500/20",
      iconColor: "text-sky-400",
      icon: <Clock className="w-7 h-7" />,
      tags: ["Live Replay", "Real Data", "Performance Scoring"],
    },
    {
      title: "AI Quizzes",
      description: "Test your financial knowledge with AI-generated questions that adapt to your portfolio. Earn points, build streaks, and track your learning progress.",
      href: "/Learn/quizzes",
      gradient: "from-amber-500/20 to-orange-500/20",
      borderColor: "border-amber-500/30",
      iconBg: "bg-amber-500/20",
      iconColor: "text-amber-400",
      icon: <Target className="w-7 h-7" />,
      tags: ["AI Generated", "Portfolio Aware", "Streak Rewards"],
    }
  ];

  return (
    <div className="min-h-screen bg-[#0b0b12] text-slate-200 overflow-hidden">
      <Navbar />

      {/* Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <main className="max-w-7xl mx-auto px-6 pt-24 pb-12 relative z-10">
        
        {/* Page Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3">
            Learn & Practice
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Master the markets through AI-powered learning, behaviour simulation, and historical trade practice.
          </p>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={feature.href} className="block group">
                <div className={`bg-white/5 backdrop-blur-xl border ${feature.borderColor} rounded-3xl p-8 relative overflow-hidden transition-all duration-300 hover:bg-white/[0.08] hover:scale-[1.01]`}>
                  {/* Gradient glow */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  
                  {/* Top accent line */}
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-5">
                      <div className={`p-3 ${feature.iconBg} rounded-2xl ${feature.iconColor}`}>
                        {feature.icon}
                      </div>
                      <h3 className="text-xl font-bold text-white group-hover:text-sky-300 transition-colors">{feature.title}</h3>
                    </div>
                    
                    <p className="text-sm text-slate-400 leading-relaxed mb-6">{feature.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-6">
                      {feature.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/5 text-slate-400 border border-white/5">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 text-sm font-bold text-sky-400 group-hover:text-sky-300 transition-colors">
                      Launch Feature
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* AI Tutor Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-sky-500/20 rounded-2xl border border-sky-500/30">
              <Brain className="w-7 h-7 text-sky-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">AI Personal Tutor</h2>
              <p className="text-sm text-slate-400">Master finance with RAG-powered intelligence</p>
            </div>
            <div className="ml-auto flex items-center gap-4 bg-white/5 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/10">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span className="text-lg font-bold text-white leading-none">{score} <span className="text-xs font-normal text-slate-400 ml-1 uppercase tracking-widest">Points</span></span>
            </div>
          </div>

          <div className="flex gap-6 min-h-0" style={{ height: '520px' }}>
            
            {/* Main Chat Interface */}
            <div className="flex-1 flex flex-col bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] overflow-hidden shadow-2xl">
              
              {/* Messages Area */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
              >
                <AnimatePresence>
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex items-start gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                      <div className={`p-2.5 rounded-xl ${msg.role === "user" ? "bg-sky-500/20 text-sky-400" : "bg-white/10 text-slate-300"} border border-white/5 flex-shrink-0`}>
                        {msg.role === "user" ? <User size={18} /> : <Bot size={18} />}
                      </div>
                      <div className={`max-w-[75%] p-4 rounded-2xl leading-relaxed text-sm shadow-lg
                        ${msg.role === "user" 
                          ? "bg-sky-600/80 text-white rounded-tr-none" 
                          : "bg-white/10 text-slate-200 border border-white/5 rounded-tl-none"}
                      `}>
                        {msg.content || (isTyping && i === messages.length - 1 ? (
                          <span className="flex gap-1 py-1">
                            <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" />
                          </span>
                        ) : msg.content)}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Input Area */}
              <div className="p-6 bg-black/20 border-t border-white/5">
                <div className="flex gap-4 relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                    placeholder={isQuizMode ? "Reply to the quiz or ask a question..." : "Ask me anything about finance..."}
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500/50 transition-all font-medium text-sm pr-16"
                  />
                  <button 
                    onClick={handleSend}
                    disabled={isTyping}
                    className="absolute right-2 top-2 p-2.5 bg-sky-500 text-white rounded-xl hover:bg-sky-400 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
                  >
                    <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Side Panel */}
            <div className="w-80 flex flex-col gap-6">
              
              {/* Quiz Mode Card */}
              <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-indigo-500/20 rounded-xl">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Daily Quiz</h3>
                </div>

                {currentQuiz && !quizFeedback ? (
                  <div className="space-y-4">
                    <p className="text-sm font-semibold text-slate-100 leading-snug">{currentQuiz.question}</p>
                    <div className="space-y-2">
                      {currentQuiz.options.map((option, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleQuizAnswer(option)}
                          className="w-full text-left p-3 text-xs font-bold rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-indigo-500/50 transition-all"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : quizFeedback ? (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-2xl flex items-center justify-center font-black uppercase tracking-widest text-sm
                      ${quizFeedback.isCorrect ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                      {quizFeedback.isCorrect ? "Correct!" : "Incorrect"}
                    </div>
                    <button 
                      onClick={startQuiz}
                      className="w-full py-4 rounded-2xl bg-white/10 text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-white/20 transition-all"
                    >
                      <RotateCcw size={14} /> Next Question
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                    <p className="text-xs text-slate-400 mb-6">Ready to test your knowledge today?</p>
                    <button 
                      onClick={startQuiz}
                      className="w-full py-4 rounded-2xl bg-indigo-500 text-white font-black text-sm shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      START QUIZ
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Suggestions */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 flex-1">
                <h4 className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black mb-4">Suggestion Box</h4>
                <div className="space-y-3">
                  {[
                    "What is SIP?",
                    "Explain Dividends",
                    "Bull vs Bear Market",
                    "Asset Allocation tips"
                  ].map((s, i) => (
                    <button 
                      key={i}
                      onClick={() => { setInput(s); }}
                      className="w-full text-left px-4 py-3 text-[11px] font-bold text-slate-400 rounded-xl bg-white/5 border border-white/5 hover:border-sky-500/30 hover:text-sky-300 transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      <Chatbot />

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
