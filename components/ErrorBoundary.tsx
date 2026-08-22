import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
interface Props {
  children?: ReactNode;
}
interface State {
  hasError: boolean;
  error: Error | null;
}
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }
  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] h-full w-full flex items-center justify-center p-6 bg-gray-50/50 rounded-2xl">
          <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-xl border border-rose-100 text-center">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">
              Oops, Terjadi Kesalahan
            </h2>
            <p className="text-gray-600 dark:text-gray-500 mb-8 leading-relaxed">
              Komponen ini mengalami masalah saat dimuat. Silakan muat ulang
              halaman atau kembali ke Beranda.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <RefreshCw size={18} />
                Muat Ulang Halaman
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
