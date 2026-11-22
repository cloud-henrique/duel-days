/**
 * O rótulo do aparelho que aparece na nuvem e na escolha de um conflito ("Salvo no iPhone"). Sai do `userAgent`; o iPad
 * com iPadOS se apresenta como Mac, e o toque o denuncia.
 */
export function deviceLabel(ua: string, touchPoints = 0): string {
  if (/iPhone|iPod/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua) || (/Macintosh/.test(ua) && touchPoints > 1)) return 'iPad';
  if (/Android/.test(ua)) return /Mobile/.test(ua) ? 'Android' : 'Tablet Android';
  if (/Macintosh|Mac OS X/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'Windows';
  if (/CrOS/.test(ua)) return 'Chromebook';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Outro aparelho';
}

export const thisDevice = () =>
  typeof navigator === 'undefined' ? 'Outro aparelho' : deviceLabel(navigator.userAgent, navigator.maxTouchPoints ?? 0);
