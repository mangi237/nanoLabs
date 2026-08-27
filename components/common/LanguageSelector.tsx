import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/languageContext';
import { Globe, ChevronDown, Check } from 'lucide-react';

interface LanguageSelectorProps {
  variant?: 'compact' | 'dropdown' | 'pill' | 'header';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'pill',
  className = ''
}) => {
  const { language, setLanguage, toggleLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧', sub: 'Default' },
    { code: 'fr', label: 'Français', flag: '🇫🇷', sub: 'French' }
  ];

  const currentLang = languages.find(l => l.code === language) || languages[0];

  if (variant === 'compact') {
    return (
      <button
        type="button"
        id="btn-language-compact-toggle"
        onClick={toggleLanguage}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs border cursor-pointer ${
          language === 'fr'
            ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
            : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
        } ${className}`}
        title="Switch Language / Changer de langue"
      >
        <Globe className="w-3.5 h-3.5" />
        <span>{currentLang.flag} {currentLang.code.toUpperCase()}</span>
      </button>
    );
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        id="btn-language-selector-dropdown"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs hover:shadow-xs transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Globe className="w-4 h-4 text-teal-600 shrink-0" />
        <span className="flex items-center gap-1.5">
          <span className="text-sm leading-none">{currentLang.flag}</span>
          <span className="text-slate-800 font-semibold">{currentLang.label}</span>
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          id="menu-language-options"
          className="absolute right-0 mt-1.5 w-48 rounded-xl bg-white shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-100"
        >
          <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Select Language / Choisir la langue
            </p>
          </div>
          {languages.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                id={`btn-select-lang-${lang.code}`}
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-teal-50 text-teal-900 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base leading-none">{lang.flag}</span>
                  <div className="text-left">
                    <div className="text-slate-900 leading-tight">{lang.label}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{lang.sub}</div>
                  </div>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-teal-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
