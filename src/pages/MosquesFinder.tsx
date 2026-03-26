import { useState, useRef, useCallback } from 'react';
import { ArrowLeft, MapPin, Navigation, Loader2, AlertCircle, Search } from 'lucide-react';
import { Link } from 'wouter';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MosqueIcon } from '@/components/NoorIcons';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Mosque {
  id: number;
  name: string;
  lat: number;
  lng: number;
  distance: number;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const p1 = (lat1 * Math.PI) / 180, p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtDist(m: number) {
  return m < 1000 ? `${Math.round(m)} م` : `${(m / 1000).toFixed(1)} كم`;
}

const mosquePin = L.divIcon({
  html: `<div style="width:32px;height:32px;background:linear-gradient(135deg,#C19A6B,#8a6a3a);border-radius:50% 50% 0 50%;transform:rotate(45deg);border:2.5px solid #fff;box-shadow:0 3px 10px rgba(193,154,107,0.5)"></div>`,
  className: '', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -36],
});

const selectedPin = L.divIcon({
  html: `<div style="width:42px;height:42px;background:linear-gradient(135deg,#e8b87d,#C19A6B);border-radius:50% 50% 0 50%;transform:rotate(45deg);border:3px solid #fff;box-shadow:0 0 24px rgba(193,154,107,0.85),0 4px 12px rgba(0,0,0,0.25)"></div>`,
  className: '', iconSize: [42, 42], iconAnchor: [21, 42], popupAnchor: [0, -46],
});

const userPin = L.divIcon({
  html: `<div style="width:18px;height:18px;background:#3B82F6;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 5px rgba(59,130,246,0.25),0 2px 8px rgba(0,0,0,0.3)"></div>`,
  className: '', iconSize: [18, 18], iconAnchor: [9, 9],
});

function MapMover({ target }: { target: { center?: [number, number]; bounds?: [[number,number],[number,number]] } | null }) {
  const map = useMap();
  const prevRef = useRef<typeof target>(null);
  if (target && target !== prevRef.current) {
    prevRef.current = target;
    if (target.bounds) {
      setTimeout(() => map.fitBounds(target.bounds!, { padding: [60, 60], maxZoom: 16, animate: true }), 50);
    } else if (target.center) {
      setTimeout(() => map.flyTo(target.center!, 15, { animate: true, duration: 0.8 }), 50);
    }
  }
  return null;
}

type Phase = 'idle' | 'loading-loc' | 'loading-data' | 'done' | 'error';

