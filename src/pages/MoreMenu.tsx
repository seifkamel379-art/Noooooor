import { useState } from 'react';
import { Link } from 'wouter';
import {
  ChevronLeft, Sun, Moon, LogOut, Share2,
  Star, Copy, X, Check, Mail, MessageSquare,
} from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { motion, AnimatePresence } from 'framer-motion';
import { firebaseSignOut } from '@/lib/firebase';
import {
  IslamicStarIcon,
  HeadphonesIcon,
  SmartReaderIcon,
  MosqueIcon,
  QuranBookIcon,
  TasbihIcon,
  MoonIcon,
  ScrollIcon,
  DuaHandsIcon,
  RadioIcon,
  HadithIcon,
} from '@/components/NoorIcons';

function IslamicPattern() {
  return (
    <svg viewBox="0 0 200 40" className="w-full opacity-15" preserveAspectRatio="xMidYMid meet">
      <g fill="#C19A6B">
        {[20, 60, 100, 140, 180].map((cx, i) => (
          <g key={i}>
            <polygon points={`${cx},5 ${cx + 5},17 ${cx + 18},17 ${cx + 7},25 ${cx + 11},38 ${cx},30 ${cx - 11},38 ${cx - 7},25 ${cx - 18},17 ${cx - 5},17`} opacity={0.7} />
          </g>
        ))}
        <line x1="0" y1="20" x2="200" y2="20" stroke="#C19A6B" strokeWidth="0.5" opacity="0.5" strokeDasharray="4 8" />
      </g>
    </svg>
  );
}

function QiblaCompassIcon({ className = '', size = 24 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
      <polygon points="12,4 10.5,10 12,9 13.5,10" fill="currentColor" opacity="0.9" />
      <polygon points="12,20 10.5,14 12,15 13.5,14" fill="currentColor" opacity="0.4" />
      <rect x="10.5" y="2.5" width="3" height="3.5" rx="0.3" fill="currentColor" opacity="0.8" />
      <line x1="10.5" y1="3.8" x2="13.5" y2="3.8" stroke="currentColor" strokeWidth="0.6" opacity="0.6" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    </svg>
  );
}

function LogoutConfirmDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="relative bg-card border border-border rounded-3xl p-6 w-full max-w-xs shadow-2xl text-center"
      >
        <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <LogOut className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="font-bold text-lg mb-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>تسجيل الخروج</h3>
        <p className="text-muted-foreground text-sm mb-5" style={{ fontFamily: '"Tajawal", sans-serif' }}>
          هل تريد تسجيل الخروج وتغيير بياناتك؟
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl bg-secondary text-foreground font-bold text-sm transition-colors"
            style={{ fontFamily: '"Tajawal", sans-serif' }}
          >إلغاء</button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold text-sm transition-colors"
            style={{ fontFamily: '"Tajawal", sans-serif' }}
          >خروج</button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Social media SVG icons ─────────────────────────────── */
const WhatsAppSvg = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const FacebookSvg = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const TelegramSvg = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

const TwitterXSvg = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const InstagramSvg = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
  </svg>
);

const SnapchatSvg = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.513-.045.378.119.7.396.84.76.165.404-.018.793-.358.943-.35.124-.53.49-.594 1.04-.012.133.046.373.27.557.465.379 1.383.839 1.383 1.783 0 .6-.406 1.063-1.201 1.378-.36.141-.729.267-1.065.373-.337.107-.658.21-.895.355-.275.168-.353.432-.325.624.05.31.376.611.948.867 1.245.555 2.058 1.437 2.058 2.327 0 .612-.41 1.126-1.037 1.356-.9.337-2.267.441-3.71.441H12c-1.443 0-2.81-.104-3.71-.441-.627-.23-1.037-.744-1.037-1.356 0-.89.813-1.772 2.058-2.327.572-.256.898-.557.948-.867.028-.192-.05-.456-.325-.624-.237-.145-.558-.248-.895-.355a21.37 21.37 0 0 1-1.065-.373c-.795-.315-1.201-.778-1.201-1.378 0-.944.918-1.404 1.383-1.783.224-.184.282-.424.27-.557-.064-.55-.244-.916-.594-1.04-.34-.15-.523-.539-.358-.943.14-.364.462-.641.84-.76.17-.059.348-.043.513.045.374.181.733.285 1.033.301.198 0 .326-.045.401-.09l-.03-.51c-.104-1.628-.23-3.654.299-4.847C7.847 1.069 11.204.793 12.206.793z" />
  </svg>
);

