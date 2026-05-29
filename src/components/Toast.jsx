/* eslint-disable react-refresh/only-export-components */
import { useState, createContext, useContext, useCallback } from 'react';
import { CheckCircle2, AlertCircle, X, Trash2 } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const showConfirm = useCallback((message, onConfirm, title = 'Konfirmasi') => {
    setConfirmDialog({ message, onConfirm, title });
  }, []);

  const handleConfirm = () => {
    confirmDialog?.onConfirm();
    setConfirmDialog(null);
  };

  return (
    <ToastContext.Provider value={{ showToast, showConfirm }}>
      {children}

      {/* Toast Notification — slides in from top */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-slide-down w-[90%] max-w-md">
          <div className={`flex items-center gap-3 p-4 border-4 border-neo-dark rounded-xl shadow-[4px_4px_0_0_#1E1E1E] font-bold ${
            toast.type === 'success' ? 'bg-[#4ADE80]' : toast.type === 'error' ? 'bg-red-400 text-white' : 'bg-neo-yellow'
          }`}>
            {toast.type === 'success' ? <CheckCircle2 size={22} className="shrink-0" /> : <AlertCircle size={22} className="shrink-0" />}
            <span className="flex-1 text-sm">{toast.message}</span>
            <button onClick={() => setToast(null)} className="shrink-0 hover:opacity-60 transition-opacity">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Confirm Dialog — Neo Brutalism style */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white border-4 border-neo-dark rounded-xl p-6 shadow-[8px_8px_0_0_#1E1E1E] max-w-sm w-full text-center animate-scale-in">
            <div className="w-16 h-16 bg-red-100 border-4 border-neo-dark rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={28} className="text-red-500" />
            </div>
            <h3 className="text-xl font-black mb-2">{confirmDialog.title}</h3>
            <p className="text-sm font-bold text-gray-500 mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDialog(null)}
                className="flex-1 bg-gray-200 border-4 border-neo-dark rounded-lg py-2.5 font-black shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 bg-red-400 text-white border-4 border-neo-dark rounded-lg py-2.5 font-black shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};
