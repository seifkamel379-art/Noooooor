import { useState } from 'react';
import { Link } from 'wouter';
import { ChevronLeft, Sun, Moon, LogOut } from 'lucide-react';
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
} from '@/components/NoorIcons';

function IslamicPattern() {
  return (
    <svg viewBox="0 0 200 40" className="w-full opacity-15" preserveAspectRatio="xMidYMid meet">
      <g fill="#C19A6B">
        {[20, 60, 100, 140, 180].map((cx, i) => (
          <g key={i}>
            <polygon points={`${cx},5 ${cx+5},17 ${cx+18},17 ${cx+7},25 ${cx+11},38 ${cx},30 ${cx-11},38 ${cx-7},25 ${cx-18},17 ${cx-5},17`} opacity={0.7} />
          </g>
        ))}
        <line x1="0" y1="20" x2="200" y2="20" stroke="#C19A6B" strokeWidth="0.5" opacity="0.5" strokeDasharray="4 8"/>
      </g>
    </svg>
  );
}

function QiblaCompassIcon({ className = '', size = 24 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="0.8" opacity="0.5"/>
      {/* Needle up (gold) */}
      <polygon points="12,4 10.5,10 12,9 13.5,10" fill="currentColor" opacity="0.9"/>
      {/* Needle down */}
      <polygon points="12,20 10.5,14 12,15 13.5,14" fill="currentColor" opacity="0.4"/>
      {/* Kaaba small */}
      <rect x="10.5" y="2.5" width="3" height="3.5" rx="0.3" fill="currentColor" opacity="0.8"/>
      <line x1="10.5" y1="3.8" x2="13.5" y2="3.8" stroke="currentColor" strokeWidth="0.6" opacity="0.6"/>
      {/* Center */}
      <circle cx="12" cy="12" r="1.2" fill="currentColor"/>
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
            className="flex-1 py-3 rounded-2xl bg-secondary text-foreground font-bold text-sm hover:bg-secondary/80 transition-colors"
            style={{ fontFamily: '"Tajawal", sans-serif' }}
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors"
            style={{ fontFamily: '"Tajawal", sans-serif' }}
          >
            خروج
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function FeatureChip({ Icon, text, color }: { Icon: React.ComponentType<{ className?: string; size?: number }>; text: string; color: string }) {
  return (
    <div className="flex items-center gap-2 bg-secondary/40 rounded-xl px-3 py-2.5">
      <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} size={16} />
      <span className="text-xs text-foreground/80 leading-tight" style={{ fontFamily: '"Tajawal", sans-serif' }}>{text}</span>
    </div>
  );
}

export function MoreMenu() {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

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
    {
      Icon: QiblaCompassIcon,
      label: 'تحديد القبلة',
      path: '/qibla',
      color: 'text-primary',
      bg: 'bg-primary/10',
      desc: 'بوصلة ذكية لاتجاه الكعبة المشرفة',
    },
    {
      Icon: RadioIcon,
      label: 'الإذاعات الإسلامية',
      path: '/radio',
      color: 'text-primary',
      bg: 'bg-primary/10',
      desc: 'إذاعة القرآن الكريم وكبار القراء',
    },
    {
      Icon: IslamicStarIcon,
      label: 'أسماء الله الحسنى',
      path: '/asma',
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      desc: '99 اسماً مع معانيها',
    },
    {
      Icon: HeadphonesIcon,
      label: 'القراء والاستماع',
      path: '/reciters',
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      desc: '50+ قارئ للقرآن الكريم',
    },
    {
      Icon: SmartReaderIcon,
      label: 'قارئ التدبر الذكي',
      path: '/speed-reader',
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      desc: 'تدبر القرآن كلمةً بكلمة',
    },
    {
      Icon: Library,
      label: 'المكتبة الإسلامية',
      path: '/library',
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10',
      desc: 'كتب، أبحاث، وموسوعة الحديث الشريف',
    },
  ];

  return (
    <div className="pb-24 pt-6 px-4 max-w-lg mx-auto" dir="rtl">
      <AnimatePresence>
        {showLogoutDialog && (
          <LogoutConfirmDialog
            onConfirm={handleLogoutConfirm}
            onCancel={() => setShowLogoutDialog(false)}
          />
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
            className="p-2 bg-secondary rounded-full text-muted-foreground hover:text-destructive transition-colors"
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
              className="flex items-center justify-between bg-card p-4 rounded-2xl border border-border/50 hover:bg-secondary/50 transition-colors shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.bg} ${item.color}`}>
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

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between bg-card p-4 rounded-2xl border border-border/50 hover:bg-secondary/50 transition-colors shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-500/10 text-slate-500 dark:text-slate-300">
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
              <FeatureChip Icon={MosqueIcon}          color="text-primary"       text="مواقيت الصلاة" />
              <FeatureChip Icon={QuranBookIcon}        color="text-emerald-600"   text="القرآن الكريم كاملاً" />
              <FeatureChip Icon={HeadphonesIcon}       color="text-purple-500"    text="أكثر من 50 قارئاً" />
              <FeatureChip Icon={TasbihIcon}           color="text-amber-600"     text="السبحة الإلكترونية" />
              <FeatureChip Icon={SmartReaderIcon}      color="text-amber-500"     text="قارئ التدبر الذكي" />
              <FeatureChip Icon={DuaHandsIcon}         color="text-teal-500"      text="الأذكار والأدعية" />
              <FeatureChip Icon={ScrollIcon}           color="text-orange-500"    text="تفسير الجلالين" />
              <FeatureChip Icon={IslamicStarIcon}      color="text-emerald-500"   text="أسماء الله الحسنى" />
              <FeatureChip Icon={RadioIcon}            color="text-primary"       text="الإذاعات الإسلامية" />
              <FeatureChip Icon={QiblaCompassIcon}     color="text-primary"       text="تحديد القبلة" />
              <FeatureChip Icon={MoonIcon}             color="text-slate-500"     text="الوضع الليلي" />
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
                <polygon points="20,2 24,14 37,14 27,22 31,35 20,27 9,35 13,22 3,14 16,14"/>
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
