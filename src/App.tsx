import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState, useCallback } from "react";
import NotFound from "@/pages/not-found";

import { BottomNav } from "@/components/layout/BottomNav";
import { MiniPlayer } from "@/components/MiniPlayer";
import { AudioProvider } from "@/contexts/AudioContext";
import { AppSettingsProvider, useAppSettings } from "@/contexts/AppSettingsContext";
import { SplashScreen } from "@/components/SplashScreen";

import { Login } from "@/pages/Login";
import { Home } from "@/pages/Home";
import { Quran } from "@/pages/Quran";
import { Azkar } from "@/pages/Azkar";
import { Tasbih } from "@/pages/Tasbih";
import { GlobalCounter } from "@/pages/GlobalCounter";
import { MoreMenu } from "@/pages/MoreMenu";
import { Settings } from "@/pages/Settings";
import { Asma } from "@/pages/Asma";
import { Reciters } from "@/pages/Reciters";
import { SpeedReader } from "@/pages/SpeedReader";
import { Adhan } from "@/pages/Adhan";
import { EgyptianRadio } from "@/pages/EgyptianRadio";
import { Qibla } from "@/pages/Qibla";
import { MosquesFinder } from "@/pages/MosquesFinder";
import { Hadith } from "@/pages/Hadith";

const queryClient = new QueryClient();

function GlobalBackground() {
  const { activeBgSrc } = useAppSettings();
  if (!activeBgSrc) return null;
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none"
      style={{
        backgroundImage: `url(${activeBgSrc})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.28)' }}
      />
    </div>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const { hasBg } = useAppSettings();
  return (
    <div className={`min-h-[100dvh] ${hasBg ? 'bg-transparent' : 'bg-background'} text-foreground selection:bg-primary/30 relative`}>
      <div className="relative z-10">
        {children}
      </div>
      <MiniPlayer />
      <BottomNav />
    </div>
  );
}

function FullScreenShell({ children }: { children: React.ReactNode }) {
  const { hasBg } = useAppSettings();
  return (
    <div className={`min-h-[100dvh] ${hasBg ? 'bg-transparent' : 'bg-background'} text-foreground selection:bg-primary/30 relative`}>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <AppShell><Home /></AppShell>
      </Route>
      <Route path="/quran">
        <AppShell><Quran /></AppShell>
      </Route>
      <Route path="/azkar">
        <AppShell><Azkar /></AppShell>
      </Route>
      <Route path="/tasbih">
        <AppShell><Tasbih /></AppShell>
      </Route>
      <Route path="/counter">
        <AppShell><GlobalCounter /></AppShell>
      </Route>
      <Route path="/more">
        <AppShell><MoreMenu /></AppShell>
      </Route>
      <Route path="/settings">
        <AppShell><Settings /></AppShell>
      </Route>
      <Route path="/asma">
        <FullScreenShell><Asma /></FullScreenShell>
      </Route>
      <Route path="/reciters">
        <FullScreenShell><Reciters /></FullScreenShell>
      </Route>
      <Route path="/speed-reader">
        <FullScreenShell><SpeedReader /></FullScreenShell>
      </Route>
      <Route path="/adhan">
        <FullScreenShell><Adhan /></FullScreenShell>
      </Route>
      <Route path="/radio">
        <FullScreenShell><EgyptianRadio /></FullScreenShell>
      </Route>
      <Route path="/qibla">
        <FullScreenShell><Qibla /></FullScreenShell>
      </Route>
      <Route path="/mosques">
        <FullScreenShell><MosquesFinder /></FullScreenShell>
      </Route>
      <Route path="/hadith">
        <FullScreenShell><Hadith /></FullScreenShell>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  return (
    <>
      <GlobalBackground />
      <Router />
    </>
  );
}

function App() {
  const [splashDone, setSplashDone] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  const handleSplashDone = useCallback(() => {
    setSplashDone(true);
    document.documentElement.dir = 'rtl';
    const theme = localStorage.getItem('theme');
    if (theme === '"dark"') {
      document.documentElement.classList.add('dark');
    }
    const profile = localStorage.getItem('user_profile');
    setIsLoggedIn(!!profile);
  }, []);

  const handleLoginComplete = useCallback(() => {
    setIsLoggedIn(true);
  }, []);

  useEffect(() => {
    const handleLogout = () => setIsLoggedIn(false);
    window.addEventListener('app-logout', handleLogout);
    return () => window.removeEventListener('app-logout', handleLogout);
  }, []);

  useEffect(() => {
    document.documentElement.dir = 'rtl';
    const theme = localStorage.getItem('theme');
    if (theme === '"dark"') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <>
      {!splashDone && <SplashScreen onDone={handleSplashDone} />}

      {splashDone && isLoggedIn === null && (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#C19A6B]/30 border-t-[#C19A6B] rounded-full animate-spin mx-auto mb-4" />
            <span className="text-[#C19A6B] text-3xl" style={{ fontFamily: '"Amiri", serif' }}>نُور</span>
          </div>
        </div>
      )}

      {splashDone && isLoggedIn === false && (
        <QueryClientProvider client={queryClient}>
          <Login onComplete={handleLoginComplete} />
        </QueryClientProvider>
      )}

      {splashDone && isLoggedIn === true && (
        <QueryClientProvider client={queryClient}>
          <AppSettingsProvider>
            <AudioProvider>
              <TooltipProvider>
                <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                  <AppContent />
                </WouterRouter>
                <Toaster />
              </TooltipProvider>
            </AudioProvider>
          </AppSettingsProvider>
        </QueryClientProvider>
      )}
    </>
  );
}

export default App;
