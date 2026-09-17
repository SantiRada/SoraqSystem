import { useEffect } from 'react';
import { env } from '@/config/env';
import { locales, useI18n } from '@/i18n';

interface PageMeta {
  /** Translated page name ("Proyectos"). Omit on the home page. */
  title?: string;
  /** Translated description. Defaults to meta.defaultDescription. */
  description?: string;
  /** Canonical path ("/"). Omit for private pages. */
  path?: string;
  /** true for private, transactional or error pages. */
  noindex?: boolean;
}

/**
 * Per-route document metadata (title, description, robots, canonical, Open Graph).
 * Every page calls this exactly once with already-translated strings. docs/SEO.md.
 */
export function usePageMeta({ title, description, path, noindex = false }: PageMeta): void {
  const { t, locale } = useI18n();
  const fullTitle = title ? t('meta.titleTemplate', { title }) : t('meta.defaultTitle');
  const fullDescription = description ?? t('meta.defaultDescription');

  useEffect(() => {
    document.title = fullTitle;
    setMeta('name', 'description', fullDescription);
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', fullDescription);
    setMeta('property', 'og:locale', locales[locale].ogLocale);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (path && !noindex) {
      const url = `${env.siteUrl}${path}`;
      setMeta('property', 'og:url', url);
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
      }
      canonical.href = url;
    } else {
      canonical?.remove();
    }
  }, [fullTitle, fullDescription, path, noindex, locale]);
}

function setMeta(attribute: 'name' | 'property', key: string, content: string): void {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
}
