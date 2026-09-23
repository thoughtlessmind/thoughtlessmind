export const SITE = {
  name: 'Rajiv Kumar',
  handle: 'thoughtlessmind',
  title: 'Rajiv Kumar — Frontend engineer',
  description:
    'Frontend engineer in New Delhi. Seven years of React and TypeScript, shipping web products that are fast, exact, and quietly good.',
  url: 'https://thoughtlessmind.dev',
  email: 'me.rajiv21@gmail.com',
  role: 'Senior Frontend Engineer',
  company: 'swipejobs',
  previousCompany: 'Influence',
  since: 2019,
  socials: {
    github: 'https://github.com/thoughtlessmind',
    linkedin: 'https://www.linkedin.com/in/thoughtlessmind/',
    devto: 'https://dev.to/thoughtlessmind',
    stackoverflow: 'https://stackoverflow.com/users/11222282/rajiv',
    x: 'https://x.com/d_rajivkumar',
  },
  location: 'New Delhi, India',
  coords: '28.6139° N, 77.2090° E',
  timezone: 'Asia/Kolkata',
  gaId: 'G-CENN0Q2PZR',
  nav: [
    { label: 'Work', href: '/work/' },
    { label: 'Writing', href: '/writing/' },
    { label: 'About', href: '/about/' },
  ],
} as const;

export type SocialKey = keyof typeof SITE.socials;