export function MosquesFinder() {
  const [phase, setPhase]         = useState<Phase>('idle');
  const [userLoc, setUserLoc]     = useState<[number, number] | null>(null);
  const [mosques, setMosques]     = useState<Mosque[]>([]);
  const [selected, setSelected]   = useState<Mosque | null>(null);
  const [errorMsg, setErrorMsg]   = useState('');
  const [mapTarget, setMapTarget] = useState<{ center?: [number, number]; bounds?: [[number,number],[number,number]] } | null>(null);
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const fetchMosques = useCallback(async (lat: number, lng: number) => {
    setPhase('loading-data');
    try {
      const q = encodeURIComponent(
        `[out:json][timeout:30];(node["amenity"="place_of_worship"]["religion"="muslim"](around:2000,${lat},${lng});way["amenity"="place_of_worship"]["religion"="muslim"](around:2000,${lat},${lng}););out center;`
      );
      const res  = await fetch(`https://overpass-api.de/api/interpreter?data=${q}`);
      if (!res.ok) throw new Error('Overpass API error');
      const data = await res.json();

      const list: Mosque[] = (data.elements as any[])
        .map(el => {
          const elat = el.lat ?? el.center?.lat;
          const elng = el.lon ?? el.center?.lon;
          if (!elat || !elng) return null;
          return {
            id: el.id,
            name: el.tags?.['name:ar'] ?? el.tags?.name ?? 'مسجد',
            lat: elat, lng: elng,
            distance: haversine(lat, lng, elat, elng),
          };
        })
        .filter(Boolean)
        .sort((a, b) => a!.distance - b!.distance) as Mosque[];

      setMosques(list);
      setPhase('done');
    } catch {
      setErrorMsg('تعذّر جلب بيانات المساجد، تحقق من اتصالك وحاول مرة أخرى');
      setPhase('error');
    }
  }, []);

  const startSearch = useCallback(() => {
    if (!navigator.geolocation) {
      setErrorMsg('متصفحك لا يدعم تحديد الموقع الجغرافي');
      setPhase('error');
      return;
    }
    setPhase('loading-loc');
    setErrorMsg('');
    setMosques([]);
    setSelected(null);

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const lat = coords.latitude, lng = coords.longitude;
        setUserLoc([lat, lng]);
        setMapTarget({ center: [lat, lng] });
        fetchMosques(lat, lng);
      },
      (err) => {
        const msgs: Record<number, string> = {
          1: 'رُفض الإذن بالوصول إلى الموقع — اسمح للمتصفح بالوصول وحاول مجدداً',
          2: 'تعذّر تحديد موقعك، تحقق من تفعيل خدمة الموقع',
          3: 'انتهت مهلة تحديد الموقع، حاول مجدداً',
        };
        setErrorMsg(msgs[err.code] ?? 'خطأ في تحديد الموقع');
        setPhase('error');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  }, [fetchMosques]);

  const pick = useCallback((mosque: Mosque) => {
    setSelected(mosque);
    if (userLoc) {
      setMapTarget({
        bounds: [
          [Math.min(userLoc[0], mosque.lat) - 0.001, Math.min(userLoc[1], mosque.lng) - 0.001],
          [Math.max(userLoc[0], mosque.lat) + 0.001, Math.max(userLoc[1], mosque.lng) + 0.001],
        ],
      });
    }
    setTimeout(() => cardRefs.current[mosque.id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 300);
  }, [userLoc]);

  const showMap = phase === 'done' && userLoc;

  return (
    <div className="h-screen flex flex-col max-w-lg mx-auto bg-background" dir="rtl">
      {/* Header */}
      <div className="px-4 py-4 flex items-center gap-4 bg-card shadow-sm border-b border-border flex-shrink-0">
        <Link href="/more">
          <button className="p-2 bg-secondary rounded-full"><ArrowLeft className="w-5 h-5" /></button>
        </Link>
        <div className="flex-1">
          <h1 className="font-bold text-xl" style={{ fontFamily: '"Tajawal", sans-serif' }}>المساجد القريبة</h1>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            {phase === 'done' ? `${mosques.length} مسجد في نطاق 2 كم`
            : phase === 'loading-loc' ? 'جاري تحديد موقعك...'
            : phase === 'loading-data' ? 'جاري البحث عن المساجد...'
            : 'اضغط للبدء'}
          </p>
        </div>
        {phase === 'done' && (
          <button onClick={startSearch} className="p-2 bg-secondary rounded-full" title="إعادة البحث">
            <Search className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Map */}
      <div className="flex-shrink-0" style={{ height: '42%' }}>
        {phase === 'idle' ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-5 bg-secondary/10 px-8">
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'rgba(193,154,107,0.15)' }}>
              <MosqueIcon className="text-primary" size={40} />
            </div>
            <div className="text-center">
              <p className="font-bold text-lg" style={{ fontFamily: '"Tajawal", sans-serif' }}>اكتشف المساجد حولك</p>
              <p className="text-muted-foreground text-sm mt-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>يبحث التطبيق عن المساجد في نطاق 2 كيلومتر من موقعك</p>
            </div>
            <button onClick={startSearch}
              className="px-8 py-3.5 rounded-2xl font-bold text-white text-base"
              style={{ background: 'linear-gradient(135deg,#C19A6B,#a07a4a)', fontFamily: '"Tajawal", sans-serif' }}>
              ابدأ البحث
            </button>
          </div>
        ) : (phase === 'loading-loc' || phase === 'loading-data') && !showMap ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-secondary/10">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              {phase === 'loading-loc' ? 'جاري تحديد موقعك...' : 'جاري البحث عن المساجد...'}
            </p>
          </div>
        ) : phase === 'error' ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4 px-8 text-center">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <p className="font-bold text-sm" style={{ fontFamily: '"Tajawal", sans-serif' }}>{errorMsg}</p>
            <button onClick={startSearch}
              className="px-6 py-3 rounded-2xl font-bold text-white text-sm"
              style={{ background: 'linear-gradient(135deg,#C19A6B,#a07a4a)', fontFamily: '"Tajawal", sans-serif' }}>
              حاول مرة أخرى
            </button>
          </div>
        ) : showMap ? (
          <MapContainer center={userLoc} zoom={15} style={{ width: '100%', height: '100%' }} zoomControl={false} attributionControl={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" maxZoom={19} detectRetina />
            <MapMover target={mapTarget} />

            <Marker position={userLoc} icon={userPin}>
              <Popup><span dir="rtl" style={{ fontFamily: '"Tajawal"' }}>موقعك الحالي</span></Popup>
            </Marker>

            {selected && (
              <Polyline positions={[userLoc, [selected.lat, selected.lng]]} color="#C19A6B" weight={3.5} dashArray="10 7" opacity={0.9} />
            )}

            {mosques.map(m => (
              <Marker key={m.id} position={[m.lat, m.lng]} icon={selected?.id === m.id ? selectedPin : mosquePin} eventHandlers={{ click: () => pick(m) }}>
                <Popup>
                  <div dir="rtl" style={{ fontFamily: '"Tajawal"' }}>
                    <p style={{ fontWeight: 'bold', marginBottom: 2 }}>{m.name}</p>
                    <p style={{ fontSize: 12, color: '#888' }}>{fmtDist(m.distance)}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        ) : null}
      </div>

      {/* Mosque Cards */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {phase === 'done' && mosques.length === 0 && (
          <div className="text-center py-16 text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            <p>لا توجد مساجد في نطاق 2 كيلومتر</p>
            <button onClick={startSearch} className="mt-4 text-primary text-sm font-bold underline" style={{ fontFamily: '"Tajawal", sans-serif' }}>حاول مرة أخرى</button>
          </div>
        )}

        {phase === 'loading-data' && userLoc && (
          <div className="flex flex-col gap-2">
            {[1,2,3].map(i => (
              <div key={i} className="h-20 rounded-2xl bg-secondary/40 animate-pulse" />
            ))}
          </div>
        )}

        {mosques.map(m => {
          const isActive = selected?.id === m.id;
          return (
            <div key={m.id} ref={el => { cardRefs.current[m.id] = el; }} onClick={() => pick(m)}
              className="flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all"
              style={{
                background: isActive ? 'rgba(193,154,107,0.1)' : undefined,
                borderColor: isActive ? 'rgba(193,154,107,0.4)' : undefined,
                boxShadow: isActive ? '0 0 18px rgba(193,154,107,0.18)' : undefined,
              }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: isActive ? 'rgba(193,154,107,0.2)' : 'rgba(193,154,107,0.08)' }}>
                <MosqueIcon className="text-primary" size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate" style={{ fontFamily: '"Tajawal", sans-serif' }}>{m.name}</p>
                <div className="flex items-center gap-1 text-muted-foreground text-xs mt-0.5">
                  <MapPin className="w-3 h-3" />
                  <span style={{ fontFamily: '"Tajawal", sans-serif' }}>{fmtDist(m.distance)}</span>
                </div>
              </div>
              {isActive && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}&travelmode=walking`,
                      '_blank'
                    );
                  }}
                  className="flex items-center gap-1 text-xs font-bold flex-shrink-0 px-3 py-2 rounded-xl active:scale-95 transition-transform"
                  style={{ background: 'rgba(193,154,107,0.15)', color: '#C19A6B', fontFamily: '"Tajawal", sans-serif' }}
                >
                  <Navigation className="w-4 h-4" />
                  <span>تنقّل</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
