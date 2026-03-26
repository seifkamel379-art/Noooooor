import { useQuery } from '@tanstack/react-query';

// --- QURAN API ---
export function useQuranSurahs() {
  return useQuery({
    queryKey: ['quran-surahs'],
    queryFn: async () => {
      const res = await fetch('https://api.alquran.cloud/v1/meta');
      if (!res.ok) throw new Error('Failed to fetch surahs');
      const data = await res.json();
      return data.data.surahs.references as Array<{
        number: number;
        name: string;
        englishName: string;
        revelationType: string;
        numberOfAyahs: number;
      }>;
    },
    staleTime: Infinity,
  });
}

export function useSurah(number: number) {
  return useQuery({
    queryKey: ['surah', number],
    queryFn: async () => {
      const res = await fetch(`https://api.alquran.cloud/v1/surah/${number}/quran-uthmani`);
      if (!res.ok) throw new Error('Failed to fetch surah');
      const data = await res.json();
      return data.data;
    },
    enabled: !!number,
    staleTime: Infinity,
  });
}

export function useTafsir(surah: number, ayah: number) {
  return useQuery({
    queryKey: ['tafsir', surah, ayah],
    queryFn: async () => {
      const res = await fetch(`https://api.quran.com/api/v4/tafsirs/16/by_ayah/${surah}:${ayah}?language=ar`);
      if (!res.ok) throw new Error('Failed to fetch tafsir');
      const data = await res.json();
      return data.tafsir;
    },
    enabled: !!surah && !!ayah,
  });
}

export function useVerseWords(surah: number, ayah: number) {
  return useQuery({
    queryKey: ['verse-words', surah, ayah],
    queryFn: async () => {
      const res = await fetch(
        `https://api.quran.com/api/v4/verses/by_key/${surah}:${ayah}?words=true&word_fields=text_uthmani,audio_url&per_page=1`
      );
      if (!res.ok) throw new Error('Failed to fetch words');
      const data = await res.json();
      const words = data.verses?.[0]?.words ?? [];
      return words.filter((w: any) => w.char_type_name !== 'end');
    },
    enabled: !!surah && !!ayah,
    staleTime: Infinity,
  });
}

// --- PRAYER TIMES API (method=5 = Egyptian General Authority of Survey) ---
export function usePrayerTimes(lat: number | null, lng: number | null, dateOffset = 0) {
  return useQuery({
    queryKey: ['prayer-times', lat, lng, dateOffset],
    queryFn: async () => {
      if (!lat || !lng) throw new Error("No coordinates");
      const now = new Date();
      now.setDate(now.getDate() + dateOffset);
      const dd = now.getDate().toString().padStart(2, '0');
      const mm = (now.getMonth() + 1).toString().padStart(2, '0');
      const yyyy = now.getFullYear();
      const dateStr = `${dd}-${mm}-${yyyy}`;
      const res = await fetch(
        `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=5`
      );
      if (!res.ok) throw new Error('Failed to fetch prayer times');
      const data = await res.json();
      return {
        timings: data.data.timings as Record<string, string>,
        hijri: data.data.date?.hijri as { day: string; month: { ar: string }; year: string } | undefined,
      };
    },
    enabled: lat !== null && lng !== null,
    staleTime: 1000 * 60 * 60,
  });
}

// --- RECITERS API ---
export function useReciters() {
  return useQuery({
    queryKey: ['mp3quran-reciters'],
    queryFn: async () => {
      const res = await fetch('https://mp3quran.net/api/v3/reciters?language=ar');
      if (!res.ok) throw new Error('Failed to fetch reciters');
      const data = await res.json();
      return data.reciters as Array<{
        id: string;
        name: string;
        country?: string;
        moshaf: Array<{ id: number; name: string; server: string; surah_total: string; moshaf_type: number }>;
      }>;
    },
    staleTime: Infinity,
  });
}