const LinkedInSvg = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const MessengerSvg = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.372 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.628 0 12-4.974 12-11.111C24 4.975 18.628 0 12 0zm1.194 14.963l-3.055-3.26-5.963 3.26L10.349 8.66l3.13 3.26 5.888-3.26-6.173 6.303z" />
  </svg>
);

/* ── Share chooser bottom sheet ─────────────────────────── */
function ShareChooserSheet({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [instaCopied, setInstaCopied] = useState(false);
  const APP_URL = 'https://noor-web--noorweb1000.replit.app/';
  const APP_TITLE = 'تطبيق نُور - رفيقك الإسلامي';
  const MESSAGE = `السلام عليكم ورحمة الله 🌙

حبيت أهديك تطبيق (Noor App) نُور، تطبيق إسلامي مميز وبدون إعلانات، بيساعدك تحافظ على أذكارك وصلاتك وتسبيحاتك.

قال ﷺ: «الدال على الخير كفاعله».. حمله من هنا وشاركنا الأجر:
${APP_URL}

نسألكم الدعاء`;

  const encodedMsg = encodeURIComponent(MESSAGE);
  const encodedUrl = encodeURIComponent(APP_URL);
  const encodedTitle = encodeURIComponent(APP_TITLE);

  type ShareOption = {
    id: string;
    label: string;
    bg: string;
    color: string;
    icon: React.ReactNode;
    action: () => void;
    hidden?: boolean;
  };

  const shareOptions: ShareOption[] = [
    {
      id: 'whatsapp',
      label: 'واتساب',
      bg: '#25D366',
      color: '#fff',
      icon: <WhatsAppSvg />,
      action: () => { window.open(`https://wa.me/?text=${encodedMsg}`, '_blank'); onClose(); },
    },
    {
      id: 'facebook',
      label: 'فيسبوك',
      bg: '#1877F2',
      color: '#fff',
      icon: <FacebookSvg />,
      action: () => { window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedMsg}`, '_blank'); onClose(); },
    },
    {
      id: 'telegram',
      label: 'تيليجرام',
      bg: '#0088cc',
      color: '#fff',
      icon: <TelegramSvg />,
      action: () => { window.open(`https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(MESSAGE.split('\n')[0])}`, '_blank'); onClose(); },
    },
    {
      id: 'twitter',
      label: 'X (تويتر)',
      bg: '#000',
      color: '#fff',
      icon: <TwitterXSvg />,
      action: () => { window.open(`https://twitter.com/intent/tweet?text=${encodedMsg}&url=${encodedUrl}`, '_blank'); onClose(); },
    },
    {
      id: 'messenger',
      label: 'ماسنجر',
      bg: '#0084FF',
      color: '#fff',
      icon: <MessengerSvg />,
      action: () => { window.open(`https://www.facebook.com/dialog/send?link=${encodedUrl}&app_id=291494417864&redirect_uri=${encodedUrl}`, '_blank'); onClose(); },
    },
    {
      id: 'instagram',
      label: instaCopied ? 'تم النسخ!' : 'إنستجرام',
      bg: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)',
      color: '#fff',
      icon: <InstagramSvg />,
      action: async () => {
        try {
          await navigator.clipboard.writeText(APP_URL);
          setInstaCopied(true);
          setTimeout(() => { setInstaCopied(false); window.open('https://www.instagram.com/', '_blank'); }, 800);
        } catch { window.open('https://www.instagram.com/', '_blank'); }
      },
    },
    {
      id: 'snapchat',
      label: 'سناب شات',
      bg: '#FFFC00',
      color: '#000',
      icon: <SnapchatSvg />,
      action: () => { window.open(`https://www.snapchat.com/scan?attachmentUrl=${encodedUrl}`, '_blank'); onClose(); },
    },
    {
      id: 'linkedin',
      label: 'لينكد إن',
      bg: '#0A66C2',
      color: '#fff',
      icon: <LinkedInSvg />,
      action: () => { window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, '_blank'); onClose(); },
    },
    {
      id: 'email',
      label: 'البريد',
      bg: '#EA4335',
      color: '#fff',
      icon: <Mail size={22} />,
      action: () => { window.open(`mailto:?subject=${encodedTitle}&body=${encodedMsg}`, '_self'); onClose(); },
    },
    {
      id: 'sms',
      label: 'رسالة SMS',
      bg: '#34C759',
      color: '#fff',
      icon: <MessageSquare size={22} />,
      action: () => { window.open(`sms:?body=${encodedMsg}`, '_self'); onClose(); },
    },
    {
      id: 'native',
      label: 'مشاركة',
      bg: 'hsl(var(--primary))',
      color: 'hsl(var(--primary-foreground))',
      icon: <Share2 size={22} />,
      action: async () => {
        if (navigator.share) {
          try { await navigator.share({ title: APP_TITLE, text: MESSAGE, url: APP_URL }); } catch { /* dismissed */ }
        }
        onClose();
      },
      hidden: typeof navigator === 'undefined' || !navigator.share,
    },
    {
      id: 'copy',
      label: copied ? 'تم النسخ!' : 'نسخ الرابط',
      bg: copied ? '#4ade80' : 'hsl(var(--secondary))',
      color: copied ? '#fff' : 'hsl(var(--foreground))',
      icon: copied ? <Check size={22} /> : <Copy size={22} />,
      action: async () => {
        try {
          await navigator.clipboard.writeText(APP_URL);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch { /* ignore */ }
      },
    },
  ].filter(o => !o.hidden);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" dir="rtl">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="relative w-full max-w-md bg-card border-t border-border rounded-t-3xl pt-5 pb-safe shadow-2xl"
        style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />

        <div className="flex items-center justify-between mb-2 px-5">
          <h3 className="font-bold text-base" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            الدال على الخير كفاعله
          </h3>
          <button onClick={onClose} className="p-1.5 bg-secondary rounded-full">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground mb-4 px-5" style={{ fontFamily: '"Tajawal", sans-serif' }}>
          اختر التطبيق وشاركنا الأجر والثواب
        </p>

        {/* Social media grid */}
        <div className="px-4 overflow-y-auto" style={{ maxHeight: '55vh' }}>
          <div className="grid grid-cols-4 gap-3 pb-2">
            {shareOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={opt.action}
                className="flex flex-col items-center gap-1.5 transition-all active:scale-90"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm"
                  style={{ background: opt.bg, color: opt.color }}
                >
                  {opt.icon}
                </div>
                <span
                  className="text-[10px] font-medium text-foreground/80 text-center leading-tight"
                  style={{ fontFamily: '"Tajawal", sans-serif' }}
                >
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function FeatureChip({ Icon, text }: { Icon: React.ComponentType<{ className?: string; size?: number }>; text: string }) {
  return (
    <div className="flex items-center gap-2 bg-secondary/40 rounded-xl px-3 py-2.5">
      <Icon className="w-4 h-4 flex-shrink-0 text-primary" size={16} />
      <span className="text-xs text-foreground/80 leading-tight" style={{ fontFamily: '"Tajawal", sans-serif' }}>{text}</span>
    </div>
  );
}

export function MoreMenu() {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleLogoutConfirm = async () => {
    await firebaseSignOut();
    localStorage.removeItem('user_profile');
    window.dispatchEvent(new Event('app-logout'));
  };

  const userProfileRaw = localStorage.getItem('user_profile');
  const userProfile = userProfileRaw ? JSON.parse(userProfileRaw) : null;

  const MENU_ITEMS = [
    { Icon: HadithIcon,       label: 'الأحاديث الشريفة',    path: '/hadith',       desc: 'أحاديث النبي ﷺ من كبار المصادر' },
    { Icon: QiblaCompassIcon, label: 'تحديد القبلة',         path: '/qibla',        desc: 'بوصلة ذكية لاتجاه الكعبة المشرفة' },
    { Icon: RadioIcon,        label: 'الإذاعات الإسلامية',  path: '/radio',        desc: 'إذاعة القرآن الكريم وكبار القراء' },
    { Icon: IslamicStarIcon,  label: 'أسماء الله الحسنى',   path: '/asma',         desc: '99 اسماً مع معانيها' },
    { Icon: HeadphonesIcon,   label: 'القراء والاستماع',    path: '/reciters',     desc: '50+ قارئ للقرآن الكريم' },
    { Icon: SmartReaderIcon,  label: 'قارئ التدبر الذكي',   path: '/speed-reader', desc: 'تدبر القرآن كلمةً بكلمة' },
  ];

  return (
    <div className="pb-24 pt-6 px-4 max-w-lg mx-auto" dir="rtl">
      <AnimatePresence>
        {showLogoutDialog && (
          <LogoutConfirmDialog onConfirm={handleLogoutConfirm} onCancel={() => setShowLogoutDialog(false)} />
        )}
        {showShareSheet && (
          <ShareChooserSheet onClose={() => setShowShareSheet(false)} />
        )}
      </AnimatePresence>

      <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: '"Tajawal", sans-serif' }}>المزيد</h1>

      {/* User profile card */}
      {userProfile && (
        <div className="mb-5 bg-gradient-to-l from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {userProfile.photo ? (
              <img src={userProfile.photo} alt={userProfile.name} className="w-10 h-10 rounded-full border-2 border-primary/30" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                  {(userProfile.name ?? '?')[0]}
                </span>
              </div>
            )}
            <div>
              <p className="font-bold text-base" style={{ fontFamily: '"Tajawal", sans-serif' }}>{userProfile.name}</p>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>{userProfile.governorateName}</p>
            </div>
          </div>
          <button
            onClick={() => setShowLogoutDialog(true)}
            className="p-2 bg-secondary rounded-full text-muted-foreground transition-colors"
            title="تغيير البيانات"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="space-y-3">
        {MENU_ITEMS.map((item, idx) => {
          const Icon = item.Icon;
          return (
            <Link
              key={idx}
              href={item.path}
              className="flex items-center justify-between bg-card p-4 rounded-2xl border border-border/50 transition-colors shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
                  <Icon size={24} />
                </div>
                <div>
                  <span className="font-bold text-base block" style={{ fontFamily: '"Tajawal", sans-serif' }}>{item.label}</span>
                  <span className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>{item.desc}</span>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </Link>
          );
        })}

        {/* Share App Card */}
        <button
          onClick={() => setShowShareSheet(true)}
          className="w-full flex items-center justify-between bg-card p-4 rounded-2xl border border-border/50 transition-colors shadow-sm"
          data-testid="button-share-app"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-base block" style={{ fontFamily: '"Tajawal", sans-serif' }}>الدال على الخير كفاعله</span>
              <span className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>أرسل التطبيق لأحبابك لكي نتشارك الأجر والثواب</span>
            </div>
          </div>
          <ChevronLeft className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        </button>

        {/* Rate App Card */}
        <a
          href="https://noor-web--noorweb1000.replit.app/#reviews"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between bg-card p-4 rounded-2xl border border-border/50 transition-colors shadow-sm"
          data-testid="link-rate-app"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-base block" style={{ fontFamily: '"Tajawal", sans-serif' }}>قيّمنا وادعمنا</span>
              <span className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>رأيك يهمنا ويساعدنا على تطوير "Noor App" ليصل للجميع</span>
            </div>
          </div>
          <ChevronLeft className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        </a>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between bg-card p-4 rounded-2xl border border-border/50 transition-colors shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
              {theme === 'light' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
            </div>
            <div>
              <span className="font-bold text-base block" style={{ fontFamily: '"Tajawal", sans-serif' }}>الوضع الليلي</span>
              <span className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>{theme === 'dark' ? 'مفعّل' : 'غير مفعّل'}</span>
            </div>
          </div>
          <div className={`w-12 h-6 rounded-full relative border border-border transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-secondary'}`}>
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${theme === 'dark' ? 'left-0.5' : 'right-0.5'}`} />
          </div>
        </button>
      </div>

      {/* About App Section */}
      <div className="mt-6 bg-card border border-primary/15 rounded-3xl overflow-hidden shadow-sm">
        <div className="bg-gradient-to-l from-primary/10 to-primary/5 px-5 pt-5 pb-3">
          <IslamicPattern />
          <div className="text-center mt-1">
            <p className="text-primary text-4xl" style={{ fontFamily: '"Amiri", "Scheherazade New", serif' }}>نُـور</p>
            <p className="text-muted-foreground text-xs mt-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>الإصدار 2.0 • 2026</p>
          </div>
          <IslamicPattern />
        </div>

        <div className="px-5 pb-5 space-y-4">
          <div className="pt-4 border-t border-border/30">
            <h3 className="font-bold text-base text-primary mb-2" style={{ fontFamily: '"Tajawal", sans-serif' }}>عن التطبيق</h3>
            <p className="text-sm text-foreground/80 leading-loose" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              تطبيق <strong>نُور</strong> هو رفيقك الإسلامي الشامل، صُمِّم لمساعدة المسلمين على تعزيز صلتهم بالله وإحياء سنة النبي ﷺ في حياتهم اليومية.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-sm text-primary mb-3" style={{ fontFamily: '"Tajawal", sans-serif' }}>مميزات التطبيق</h3>
            <div className="grid grid-cols-2 gap-2">
              <FeatureChip Icon={MosqueIcon}        text="مواقيت الصلاة" />
              <FeatureChip Icon={QuranBookIcon}      text="القرآن الكريم كاملاً" />
              <FeatureChip Icon={HeadphonesIcon}     text="أكثر من 50 قارئاً" />
              <FeatureChip Icon={TasbihIcon}         text="السبحة الإلكترونية" />
              <FeatureChip Icon={SmartReaderIcon}    text="قارئ التدبر الذكي" />
              <FeatureChip Icon={DuaHandsIcon}       text="الأذكار والأدعية" />
              <FeatureChip Icon={ScrollIcon}         text="تفسير الجلالين" />
              <FeatureChip Icon={IslamicStarIcon}    text="أسماء الله الحسنى" />
              <FeatureChip Icon={RadioIcon}          text="الإذاعات الإسلامية" />
              <FeatureChip Icon={QiblaCompassIcon}   text="تحديد القبلة" />
              <FeatureChip Icon={HadithIcon}         text="الأحاديث الشريفة" />
              <FeatureChip Icon={MoonIcon}           text="الوضع الليلي" />
            </div>
          </div>

          <div className="border-t border-border/30 pt-3 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>مصادر البيانات</span>
              <span className="text-foreground/70 text-left text-[11px]" style={{ fontFamily: '"Tajawal", sans-serif' }}>aladhan.com • alquran.cloud</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>القراء</span>
              <span className="text-foreground/70" style={{ fontFamily: '"Tajawal", sans-serif' }}>mp3quran.net</span>
            </div>
          </div>

          <div className="border-t border-border/30 pt-3 text-center">
            <p className="text-foreground/80 text-sm font-bold" style={{ fontFamily: '"Tajawal", sans-serif' }}>تصميم وتطوير</p>
            <p className="text-primary font-bold text-base mt-0.5" style={{ fontFamily: '"Tajawal", sans-serif' }}>سيف كامل</p>
            <p className="text-muted-foreground text-xs mt-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>مطوّر تطبيق نُور</p>
            <div className="mt-3 flex items-center justify-center gap-2 text-muted-foreground/40">
              <div className="h-px flex-1 max-w-8" style={{ background: 'rgba(193,154,107,0.3)' }} />
              <svg width="16" height="16" viewBox="0 0 40 40" fill="#C19A6B" opacity={0.4}>
                <polygon points="20,2 24,14 37,14 27,22 31,35 20,27 9,35 13,22 3,14 16,14" />
              </svg>
              <div className="h-px flex-1 max-w-8" style={{ background: 'rgba(193,154,107,0.3)' }} />
            </div>
            <p className="text-muted-foreground text-xs mt-2" style={{ fontFamily: '"Tajawal", sans-serif' }}>جميع الحقوق محفوظة © 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
