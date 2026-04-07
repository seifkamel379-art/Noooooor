import { useState } from 'react';
import { EGYPT_GOVERNORATES } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, Mail, Lock, Eye, EyeOff, ChevronRight,
  UserCircle2, LogIn, UserPlus, Sparkles,
} from 'lucide-react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface LoginProps {
  onComplete: () => void;
}

type Step =
  | 'welcome'
  | 'signup-email' | 'signup-password' | 'signup-city'
  | 'login-email'  | 'login-password'
  | 'guest-name'   | 'guest-city';

function InputField({
  type = 'text',
  value,
  onChange,
  placeholder,
  autoFocus,
  onEnter,
  icon,
  trailing,
}: {
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoFocus?: boolean;
  onEnter?: () => void;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      className="relative w-full rounded-2xl transition-all duration-200"
      style={{
        background: focused ? 'rgba(193,154,107,0.08)' : 'rgba(255,255,255,0.05)',
        border: focused ? '1.5px solid rgba(193,154,107,0.55)' : '1.5px solid rgba(255,255,255,0.1)',
        boxShadow: focused ? '0 0 0 3px rgba(193,154,107,0.1)' : 'none',
      }}
    >
      {icon && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: focused ? '#C19A6B' : 'rgba(255,255,255,0.3)' }}>
          {icon}
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full bg-transparent outline-none py-4 text-white placeholder-white/25"
        style={{
          fontFamily: '"Tajawal", sans-serif',
          fontSize: '1rem',
          paddingRight: icon ? '3rem' : '1.25rem',
          paddingLeft: trailing ? '3rem' : '1.25rem',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={e => e.key === 'Enter' && onEnter?.()}
      />
      {trailing && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
          {trailing}
        </div>
      )}
    </div>
  );
}

