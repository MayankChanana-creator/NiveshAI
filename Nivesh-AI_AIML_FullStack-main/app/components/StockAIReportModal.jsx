"use client";
import { useState } from "react";
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

const StockAIReportModal = ({ isOpen, onClose, stockData }) => {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");

  const generateReport = async () => {
    if (!stockData) return;

    setLoading(true);
    try {
      // Prepare detailed stock context
      const prompt = `
      Generate a detailed stock research report for:
      
      COMPANY OVERVIEW:
      Symbol: ${stockData.meta?.symbol}
      Company Name: ${stockData.meta?.longName || stockData.meta?.companyName}
      Industry: ${stockData.meta?.industry || 'N/A'}
      Sector: ${stockData.meta?.sector || 'N/A'}
      Market Cap: ₹${stockData.meta?.marketCap?.toLocaleString() || 'N/A'}

      TECHNICAL ANALYSIS:
      Current Price: ₹${stockData.navHistory?.[stockData.navHistory.length - 1]?.close || 'N/A'}
      Annualized Return: ${(stockData.riskVolatility?.annualized_return * 100).toFixed(2)}%
      Volatility: ${(stockData.riskVolatility?.annualized_volatility * 100).toFixed(2)}%
      Sharpe Ratio: ${stockData.riskVolatility?.sharpe_ratio?.toFixed(2)}

      FUTURE OUTLOOK:
      Expected Price (Monte Carlo): ₹${stockData.monteCarlo?.expected_price?.toFixed(2)}
      Probability of Positive Return: ${stockData.monteCarlo?.probability_positive_return}%
      Price Range (5th-95th percentile): ₹${stockData.monteCarlo?.lower_bound_5th_percentile?.toFixed(2)} - ₹${stockData.monteCarlo?.upper_bound_95th_percentile?.toFixed(2)}

      Generate a comprehensive stock research report including:

      1. Executive Summary
      2. Company Overview & Business Model
      3. Industry Analysis & Competitive Position
      4. Technical Analysis
         - Price Trends
         - Volatility Analysis
         - Risk Metrics
      5. Investment Thesis
         - Growth Drivers
         - Risk Factors
         - Valuation Analysis
      6. Future Outlook & Price Targets
      7. Investment Recommendation
         - Buy/Hold/Sell Rating
         - Target Price Range
         - Investment Horizon
         - Risk Level

      Format the report professionally with clear sections and bullet points where appropriate.
      Keep language clear and accessible for retail investors. DO NOT include any emojis or icons.
      `;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) throw new Error("Failed to generate report");

      let fullResponse = "";
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        fullResponse += chunk;
        setResponse(fullResponse);
      }
    } catch (error) {
      console.error("Error generating report:", error);
      setResponse("Sorry, I couldn't generate the report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
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
      pdf.save(`${stockData?.meta?.symbol || 'Stock'}-AI-Report.pdf`);
    } catch (e) {
      console.error("Error generating PDF:", e);
      alert("Failed to download PDF: " + (e.message || "Unknown error"));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#181f31] rounded-xl w-full max-w-4xl h-[80vh] flex flex-col relative border border-gray-700">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Stock Research Report</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!response && !loading && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <p className="text-gray-400 text-center">
                Click the button below to generate a detailed stock research report.
              </p>
              <button
                onClick={generateReport}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
              >
                Generate Report
              </button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div>
              <p className="text-gray-400">Generating report...</p>
            </div>
          )}

          {response && !loading && (
            <div id="report-content-to-pdf" style={{ padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', backgroundColor: '#ffffff', color: '#111827', border: '1px solid #e5e7eb' }}>
              <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: '#9333ea', margin: '0' }}>
                    AI Investment Research
                  </h1>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Generated on {new Date().toLocaleDateString()}</span>
                </div>
                <p style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937', margin: '0' }}>{stockData?.meta?.longName || stockData?.meta?.companyName || 'Unknown Company'} <span style={{ color: '#6b7280', fontSize: '1rem' }}>({stockData?.meta?.symbol})</span></p>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', fontWeight: '500', marginTop: '0.25rem' }}>
                   <span style={{ backgroundColor: '#f3e8ff', color: '#7e22ce', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', border: '1px solid #e9d5ff' }}>Sector: {stockData?.meta?.sector || 'N/A'}</span>
                   <span style={{ backgroundColor: '#fce7f3', color: '#be185d', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', border: '1px solid #fbcfe8' }}>Industry: {stockData?.meta?.industry || 'N/A'}</span>
                   <span style={{ backgroundColor: '#cffafe', color: '#0e7490', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', border: '1px solid #a5f3fc' }}>Market Cap: ₹{stockData?.meta?.marketCap?.toLocaleString() || 'N/A'}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem', marginBottom: '2rem', fontSize: '0.875rem' }}>
                <div style={{ backgroundColor: '#f9fafb', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #e5e7eb' }}>
                  <h4 style={{ fontWeight: '700', color: '#374151', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', margin: '0 0 1rem 0' }}>Key Metrics</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#4b5563' }}>Current Price:</span><span style={{ fontWeight: '600', color: '#111827' }}>₹{stockData?.navHistory?.[stockData.navHistory.length - 1]?.close || 'N/A'}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#4b5563' }}>Annualized Return:</span><span style={{ fontWeight: '600', color: '#059669' }}>{(stockData?.riskVolatility?.annualized_return * 100).toFixed(2)}%</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#4b5563' }}>Volatility:</span><span style={{ fontWeight: '600', color: '#ea580c' }}>{(stockData?.riskVolatility?.annualized_volatility * 100).toFixed(2)}%</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#4b5563' }}>Sharpe Ratio:</span><span style={{ fontWeight: '600', color: '#111827' }}>{stockData?.riskVolatility?.sharpe_ratio?.toFixed(2)}</span></div>
                  </div>
                </div>
                <div style={{ backgroundColor: '#f9fafb', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #e5e7eb' }}>
                  <h4 style={{ fontWeight: '700', color: '#374151', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', margin: '0 0 1rem 0' }}>AI Forecast (Monte Carlo)</h4>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#4b5563' }}>Expected Price:</span><span style={{ fontWeight: '600', color: '#111827' }}>₹{stockData?.monteCarlo?.expected_price?.toFixed(2) || 'N/A'}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#4b5563' }}>Prob. of Positive Return:</span><span style={{ fontWeight: '600', color: '#059669' }}>{stockData?.monteCarlo?.probability_positive_return || '0'}%</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#4b5563' }}>Lower Bound (5%):</span><span style={{ fontWeight: '600', color: '#111827' }}>₹{stockData?.monteCarlo?.lower_bound_5th_percentile?.toFixed(2) || 'N/A'}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#4b5563' }}>Upper Bound (95%):</span><span style={{ fontWeight: '600', color: '#111827' }}>₹{stockData?.monteCarlo?.upper_bound_95th_percentile?.toFixed(2) || 'N/A'}</span></div>
                  </div>
                </div>
              </div>

              <div style={{ color: '#374151', lineHeight: '1.625', fontSize: '0.875rem' }}>
                <ReactMarkdown components={markdownComponents}>
                  {response.replace(/[\u{1F300}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{1F1E6}-\u{1F1FF}\u{1F004}-\u{1F02F}\u{2B50}]/gu, '')}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>

        {response && !loading && (
          <div className="p-6 border-t border-gray-700 flex gap-4">
            <button
              onClick={generateReport}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
            >
              Regenerate Analysis
            </button>
            <button
              onClick={downloadPDF}
              className="flex-1 bg-gradient-to-r flex items-center justify-center gap-2 from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg transition-all transform hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download PDF Report
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockAIReportModal;