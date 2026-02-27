
import React from 'react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-[15px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-10 text-center space-y-6">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500 shadow-inner">
            <i className="fas fa-exclamation-triangle text-3xl"></i>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">{title}</h4>
            <p className="text-sm text-slate-500 leading-relaxed px-4">{message}</p>
          </div>

          <div className="flex flex-col space-y-3 pt-4">
            <button 
              onClick={onConfirm}
              className="w-full bg-rose-600 text-white py-4 rounded-[10px] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-rose-700 transition-all"
            >
              Supprimer
            </button>
            <button 
              onClick={onCancel}
              className="w-full bg-slate-100 text-slate-500 py-4 rounded-[10px] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-200 transition-all"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
