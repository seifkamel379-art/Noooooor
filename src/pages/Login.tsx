import { useState } from 'react';
import { EGYPT_GOVERNORATES } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

interface LoginProps {
  onComplete: () => void;
}

export function Login({ onComplete }: LoginProps) {
  const [name, setName] = useState('');
  const [govId, setGovId] = useState('');
  const [step, setStep] = useState<1 | 2>(1);

  const saveProfile = (finalName: string) => {
    const gov = EGYPT_GOVERNORATES.find(g => g.id === govId);
    if (!gov) return;
    const existing = (() => {
      try { return JSON.parse(localStorage.getItem('user_profile') ?? ''); } catch { return null; }
    })();
    const uid = existing?.uid || crypto.randomUUID();
    const profile = {
      uid,
      name: finalName.trim(),
      governorateId: govId,
      governorateName: gov.name,
      lat: gov.lat,
      lng: gov.lng,
      photo: existing?.photo || '',
    };
    localStorage.setItem('user_profile', JSON.stringify(profile));
    onComplete();
  };

  const cardStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1.5px solid rgba(255,255,255,0.09)',
  };

  return (
    <div className="min-h-screen bg-[#060810] flex flex-col items-center justify-center p-5" dir="rtl">

      {/* Background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] opacity-[0.07] rounded-full"
          style={{ background: 'radial-gradient(circle, #C19A6B, transparent)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 opacity-[0.05] rounded-full"
          style={{ background: 'radial-gradient(circle, #C19A6B, transparent)', filter: 'blur(60px)' }} />
      </div>

      <div className="relative z-10 w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="relative mx-auto mb-2 w-28 h-28 flex items-center justify-center">
            <div className="absolute inset-0 rounded-3xl"
              style={{ boxShadow: '0 0 50px rgba(193,154,107,0.18)' }} />
            <img src="/logo.png" alt="شعار نور"
              className="w-full h-full object-contain rounded-3xl" />
          </div>
          <p className="text-white/35 text-[11px] tracking-widest mt-1"
            style={{ fontFamily: '"Tajawal", sans-serif' }}>
            تطبيق إسلامي شامل
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            /* ─── الخطوة ١: الاسم ─── */
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-4"
            >
              <div className="rounded-2xl p-6" style={cardStyle}>
                <h2 className="text-white text-lg font-bold text-center mb-1"
                  style={{ fontFamily: '"Tajawal", sans-serif' }}>
                  أدخل اسمك
                </h2>
                <p className="text-white/35 text-xs text-center mb-5"
                  style={{ fontFamily: '"Tajawal", sans-serif' }}>
                  سيظهر اسمك في التطبيق
                </p>

                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="اكتب اسمك هنا..."
                  autoFocus
                  className="w-full rounded-xl px-4 py-3.5 text-white outline-none transition-all mb-4"
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1.5px solid rgba(255,255,255,0.12)',
                    fontFamily: '"Tajawal", sans-serif',
                    fontSize: '1rem',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(193,154,107,0.6)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                  onKeyDown={e => e.key === 'Enter' && name.trim() && setStep(2)}
                />

                <button
                  onClick={() => name.trim() && setStep(2)}
                  disabled={!name.trim()}
                  className="w-full py-3.5 font-bold rounded-xl transition-all disabled:opacity-30 text-sm"
                  style={{
                    background: 'linear-gradient(135deg, #C19A6B, #d4a97c)',
                    color: '#000',
                    fontFamily: '"Tajawal", sans-serif',
                    boxShadow: '0 4px 20px rgba(193,154,107,0.25)',
                  }}
                >
                  التالي →
                </button>
              </div>
            </motion.div>

          ) : (
            /* ─── الخطوة ٢: المحافظة ─── */
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-3"
            >
              {/* Header */}
              <div className="rounded-2xl px-4 py-3.5" style={cardStyle}>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setStep(1); setGovId(''); }}
                    className="text-white/40 p-1.5 rounded-lg flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <div>
                    <h2 className="text-white text-sm font-bold"
                      style={{ fontFamily: '"Tajawal", sans-serif' }}>
                      أهلاً {name}
                    </h2>
                    <p className="text-white/35 text-xs"
                      style={{ fontFamily: '"Tajawal", sans-serif' }}>
                      اختر محافظتك لمواقيت الصلاة
                    </p>
                  </div>
                </div>
              </div>

              {/* Grid المحافظات */}
              <div
                className="rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.08)' }}
              >
                <div className="overflow-y-auto" style={{ maxHeight: '50vh' }}>
                  <div className="grid grid-cols-3 gap-2 p-3">
                    {EGYPT_GOVERNORATES.map(gov => {
                      const selected = govId === gov.id;
                      return (
                        <motion.button
                          key={gov.id}
                          onClick={() => setGovId(gov.id)}
                          whileTap={{ scale: 0.93 }}
                          className="relative flex flex-col items-center gap-1.5 rounded-xl p-2 pt-2.5 transition-all duration-200"
                          style={{
                            background: selected
                              ? 'linear-gradient(135deg, rgba(193,154,107,0.22), rgba(193,154,107,0.08))'
                              : 'rgba(255,255,255,0.04)',
                            border: selected
                              ? '1.5px solid rgba(193,154,107,0.65)'
                              : '1.5px solid rgba(255,255,255,0.07)',
                            boxShadow: selected ? '0 0 14px rgba(193,154,107,0.18)' : 'none',
                          }}
                        >
                          <div
                            className="w-11 h-8 rounded-md overflow-hidden flex items-center justify-center"
                            style={{ background: 'rgba(255,255,255,0.06)' }}
                          >
                            <img
                              src={gov.flag}
                              alt={gov.name}
                              className="w-full h-full object-cover"
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          </div>
                          <span
                            className="text-[10px] font-bold leading-tight text-center"
                            style={{
                              fontFamily: '"Tajawal", sans-serif',
                              color: selected ? '#C19A6B' : 'rgba(255,255,255,0.65)',
                            }}
                          >
                            {gov.name}
                          </span>
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

              {/* زرار الدخول */}
              <button
                onClick={() => govId && saveProfile(name)}
                disabled={!govId}
                className="w-full py-4 font-bold rounded-2xl transition-all disabled:opacity-30"
                style={{
                  background: govId ? 'linear-gradient(135deg, #C19A6B, #d4a97c)' : 'rgba(255,255,255,0.07)',
                  color: govId ? '#000' : 'rgba(255,255,255,0.25)',
                  fontFamily: '"Tajawal", sans-serif',
                  fontSize: '0.95rem',
                  boxShadow: govId ? '0 4px 20px rgba(193,154,107,0.28)' : 'none',
                }}
              >
                {govId
                  ? `دخول إلى نور — ${EGYPT_GOVERNORATES.find(g => g.id === govId)?.name}`
                  : 'اختر محافظتك أولاً'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-white/18 text-[11px] mt-5"
          style={{ fontFamily: '"Tajawal", sans-serif' }}>
          يمكنك تغيير هذه المعلومات لاحقاً من صفحة المزيد
        </p>
      </div>
    </div>
  );
}
