import React from 'react';
import { useLanguage } from '../../context/languageContext';
import { Globe, ChevronDown } from 'lucide-react';

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'buttons';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ variant = 'dropdown' }) => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = React.useState(false);

  if (variant === 'buttons') {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => setLanguage('en')}
          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
            language === 'en' 
              ? 'bg-teal-600 text-white' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          EN
        </button>
        <button
          onClick={() => setLanguage('fr')}
          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
            language === 'fr' 
              ? 'bg-teal-600 text-white' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          FR
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium transition-all cursor-pointer"
      >
        <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600" />
        <span className="hidden xs:inline">{language === 'en' ? 'English' : 'Français'}</span>
        <span className="xs:hidden">{language === 'en' ? 'EN' : 'FR'}</span>
        <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50">
          <button
            onClick={() => { setLanguage('en'); setIsOpen(false); }}
            className={`w-full px-3 py-2 text-left text-xs font-medium hover:bg-teal-50 transition-colors cursor-pointer ${
              language === 'en' ? 'bg-teal-50 text-teal-700 font-bold' : 'text-slate-700'
            }`}
          >
            English
          </button>
          <button
            onClick={() => { setLanguage('fr'); setIsOpen(false); }}
            className={`w-full px-3 py-2 text-left text-xs font-medium hover:bg-teal-50 transition-colors cursor-pointer ${
              language === 'fr' ? 'bg-teal-50 text-teal-700 font-bold' : 'text-slate-700'
            }`}
          >
            Français
          </button>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;