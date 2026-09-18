/** Small client-safe country list for pickers (names + flags). */
export const COUNTRY_INFO: Record<string, { name: string; flag: string }> = {
  us: { name: 'United States', flag: '🇺🇸' },
  gb: { name: 'United Kingdom', flag: '🇬🇧' },
  de: { name: 'Germany', flag: '🇩🇪' },
  fr: { name: 'France', flag: '🇫🇷' },
  es: { name: 'Spain', flag: '🇪🇸' },
  nl: { name: 'Netherlands', flag: '🇳🇱' },
  pl: { name: 'Poland', flag: '🇵🇱' },
  ch: { name: 'Switzerland', flag: '🇨🇭' },
  ge: { name: 'Georgia', flag: '🇬🇪' },
  pa: { name: 'Panama', flag: '🇵🇦' },
  am: { name: 'Armenia', flag: '🇦🇲' },
  it: { name: 'Italy', flag: '🇮🇹' },
  pt: { name: 'Portugal', flag: '🇵🇹' },
  ca: { name: 'Canada', flag: '🇨🇦' },
  br: { name: 'Brazil', flag: '🇧🇷' },
};

export function countryInfo(code: string) {
  return COUNTRY_INFO[code] ?? { name: code.toUpperCase(), flag: '🌐' };
}
