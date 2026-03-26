import { useState, useEffect, useRef } from 'react';

export function useCompass() {
  const [heading, setHeading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const absoluteFired = useRef(false);

  useEffect(() => {
    if (!window.DeviceOrientationEvent) {
      setIsSupported(false);
      setError('حساس البوصلة غير مدعوم في جهازك');
      return;
    }

    const handleAbsolute = (event: DeviceOrientationEvent) => {
      absoluteFired.current = true;
      if (event.alpha === null) return;

      // iOS
      if ((event as any).webkitCompassHeading != null) {
        setHeading((event as any).webkitCompassHeading);
        return;
      }
      // Standard absolute: alpha is CCW from North → convert to CW heading
      const screenAngle = (window.screen?.orientation?.angle ?? 0);
      const raw = (360 - event.alpha + screenAngle) % 360;
      setHeading(raw);
    };

    const handleRelative = (event: DeviceOrientationEvent) => {
      // Ignore relative events if absolute already fired
      if (absoluteFired.current) return;
      if (event.alpha === null) {
        setIsSupported(false);
        return;
      }
      // iOS webkitCompassHeading works on deviceorientation too
      if ((event as any).webkitCompassHeading != null) {
        setHeading((event as any).webkitCompassHeading);
        return;
      }
      // Relative alpha — less accurate but try anyway
      const screenAngle = (window.screen?.orientation?.angle ?? 0);
      const raw = (360 - event.alpha + screenAngle) % 360;
      setHeading(raw);
    };

    window.addEventListener('deviceorientationabsolute', handleAbsolute as EventListener, true);
    window.addEventListener('deviceorientation', handleRelative as EventListener, true);

    return () => {
      window.removeEventListener('deviceorientationabsolute', handleAbsolute as EventListener, true);
      window.removeEventListener('deviceorientation', handleRelative as EventListener, true);
    };
  }, []);

  const requestPermission = async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const result = await (DeviceOrientationEvent as any).requestPermission();
        if (result !== 'granted') {
          setError('لم يتم منح الإذن للوصول للبوصلة');
        }
      } catch {
        setError('حدث خطأ أثناء طلب الإذن');
      }
    }
  };

  return { heading, error, isSupported, requestPermission };
}
