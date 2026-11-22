import { describe, it, expect } from 'vitest';
import { APP_NAME, OWNER, GITHUB_URL } from '@/config/site';

describe('site config', () => {
  it('has valid APP_NAME and OWNER configuration', () => {
    expect(APP_NAME).toBe('SlideThread');
    expect(OWNER.name).toBe('Mina Hawarei');
    expect(OWNER.handle).toBe('@minahawarei');
    expect(GITHUB_URL).toContain('SlideThread');
  });
});
