import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    const msg = (error?.message || '').toLowerCase();
    const isDOMTranslateError = 
      msg.includes('removechild') || 
      msg.includes('insertbefore') || 
      msg.includes('replacechild') || 
      msg.includes('not a child') ||
      msg.includes('node') ||
      msg.includes('not found') ||
      msg.includes('domexception');
    
    // If it's a transient DOM translate error, do not block the UI
    return { hasError: !isDOMTranslateError, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const msg = (error?.message || '').toLowerCase();
    const isDOMTranslateError = 
      msg.includes('removechild') || 
      msg.includes('insertbefore') || 
      msg.includes('replacechild') || 
      msg.includes('not a child') ||
      msg.includes('node') ||
      msg.includes('not found') ||
      msg.includes('domexception');

    if (isDOMTranslateError) {
      console.warn('[ErrorBoundary] Auto-recovered from Google Translate DOM sync event:', error);
      // Quickly reset state on the next tick so React renders the component tree
      setTimeout(() => {
        this.setState({ hasError: false, error: null });
      }, 50);
      return;
    }

    console.error('ErrorBoundary caught an unhandled UI error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700/80 rounded-3xl p-8 max-w-lg w-full text-center space-y-5 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center mx-auto">
              <RefreshCw className="w-7 h-7 animate-spin" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Reconnecting Interface...</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Syncing views with clinical database.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="w-1/2 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Continue Session
              </button>
              <button
                onClick={this.handleReset}
                className="w-1/2 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition shadow-lg cursor-pointer"
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
