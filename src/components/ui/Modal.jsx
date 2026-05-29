
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, icon }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border-4 border-neo-dark rounded-2xl shadow-[8px_8px_0_0_#1E1E1E] max-w-md w-full relative max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Modal Header */}
        <div className="bg-neo-yellow border-b-4 border-neo-dark rounded-t-xl p-5 md:p-6 relative">
          <button 
            onClick={onClose}
            type="button"
            className="absolute right-3 top-3 bg-white border-3 border-neo-dark w-9 h-9 rounded-full font-black hover:bg-red-400 hover:text-white transition-colors flex items-center justify-center shadow-[2px_2px_0_0_#1E1E1E] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-3 mb-2">
            {icon && (
              <div className="w-12 h-12 bg-white border-3 border-neo-dark rounded-lg flex items-center justify-center shadow-[2px_2px_0_0_#1E1E1E]">
                {icon}
              </div>
            )}
            <div>
              <h2 className="text-xl md:text-2xl font-black leading-tight">{title}</h2>
            </div>
          </div>
        </div>
        
        {/* Modal Body */}
        <div className="p-5 md:p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
