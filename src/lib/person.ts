import { SITE } from '../consts';

/** Stable JSON-LD @ids. Other nodes reference these instead of repeating the entity. */
export const PERSON_ID = `${SITE.url}/#person`;
export const WEBSITE_ID = `${SITE.url}/#website`;

// Same glob as Avatar.astro: `image` is emitted only once an avatar file exists in public/images/.
const avatar = Object.keys(import.meta.glob('/public/images/avatar.{jpg,png,webp}'))[0]?.replace(/^\/public/, '');

/** JSON-LD Person, defined on the home page and the about page. `url` is always the site root. */
export const person = () => ({
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': PERSON_ID,
  name: SITE.name,
  alternateName: SITE.handle,
  url: SITE.url,
  ...(avatar && { image: new URL(avatar, SITE.url).href }),
  email: `mailto:${SITE.email}`,
  jobTitle: SITE.role,
  knowsAbout: [
    'Software engineering',
    'Web applications',
    'macOS apps',
    'Backend development',
    'Cloud infrastructure',
    'DevOps',
    'TypeScript',
    'React',
    'Node.js',
    'Swift',
    'AWS',
    'Terraform',
  ],
  address: { '@type': 'PostalAddress', addressLocality: 'New Delhi', addressCountry: 'IN' },
  sameAs: [
    ...Object.values(SITE.socials).filter(Boolean),
    'https://hashnode.com/@thoughtlessmind',
    'https://www.npmjs.com/~thoughtlessmind',
  ],
});
