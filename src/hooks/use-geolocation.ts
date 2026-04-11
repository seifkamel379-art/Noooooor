import { useState, useEffect } from 'react';

export function useGeolocation(autoRequest = true) {
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(autoRequest);

  const requestLocation = () => {
    setIsLoading(true);
    setError(null);
    if (!navigator.geolocation) {
      setError("خدمة الموقع غير مدعومة في متصفحك");
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setError(null);
        setIsLoading(false);
      },
      () => {
        setError("لم نتمكن من تحديد موقعك. يرجى تفعيل الموقع.");
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (autoRequest) requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { coords, error, isLoading, requestLocation };
}

export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function calculateQibla(lat: number, lng: number): number {
  const MAKKAH_LAT = 21.422487;
  const MAKKAH_LNG = 39.826206;

  const latRad = (lat * Math.PI) / 180;
  const makkahLatRad = (MAKKAH_LAT * Math.PI) / 180;
  const lngDiffRad = ((MAKKAH_LNG - lng) * Math.PI) / 180;

  const y = Math.sin(lngDiffRad);
  const x = Math.cos(latRad) * Math.tan(makkahLatRad) - Math.sin(latRad) * Math.cos(lngDiffRad);

  const qiblaRad = Math.atan2(y, x);
  const qiblaDeg = (qiblaRad * 180) / Math.PI;

  return (qiblaDeg + 360) % 360;
}
