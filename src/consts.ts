export const SITE = {
  name: 'Rajiv Kumar',
  brand: 'rajiv.me',
  title: 'Rajiv Kumar, software engineer in New Delhi',
  description:
    'Software engineer in New Delhi. I build web and native apps, the backends behind them and the infrastructure they run on. Shipping since 2019.',
  url: 'https://thoughtlessmind.dev',
  email: 'me.rajiv21@gmail.com',
  role: 'Senior Frontend Engineer',
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
  nav: [
    { label: 'Work', href: '/work' },
    { label: 'Writing', href: '/writing' },
    { label: 'About', href: '/about' },
  ],
} as const;

export type SocialKey = keyof typeof SITE.socials;
