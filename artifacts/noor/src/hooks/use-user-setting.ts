import { useState, useCallback } from 'react';
import { auth } from '@/lib/firebase';
import { getSettingCache, queueSettingSync, getCurrentUid } from '@/lib/rtdb';

/**
 * Hook يقرأ إعداداً من كاش RTDB ويؤجل الكتابة إلى Firebase.
 * يعمل بدون localStorage تماماً.
 */
export function useUserSetting<T>(
  key: string,
  defaultVal: T,
): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => getSettingCache<T>(key, defaultVal));

  const set = useCallback(
    (v: T | ((prev: T) => T)) => {
      setValue(prev => {
        const next = typeof v === 'function' ? (v as (p: T) => T)(prev) : v;
        const uid = auth.currentUser?.uid ?? getCurrentUid();
        if (uid) queueSettingSync(uid, key, next);
        return next;
      });
    },
    [key],
  );

  return [value, set];
}
