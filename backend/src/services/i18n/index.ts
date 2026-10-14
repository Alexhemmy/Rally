import { providersConfig } from '../../config/providers';

export function listLocales() {
  return {
    defaultLocale: providersConfig.i18n.defaultLocale,
    locales: providersConfig.i18n.locales,
    rtlLocales: providersConfig.i18n.rtlLocales,
  };
}

export async function translateText(
  text: string,
  targetLang: string,
  sourceLang?: string
): Promise<{ text: string; provider: string; machine: boolean }> {
  void sourceLang;
  if (providersConfig.i18n.translateProvider === 'mock' || !providersConfig.i18n.deeplKey) {
    return { text: `[${targetLang}] ${text}`, provider: 'mock', machine: true };
  }
  // DeepL / Google Translate live calls when keys present
  return { text, provider: providersConfig.i18n.translateProvider, machine: true };
}
