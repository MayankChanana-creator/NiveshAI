"use client";

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Chatbot from '../components/Chatbot';
import Link from 'next/link';
import useUser from '@/lib/authClient';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Wallet,
  TrendingUp,
  PieChart,
  Target,
  ChevronRight,
  AlertCircle,
  Check,
  RefreshCw,
  Camera,
  Loader2,
  Save,
} from 'lucide-react';

import {
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

const STEPS = ['income', 'expenses', 'profile', 'analyzing', 'results'];

const EXPENSE_PRESETS = [
  { name: 'Rent', amount: '', is_fixed: true },
  { name: 'Groceries', amount: '', is_fixed: false },
  { name: 'EMI / Loan', amount: '', is_fixed: true },
  { name: 'Electricity', amount: '', is_fixed: true },
  { name: 'Internet / Mobile', amount: '', is_fixed: true },
  { name: 'Transport / Fuel', amount: '', is_fixed: false },
  { name: 'Dining Out', amount: '', is_fixed: false },
  { name: 'Subscriptions', amount: '', is_fixed: true },
  { name: 'Shopping / Clothing', amount: '', is_fixed: false },
  { name: 'Health / Medical', amount: '', is_fixed: false },
];

const PIE_COLORS = ['#38bdf8', '#a78bfa', '#fbbf24', '#f43f5e', '#10b981', '#f97316', '#6366f1'];
const ALLOC_COLORS = ['#10b981', '#38bdf8', '#fbbf24', '#f43f5e', '#a78bfa'];

export default function WealthPilotPage() {
  const { user, isSignedIn, isLoading } = useUser();
  const [step, setStep] = useState('income');
  const [portfolio, setPortfolio] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [ocrSuccessMsg, setOcrSuccessMsg] = useState(null);

  // Income state
  const [incomes, setIncomes] = useState([{ name: 'Salary', amount: '', frequency: 'monthly' }]);

  // Expense state
  const [expenses, setExpenses] = useState(EXPENSE_PRESETS.map(e => ({ ...e })));

  // Profile state
  const [riskProfile, setRiskProfile] = useState('moderate');
  const [age, setAge] = useState(25);
  const [savingsGoal, setSavingsGoal] = useState('');

  // Results
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isSignedIn && user) {
      fetchPortfolio();
      fetchWealthPilotData();
    } else if (!isLoading) {
      setIsInitialLoading(false);
    }
  }, [isSignedIn, user, isLoading]);

  const fetchWealthPilotData = async () => {
    setIsInitialLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wealth-pilot/data/${user.sub}`);
      if (res.ok) {
        const data = await res.json();
        if (data.incomes && data.incomes.length > 0) setIncomes(data.incomes);
        if (data.expenses && data.expenses.length > 0) setExpenses(data.expenses);
        if (data.profile) {
          if (data.profile.age) setAge(data.profile.age);
          if (data.profile.risk_profile) setRiskProfile(data.profile.risk_profile);
          if (data.profile.savings_goal) setSavingsGoal(data.profile.savings_goal);
        }
      }
    } catch (err) {
      console.error("Failed to load WealthPilot data", err);
    } finally {
      setIsInitialLoading(false);
    }
  };

  const fetchPortfolio = async () => {
    try {
      const userId = encodeURIComponent(user?.sub || '');
      if (!userId) return;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/portfolio/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setPortfolio(data.map(i => ({ symbol: i.symbol, name: i.name, item_type: i.item_type })));
      }
    } catch (err) {
      console.error("Portfolio fetch failed:", err);
    }
  };

  const addIncome = () => setIncomes([...incomes, { name: '', amount: '', frequency: 'monthly' }]);
  const removeIncome = (i) => setIncomes(incomes.filter((_, idx) => idx !== i));
  const updateIncome = (i, field, val) => {
    const copy = [...incomes];
    copy[i][field] = val;
    setIncomes(copy);
  };

  const addExpense = () => setExpenses([...expenses, { name: '', amount: '', is_fixed: false }]);
  const removeExpense = (i) => setExpenses(expenses.filter((_, idx) => idx !== i));
  const updateExpense = (i, field, val) => {
    const copy = [...expenses];
    copy[i][field] = val;
    setExpenses(copy);
  };

  const runAnalysis = async () => {
    setStep('analyzing');
    setError(null);
    try {
      const validIncomes = incomes.filter(i => i.name && Number(i.amount) > 0).map(i => ({ ...i, amount: Number(i.amount) }));
      const validExpenses = expenses.filter(e => e.name && Number(e.amount) > 0).map(e => ({ ...e, amount: Number(e.amount) }));

      if (validIncomes.length === 0) throw new Error("Please add at least one income source");
      if (validExpenses.length === 0) throw new Error("Please add at least one expense");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wealth-pilot/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          income_sources: validIncomes,
          expenses: validExpenses,
          risk_profile: riskProfile,
          age,
          savings_goal: Number(savingsGoal) || 0,
          portfolio,
        }),
      });

      if (!res.ok) throw new Error("Analysis failed");
      const data = await res.json();
      setResult(data);
      setStep('results');
    } catch (err) {
      setError(err.message);
      setStep('profile');
    }
  };

  const canProceed = () => {
    if (isInitialLoading) return false;
    if (step === 'income') return incomes.some(i => i.name && Number(i.amount) > 0);
    if (step === 'expenses') return expenses.some(e => e.name && Number(e.amount) > 0);
    return true;
  };

  const saveData = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wealth-pilot/save/${user.sub}`, {
         method: 'POST',
         headers: {'Content-Type': 'application/json'},
         body: JSON.stringify({
            profile: { age: Number(age), risk_profile: riskProfile, savings_goal: Number(savingsGoal)||0 },
            incomes: incomes.filter(i => i.name),
            expenses: expenses.filter(e => e.name)
         })
      });
      setSaveMessage('Progress saved');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch(err) {
      console.error("Save failed", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOcrUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setOcrLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
       const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wealth-pilot/ocr-scan`, {
         method: 'POST',
         body: formData
       });
       if(res.ok) {
         const data = await res.json();
         const merchantName = data.merchant && data.merchant !== 'unknown' ? data.merchant : 'Receipt';
         setExpenses(prev => [...prev, {
            name: merchantName,
            amount: data.amount || '',
            category: data.category || '',
            is_fixed: false,
            source: 'ocr',
            merchant: data.merchant,
            expense_date: data.date
         }]);
         setOcrSuccessMsg(`Successfully added ₹${data.amount || 0} from ${merchantName}`);
         setTimeout(() => setOcrSuccessMsg(null), 4000);
       }
    } catch(err) {
       console.error("OCR upload failed", err);
    } finally {
       setOcrLoading(false);
       e.target.value = null;
    }
  };

  const nextStep = () => {
    if (['income', 'expenses'].includes(step)) saveData();
    const idx = STEPS.indexOf(step);
    if (step === 'profile') { runAnalysis(); return; }
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  };
  const prevStep = () => {
    if (['expenses', 'profile'].includes(step)) saveData();
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-24 pb-20 px-4 md:px-8 bg-[#020617] text-white font-sans">
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 right-1/3 w-[400px] h-[400px] bg-sky-500/5 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8 relative">
            {saveMessage && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="absolute -top-12 right-0 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2">
                <Check className="w-3.5 h-3.5" /> {saveMessage}
              </motion.div>
            )}
            <Link href="/Portfolio" className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-black tracking-tight">WealthPilot</h1>
              <p className="text-sm text-slate-400">AI-powered income tracker, budget planner & investment engine</p>
            </div>
            {isInitialLoading && (
              <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2 text-xs text-sky-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading data...
              </div>
            )}
            {isSaving && (
              <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
              </div>
            )}
          </div>

          {/* Progress Steps */}
          {step !== 'results' && step !== 'analyzing' && (
            <div className="flex items-center gap-2 mb-10">
              {['income', 'expenses', 'profile'].map((s, i) => (
                <React.Fragment key={s}>
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                      step === s
                        ? 'bg-sky-500/20 border border-sky-500/30 text-sky-400'
                        : STEPS.indexOf(step) > i
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                          : 'bg-white/[0.03] border border-white/10 text-slate-500'
                    }`}
                  >
                    {STEPS.indexOf(step) > i ? <Check className="w-3.5 h-3.5" /> : <span>{i + 1}</span>}
                    {s === 'income' ? 'Income' : s === 'expenses' ? 'Expenses' : 'Profile'}
                  </div>
                  {i < 2 && <ChevronRight className="w-4 h-4 text-slate-600" />}
                </React.Fragment>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* ─── STEP 1: INCOME ─── */}
            {step === 'income' && (
              <motion.div key="income" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
                <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Wallet className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-lg font-bold">Income Sources</h2>
                  </div>
                  <div className="space-y-4">
                    {incomes.map((inc, i) => (
                      <div key={i} className="flex gap-3 items-center">
                        <input
                          type="text" value={inc.name}
                          onChange={(e) => updateIncome(i, 'name', e.target.value)}
                          placeholder="Source name"
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sky-500 transition-colors"
                        />
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₹</span>
                          <input
                            type="number" value={inc.amount}
                            onChange={(e) => updateIncome(i, 'amount', e.target.value)}
                            placeholder="Amount"
                            className="w-40 bg-white/5 border border-white/10 rounded-xl pl-7 pr-4 py-3 text-sm focus:outline-none focus:border-sky-500 transition-colors"
                          />
                        </div>
                        <select
                          value={inc.frequency}
                          onChange={(e) => updateIncome(i, 'frequency', e.target.value)}
                          className="bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-sky-500 transition-colors"
                        >
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                          <option value="weekly">Weekly</option>
                        </select>
                        {incomes.length > 1 && (
                          <button onClick={() => removeIncome(i)} className="p-2 rounded-lg hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button onClick={addIncome} className="mt-4 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add Source
                  </button>
                </div>
              </motion.div>
            )}

            {/* ─── STEP 2: EXPENSES ─── */}
            {step === 'expenses' && (
              <motion.div key="expenses" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
                
                {/* AI OCR Scanner Box */}
                <div className="bg-gradient-to-r from-indigo-500/10 to-sky-500/10 border border-sky-500/20 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
                    <Camera className="w-48 h-48 -mt-8 -mr-8" />
                  </div>
                  <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-sky-300 flex items-center gap-2"><Camera className="w-5 h-5" /> Smart Receipt Scanner</h3>
                      <p className="text-sm text-slate-400 mt-1 max-w-md">Snap a photo of your receipt, bill, or bank SMS and our AI will automatically parse and track the expense.</p>
                    </div>
                    <div className="shrink-0 relative">
                      <input 
                        type="file" accept="image/*" id="ocr-upload"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        onChange={handleOcrUpload}
                        disabled={ocrLoading}
                      />
                      <label htmlFor="ocr-upload" className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${ocrLoading ? 'bg-slate-800 text-slate-400' : 'bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20'}`}>
                        {ocrLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing AI...</> : <><Camera className="w-5 h-5" /> Upload Image</>}
                      </label>
                    </div>
                  </div>
                </div>

                {/* AI OCR Success Notification */}
                <AnimatePresence>
                  {ocrSuccessMsg && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0, scale: 0.9 }} 
                      animate={{ opacity: 1, height: 'auto', scale: 1 }} 
                      exit={{ opacity: 0, height: 0, scale: 0.9 }} 
                      className="overflow-hidden"
                    >
                      <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl flex items-center gap-3 font-medium text-sm shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                        <div className="p-1.5 bg-emerald-500/20 rounded-full">
                          <Check className="w-5 h-5 text-emerald-400" />
                        </div>
                        {ocrSuccessMsg}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-8">
                  <div className="flex items-center gap-3 mb-2">
                    <PieChart className="w-5 h-5 text-rose-400" />
                    <h2 className="text-lg font-bold">Monthly Expenses</h2>
                  </div>
                  <p className="text-xs text-slate-500 mb-6">Fill in the ones that apply. Leave amount empty to skip.</p>
                  <div className="space-y-3">
                    {expenses.map((exp, i) => (
                      <div key={i} className="flex gap-3 items-center">
                        <input
                          type="text" value={exp.name}
                          onChange={(e) => updateExpense(i, 'name', e.target.value)}
                          placeholder="Expense name"
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sky-500 transition-colors"
                        />
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₹</span>
                          <input
                            type="number" value={exp.amount}
                            onChange={(e) => updateExpense(i, 'amount', e.target.value)}
                            placeholder="₹ Amount"
                            className="w-36 bg-white/5 border border-white/10 rounded-xl pl-7 pr-4 py-3 text-sm focus:outline-none focus:border-sky-500 transition-colors"
                          />
                        </div>
                        <button
                          onClick={() => updateExpense(i, 'is_fixed', !exp.is_fixed)}
                          className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${
                            exp.is_fixed
                              ? 'bg-sky-500/10 border-sky-500/20 text-sky-400'
                              : 'bg-white/5 border-white/10 text-slate-500'
                          }`}
                        >
                          {exp.is_fixed ? 'Fixed' : 'Variable'}
                        </button>
                        <button onClick={() => removeExpense(i)} className="p-2 rounded-lg hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button onClick={addExpense} className="mt-4 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add Expense
                  </button>
                </div>
              </motion.div>
            )}

            {/* ─── STEP 3: PROFILE ─── */}
            {step === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
                <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Target className="w-5 h-5 text-violet-400" />
                    <h2 className="text-lg font-bold">Your Financial Profile</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2 block">Age</label>
                      <input type="number" value={age} onChange={(e) => setAge(Number(e.target.value))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sky-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2 block">Monthly Savings Goal (optional)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₹</span>
                        <input type="number" value={savingsGoal} onChange={(e) => setSavingsGoal(e.target.value)} placeholder="0"
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-7 pr-4 py-3 text-sm focus:outline-none focus:border-sky-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-3 block">Risk Profile</label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { id: 'conservative', label: 'Conservative', desc: 'Safety first, steady returns', color: 'sky' },
                        { id: 'moderate', label: 'Moderate', desc: 'Balanced risk and growth', color: 'violet' },
                        { id: 'aggressive', label: 'Aggressive', desc: 'High growth, higher risk', color: 'rose' },
                      ].map(r => (
                        <button
                          key={r.id}
                          onClick={() => setRiskProfile(r.id)}
                          className={`p-5 rounded-xl border text-left transition-all ${
                            riskProfile === r.id
                              ? `bg-${r.color}-500/10 border-${r.color}-500/30`
                              : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.04]'
                          }`}
                        >
                          <div className={`text-sm font-bold mb-1 ${riskProfile === r.id ? `text-${r.color}-400` : 'text-white'}`}>{r.label}</div>
                          <div className="text-[11px] text-slate-500">{r.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {portfolio.length > 0 && (
                    <div className="mt-6 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center gap-3">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs text-emerald-300">{portfolio.length} portfolio assets will be included in the analysis</span>
                    </div>
                  )}

                  {error && (
                    <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-400 text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ─── ANALYZING ─── */}
            {step === 'analyzing' && (
              <motion.div key="analyzing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-24 gap-6">
                <div className="w-16 h-16 border-3 border-white/10 border-t-sky-400 rounded-full animate-spin" />
                <h2 className="text-xl font-bold">Analyzing your finances...</h2>
                <p className="text-sm text-slate-400 max-w-md text-center">WealthPilot is categorizing expenses, generating a budget plan, and building your investment allocation.</p>
              </motion.div>
            )}

            {/* ─── RESULTS ─── */}
            {step === 'results' && result && (
              <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {/* Headline */}
                <div className="bg-gradient-to-r from-sky-500/10 to-indigo-500/10 border border-sky-500/20 rounded-2xl p-6 text-center">
                  <p className="text-lg font-bold text-sky-300">{result.headline || "Your financial analysis is ready"}</p>
                </div>

                {/* Summary Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Monthly Income', val: `₹${result.summary?.total_income?.toLocaleString() || 0}`, color: 'text-emerald-400' },
                    { label: 'Monthly Expenses', val: `₹${result.summary?.total_expenses?.toLocaleString() || 0}`, color: 'text-rose-400' },
                    { label: 'Monthly Surplus', val: `₹${result.summary?.surplus?.toLocaleString() || 0}`, color: result.summary?.surplus >= 0 ? 'text-sky-400' : 'text-rose-400' },
                    { label: 'Health Score', val: `${result.expense_analysis?.expense_health_score || 0}/100`, color: 'text-amber-400' },
                  ].map((s, i) => (
                    <div key={i} className="bg-white/[0.04] border border-white/10 rounded-xl p-5">
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">{s.label}</div>
                      <div className={`text-xl font-black ${s.color}`}>{s.val}</div>
                    </div>
                  ))}
                </div>

                {/* Expense Breakdown */}
                <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-8">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><PieChart className="w-5 h-5 text-sky-400" /> Expense Analysis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPie>
                          <Pie
                            data={result.expense_analysis?.categories?.filter(c => c.amount > 0) || []}
                            dataKey="amount"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            innerRadius={50}
                            strokeWidth={2}
                            stroke="#0f172a"
                          >
                            {(result.expense_analysis?.categories || []).filter(c => c.amount > 0).map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                            formatter={(val) => [`₹${Number(val).toLocaleString()}`, '']}
                          />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-3">
                      {result.expense_analysis?.categories?.filter(c => c.amount > 0).map((cat, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="text-sm font-medium">{cat.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold">₹{cat.amount?.toLocaleString()}</span>
                            <span className="text-[10px] text-slate-500 ml-2">{cat.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Insights */}
                  {result.expense_analysis?.insights?.length > 0 && (
                    <div className="mt-6 space-y-2">
                      <h4 className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-3">AI Insights</h4>
                      {result.expense_analysis.insights.map((insight, i) => (
                        <div key={i} className="p-3 rounded-xl bg-sky-500/5 border border-sky-500/10 text-sm text-sky-200">
                          {insight}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Budget Plan */}
                <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-8">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Wallet className="w-5 h-5 text-emerald-400" /> AI Budget Plan</h3>

                  {/* Monthly Targets Bar */}
                  {result.budget_plan?.monthly_targets && (
                    <div className="mb-8">
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                            { name: 'Needs', amount: result.budget_plan.monthly_targets.needs || 0 },
                            { name: 'Wants', amount: result.budget_plan.monthly_targets.wants || 0 },
                            { name: 'Savings', amount: result.budget_plan.monthly_targets.savings || 0 },
                            { name: 'Investments', amount: result.budget_plan.monthly_targets.investments || 0 },
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                            <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                            <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
                            <Tooltip
                              contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                              formatter={(val) => [`₹${Number(val).toLocaleString()}`, '']}
                            />
                            <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                              {['#38bdf8', '#a78bfa', '#10b981', '#fbbf24'].map((c, i) => <Cell key={i} fill={c} />)}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-6 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 mb-6">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Recommended Savings</div>
                      <div className="text-2xl font-black text-emerald-400">₹{result.budget_plan?.recommended_savings?.toLocaleString() || 0}<span className="text-sm text-slate-500 ml-1">/mo</span></div>
                    </div>
                    <div className="h-10 w-px bg-white/10" />
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Savings Rate</div>
                      <div className="text-2xl font-black text-sky-400">{result.budget_plan?.savings_rate_percent || 0}%</div>
                    </div>
                  </div>

                  {result.budget_plan?.tips?.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-3">Budget Tips</h4>
                      {result.budget_plan.tips.map((tip, i) => (
                        <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-slate-300">{tip}</div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Investment Plan */}
                <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-8">
                  <h3 className="text-lg font-bold mb-2 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-amber-400" /> Auto Investment Engine</h3>
                  <p className="text-sm text-slate-400 mb-6">{result.investment_plan?.rationale}</p>

                  <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 mb-6 flex items-center gap-4">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Investable Amount</div>
                      <div className="text-2xl font-black text-amber-400">₹{result.investment_plan?.investable_amount?.toLocaleString() || 0}<span className="text-sm text-slate-500 ml-1">/mo</span></div>
                    </div>
                    <div className="h-10 w-px bg-white/10" />
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Time Horizon</div>
                      <div className="text-lg font-black text-violet-400 capitalize">{result.investment_plan?.time_horizon || 'Medium'} Term</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {result.investment_plan?.allocation?.map((alloc, i) => (
                      <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ALLOC_COLORS[i % ALLOC_COLORS.length] }} />
                            <span className="text-sm font-bold">{alloc.type}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-black text-white">₹{alloc.amount?.toLocaleString()}</span>
                            <span className="text-xs text-slate-500 ml-2">{alloc.percentage}%</span>
                          </div>
                        </div>
                        {/* Percentage bar */}
                        <div className="w-full h-1.5 rounded-full bg-white/5 mt-2">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${alloc.percentage}%`, backgroundColor: ALLOC_COLORS[i % ALLOC_COLORS.length] }} />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2">{alloc.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Restart */}
                <button
                  onClick={() => { setStep('income'); setResult(null); }}
                  className="w-full py-4 rounded-2xl bg-white/[0.04] border border-white/10 text-sm font-bold text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Run New Analysis
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          {!['analyzing', 'results'].includes(step) && (
            <div className="flex justify-between mt-8">
              {step !== 'income' ? (
                <button onClick={prevStep} className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-slate-400 hover:text-white transition-all flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              ) : <div />}
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 text-white text-sm font-bold shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 transition-all flex items-center gap-2 disabled:opacity-50 disabled:grayscale"
              >
                {step === 'profile' ? 'Run AI Analysis' : 'Continue'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
      <Chatbot />
    </>
  );
}
