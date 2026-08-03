import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { useLanguage } from '../../context/languageContext';
import { useTheme } from '../../context/themeContext';
import { Activity, Building2, Key, ChevronDown, CheckCircle, Search, ArrowRight, Loader2, Shield } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess?: (user: any) => void;
  onNavigateRegister?: () => void;
  onNavigateSelectLab?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onNavigateRegister,
  onNavigateSelectLab
}) => {
  const { t } = useLanguage();
  const { login, isLoading, getAllLabs, lab: currentLab } = useAuth();
  const [accessCode, setAccessCode] = useState('');
  const [labId, setLabId] = useState(currentLab?.id || '');
  const [labName, setLabName] = useState(currentLab?.name || '');
  const [showLabSelector, setShowLabSelector] = useState(false);
  const [labs, setLabs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    try {
      const list = await getAllLabs();
      setLabs(list || []);
      if (list && list.length > 0 && !labId) {
        setLabId(list[0].id);
        setLabName(list[0].name);
      }
    } catch (e) {
      console.error('Error fetching labs:', e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!accessCode.trim()) {
      setErrorMessage('Please enter your authorization access code.');
      return;
    }

    try {
      const result = await login(accessCode, labId);
      if (result.success && result.user) {
        if (onLoginSuccess) {
          onLoginSuccess(result.user);
        }
      } else {
        setErrorMessage('Invalid access code or laboratory configuration.');
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'Authentication failed. Please verify credentials.');
    }
  };

  const filteredLabs = labs.filter((lab: any) =>
    lab.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lab.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-500 to-blue-600 text-white shadow-xl shadow-teal-500/25 mb-2">
            <Activity className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            nano<span className="text-teal-400">Labs</span> Health Care
          </h1>
          <p className="text-sm text-slate-300">
            Secure Portal Access & Laboratory Management
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/15 p-8 rounded-3xl shadow-2xl space-y-6">
          <form onSubmit={handleLogin} className="space-y-5">
            {errorMessage && (
              <div className="p-3.5 bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs rounded-2xl font-medium">
                {errorMessage}
              </div>
            )}

            {/* Lab Selector Dropdown Button */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Laboratory Location
              </label>
              <button
                type="button"
                onClick={() => setShowLabSelector(!showLabSelector)}
                className="w-full flex items-center justify-between p-3.5 bg-white/10 hover:bg-white/15 border border-white/20 rounded-2xl text-left text-sm text-white transition-all"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Building2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span className="truncate">{labName || 'Select Laboratory Center'}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showLabSelector ? 'rotate-180' : ''}`} />
              </button>

              {/* Lab Selector Dropdown Overlay */}
              {showLabSelector && (
                <div className="mt-2 bg-slate-900 border border-slate-700/80 rounded-2xl p-3 shadow-2xl space-y-2 z-20 relative animate-in fade-in zoom-in-95 duration-150">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Search laboratory..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                    {filteredLabs.map((l: any) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => {
                          setLabId(l.id);
                          setLabName(l.name);
                          setShowLabSelector(false);
                          setSearchQuery('');
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs text-left transition-colors ${
                          labId === l.id ? 'bg-teal-600/30 text-teal-300 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="truncate">
                          <div className="truncate">{l.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{l.location}</div>
                        </div>
                        {labId === l.id && <CheckCircle className="w-4 h-4 text-teal-400 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Access Code Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Access Security Code
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  placeholder="Enter your security code"
                  value={accessCode}
                  onChange={e => setAccessCode(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-slate-400 text-sm tracking-wider font-mono focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Note: Super admin password hint HAS BEEN REMOVED per user prompt request */}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-bold rounded-2xl text-sm shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Access Portal
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Register Redirect */}
          <div className="pt-4 border-t border-white/10 text-center">
            <button
              type="button"
              onClick={onNavigateRegister}
              className="text-xs text-teal-300 hover:text-white font-medium transition-colors hover:underline"
            >
              New patient? Register your profile here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