function CityPicker({
  govId,
  onSelect,
}: {
  govId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.07)' }}
    >
      <div className="overflow-y-auto" style={{ maxHeight: '44vh' }}>
        <div className="grid grid-cols-3 gap-2 p-3">
          {EGYPT_GOVERNORATES.map(gov => {
            const selected = govId === gov.id;
            return (
              <motion.button
                key={gov.id}
                onClick={() => onSelect(gov.id)}
                whileTap={{ scale: 0.93 }}
                className="relative flex flex-col items-center gap-1.5 rounded-xl p-2 pt-2.5 transition-all duration-200"
                style={{
                  background: selected
                    ? 'linear-gradient(135deg,rgba(193,154,107,0.22),rgba(193,154,107,0.08))'
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
                    color: selected ? '#C19A6B' : 'rgba(255,255,255,0.55)',
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
  );
}

function ErrorBadge({ msg }: { msg: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl px-4 py-3 text-sm text-center flex items-center justify-center gap-2"
      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', fontFamily: '"Tajawal", sans-serif', color: '#f87171' }}
    >
      {msg}
    </motion.div>
  );
}

function mapFirebaseError(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':    return 'هذا البريد الإلكتروني مستخدم بالفعل';
    case 'auth/invalid-email':            return 'البريد الإلكتروني غير صحيح';
    case 'auth/weak-password':            return 'كلمة السر ضعيفة جداً (٦ أحرف على الأقل)';
    case 'auth/user-not-found':           return 'لا يوجد حساب بهذا البريد الإلكتروني';
    case 'auth/wrong-password':           return 'كلمة السر غير صحيحة';
    case 'auth/invalid-credential':       return 'البريد الإلكتروني أو كلمة السر غير صحيحة';
    case 'auth/too-many-requests':        return 'محاولات كثيرة، حاول مرة أخرى لاحقاً';
    case 'auth/network-request-failed':   return 'تحقق من اتصال الإنترنت وحاول مجدداً';
    default:                              return 'حدث خطأ، حاول مرة أخرى';
  }
}

function computeLeaderboardId(uid: string, isGuest: boolean, name: string, govId: string): string {
  if (!isGuest && uid) return uid;
  return btoa(encodeURIComponent(`${name}-${govId}`)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
}

/* ── Decorative Islamic Star ── */
function IslamicStar({ size = 60, opacity = 0.12 }: { size?: number; opacity?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ opacity }}>
      <polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35"
        fill="#C19A6B" />
    </svg>
  );
}

export function Login({ onComplete }: LoginProps) {
  const [step, setStep]           = useState<Step>('welcome');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [name, setName]           = useState('');
  const [govId, setGovId]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [loginUid, setLoginUid]   = useState<string | null>(null);

  const clearError = () => setError('');

  const saveProfile = (uid: string, displayName: string, userEmail: string | null, selectedGovId: string, isGuest: boolean) => {
    const gov = EGYPT_GOVERNORATES.find(g => g.id === selectedGovId);
    if (!gov) return;
    const existing = (() => {
      try { return JSON.parse(localStorage.getItem('user_profile') ?? ''); } catch { return null; }
    })();
    const leaderboardId = computeLeaderboardId(uid, isGuest, displayName.trim(), selectedGovId);
    const profile = {
      uid,
      name: displayName.trim(),
      email: userEmail ?? '',
      governorateId: selectedGovId,
      governorateName: gov.name,
      lat: gov.lat,
      lng: gov.lng,
      photo: existing?.photo || '',
      isGuest,
      leaderboardId,
    };
    localStorage.setItem('user_profile', JSON.stringify(profile));
    onComplete();
  };

  const handleSignupCity = async (selectedGov: string) => {
    if (!selectedGov) return;
    if (loginUid) {
      const displayName = email.split('@')[0];
      saveProfile(loginUid, displayName, email.trim(), selectedGov, false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const uid = cred.user.uid;
      const displayName = email.split('@')[0];
      saveProfile(uid, displayName, email.trim(), selectedGov, false);
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code ?? '';
      setError(mapFirebaseError(code));
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    setError('');
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const uid  = cred.user.uid;
      const existing = (() => {
        try { return JSON.parse(localStorage.getItem('user_profile') ?? ''); } catch { return null; }
      })();
      if (existing?.uid === uid) {
        existing.isGuest = false;
        existing.email   = email.trim();
        if (!existing.leaderboardId) existing.leaderboardId = uid;
        localStorage.setItem('user_profile', JSON.stringify(existing));
        onComplete();
      } else {
        setLoginUid(uid);
        setLoading(false);
        setStep('signup-city');
      }
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code ?? '';
      setError(mapFirebaseError(code));
      setLoading(false);
    }
  };

  const handleGuestCity = (selectedGov: string) => {
    if (!selectedGov) return;
    const uid = crypto.randomUUID();
    saveProfile(uid, name, null, selectedGov, true);
  };

  const slide = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -16 },
    transition: { duration: 0.26 },
  };

  const BTN_GOLD = {
    background: 'linear-gradient(135deg, #C19A6B 0%, #d4aa7d 50%, #b8894f 100%)',
    color: '#1a0e00',
    fontFamily: '"Tajawal", sans-serif',
    boxShadow: '0 4px 24px rgba(193,154,107,0.35), 0 1px 0 rgba(255,255,255,0.15) inset',
    fontWeight: 700,
    fontSize: '1rem',
  } as const;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-5 overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #07090f 0%, #0c1018 50%, #06080d 100%)' }}
      dir="rtl"
    >
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Top gold glow */}
        <div
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(193,154,107,0.09) 0%, transparent 70%)', filter: 'blur(40px)' }}
        />
        {/* Bottom right glow */}
        <div
          className="absolute bottom-0 right-0 w-72 h-72 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(193,154,107,0.06) 0%, transparent 70%)', filter: 'blur(40px)' }}
        />
        {/* Decorative stars */}
        <div className="absolute top-8 right-6">
          <IslamicStar size={45} opacity={0.08} />
        </div>
        <div className="absolute bottom-24 left-4">
          <IslamicStar size={38} opacity={0.06} />
        </div>
        <div className="absolute top-1/3 left-2">
          <IslamicStar size={28} opacity={0.05} />
        </div>
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, #C19A6B 0px, transparent 1px, transparent 60px), repeating-linear-gradient(90deg, #C19A6B 0px, transparent 1px, transparent 60px)',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-sm">

        {/* ── Logo ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-8"
        >
          <div className="relative mx-auto mb-3 w-24 h-24">
            {/* Outer glow ring */}
            <div
              className="absolute -inset-2 rounded-[30px] opacity-30"
              style={{ background: 'radial-gradient(circle, #C19A6B, transparent)', filter: 'blur(12px)' }}
            />
            {/* Gold border ring */}
            <div
              className="absolute -inset-0.5 rounded-[26px]"
              style={{ background: 'linear-gradient(135deg, rgba(193,154,107,0.6), rgba(193,154,107,0.1), rgba(193,154,107,0.4))' }}
            />
            <img
              src="/logo.png"
              alt="شعار نور"
              className="relative w-full h-full object-contain rounded-3xl"
              style={{ zIndex: 1 }}
            />
          </div>
          <h1
            className="text-3xl font-bold mt-1"
            style={{
              fontFamily: '"Amiri", serif',
              background: 'linear-gradient(135deg, #e8c98a, #C19A6B, #a07840)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            نُور
          </h1>
          <p
            className="text-white/25 text-xs tracking-[0.25em] mt-0.5"
            style={{ fontFamily: '"Tajawal", sans-serif' }}
          >
            رفيقك الإسلامي الشامل
          </p>
        </motion.div>

        <AnimatePresence mode="wait">

          {/* ─── Welcome ─── */}
          {step === 'welcome' && (
            <motion.div key="welcome" {...slide} className="flex flex-col gap-3">

              {/* إنشاء حساب */}
              <button
                onClick={() => { clearError(); setStep('signup-email'); }}
                className="w-full rounded-2xl p-4 flex items-center gap-4 transition-all active:scale-[0.97]"
                style={{
                  background: 'linear-gradient(135deg, rgba(193,154,107,0.18) 0%, rgba(193,154,107,0.06) 100%)',
                  border: '1.5px solid rgba(193,154,107,0.45)',
                  boxShadow: '0 4px 24px rgba(193,154,107,0.1)',
                }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #C19A6B, #8B6340)', boxShadow: '0 4px 12px rgba(193,154,107,0.4)' }}
                >
                  <UserPlus className="w-5.5 h-5.5 text-black" size={22} />
                </div>
                <div className="text-right flex-1">
                  <p className="font-bold text-white text-sm" style={{ fontFamily: '"Tajawal", sans-serif' }}>إنشاء حساب جديد</p>
                  <p className="text-white/35 text-xs mt-0.5" style={{ fontFamily: '"Tajawal", sans-serif' }}>سجّل ببريدك الإلكتروني واحفظ بياناتك</p>
                </div>
                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(193,154,107,0.15)' }}>
                  <ChevronRight className="w-4 h-4" style={{ color: '#C19A6B' }} />
                </div>
              </button>

              {/* تسجيل دخول */}
              <button
                onClick={() => { clearError(); setStep('login-email'); }}
                className="w-full rounded-2xl p-4 flex items-center gap-4 transition-all active:scale-[0.97]"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1.5px solid rgba(255,255,255,0.09)',
                }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.12)' }}
                >
                  <LogIn className="w-5 h-5 text-white/70" />
                </div>
                <div className="text-right flex-1">
                  <p className="font-bold text-white text-sm" style={{ fontFamily: '"Tajawal", sans-serif' }}>تسجيل الدخول</p>
                  <p className="text-white/35 text-xs mt-0.5" style={{ fontFamily: '"Tajawal", sans-serif' }}>ادخل على حسابك الموجود</p>
                </div>
                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <ChevronRight className="w-4 h-4 text-white/25" />
                </div>
              </button>

              {/* دخول كضيف */}
              <button
                onClick={() => { clearError(); setStep('guest-name'); }}
                className="w-full rounded-2xl p-4 flex items-center gap-4 transition-all active:scale-[0.97]"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1.5px solid rgba(255,255,255,0.07)',
                }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.09)' }}
                >
                  <UserCircle2 className="w-5 h-5 text-white/50" />
                </div>
                <div className="text-right flex-1">
                  <p className="font-bold text-white/80 text-sm" style={{ fontFamily: '"Tajawal", sans-serif' }}>دخول كضيف</p>
                  <p className="text-white/30 text-xs mt-0.5" style={{ fontFamily: '"Tajawal", sans-serif' }}>بالاسم والمحافظة — بدون حساب</p>
                </div>
                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <ChevronRight className="w-4 h-4 text-white/20" />
                </div>
              </button>

              <p className="text-center text-white/20 text-[11px] mt-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                يمكنك تغيير هذه المعلومات لاحقاً من صفحة المزيد
              </p>
            </motion.div>
          )}

          {/* ─── Signup: Email ─── */}
          {step === 'signup-email' && (
            <motion.div key="signup-email" {...slide} className="flex flex-col gap-4">
              <button
                onClick={() => { clearError(); setStep('welcome'); }}
                className="flex items-center gap-1.5 text-white/35 text-sm"
                style={{ fontFamily: '"Tajawal", sans-serif' }}
              >
                <ChevronRight className="w-4 h-4" /> رجوع
              </button>
              <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)' }}>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'linear-gradient(135deg,#C19A6B,#8B6340)' }}>
                  <UserPlus className="w-5 h-5 text-black" />
                </div>
                <h2 className="text-white text-lg font-bold text-center mb-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>إنشاء حساب جديد</h2>
                <p className="text-white/30 text-xs text-center mb-5" style={{ fontFamily: '"Tajawal", sans-serif' }}>أدخل بريدك الإلكتروني للمتابعة</p>
                <InputField
                  type="email"
                  value={email}
                  onChange={v => { setEmail(v); clearError(); }}
                  placeholder="البريد الإلكتروني..."
                  autoFocus
                  icon={<Mail className="w-4 h-4" />}
                  onEnter={() => email.trim() && setStep('signup-password')}
                />
                {error && <div className="mt-3"><ErrorBadge msg={error} /></div>}
              </div>
              <button
                onClick={() => email.trim() && setStep('signup-password')}
                disabled={!email.trim()}
                className="w-full py-4 rounded-2xl transition-all disabled:opacity-30"
                style={BTN_GOLD}
              >
                التالي ←
              </button>
            </motion.div>
          )}

          {/* ─── Signup: Password ─── */}
          {step === 'signup-password' && (
            <motion.div key="signup-password" {...slide} className="flex flex-col gap-4">
              <button onClick={() => { clearError(); setStep('signup-email'); }} className="flex items-center gap-1.5 text-white/35 text-sm" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                <ChevronRight className="w-4 h-4" /> رجوع
              </button>
              <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)' }}>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'linear-gradient(135deg,rgba(193,154,107,0.3),rgba(193,154,107,0.1))', border: '1px solid rgba(193,154,107,0.3)' }}>
                  <Lock className="w-5 h-5 text-[#C19A6B]" />
                </div>
                <h2 className="text-white text-lg font-bold text-center mb-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>أنشئ كلمة السر</h2>
                <p className="text-white/30 text-xs text-center mb-5" style={{ fontFamily: '"Tajawal", sans-serif' }}>كلمة سر خاصة بتطبيق نُور (٦ أحرف على الأقل)</p>
                <InputField
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={v => { setPassword(v); clearError(); }}
                  placeholder="كلمة السر..."
                  autoFocus
                  icon={<Lock className="w-4 h-4" />}
                  trailing={
                    <button onClick={() => setShowPass(p => !p)} className="text-white/30 p-1">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  onEnter={() => password.length >= 6 && setStep('signup-city')}
                />
                {error && <div className="mt-3"><ErrorBadge msg={error} /></div>}
              </div>
              <button
                onClick={() => password.length >= 6 && setStep('signup-city')}
                disabled={password.length < 6}
                className="w-full py-4 rounded-2xl transition-all disabled:opacity-30"
                style={BTN_GOLD}
              >
                التالي ←
              </button>
            </motion.div>
          )}

          {/* ─── Signup: City ─── */}
          {step === 'signup-city' && (
            <motion.div key="signup-city" {...slide} className="flex flex-col gap-3">
              <button
                onClick={() => { clearError(); setStep(loginUid ? 'login-password' : 'signup-password'); }}
                className="flex items-center gap-1.5 text-white/35 text-sm"
                style={{ fontFamily: '"Tajawal", sans-serif' }}
              >
                <ChevronRight className="w-4 h-4" /> رجوع
              </button>
              <div className="rounded-2xl px-4 py-3.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)' }}>
                <p className="text-white font-bold text-sm" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                  {loginUid ? 'مرحباً من جديد! اختر محافظتك' : 'اختر محافظتك'}
                </p>
                <p className="text-white/30 text-xs mt-0.5" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                  {loginUid ? 'لاستعادة حسابك وضبط مواقيت الصلاة' : 'لتحديد مواقيت الصلاة بدقة'}
                </p>
              </div>
              <CityPicker govId={govId} onSelect={setGovId} />
              {error && <ErrorBadge msg={error} />}
              <button
                onClick={() => !loading && govId && handleSignupCity(govId)}
                disabled={!govId || loading}
                className="w-full py-4 rounded-2xl transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                style={BTN_GOLD}
              >
                {loading && <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
                {loading
                  ? (loginUid ? 'جارٍ استعادة الحساب...' : 'جارٍ إنشاء الحساب...')
                  : loginUid
                    ? `دخول — ${EGYPT_GOVERNORATES.find(g => g.id === govId)?.name ?? 'اختر محافظة'}`
                    : `إنشاء الحساب — ${EGYPT_GOVERNORATES.find(g => g.id === govId)?.name ?? 'اختر محافظة'}`
                }
              </button>
            </motion.div>
          )}

          {/* ─── Login: Email ─── */}
          {step === 'login-email' && (
            <motion.div key="login-email" {...slide} className="flex flex-col gap-4">
              <button onClick={() => { clearError(); setStep('welcome'); }} className="flex items-center gap-1.5 text-white/35 text-sm" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                <ChevronRight className="w-4 h-4" /> رجوع
              </button>
              <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)' }}>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <LogIn className="w-5 h-5 text-white/60" />
                </div>
                <h2 className="text-white text-lg font-bold text-center mb-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>تسجيل الدخول</h2>
                <p className="text-white/30 text-xs text-center mb-5" style={{ fontFamily: '"Tajawal", sans-serif' }}>أدخل بريدك الإلكتروني</p>
                <InputField
                  type="email"
                  value={email}
                  onChange={v => { setEmail(v); clearError(); }}
                  placeholder="البريد الإلكتروني..."
                  autoFocus
                  icon={<Mail className="w-4 h-4" />}
                  onEnter={() => email.trim() && setStep('login-password')}
                />
                {error && <div className="mt-3"><ErrorBadge msg={error} /></div>}
              </div>
              <button
                onClick={() => email.trim() && setStep('login-password')}
                disabled={!email.trim()}
                className="w-full py-4 rounded-2xl transition-all disabled:opacity-30"
                style={BTN_GOLD}
              >
                التالي ←
              </button>
            </motion.div>
          )}

          {/* ─── Login: Password ─── */}
          {step === 'login-password' && (
            <motion.div key="login-password" {...slide} className="flex flex-col gap-4">
              <button onClick={() => { clearError(); setStep('login-email'); }} className="flex items-center gap-1.5 text-white/35 text-sm" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                <ChevronRight className="w-4 h-4" /> رجوع
              </button>
              <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)' }}>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <Lock className="w-5 h-5 text-white/60" />
                </div>
                <h2 className="text-white text-lg font-bold text-center mb-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>أدخل كلمة السر</h2>
                <p className="text-white/30 text-xs text-center mb-5" style={{ fontFamily: '"Tajawal", sans-serif' }}>{email}</p>
                <InputField
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={v => { setPassword(v); clearError(); }}
                  placeholder="كلمة السر..."
                  autoFocus
                  icon={<Lock className="w-4 h-4" />}
                  trailing={
                    <button onClick={() => setShowPass(p => !p)} className="text-white/30 p-1">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  onEnter={handleLogin}
                />
                {error && <div className="mt-3"><ErrorBadge msg={error} /></div>}
              </div>
              <button
                onClick={handleLogin}
                disabled={!password || loading}
                className="w-full py-4 rounded-2xl transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                style={BTN_GOLD}
              >
                {loading && <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
                {loading ? 'جارٍ الدخول...' : 'دخول ←'}
              </button>
            </motion.div>
          )}

          {/* ─── Guest: Name ─── */}
          {step === 'guest-name' && (
            <motion.div key="guest-name" {...slide} className="flex flex-col gap-4">
              <button onClick={() => { clearError(); setStep('welcome'); }} className="flex items-center gap-1.5 text-white/35 text-sm" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                <ChevronRight className="w-4 h-4" /> رجوع
              </button>
              <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)' }}>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>
                  <UserCircle2 className="w-5 h-5 text-white/50" />
                </div>
                <h2 className="text-white text-lg font-bold text-center mb-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>دخول كضيف</h2>
                <p className="text-white/30 text-xs text-center mb-5" style={{ fontFamily: '"Tajawal", sans-serif' }}>أدخل اسمك ليظهر في التطبيق</p>
                <InputField
                  value={name}
                  onChange={setName}
                  placeholder="اكتب اسمك هنا..."
                  autoFocus
                  icon={<UserCircle2 className="w-4 h-4" />}
                  onEnter={() => name.trim() && setStep('guest-city')}
                />
              </div>
              <button
                onClick={() => name.trim() && setStep('guest-city')}
                disabled={!name.trim()}
                className="w-full py-4 rounded-2xl transition-all disabled:opacity-30"
                style={BTN_GOLD}
              >
                التالي ←
              </button>
            </motion.div>
          )}

          {/* ─── Guest: City ─── */}
          {step === 'guest-city' && (
            <motion.div key="guest-city" {...slide} className="flex flex-col gap-3">
              <button onClick={() => { clearError(); setStep('guest-name'); }} className="flex items-center gap-1.5 text-white/35 text-sm" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                <ChevronRight className="w-4 h-4" /> رجوع
              </button>
              <div className="rounded-2xl px-4 py-3.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)' }}>
                <p className="text-white font-bold text-sm" style={{ fontFamily: '"Tajawal", sans-serif' }}>أهلاً {name}، اختر محافظتك</p>
                <p className="text-white/30 text-xs mt-0.5" style={{ fontFamily: '"Tajawal", sans-serif' }}>لتحديد مواقيت الصلاة بدقة</p>
              </div>
              <CityPicker govId={govId} onSelect={setGovId} />
              <button
                onClick={() => govId && handleGuestCity(govId)}
                disabled={!govId}
                className="w-full py-4 rounded-2xl transition-all disabled:opacity-30"
                style={govId ? BTN_GOLD : {
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.25)',
                  fontFamily: '"Tajawal", sans-serif',
                  fontWeight: 700,
                }}
              >
                {govId ? `دخول كضيف — ${EGYPT_GOVERNORATES.find(g => g.id === govId)?.name}` : 'اختر محافظتك أولاً'}
              </button>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Bottom sparkle hint */}
        {step === 'welcome' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-2 mt-5"
          >
            <Sparkles className="w-3 h-3" style={{ color: 'rgba(193,154,107,0.4)' }} />
            <p className="text-white/18 text-[11px]" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              تطبيق إسلامي شامل — مجاناً للأبد
            </p>
            <Sparkles className="w-3 h-3" style={{ color: 'rgba(193,154,107,0.4)' }} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
