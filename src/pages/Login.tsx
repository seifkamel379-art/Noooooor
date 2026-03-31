import { useState } from 'react';
import { EGYPT_GOVERNORATES } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { signInWithGoogle } from '@/lib/firebase';

interface LoginProps {
  onComplete: () => void;
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M43.6 20.5h-19.7v7.5h11.3c-1.1 5.2-5.6 8.8-11.3 8.8-6.9 0-12.5-5.6-12.5-12.5s5.6-12.5 12.5-12.5c3.1 0 5.9 1.1 8 3l5.7-5.7C34 6.2 29.3 4 24.3 4 13 4 4 13 4 24.3S13 44.5 24.3 44.5c10.6 0 19.7-7.7 19.7-20.2 0-1.3-.1-2.6-.4-3.8z" fill="#FFC107"/>
      <path d="M6.3 14.7l6.6 4.8C14.5 16 19 12.5 24.3 12.5c3.1 0 5.9 1.1 8 3l5.7-5.7C34 6.2 29.3 4 24.3 4 16.4 4 9.6 8.3 6.3 14.7z" fill="#FF3D00"/>
      <path d="M24.3 44.5c4.9 0 9.5-1.8 13-4.8l-6-5.1c-1.9 1.4-4.3 2.2-7 2.2-5.6 0-10.1-3.5-11.3-8.7l-6.5 5C9.7 40.2 16.5 44.5 24.3 44.5z" fill="#4CAF50"/>
      <path d="M43.6 20.5H24v7.5h11.3c-.5 2.5-2 4.7-4.2 6.1l6 5.1c3.6-3.3 5.5-8.1 5.5-13.5 0-1.3-.1-2.6-.4-3.8l1.4.6z" fill="#1976D2"/>
    </svg>
  );
}

