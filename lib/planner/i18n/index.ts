import en from './en';
import ru from './ru';
import kk from './kk';

export type Lang = 'ru' | 'kk' | 'en';
export type TKey = keyof typeof en;

export const LANGS: Lang[] = ['ru', 'kk', 'en'];
export const DEFAULT_LANG: Lang = 'ru';

const DICTS: Record<Lang, typeof en> = { en, ru, kk };

/** Translate a key. Falls back to English, then to the raw key. */
export function translate(lang: Lang, key: TKey): string {
  return DICTS[lang][key] ?? en[key] ?? key;
}
