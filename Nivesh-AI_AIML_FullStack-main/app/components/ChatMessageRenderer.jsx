"use client";
import React, { useState } from "react";
import useUser from "@/lib/authClient";

/**
 * ChatMessageRenderer — renders bot messages with rich formatting.
 * Parses markdown-like patterns (headers, bold, bullets, numbered lists,
 * code blocks, inline code, horizontal rules) into styled JSX.
 */

const STYLES = {
  // Section header
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "18px",
    marginBottom: "8px",
    paddingBottom: "6px",
    borderBottom: "1px solid rgba(99, 102, 241, 0.15)",
  },
  sectionHeaderText: {
    fontSize: "0.92rem",
    fontWeight: 700,
    color: "#a5b4fc",
    letterSpacing: "0.01em",
  },
  sectionHeaderDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #818cf8, #06b6d4)",
    flexShrink: 0,
  },
  // Paragraph text
  paragraph: {
    fontSize: "0.88rem",
    lineHeight: "1.7",
    color: "#cbd5e1",
    margin: "6px 0",
  },
  // Highlighted keyword / bold
  bold: {
    fontWeight: 700,
    color: "#e2e8f0",
    background: "rgba(99, 102, 241, 0.08)",
    padding: "1px 4px",
    borderRadius: "4px",
  },
  // Bullet list
  bulletItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    padding: "5px 0",
    fontSize: "0.86rem",
    lineHeight: "1.65",
    color: "#cbd5e1",
  },
  bulletDot: {
    width: "5px",
    height: "5px",
    borderRadius: "50%",
    background: "#6366f1",
    flexShrink: 0,
    marginTop: "8px",
  },
  // Numbered list
  numberBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "20px",
    height: "20px",
    borderRadius: "6px",
    background: "rgba(99, 102, 241, 0.15)",
    color: "#818cf8",
    fontSize: "0.72rem",
    fontWeight: 700,
    flexShrink: 0,
    marginTop: "2px",
  },
  // Inline code
  inlineCode: {
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: "0.82rem",
    background: "rgba(99, 102, 241, 0.1)",
    border: "1px solid rgba(99, 102, 241, 0.2)",
    padding: "2px 6px",
    borderRadius: "4px",
    color: "#a5b4fc",
  },
  // Code block
  codeBlock: {
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: "0.8rem",
    background: "rgba(0, 0, 0, 0.4)",
    border: "1px solid rgba(99, 102, 241, 0.15)",
    borderRadius: "8px",
    padding: "12px 16px",
    margin: "10px 0",
    color: "#94a3b8",
    overflowX: "auto",
    whiteSpace: "pre-wrap",
    lineHeight: "1.6",
  },
  // Highlight card (for key stats / takeaways)
  highlightCard: {
    background: "linear-gradient(135deg, rgba(99, 102, 241, 0.06), rgba(6, 182, 212, 0.04))",
    border: "1px solid rgba(99, 102, 241, 0.15)",
    borderRadius: "10px",
    padding: "12px 16px",
    margin: "10px 0",
  },
  // Divider
  divider: {
    border: "none",
    borderTop: "1px solid rgba(99, 102, 241, 0.1)",
    margin: "14px 0",
  },
};

