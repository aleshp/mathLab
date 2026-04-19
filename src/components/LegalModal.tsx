// src/components/LegalModal.tsx
import { X, Shield, FileText, DollarSign } from 'lucide-react';
import { PrivacyContent, TermsContent, RefundContent } from '../lib/legalContent';

type LegalType = 'privacy' | 'terms' | 'refund';

type Props = {
  type: LegalType;
  onClose: () => void;
};

export function LegalModal({ type, onClose }: Props) {
  const isPrivacy = type === 'privacy';
  const isTerms = type === 'terms';
  const isRefund = type === 'refund';

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl h-[90vh] rounded-3xl shadow-2xl flex flex-col relative overflow-hidden">
        
        {/* Шапка */}
        <div className="p-6 border-b border-slate-700 bg-slate-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              {isPrivacy ? <Shield className="w-6 h-6 text-cyan-400" /> : 
               isRefund ? <DollarSign className="w-6 h-6 text-emerald-400" /> :
               <FileText className="w-6 h-6 text-amber-400" />}
            </div>
            <h2 className="text-2xl font-bold text-white">
              {isPrivacy ? 'Политика конфиденциальности' : isTerms ? 'Пользовательское соглашение' : 'Политика возврата'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Контент */}
        <div className="flex-1 overflow-y-auto p-8 text-slate-300 space-y-6 custom-scrollbar leading-relaxed text-sm md:text-base">
          {isPrivacy && <PrivacyContent />}
          {isTerms && <TermsContent />}
          {isRefund && <RefundContent />}
        </div>

        {/* Футер */}
        <div className="p-6 border-t border-slate-700 bg-slate-800/50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors font-bold"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
}