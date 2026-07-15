"use client";
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";

const markdownComponents = {
  p: ({node, children}) => <p style={{margin: '0 0 1em 0', color: '#374151'}}>{children}</p>,
  h1: ({node, children}) => <h1 style={{fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', margin: '1.5em 0 0.5em 0'}}>{children}</h1>,
  h2: ({node, children}) => <h2 style={{fontSize: '1.125rem', fontWeight: 'bold', color: '#111827', margin: '1.5em 0 0.5em 0'}}>{children}</h2>,
  h3: ({node, children}) => <h3 style={{fontSize: '1rem', fontWeight: 'bold', color: '#111827', margin: '1.5em 0 0.5em 0'}}>{children}</h3>,
  ul: ({node, children}) => <ul style={{listStyleType: 'disc', paddingLeft: '1.5em', margin: '0 0 1em 0', color: '#374151'}}>{children}</ul>,
  ol: ({node, children}) => <ol style={{listStyleType: 'decimal', paddingLeft: '1.5em', margin: '0 0 1em 0', color: '#374151'}}>{children}</ol>,
  li: ({node, children}) => <li style={{margin: '0.25em 0'}}>{children}</li>,
  strong: ({node, children}) => <strong style={{fontWeight: '700', color: '#111827'}}>{children}</strong>,
};

export default function AIReportModal({ isOpen, onClose, fundData }) {
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    setReport("");

    try {
      const response = await fetch("/api/ai/generate-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fundData }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        setReport((prev) => prev + chunk);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen && !report && !loading) {
      generateReport();
    }
  }, [isOpen]);

  const downloadReport = async () => {
    try {
      const { toPng } = await import('html-to-image');
      const { jsPDF } = await import('jspdf');
      
      const element = document.getElementById('report-content-to-pdf');
      if (!element) throw new Error("Report not found");
      
      // Temporarily ensure high quality render dimensions
      const originalStyle = element.style.display;
      element.style.display = 'block';

      const dataUrl = await toPng(element, { 
        quality: 1.0, 
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        fontEmbedCSS: ''
      });
      
      element.style.display = originalStyle;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${fundData?.meta?.schemeCode || 'Fund'}-AI-Report.pdf`);
    } catch (e) {
      console.error("Error generating PDF:", e);
      alert("Failed to download PDF: " + (e.message || "Unknown error"));
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(report);
    alert("Report copied to clipboard!");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#181f31] rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <h2 className="text-2xl font-bold text-white">AI Investment Report</h2>
              <p className="text-purple-100 text-sm">Comprehensive Analysis & Insights</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin border-4 border-purple-400 border-t-transparent rounded-full w-12 h-12 mb-4"></div>
              <p className="text-gray-400 text-lg">Generating comprehensive report... 📊</p>
              <p className="text-gray-500 text-sm mt-2">This may take a moment</p>
            </div>
          )}

          {error && (
            <div className="bg-red-900/30 border border-red-600 rounded-lg p-4 text-red-400">
              <p className="font-semibold">Error: {error}</p>
              <button
                onClick={generateReport}
                className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                Try Again
              </button>
            </div>
          )}

          {report && (
            <div id="report-content-to-pdf" style={{ padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', backgroundColor: '#ffffff', color: '#111827', border: '1px solid #e5e7eb' }}>
              <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: '#9333ea', margin: '0' }}>
                    AI Fund Analysis
                  </h1>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Generated on {new Date().toLocaleDateString()}</span>
                </div>
                <p style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937', margin: '0' }}>{fundData?.meta?.scheme_name || fundData?.meta?.schemeName || 'Unknown Fund'} <span style={{ color: '#6b7280', fontSize: '1rem' }}>({fundData?.meta?.schemeCode || 'N/A'})</span></p>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', fontWeight: '500', marginTop: '0.25rem' }}>
                   <span style={{ backgroundColor: '#f3e8ff', color: '#7e22ce', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', border: '1px solid #e9d5ff' }}>House: {fundData?.meta?.fund_house || 'N/A'}</span>
                   <span style={{ backgroundColor: '#fce7f3', color: '#be185d', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', border: '1px solid #fbcfe8' }}>Category: {fundData?.meta?.scheme_category || 'N/A'}</span>
                   <span style={{ backgroundColor: '#cffafe', color: '#0e7490', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', border: '1px solid #a5f3fc' }}>Type: {fundData?.meta?.scheme_type || 'N/A'}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem', marginBottom: '2rem', fontSize: '0.875rem' }}>
                <div style={{ backgroundColor: '#f9fafb', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #e5e7eb' }}>
                  <h4 style={{ fontWeight: '700', color: '#374151', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', margin: '0 0 1rem 0' }}>Key Metrics</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#4b5563' }}>Current NAV:</span><span style={{ fontWeight: '600', color: '#111827' }}>₹{fundData?.navHistory?.[fundData.navHistory.length - 1]?.nav || 'N/A'}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#4b5563' }}>Annualized Return:</span><span style={{ fontWeight: '600', color: '#059669' }}>{(fundData?.riskVolatility?.annualized_return * 100).toFixed(2)}%</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#4b5563' }}>Volatility:</span><span style={{ fontWeight: '600', color: '#ea580c' }}>{(fundData?.riskVolatility?.annualized_volatility * 100).toFixed(2)}%</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#4b5563' }}>Sharpe Ratio:</span><span style={{ fontWeight: '600', color: '#111827' }}>{fundData?.riskVolatility?.sharpe_ratio?.toFixed(2)}</span></div>
                  </div>
                </div>
                <div style={{ backgroundColor: '#f9fafb', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #e5e7eb' }}>
                  <h4 style={{ fontWeight: '700', color: '#374151', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', margin: '0 0 1rem 0' }}>AI Forecast (Monte Carlo)</h4>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#4b5563' }}>Expected NAV:</span><span style={{ fontWeight: '600', color: '#111827' }}>₹{fundData?.monteCarlo?.expected_nav?.toFixed(2) || 'N/A'}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#4b5563' }}>Prob. of Positive Return:</span><span style={{ fontWeight: '600', color: '#059669' }}>{fundData?.monteCarlo?.probability_positive_return || '0'}%</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#4b5563' }}>Lower Bound (5%):</span><span style={{ fontWeight: '600', color: '#111827' }}>₹{fundData?.monteCarlo?.lower_bound_5th_percentile?.toFixed(2) || 'N/A'}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#4b5563' }}>Upper Bound (95%):</span><span style={{ fontWeight: '600', color: '#111827' }}>₹{fundData?.monteCarlo?.upper_bound_95th_percentile?.toFixed(2) || 'N/A'}</span></div>
                  </div>
                </div>
              </div>

              <div style={{ color: '#374151', lineHeight: '1.625', fontSize: '0.875rem' }}>
                <ReactMarkdown components={markdownComponents}>
                  {report.replace(/[\u{1F300}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{1F1E6}-\u{1F1FF}\u{1F004}-\u{1F02F}\u{2B50}]/gu, '')}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Actions */}
        <div className="bg-[#0d1020] p-4 flex justify-between items-center border-t border-gray-700 flex-wrap gap-3">
          <p className="text-gray-400 text-sm">
            📋 Professional AI-generated investment report
          </p>
          <div className="flex gap-3">
            {report && (
              <>
                <button
                  onClick={copyToClipboard}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </button>
                <button
                  onClick={downloadReport}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