// ─── Inline text parser ──────────────────────────────────────────────────────
function parseInline(text) {
  if (!text) return text;
  const parts = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold: **text** or __text__
    const boldMatch = remaining.match(/(\*\*|__)(.+?)(\*\*|__)/);
    // Inline code: `text`
    const codeMatch = remaining.match(/`([^`]+)`/);

    let firstMatch = null;
    let matchType = null;

    if (boldMatch && (!codeMatch || boldMatch.index <= codeMatch.index)) {
      firstMatch = boldMatch;
      matchType = "bold";
    } else if (codeMatch) {
      firstMatch = codeMatch;
      matchType = "code";
    }

    if (!firstMatch) {
      parts.push(remaining);
      break;
    }

    // Text before the match
    if (firstMatch.index > 0) {
      parts.push(remaining.substring(0, firstMatch.index));
    }

    if (matchType === "bold") {
      parts.push(
        <span key={key++} style={STYLES.bold}>{firstMatch[2]}</span>
      );
    } else if (matchType === "code") {
      parts.push(
        <code key={key++} style={STYLES.inlineCode}>{firstMatch[1]}</code>
      );
    }

    remaining = remaining.substring(firstMatch.index + firstMatch[0].length);
  }

  return parts;
}

// ─── Custom Widget Components ────────────────────────────────────────────────
const GoalWidget = ({ goal }) => {
  const { user, isSignedIn } = useUser();
  const [adding, setAdding] = useState(false);

  const addToPortfolio = async () => {
    if (!isSignedIn) {
      alert("Please sign in to add this plan to your portfolio.");
      return;
    }
    
    setAdding(true);
    try {
      const userId = encodeURIComponent(user.sub || "");
      
      // Save the Goal Metadata
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/portfolio/goal/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal_name: goal.goal_name || "Custom Goal",
          target_amount: goal.target_amount,
          timeframe_years: goal.timeframe_years,
          expected_return_rate: goal.expected_return_rate,
          monthly_sip: goal.monthly_sip,
          risk_profile: goal.risk_profile || "Moderate"
        })
      });

      // Save the individual assets
      for (const asset of goal.recommended_assets) {
         let itemType = "stock";
         if (asset.type === "Mutual Fund") itemType = "mutual_fund";
         if (asset.type === "Crypto") itemType = "crypto";
         
         await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/portfolio/add/${userId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ symbol: asset.symbol, name: asset.name, item_type: itemType })
         });
      }
      
      // Navigate to Portfolio Page after successful addition
      window.location.href = "/Portfolio";
    } catch(e) {
      console.error(e);
      alert("Failed to add some assets to portfolio.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(6, 182, 212, 0.05))',
      border: '1px solid rgba(16, 185, 129, 0.2)',
      borderRadius: '12px',
      padding: '20px',
      margin: '16px 0',
      color: '#e2e8f0',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#34d399', fontWeight: 'bold' }}>{goal.goal_name}</h3>
        <span style={{ fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.2)', padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>{goal.risk_profile} Risk</span>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: '0.8rem', color: '#94a3b8' }}>Target</p>
          <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold' }}>₹{goal.target_amount?.toLocaleString()}</p>
        </div>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: '0.8rem', color: '#94a3b8' }}>Timeframe</p>
          <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold' }}>{goal.timeframe_years} Yrs</p>
        </div>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: '0.8rem', color: '#94a3b8' }}>Required Monthly SIP</p>
          <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold', color: '#fbbf24' }}>₹{goal.monthly_sip?.toLocaleString()}</p>
        </div>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: '0.8rem', color: '#94a3b8' }}>Est. Annual Return</p>
          <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold' }}>{goal.expected_return_rate}%</p>
        </div>
      </div>
      
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
        <p style={{ margin: '0 0 12px', fontSize: '0.9rem', fontWeight: 'bold', color: '#94a3b8' }}>Optimal Asset Allocation</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {goal.recommended_assets?.map((asset, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '10px 14px', borderRadius: '8px' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600', color: '#f8fafc' }}>{asset.name}</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>{asset.type} • {asset.symbol}</p>
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#38bdf8' }}>
                {asset.allocation_percent}%
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <button 
        onClick={addToPortfolio}
        disabled={adding}
        style={{ 
          width: '100%', 
          marginTop: '20px', 
          padding: '12px', 
          background: adding ? '#64748b' : '#10b981', 
          color: '#fff', 
          border: 'none', 
          borderRadius: '8px', 
          cursor: adding ? 'not-allowed' : 'pointer', 
          fontWeight: 'bold', 
          fontSize: '0.95rem',
          transition: 'all 0.2s'
        }}
      >
        {adding ? "Adding to Portfolio..." : "Add Plan to Portfolio"}
      </button>
    </div>
  );
};

// ─── Main renderer ───────────────────────────────────────────────────────────
export default function ChatMessageRenderer({ content, role }) {
  if (role === "user") {
    return <span>{content}</span>;
  }

  if (!content || typeof content !== "string") {
    return <span>{content || ""}</span>;
  }

  const lines = content.split("\n");
  const elements = [];
  let key = 0;
  let inCodeBlock = false;
  let codeLanguage = null;
  let codeBuffer = [];
  let currentListItems = [];
  let listType = null; // 'bullet' or 'number'

  const flushList = () => {
    if (currentListItems.length === 0) return;

    elements.push(
      <div key={key++} style={{ margin: "6px 0 6px 2px" }}>
        {currentListItems.map((item, idx) => (
          <div key={idx} style={STYLES.bulletItem}>
            {listType === "number" ? (
              <span style={STYLES.numberBadge}>{item.num}</span>
            ) : (
              <span style={STYLES.bulletDot} />
            )}
            <span style={{ flex: 1 }}>{parseInline(item.text)}</span>
          </div>
        ))}
      </div>
    );
    currentListItems = [];
    listType = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block toggle
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        if (codeLanguage === "goal") {
          try {
            const goalData = JSON.parse(codeBuffer.join("\n"));
            elements.push(<GoalWidget key={key++} goal={goalData} />);
          } catch(e) {
            elements.push(<pre key={key++} style={STYLES.codeBlock}>{codeBuffer.join("\n")}</pre>);
          }
        } else {
          elements.push(
            <pre key={key++} style={STYLES.codeBlock}>{codeBuffer.join("\n")}</pre>
          );
        }
        codeBuffer = [];
        inCodeBlock = false;
        codeLanguage = null;
      } else {
        flushList();
        inCodeBlock = true;
        codeLanguage = line.trim().slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      flushList();
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(trimmed)) {
      flushList();
      elements.push(<hr key={key++} style={STYLES.divider} />);
      continue;
    }

    // Headers: # ## ### etc
    const headerMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headerMatch) {
      flushList();
      elements.push(
        <div key={key++} style={STYLES.sectionHeader}>
          <span style={STYLES.sectionHeaderDot} />
          <span style={STYLES.sectionHeaderText}>{parseInline(headerMatch[2])}</span>
        </div>
      );
      continue;
    }

    // Bullet list: - or • or *
    const bulletMatch = trimmed.match(/^[-•*]\s+(.+)$/);
    if (bulletMatch) {
      if (listType === "number") flushList();
      listType = "bullet";
      currentListItems.push({ text: bulletMatch[1] });
      continue;
    }

    // Numbered list: 1. 2. etc
    const numMatch = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
    if (numMatch) {
      if (listType === "bullet") flushList();
      listType = "number";
      currentListItems.push({ num: numMatch[1], text: numMatch[2] });
      continue;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={key++} style={STYLES.paragraph}>{parseInline(trimmed)}</p>
    );
  }

  // Flush remaining
  flushList();
  if (inCodeBlock && codeBuffer.length > 0) {
    if (codeLanguage === "goal") {
      try {
        const goalData = JSON.parse(codeBuffer.join("\n"));
        elements.push(<GoalWidget key={key++} goal={goalData} />);
      } catch(e) {
        elements.push(<pre key={key++} style={STYLES.codeBlock}>{codeBuffer.join("\n")}</pre>);
      }
    } else {
      elements.push(
        <pre key={key++} style={STYLES.codeBlock}>{codeBuffer.join("\n")}</pre>
      );
    }
  }

  return <div style={{ display: "flex", flexDirection: "column" }}>{elements}</div>;
}
