import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

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
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Arzon.tj ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('arzontj_ads_v2');
      localStorage.removeItem('arzontj_favorites_v2');
      localStorage.removeItem('arzontj_lang');
      localStorage.removeItem('arzontj_conversations_v2');
      localStorage.removeItem('arzontj_conversations_v3');
      sessionStorage.clear();
      if ('caches' in window) {
        caches.keys().then((keys) => {
          for (const key of keys) caches.delete(key);
        });
      }
    } catch {
      // ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 text-center shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center mb-5">
              <RotateCcw className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Arzon.tj - Навсозии саҳифа
            </h2>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Барои ворид шудан ба барнома лутфан тугмаи сабзи поёнро пахш намоед, то саҳифа нав шавад.
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <RotateCcw className="w-4 h-4" />
                Навсозии саҳифа (Обновить)
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Тоза кардани кэши маҳаллӣ (Очистить кэш)
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
