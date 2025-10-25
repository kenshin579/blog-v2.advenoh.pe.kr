export interface SocialLink {
  name: string;
  url: string;
  icon: string;
  ariaLabel: string;
}

export const socialLinks: SocialLink[] = [
  {
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/in/frank-oh-abb80b10/',
    icon: 'Linkedin',
    ariaLabel: 'LinkedIn 프로필 방문'
  },
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/frank.photosnap',
    icon: 'Instagram',
    ariaLabel: 'Instagram 프로필 방문'
  },
  {
    name: 'Blog',
    url: 'https://investment.advenoh.pe.kr/',
    icon: 'BookOpen',
    ariaLabel: '투자 블로그 방문'
  }
];
