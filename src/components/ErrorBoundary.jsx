import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Auto-reload on ChunkLoadError (very common after deployments)
    if (
      error.name === 'ChunkLoadError' || 
      error.message?.includes('Failed to fetch dynamically imported module') ||
      error.message?.includes('error loading dynamically imported module')
    ) {
      console.warn('ChunkLoadError detected, reloading page...');
      window.location.reload();
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neo-bg flex flex-col items-center justify-center p-4">
          <div className="bg-[#FFB5C6] border-4 border-neo-dark rounded-2xl p-6 md:p-8 max-w-md w-full text-center shadow-[8px_8px_0_0_#1E1E1E] animate-scale-in">
            <div className="w-16 h-16 bg-white border-4 border-neo-dark rounded-full flex items-center justify-center mx-auto mb-6 shadow-[2px_2px_0_0_#1E1E1E]">
              <AlertTriangle size={32} className="text-neo-dark" />
            </div>
            
            <h1 className="text-3xl font-black mb-3 uppercase tracking-tight text-neo-dark">
              Oops, Ada Masalah!
            </h1>
            
            <p className="font-bold text-gray-700 mb-6 text-sm">
              Terjadi kesalahan sistem saat memuat halaman ini. Silakan coba muat ulang halaman.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-white/50 border-2 border-neo-dark rounded-lg p-3 text-left text-xs font-mono mb-6 overflow-x-auto max-h-40">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-neo-yellow border-4 border-neo-dark rounded-xl py-3 font-black shadow-[4px_4px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} /> Muat Ulang
              </button>
              
              <button
                onClick={this.handleReset}
                className="flex-1 bg-white border-4 border-neo-dark rounded-xl py-3 font-black shadow-[4px_4px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center gap-2"
              >
                <Home size={18} /> Beranda
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
