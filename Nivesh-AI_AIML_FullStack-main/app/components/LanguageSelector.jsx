"use client";

import { useState, useEffect, useRef } from 'react';

const languages = [
  { code: 'hi', name: 'Hindi' },
  { code: 'en', name: 'English' },
  { code: 'bn', name: 'Bengali' },
  { code: 'te', name: 'Telugu' },
  { code: 'mr', name: 'Marathi' },
  { code: 'ta', name: 'Tamil' },
  { code: 'ur', name: 'Urdu' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'kn', name: 'Kannada' },
  { code: 'or', name: 'Odia' }, 
  { code: 'ml', name: 'Malayalam' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'as', name: 'Assamese' },
  { code: 'mai', name: 'Maithili' }, 
  { code: 'sa', name: 'Sanskrit' },
  { code: 'ks', name: 'Kashmiri' }, 
  { code: 'ne', name: 'Nepali' },
  { code: 'sd', name: 'Sindhi' },
  { code: 'gom', name: 'Konkani' },
  { code: 'doi', name: 'Dogri' },
  { code: 'mni-Mtei', name: 'Manipuri (Meitei)' }, 
  { code: 'brx', name: 'Bodo' },
  { code: 'sat', name: 'Santhali' }
];

export default function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Close dropdown when clicking outside
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const changeLanguage = (langCode) => {
    // Set a cookie that Google Translate component uses to determine the language
    document.cookie = `googtrans=/en/${langCode}; path=/;`;
    document.cookie = `googtrans=/en/${langCode}; domain=.${window.location.host}; path=/;`;
    
    // Instead of reload, trigger the hidden Google Translate dropdown if possible
    const select = document.querySelector('.goog-te-combo');
    if (select) {
      select.value = langCode;
      select.dispatchEvent(new Event('change'));
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="fixed bottom-32 right-11 z-50 flex flex-col items-end" ref={dropdownRef}>
      {isOpen && (
        <div className="mb-3 bg-[#181f31] rounded-xl shadow-lg w-48 max-h-80 flex flex-col border border-gray-700 overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="p-3 bg-linear-to-r from-[#0d1020] to-[#0b0b12] border-b border-gray-700">
             <h3 className="text-white font-semibold text-sm text-center">Select Language</h3>
          </div>
          <div className="overflow-y-auto overflow-x-hidden no-scrollbar py-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  changeLanguage(lang.code);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#232b44] transition-colors"
              >
                {lang.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-linear-to-r from-emerald-600 to-teal-500 rounded-full text-white shadow-lg hover:scale-105 transition-transform flex items-center justify-center p-2.5"
        title="Translate Website"
      >
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
      </button>
    </div>
  );
}
