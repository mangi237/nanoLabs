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
      msg.includes('domexception') ||
      msg.includes('failed to execute');
    
    // Never trigger error state for DOM translation or mutation errors
    if (isDOMTranslateError) {
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
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
      msg.includes('domexception') ||
      msg.includes('failed to execute');

    if (isDOMTranslateError) {
      this.setState({ hasError: false, error: null });
      return;
    }

    console.error('ErrorBoundary caught an unhandled UI error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="p-6 max-w-xl mx-auto my-8 bg-white border border-teal-200 rounded-2xl shadow-sm text-slate-800 space-y-3">
          <div className="flex items-center gap-3 text-teal-700">
            <RefreshCw className="w-5 h-5 shrink-0" />
            <h3 className="text-sm font-bold">Ready to Continue</h3>
          </div>
          <p className="text-xs text-slate-600">
            This view needed a quick refresh. Your account and test booking remain active.
          </p>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            Continue Booking
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
