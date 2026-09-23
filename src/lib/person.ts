import { SITE } from '../consts';

/** JSON-LD Person, shared by the home and about pages. Pass a page-specific `url` if it differs from the site root. */
export const person = (url: string = SITE.url) => ({
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: SITE.name,
  url,
  email: `mailto:${SITE.email}`,
  jobTitle: SITE.role,
  worksFor: { '@type': 'Organization', name: SITE.company },
  address: { '@type': 'PostalAddress', addressLocality: 'New Delhi', addressCountry: 'IN' },
  sameAs: Object.values(SITE.socials).filter(Boolean),
});