export function Login({ onComplete }: LoginProps) {
  const [name, setName] = useState('');
  const [govId, setGovId] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const [googleUser, setGoogleUser] = useState<{ uid: string; name: string; photo: string } | null>(null);

  const saveProfile = (finalName: string, uid: string) => {
    const gov = EGYPT_GOVERNORATES.find(g => g.id === govId);
    if (!gov) return;
    const profile = {
      uid,
      name: finalName.trim(),
      governorateId: govId,
      governorateName: gov.name,
      lat: gov.lat,
      lng: gov.lng,
      photo: googleUser?.photo ?? '',
    };
    localStorage.setItem('user_profile', JSON.stringify(profile));
    onComplete();
  };

  const handleManualSubmit = () => {
    if (!name.trim() || !govId) return;
    const existing = (() => {
      try { return JSON.parse(localStorage.getItem('user_profile') ?? ''); } catch { return null; }
    })();
    const uid = existing?.uid || crypto.randomUUID();
    saveProfile(name, uid);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setGoogleError('');
    try {
      const user = await signInWithGoogle();
      if (!user) throw new Error('فشل تسجيل الدخول');
      setGoogleUser(user);
      setName(user.name);
      setStep(2);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setGoogleError('');
      } else if (code === 'auth/unauthorized-domain') {
        setGoogleError('unauthorized-domain');
      } else if (code === 'auth/popup-blocked') {
        setGoogleError('يرجى السماح للنوافذ المنبثقة في متصفحك ثم حاول مرة أخرى');
      } else {
        console.error('Google sign-in error:', code, err);
        setGoogleError(`حدث خطأ (${code || 'unknown'}). حاول مرة أخرى.`);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGovConfirm = () => {
    if (!govId) return;
    if (googleUser) {
      saveProfile(googleUser.name, googleUser.uid);
    } else {
      handleManualSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-[#060810] flex flex-col items-center justify-center p-5" dir="rtl">

      {/* Background glow blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] opacity-[0.07] rounded-full"
          style={{ background: 'radial-gradient(circle, #C19A6B, transparent)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 opacity-[0.05] rounded-full"
          style={{ background: 'radial-gradient(circle, #C19A6B, transparent)', filter: 'blur(60px)' }} />
      </div>

      <div className="relative z-10 w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-7">
          <div className="relative mx-auto mb-2 w-28 h-28 flex items-center justify-center">
            <div className="absolute inset-0 rounded-3xl" style={{ boxShadow: '0 0 50px rgba(193,154,107,0.18)' }} />
            <img src="/logo.png" alt="شعار نور" className="w-full h-full object-contain rounded-3xl" />
          </div>
          <p className="text-white/35 text-[11px] tracking-widest mt-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            تطبيق إسلامي شامل
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            /* ── Step 1: Name + Google ── */
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col gap-3"
            >
              {/* Google sign-in button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold transition-all disabled:opacity-60"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1.5px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                  fontFamily: '"Tajawal", sans-serif',
                  fontSize: '1rem',
                }}
              >
                {googleLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                {googleLoading ? 'جارٍ التسجيل...' : 'تسجيل الدخول بجوجل'}
              </button>

              {googleError === 'unauthorized-domain' ? (
                <div
                  className="rounded-xl p-4 text-xs"
                  style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)' }}
                  dir="rtl"
                >
                  <p className="text-red-300 font-bold mb-2" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                    يجب إضافة النطاق في Firebase Console:
                  </p>
                  <p className="text-white/60 mb-2" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                    ١. افتح: Firebase Console → Authentication → Settings → Authorized domains
                  </p>
                  <p className="text-white/60 mb-2" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                    ٢. اضغط «Add domain» وأضف هذا النطاق:
                  </p>
                  <code
                    className="block text-[10px] text-yellow-300 break-all p-2 rounded-lg"
                    style={{ background: 'rgba(0,0,0,0.4)', direction: 'ltr', textAlign: 'left' }}
                  >
                    {window.location.hostname}
                  </code>
                </div>
              ) : googleError ? (
                <p className="text-red-400 text-xs text-center" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                  {googleError}
                </p>
              ) : null}

              {/* Divider */}
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
                <span className="text-white/30 text-xs" style={{ fontFamily: '"Tajawal", sans-serif' }}>أو</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
              </div>

              {/* Manual name entry */}
              <div
                className="rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.09)' }}
              >
                <h2 className="text-white text-base font-bold text-center mb-1"
                  style={{ fontFamily: '"Tajawal", sans-serif' }}>
                  أدخل اسمك
                </h2>
                <p className="text-white/35 text-xs text-center mb-4"
                  style={{ fontFamily: '"Tajawal", sans-serif' }}>
                  سيظهر اسمك في التطبيق
                </p>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="اكتب اسمك هنا..."
                  className="w-full rounded-xl px-4 py-3 text-white outline-none transition-all mb-3"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1.5px solid rgba(255,255,255,0.14)',
                    fontFamily: '"Tajawal", sans-serif',
                    fontSize: '0.95rem',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(193,154,107,0.6)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.14)')}
                  onKeyDown={e => e.key === 'Enter' && name.trim() && setStep(2)}
                />
                <button
                  onClick={() => name.trim() && setStep(2)}
                  disabled={!name.trim()}
                  className="w-full py-3.5 font-bold rounded-xl transition-all disabled:opacity-35 text-sm"
                  style={{
                    background: 'linear-gradient(135deg, #C19A6B, #d4a97c)',
                    color: '#000',
                    fontFamily: '"Tajawal", sans-serif',
                    boxShadow: '0 4px 20px rgba(193,154,107,0.22)',
                  }}
                >
                  التالي ←
                </button>
              </div>
            </motion.div>
          ) : (
            /* ── Step 2: Governorate ── */
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col gap-3"
            >
              {/* Header */}
              <div
                className="rounded-2xl px-4 py-3.5"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.09)' }}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setStep(1); setGoogleUser(null); setGovId(''); }}
                    className="text-white/40 p-1 rounded-lg transition-colors"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <div className="flex items-center gap-2 flex-1">
                    {googleUser?.photo ? (
                      <img
                        src={googleUser.photo}
                        alt={googleUser.name}
                        className="w-9 h-9 rounded-full object-cover"
                        style={{ border: '1.5px solid rgba(193,154,107,0.5)' }}
                      />
                    ) : null}
                    <div>
                      <h2 className="text-white text-base font-bold leading-tight"
                        style={{ fontFamily: '"Tajawal", sans-serif' }}>
                        أهلاً {googleUser?.name || name}
                      </h2>
                      <p className="text-white/35 text-xs" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                        اختر محافظتك لمواقيت الصلاة
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Governorate grid */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.08)' }}
              >
                <div className="overflow-y-auto" style={{ maxHeight: '48vh' }}>
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
                          <div className="w-11 h-8 rounded-md overflow-hidden flex items-center justify-center"
                            style={{ background: 'rgba(255,255,255,0.06)' }}>
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

              {/* Confirm button */}
              <button
                onClick={handleGovConfirm}
                disabled={!govId}
                className="w-full py-4 font-bold rounded-2xl transition-all disabled:opacity-35"
                style={{
                  background: govId ? 'linear-gradient(135deg, #C19A6B, #d4a97c)' : 'rgba(255,255,255,0.08)',
                  color: govId ? '#000' : 'rgba(255,255,255,0.3)',
                  fontFamily: '"Tajawal", sans-serif',
                  fontSize: '0.95rem',
                  boxShadow: govId ? '0 4px 20px rgba(193,154,107,0.25)' : 'none',
                }}
              >
                {govId
                  ? `دخول للتطبيق — ${EGYPT_GOVERNORATES.find(g => g.id === govId)?.name}`
                  : 'اختر محافظتك أولاً'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-white/18 text-xs mt-5" style={{ fontFamily: '"Tajawal", sans-serif' }}>
          يمكنك تغيير هذه المعلومات لاحقاً من صفحة المزيد
        </p>
      </div>
    </div>
  );
}
