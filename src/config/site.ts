export interface OwnerConfig {
  name: string;
  handle: string;
  socials: {
    linkedin: string;
    instagram: string;
    github: string;
    x?: string;
  };
}

export const APP_NAME = 'SlideThread';
export const APP_VERSION = '1.0.0';

export const OWNER: OwnerConfig = {
  name: 'Mina Hawarei',
  handle: '@minahawarei',
  socials: {
    linkedin: 'https://linkedin.com/in/minahawarei',
    instagram: 'https://instagram.com/minahawarei',
    github: 'https://github.com/minahawarei',
  },
};

export const FEEDBACK_URL: string = '';
export const GITHUB_URL = 'https://github.com/minahawarei/SlideThread';
