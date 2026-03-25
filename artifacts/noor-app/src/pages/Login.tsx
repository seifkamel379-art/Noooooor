import { useState } from 'react';
import { EGYPT_GOVERNORATES } from '@/lib/constants';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface LoginProps {
  onComplete: () => void;
}


export function Login({ onComplete }: LoginProps) {
  const [name, setName] = useState('');
  const [govId, setGovId] = useState('');
  const [step, setStep] = useState<1 | 2>(1);

  const handleSubmit = () => {
    if (!name.trim() || !govId) return;
    const gov = EGYPT_GOVERNORATES.find(g => g.id === govId);
    if (!gov) return;
    const profile = { name: name.trim(), governorateId: govId, governorateName: gov.name, lat: gov.lat, lng: gov.lng };
    localStorage.setItem('user_profile', JSON.stringify(profile));
    onComplete();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6" dir="rtl">
      {/* Background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#C19A6B]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#C19A6B]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="relative mx-auto mb-2 w-36 h-36 flex items-center justify-center">
            <div className="absolute inset-0 rounded-3xl" style={{ boxShadow: '0 0 40px rgba(193,154,107,0.2)' }} />
            <img
              src="/logo.png"
              alt="شعار نور"
              className="w-full h-full object-contain rounded-3xl"
            />
          </div>
          <p className="text-white/40 text-xs tracking-widest mt-1">تطبيق إسلامي شامل</p>
        </div>

        {step === 1 ? (
          /* ── Step 1: Name ── */
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-white text-lg font-bold text-center mb-1">أدخل بياناتك</h2>
            <p className="text-white/40 text-xs text-center mb-5">أدخل اسمك لمتابعة التسجيل</p>
            <div className="mb-4">
              <label className="text-white/60 text-xs mb-1.5 block">الاسم</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="اكتب اسمك هنا..."
                className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3.5 text-white placeholder:text-white/30 outline-none focus:border-[#C19A6B]/60 focus:ring-2 focus:ring-[#C19A6B]/20 transition-all text-base"
                onKeyDown={e => e.key === 'Enter' && name.trim() && setStep(2)}
              />
            </div>
            <button
              onClick={() => name.trim() && setStep(2)}
              disabled={!name.trim()}
              className="w-full py-4 font-bold rounded-2xl transition-all disabled:opacity-40 hover:opacity-90 active:scale-98 shadow-lg text-base"
              style={{ background: 'linear-gradient(135deg, #C19A6B, #d4a97c)', color: '#000', boxShadow: '0 4px 20px rgba(193,154,107,0.25)' }}
            >
              التالي ←
            </button>
          </div>
        ) : (
          /* ── Step 2: Governorate cards ── */
          <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl px-5 py-4">
              <div className="flex items-center gap-2">
                <button onClick={() => setStep(1)} className="text-white/50 hover:text-white p-1">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <div>
                  <h2 className="text-white text-lg font-bold">أهلاً {name}</h2>
                  <p className="text-white/40 text-xs">اختر محافظتك لمواقيت الصلاة</p>
                </div>
              </div>
            </div>

            {/* Governorate grid */}
            <div
              className="rounded-3xl border border-white/10 overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)' }}
            >
              <div
                className="overflow-y-auto"
                style={{ maxHeight: '52vh' }}
              >
                <div className="grid grid-cols-3 gap-2 p-3">
                  {EGYPT_GOVERNORATES.map(gov => {
                    const selected = govId === gov.id;
                    return (
                      <motion.button
                        key={gov.id}
                        onClick={() => setGovId(gov.id)}
                        whileTap={{ scale: 0.94 }}
                        className="relative flex flex-col items-center gap-1.5 rounded-2xl p-2 pt-2.5 transition-all duration-200"
                        style={{
                          background: selected
                            ? 'linear-gradient(135deg, rgba(193,154,107,0.25), rgba(193,154,107,0.1))'
                            : 'rgba(255,255,255,0.04)',
                          border: selected
                            ? '1.5px solid rgba(193,154,107,0.7)'
                            : '1.5px solid rgba(255,255,255,0.07)',
                          boxShadow: selected ? '0 0 14px rgba(193,154,107,0.2)' : 'none',
                        }}
                      >
                        {/* Flag image */}
                        <div className="w-12 h-8 rounded-md overflow-hidden flex items-center justify-center"
                          style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <img
                            src={gov.flag}
                            alt={gov.name}
                            className="w-full h-full object-cover"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        </div>
                        {/* Name */}
                        <span
                          className="text-[10px] font-bold leading-tight text-center"
                          style={{
                            fontFamily: '"Tajawal", sans-serif',
                            color: selected ? '#C19A6B' : 'rgba(255,255,255,0.7)',
                          }}
                        >
                          {gov.name}
                        </span>
                        {/* Selected checkmark */}
                        {selected && (
                          <div
                            className="absolute top-1 left-1 w-4 h-4 rounded-full flex items-center justify-center"
                            style={{ background: '#C19A6B' }}
                          >
                            <Check className="w-2.5 h-2.5 text-black" />
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Confirm button */}
            <button
              onClick={handleSubmit}
              disabled={!govId}
              className="w-full py-4 font-bold rounded-2xl transition-all disabled:opacity-40 hover:opacity-90 active:scale-98 shadow-lg text-base"
              style={{ background: 'linear-gradient(135deg, #C19A6B, #d4a97c)', color: '#000', boxShadow: '0 4px 20px rgba(193,154,107,0.25)' }}
            >
              {govId
                ? `دخول للتطبيق — ${EGYPT_GOVERNORATES.find(g => g.id === govId)?.name}`
                : 'اختر محافظتك أولاً'}
            </button>
          </div>
        )}

        <p className="text-center text-white/20 text-xs mt-5">
          يمكنك تغيير هذه المعلومات لاحقاً من صفحة المزيد
        </p>
      </div>
    </div>
  );
}
