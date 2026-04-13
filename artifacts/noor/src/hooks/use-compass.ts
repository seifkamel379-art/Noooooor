import { useState, useEffect, useRef } from 'react';

/**
 * Low-pass filter factor (0–1).
 * Lower = smoother but slower to respond.
 * 0.25 gives a good balance for a compass.
 */
const LPF = 0.25;

/** Blend two compass angles respecting the 0/360 wraparound. */
function blendAngles(prev: number, next: number, alpha: number): number {
  let diff = next - prev;
  if (diff > 180)  diff -= 360;
  if (diff < -180) diff += 360;
  return (prev + alpha * diff + 360) % 360;
}

/**
 * Returns the current screen-orientation offset in degrees.
 *
 * We need to add this to the raw sensor heading so that the
 * compass always reads relative to the TOP of the screen, not
 * the top of the physical device.
 *
 * - Portrait (home bottom / no rotation) → 0°
 * - Landscape with home on the right     → +90°
 * - Portrait upside-down                 → +180°
 * - Landscape with home on the left      → +270° (or −90°)
 *
 * The Screen Orientation API gives this directly (on Android).
 * On iOS, `screen.orientation` is undefined; we fall back to the
 * deprecated `window.orientation` which works on Safari.
 */
function screenOrientationOffset(): number {
  // Modern API (Android, Chrome)
  if (window.screen?.orientation?.angle !== undefined) {
    return window.screen.orientation.angle;
  }
  // Legacy iOS Safari fallback
  const wo = (window as any).orientation;
  if (typeof wo === 'number') {
    // window.orientation: 0, 90, -90, 180
    // Convert to 0..360 same as Screen Orientation API
    return ((wo % 360) + 360) % 360;
  }
  return 0;
}

export function useCompass() {
  const [heading, setHeading] = useState<number | null>(null);
  const [error, setError]   = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  // Internal smoothed value — kept in a ref to avoid re-render on every sensor tick
  const smoothed    = useRef<number | null>(null);
  // Whether we have ever received a trustworthy absolute reading
  const hasAbsolute = useRef(false);

  useEffect(() => {
    if (!window.DeviceOrientationEvent) {
      setIsSupported(false);
      setError('حساس البوصلة غير مدعوم في جهازك');
      return;
    }

    /** Apply LPF and update state. */
    function applyAndSet(raw: number) {
      const next =
        smoothed.current === null
          ? raw
          : blendAngles(smoothed.current, raw, LPF);
      smoothed.current = next;
      setHeading(Math.round(next * 10) / 10); // round to 1 dp
    }

    /**
     * Handler for `deviceorientationabsolute` (Android / some browsers).
     *
     * `event.absolute === true` guarantees the alpha is referenced to
     * magnetic north.  alpha is measured CCW from north → invert to CW.
     */
    const handleAbsolute = (event: DeviceOrientationEvent) => {
      // Guard: only process truly absolute events
      if (!event.absolute) return;
      if (event.alpha === null) return;

      hasAbsolute.current = true;

      // iOS can fire here too with webkitCompassHeading already corrected
      if ((event as any).webkitCompassHeading != null) {
        const offset = screenOrientationOffset();
        applyAndSet(((event as any).webkitCompassHeading + offset) % 360);
        return;
      }

      // Standard: alpha CCW from north → CW heading, then screen correction
      const offset = screenOrientationOffset();
      applyAndSet((360 - event.alpha + offset) % 360);
    };

    /**
     * Handler for `deviceorientation` (fires on all platforms).
     *
     * We use this ONLY for iOS `webkitCompassHeading`, which IS a true
     * compass heading.  We intentionally ignore the plain `alpha` value
     * here because without `event.absolute === true` it is just an
     * arbitrary relative rotation — NOT a compass heading.
     */
    const handleOrientation = (event: DeviceOrientationEvent) => {
      // Prefer the absolute stream if it is already delivering data
      if (hasAbsolute.current) return;

      // iOS: webkitCompassHeading is a proper compass heading
      if ((event as any).webkitCompassHeading != null) {
        const offset = screenOrientationOffset();
        applyAndSet(((event as any).webkitCompassHeading + offset) % 360);
        return;
      }

      // No absolute reference and no webkitCompassHeading →
      // we cannot derive a compass heading from relative alpha.
      if (event.alpha === null) {
        setIsSupported(false);
      }
      // Do NOT fall back to relative alpha — it is not a compass heading.
    };

    window.addEventListener(
      'deviceorientationabsolute',
      handleAbsolute as EventListener,
      true,
    );
    window.addEventListener(
      'deviceorientation',
      handleOrientation as EventListener,
      true,
    );

    return () => {
      window.removeEventListener(
        'deviceorientationabsolute',
        handleAbsolute as EventListener,
        true,
      );
      window.removeEventListener(
        'deviceorientation',
        handleOrientation as EventListener,
        true,
      );
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
