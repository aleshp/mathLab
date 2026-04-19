// src/components/TermsPage.tsx
import React, { useState } from 'react';
import { PrivacyContent, TermsContent, RefundContent } from '../lib/legalContent';
import { ArrowLeft, FileText, Shield, DollarSign } from 'lucide-react';

export function TermsPage() {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'refund'>('terms');

  return (
    <div className="min-h-screen bg-slate-900 text-slate-300 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="bg-slate-800 p-2 rounded-xl">
              <FileText className="w-8 h-8 text-cyan-400" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Правовая информация</h1>
          </div>
          <a href="/" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white text-sm font-bold flex items-center gap-2 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            На главную
          </a>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button 
            onClick={() => setActiveTab('terms')}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
              activeTab === 'terms' ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Условия использования
          </button>
          <button 
            onClick={() => setActiveTab('privacy')}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
              activeTab === 'privacy' ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Конфиденциальность
          </button>
          <button 
            onClick={() => setActiveTab('refund')}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
              activeTab === 'refund' ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Политика возврата
          </button>
        </div>

        {/* Content */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 md:p-10 leading-relaxed text-base md:text-lg shadow-xl">
          {activeTab === 'terms' && <TermsContent />}
          {activeTab === 'privacy' && <PrivacyContent />}
          {activeTab === 'refund' && <RefundContent />}
        </div>

        {/* Footer for Paddle Compliance */}
        <div className="mt-12 text-center text-xs text-slate-600 border-t border-slate-800 pt-6">
          <p>MathLab PvP © {new Date().getFullYear()}. All rights reserved.</p>
          <p className="mt-1">Payments are processed by Paddle.com</p>
        </div>

      </div>
    </div>
  );
}