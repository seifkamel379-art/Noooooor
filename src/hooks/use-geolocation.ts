import { useState, useEffect, useRef } from 'react';

export function useGeolocation(autoRequest = true) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError]   = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(autoRequest);

  // Hold the watchPosition ID so we can clear it on unmount
  const watchId = useRef<number | null>(null);

  const stopWatch = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  };

  const requestLocation = () => {
    setIsLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('خدمة الموقع غير مدعومة في متصفحك');
      setIsLoading(false);
      return;
    }

    // Clear any existing watch before starting a new one
    stopWatch();

    const onSuccess = (position: GeolocationPosition) => {
      setCoords({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
      setError(null);
      setIsLoading(false);
    };

    const onError = () => {
      setError('لم نتمكن من تحديد موقعك. يرجى تفعيل خدمة الموقع.');
      setIsLoading(false);
    };

    const options: PositionOptions = {
      enableHighAccuracy: true, // use GPS chip, not network/IP
      timeout: 15000,
      maximumAge: 0,            // never use a cached position
    };

    // watchPosition keeps updating as the user moves —
    // much more accurate than a one-shot getCurrentPosition.
    watchId.current = navigator.geolocation.watchPosition(
      onSuccess,
      onError,
      options,
    );
  };

  useEffect(() => {
    if (autoRequest) requestLocation();
    return stopWatch; // clean up watch when component unmounts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { coords, error, isLoading, requestLocation };
}

/* ── Great-circle distance (Haversine) — returns km ── */
export function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R    = 6371; // mean Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ── Qibla bearing from (lat, lng) toward the Kaaba ── */
export function calculateQibla(lat: number, lng: number): number {
  const MAKKAH_LAT = 21.422487;
  const MAKKAH_LNG = 39.826206;

  const lat1  = (lat         * Math.PI) / 180;
  const lat2  = (MAKKAH_LAT  * Math.PI) / 180;
  const dLng  = ((MAKKAH_LNG - lng) * Math.PI) / 180;

  // Standard great-circle bearing formula
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
