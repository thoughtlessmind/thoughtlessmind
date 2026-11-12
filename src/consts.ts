export const SITE = {
  name: 'Rajiv Kumar',
  brand: 'rajiv.me',
  title: 'Rajiv Kumar, software engineer in New Delhi',
  description:
    'Software engineer in New Delhi. I build web and native apps, their backends and infrastructure, and put language models to work inside them. Since 2019.',
  url: 'https://thoughtlessmind.dev',
  email: 'hello@rajiv.me',
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
  // The header nav, in the home page's section order. `spy` is the home page section the scroll spy matches.
  nav: [
    { label: 'About', href: '/#about', spy: 'about' },
    { label: 'Blogs', href: '/blogs', spy: 'blogs' },
    { label: 'Projects', href: '/#projects', spy: 'projects' },
  ],
} as const;

export type SocialKey = keyof typeof SITE.socials;
