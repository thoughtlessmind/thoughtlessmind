export const SITE = {
  name: 'Rajiv Kumar',
  brand: 'rajiv.me',
  title: 'Rajiv Kumar, software engineer',
  description:
    'Software engineer putting language models to work inside real products, and building the web and native apps, backends and infrastructure around them.',
  url: 'https://rajiv.me',
  email: 'hello@rajiv.me',
  role: 'Senior Frontend Engineer',
  previousCompany: 'Influence',
  since: 2020,
  // Umami Cloud website id (cookieless analytics). Empty means no script is loaded.
  umami: 'a0fe1bef-1b82-4890-8e2f-27753b91d1a5',
  socials: {
    github: 'https://github.com/thoughtlessmind',
    linkedin: 'https://www.linkedin.com/in/thoughtlessmind/',
    stackoverflow: 'https://stackoverflow.com/users/11222282/rajiv',
    x: 'https://x.com/rajiv_x_',
  },
  // The header nav, in the home page's section order. `spy` is the home page section the scroll spy matches.
  nav: [
    { label: 'About', href: '/#about', spy: 'about' },
    { label: 'Blogs', href: '/#blogs', spy: 'blogs' },
    { label: 'Projects', href: '/#projects', spy: 'projects' },
  ],
} as const;
