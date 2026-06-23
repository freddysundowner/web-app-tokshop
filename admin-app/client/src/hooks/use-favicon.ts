import { useEffect } from 'react';
import { useSettings } from '@/lib/settings-context';
import { useApiConfig, getImageUrl } from '@/lib/use-api-config';

function setFavicon(href: string) {
  const head = document.head;
  let link = head.querySelector<HTMLLinkElement>("link[rel='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    head.appendChild(link);
  }
  if (/\.png(\?|$)/i.test(href)) link.type = 'image/png';
  else if (/\.jpe?g(\?|$)/i.test(href)) link.type = 'image/jpeg';
  else if (/\.svg(\?|$)/i.test(href)) link.type = 'image/svg+xml';
  else link.removeAttribute('type');
  link.href = href;
}

export function useFavicon() {
  const { settings } = useSettings();
  const { externalApiUrl } = useApiConfig();

  useEffect(() => {
    const logo = settings.app_logo;
    if (!logo || !externalApiUrl) return;
    const url = getImageUrl(logo, externalApiUrl);
    if (url) setFavicon(url);
  }, [settings.app_logo, externalApiUrl]);
}
