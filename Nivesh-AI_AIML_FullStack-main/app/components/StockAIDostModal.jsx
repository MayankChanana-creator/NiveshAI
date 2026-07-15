"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  PremiumAvatar, PremiumAvatar3D, Waveform, FintechBackground,
  KaraokeTranscript, LangToggle, cleanText,
} from "./AIDostAvatar";

/* ── Loading messages rotate while generating ── */
const LOADING_MSGS = [
  "AI Dost is analysing this stock for you...",
  "Finding insights that matter to you...",
  "Crunching the numbers with care...",
  "Your personal financial friend is thinking...",
  "Almost ready with a smart take just for you...",
];

export default function StockAIDostModal({ isOpen, onClose, stockData }) {
  const [stage, setStage] = useState("idle");   // idle | loading | speaking | ready | error
  const [words, setWords] = useState([]);
  const [currentWordIdx, setWordIdx] = useState(-1);
  const [progress, setProgress] = useState("");
  const [loadMsg, setLoadMsg] = useState(LOADING_MSGS[0]);
  const [lang, setLang] = useState("en");
  const [isPaused, setIsPaused] = useState(false);

  const audioRef = useRef(null);
  const rafRef = useRef(null);
  const transcriptRef = useRef(null);
  const loadMsgTimer = useRef(null);
  const abortRef = useRef(null);  // AbortController for in-flight fetches
  const activeRef = useRef(false); // true while modal is open & generating

  // ── Reset on close ──────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      activeRef.current = false;
      if (abortRef.current) abortRef.current.abort();
      cleanup();
      setStage("idle"); setWords([]); setWordIdx(-1);
    } else {
      activeRef.current = true;
    }
  }, [isOpen]);

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (loadMsgTimer.current) clearInterval(loadMsgTimer.current);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
  }, []);

  // ── Rotate loading messages ─────────────────────────────
  const startLoadingMsgs = () => {
    let i = 0;
    loadMsgTimer.current = setInterval(() => {
      i = (i + 1) % LOADING_MSGS.length;
      setLoadMsg(LOADING_MSGS[i]);
    }, 2200);
  };

  // ── Karaoke driver ──────────────────────────────────────
  const startKaraoke = useCallback((audio, total) => {
    const tick = () => {
      if (!audio || audio.paused || audio.ended) return;
      const idx = Math.min(Math.floor((audio.currentTime / audio.duration) * total), total - 1);
      setWordIdx(idx);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // ── Build prompt ────────────────────────────────────────
  const buildPrompt = () => {
    const name = stockData?.meta?.longName || stockData?.meta?.companyName || stockData?.meta?.symbol;
    const price = stockData?.navHistory?.[stockData.navHistory.length - 1]?.close;
    const ret = ((stockData?.riskVolatility?.annualized_return || 0) * 100).toFixed(1);
    const vol = ((stockData?.riskVolatility?.annualized_volatility || 0) * 100).toFixed(1);
    const sharpe = stockData?.riskVolatility?.sharpe_ratio?.toFixed(2) || "N/A";
    const exp = stockData?.monteCarlo?.expected_price?.toFixed(2) || "N/A";
    const prob = stockData?.monteCarlo?.probability_positive_return || "N/A";

    if (lang === "hi") {
      return `Aap ek friendly financial advisor hain jo ek beginner investor ke dost hain.
Is stock ko bilkul simple, warm aur conversational Hindi mein samjhao jaise chai pe baat ho rahi ho.
Koi bhi markdown, hashtag, asterisk, bullet point, numbering, ya emoji mat daalo.
Sirf normal boli jaane wali bhasha mein plain sentences mein likho. 30 seconds ki speech ke liye kaafi ho.
Stock: ${name}, Sector: ${stockData?.meta?.sector || "N/A"}
Abhi ka bhaav: Rs.${price || "N/A"}, Saalanaa return: ${ret}%, Volatility: ${vol}%
Sharpe: ${sharpe}, Expected bhaav (1 saal): Rs.${exp}, Positive return probability: ${prob}%`;
    }

    return `You are a friendly, knowledgeable financial advisor explaining a stock to a beginner investor like a trusted friend.
Speak naturally and conversationally — like you are sipping chai together and having a real conversation.
Do NOT use any markdown, bullet points, numbers, hashtags, asterisks, emojis or symbols of any kind.
Write in plain, flowing, spoken English sentences only. Keep it to about 20-30 seconds of speech.
Stock: ${name}, Sector: ${stockData?.meta?.sector || "N/A"}
Current Price: Rs.${price || "N/A"}, Annual Return: ${ret}%, Volatility: ${vol}%
Sharpe: ${sharpe}, Expected Price in 1 year: Rs.${exp}, Probability of positive return: ${prob}%`;
  };

  // ── Generate + Speak ────────────────────────────────────
  const generateAndSpeak = async () => {
    if (!stockData) return;
    cleanup();
    // Fresh abort controller for this generation
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    activeRef.current = true;

    setStage("loading"); setWords([]); setWordIdx(-1); setIsPaused(false);
    setLoadMsg(LOADING_MSGS[0]);
    startLoadingMsgs();

    try {
      const txtRes = await fetch("/api/ai/analyze-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: buildPrompt() }),
        signal: ctrl.signal,
      });
      if (!txtRes.ok) throw new Error("Analysis failed");

      let full = "";
      const reader = txtRes.body.getReader();
      const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += dec.decode(value);
      }

      // Bail if modal was closed while we were generating text
      if (!activeRef.current) return;

      clearInterval(loadMsgTimer.current);
      setProgress("Generating voice...");

      const wordArray = cleanText(full).split(/\s+/).filter(Boolean);
      setWords(wordArray);

      const ttsRes = await fetch("/api/ai/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: full, lang }),
        signal: ctrl.signal,
      });
      if (!ttsRes.ok) throw new Error("TTS failed");

      // Final guard before playing audio
      if (!activeRef.current) return;

      const blob = await ttsRes.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.addEventListener("loadedmetadata", () => {
        if (!activeRef.current) { URL.revokeObjectURL(url); return; }
        audio.play();
        setStage("speaking");
        startKaraoke(audio, wordArray.length);
      });
      audio.onended = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        setWordIdx(wordArray.length - 1);
        setStage("ready");
        setIsPaused(false);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => { setStage("ready"); setIsPaused(false); };
      audio.load();
    } catch (err) {
      // AbortError means user closed the modal — silently ignore
      if (err.name === "AbortError") return;
      clearInterval(loadMsgTimer.current);
      console.error(err);
      setStage("error");
      setProgress(err.message || "Something went wrong.");
    }
  };

  const togglePause = () => {
    if (!audioRef.current) return;
    if (isPaused) {
      audioRef.current.play();
      startKaraoke(audioRef.current, words.length);
      setIsPaused(false);
      setStage("speaking");
    } else {
      audioRef.current.pause();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setIsPaused(true);
      setStage("ready");
    }
  };

  const stopAudio = () => {
    cleanup();
    setWordIdx(-1);
    setIsPaused(false);
    setStage("ready");
  };

  if (!isOpen) return null;

  const companyName = stockData?.meta?.longName || stockData?.meta?.companyName || stockData?.meta?.symbol;
  const isSpeakingNow = stage === "speaking" && !isPaused;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1rem", backdropFilter: "blur(10px)",
      background: "rgba(3,6,18,0.88)",
    }}>
      <div style={{
        position: "relative", borderRadius: "1.75rem",
        width: "100%", maxWidth: "960px",
        maxHeight: "92vh",
        border: "1px solid rgba(124,58,237,0.35)",
        boxShadow: "0 0 0 1px rgba(6,182,212,0.12), 0 30px 80px rgba(0,0,0,0.7), 0 0 60px rgba(124,58,237,0.1)",
        overflow: "hidden", animation: "fadeInUp 0.4s ease-out",
      }}>
        <FintechBackground isSpeaking={isSpeakingNow} />

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* ── Header ── */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "0.85rem 1.5rem",
            borderBottom: "1px solid rgba(124,58,237,0.2)",
            background: "rgba(0,0,0,0.35)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div style={{
                width: "8px", height: "8px", borderRadius: "50%",
                background: isSpeakingNow ? "#34d399" : "#64748b",
                boxShadow: isSpeakingNow ? "0 0 8px #34d399" : "none",
                animation: isSpeakingNow ? "blink 1s infinite" : "none",
              }} />
              <span style={{ fontWeight: 800, fontSize: "1rem", color: "#e2e8f0", letterSpacing: "0.01em" }}>
                AI Dost — Your Financial Friend
              </span>
            </div>
            <button onClick={onClose} style={{
              background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "50%", width: "30px", height: "30px", cursor: "pointer",
              color: "#94a3b8", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
            }}
              onMouseOver={e => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "#fff"; }}
              onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#94a3b8"; }}>
              ✕
            </button>
          </div>

          {/* ── Two-panel body ── */}
          <div style={{ display: "flex", minHeight: "520px" }}>
            {/* LEFT PANEL — Full-body avatar */}
            <div style={{
              flex: "0 0 380px",
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative",
              borderRight: "1px solid rgba(124,58,237,0.12)",
              background: "rgba(0,0,0,0.15)",
              overflow: "hidden",
            }}>
              <PremiumAvatar3D isSpeaking={isSpeakingNow} size={340} audioRef={audioRef} />
            </div>

            {/* RIGHT PANEL — Controls & transcript */}
            <div style={{
              flex: 1,
              display: "flex", flexDirection: "column",
              padding: "1.5rem 1.75rem",
              gap: "0.85rem",
              overflowY: "auto",
              maxHeight: "520px",
            }}>
              {/* Status badge */}
              <div style={{
                display: "flex", alignItems: "center", gap: "6px",
                fontSize: "0.72rem", fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase",
                color: isSpeakingNow ? "#34d399" : "#475569",
              }}>
                {isSpeakingNow && <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#34d399", animation: "blink 1s infinite" }} />}
                {stage === "speaking" ? (isPaused ? "Paused" : "Speaking...") :
                  stage === "loading" ? "Analysing..." :
                    stage === "ready" ? "Ready" :
                      stage === "error" ? "Error" : "AI Dost"}
              </div>

              <Waveform active={isSpeakingNow} />

              {/* Company chip + language toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", width: "100%" }}>
                <div style={{
                  flex: 1, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)",
                  borderRadius: "0.5rem", padding: "0.45rem 0.9rem",
                  fontSize: "0.85rem", color: "#93c5fd", fontWeight: 600,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{companyName}</div>
                {(stage === "idle" || stage === "ready" || stage === "error") && (
                  <LangToggle lang={lang} setLang={setLang} />
                )}
              </div>

              {/* Idle CTA */}
              {stage === "idle" && (
                <div style={{ textAlign: "center", paddingTop: "0.5rem", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <p style={{ color: "#475569", fontSize: "0.88rem", marginBottom: "1.1rem" }}>
                    Choose a language, then let AI Dost explain this stock to you like a trusted friend.
                  </p>
                  <button onClick={generateAndSpeak} style={{
                    background: "linear-gradient(135deg, #7c3aed 0%, #2563eb 50%, #06b6d4 100%)",
                    border: "none", borderRadius: "0.85rem", color: "white",
                    padding: "0.9rem 2.5rem", fontSize: "0.95rem", fontWeight: 800,
                    cursor: "pointer", letterSpacing: "0.02em",
                    boxShadow: "0 8px 30px rgba(124,58,237,0.45), 0 0 0 1px rgba(255,255,255,0.08)",
                    transition: "transform 0.15s, box-shadow 0.15s",
                  }}
                    onMouseOver={e => { e.currentTarget.style.transform = "scale(1.04)"; }}
                    onMouseOut={e => { e.currentTarget.style.transform = "scale(1)"; }}>
                    Speak to me, AI Dost
                  </button>
                </div>
              )}

              {/* Loading */}
              {stage === "loading" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.85rem", padding: "0.5rem 0", flex: 1, justifyContent: "center" }}>
                  <div style={{
                    width: "40px", height: "40px", borderRadius: "50%",
                    border: "3px solid rgba(124,58,237,0.15)", borderTopColor: "#7c3aed",
                    animation: "spin 0.85s linear infinite",
                  }} />
                  <p style={{ color: "#64748b", fontSize: "0.85rem", textAlign: "center", maxWidth: "280px" }}>{loadMsg}</p>
                </div>
              )}

              {/* Karaoke */}
              {words.length > 0 && (stage === "speaking" || stage === "ready") && (
                <KaraokeTranscript
                  words={words}
                  currentWordIdx={currentWordIdx}
                  isSpeaking={isSpeakingNow}
                  transcriptRef={transcriptRef}
                />
              )}

              {/* Error */}
              {stage === "error" && (
                <div style={{
                  background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: "0.75rem", padding: "0.85rem 1rem", color: "#f87171",
                  fontSize: "0.85rem", width: "100%",
                }}>{progress || "Something went wrong."}</div>
              )}

              {/* Action buttons */}
              <div style={{ display: "flex", gap: "0.6rem", marginTop: "auto", paddingTop: "0.5rem" }}>
                {stage === "speaking" && (
                  <>
                    <button onClick={togglePause} style={{
                      flex: 1, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)",
                      borderRadius: "0.6rem", color: "#a5b4fc", fontWeight: 700,
                      padding: "0.6rem", cursor: "pointer", fontSize: "0.85rem",
                    }}>{isPaused ? "Resume" : "Pause"}</button>
                    <button onClick={stopAudio} style={{
                      flex: 1, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                      borderRadius: "0.6rem", color: "#f87171", fontWeight: 700,
                      padding: "0.6rem", cursor: "pointer", fontSize: "0.85rem",
                    }}>Stop</button>
                  </>
                )}
                {(stage === "ready" || stage === "error") && (
                  <button onClick={generateAndSpeak} style={{
                    flex: 1, background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
                    border: "none", borderRadius: "0.6rem", color: "white",
                    fontWeight: 700, padding: "0.6rem", cursor: "pointer", fontSize: "0.85rem",
                  }}>{stage === "error" ? "Try Again" : "Regenerate"}</button>
                )}
                <button onClick={onClose} style={{
                  flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "0.6rem", color: "#475569", fontWeight: 600,
                  padding: "0.6rem", cursor: "pointer", fontSize: "0.85rem",
                }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin       { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes blink      { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes fadeInUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}