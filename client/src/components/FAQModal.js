// client/src/components/FAQModal.js
import React, { useEffect, useRef } from "react";

export default function FAQModal({ open, onClose }) {
  const previouslyFocused = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement;
    if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    if (modalRef.current) {
        modalRef.current.focus();
    }

    return () => {
      document.body.style.overflow = prevOverflow || "";
      if (previouslyFocused.current?.focus) {
        previouslyFocused.current.focus();
      }
    };
  }, [open]);

  if (!open) return null;

  return (
    // FIX 1: z-[9999] ensures this sits on top of sticky headers/search bars brute force TD::Find alternative pero kahit wag muna
    <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in" 
        role="dialog" 
        aria-modal="true"
        aria-labelledby="faq-title"
    >
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      <div 
        ref={modalRef}
        className="relative z-[10000] w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden outline-none"
        tabIndex={-1}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white">
          <h3 id="faq-title" className="text-lg font-bold text-slate-800">Frequently Asked Questions</h3>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Close FAQ"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto bg-white">
          <div className="space-y-1">
            <h4 className="font-semibold text-slate-900">How do I join a ride queue?</h4>
            <p className="text-sm text-slate-600 leading-relaxed"> To join a ride queue, you must present your QR code to a ride attendant and let them scan it. Click the MyQr Button at the home page or navigate through the Menu.</p>
          </div>

          <div className="space-y-1">
            <h4 className="font-semibold text-slate-900">What is Snow World access?</h4>
            <p className="text-sm text-slate-600 leading-relaxed"> Snow World Acess refers to the ticket type you bought at the entrance, which will give you access to Star City's Snow World Attraction.</p>
          </div>

          <div className="space-y-1">
            <h4 className="font-semibold text-slate-900">Can I cancel my queue?</h4>
            <p className="text-sm text-slate-600 leading-relaxed"> Yes, go to My Queues look for the active queue you wish to cancel and press cancel.</p>
          </div>
          
          <div className="pt-2">
            <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded-lg border border-amber-100">
                <strong>Note:</strong> Queues are subject to park capacity and ride maintenance schedules.
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button 
            onClick={onClose} 
            className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 shadow-sm transition-all text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}