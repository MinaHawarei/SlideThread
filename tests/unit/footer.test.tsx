import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from '../../src/ui/common/Footer';
import { OWNER, GITHUB_URL, FEEDBACK_URL } from '../../src/config/site';
import { useI18nStore } from '../../src/i18n';

describe('Footer Component (Spec §10.3, §10.4, Task P3-9)', () => {
  beforeEach(() => {
    useI18nStore.getState().setLocale('en');
  });

  it('renders owner name, handle, and social links from site.ts, and centered version', () => {
    render(<Footer />);

    expect(screen.getByTestId('app-footer')).toBeInTheDocument();
    expect(screen.getByTestId('footer-owner-link')).toHaveTextContent(OWNER.name);
    expect(screen.queryByText(`(${OWNER.handle})`)).not.toBeInTheDocument();
    expect(screen.getByTestId('footer-version')).toHaveTextContent('v1.0.0');

    // Owner social profile link
    expect(screen.getByTestId('footer-owner-link')).toHaveAttribute(
      'href',
      OWNER.socials.linkedin || OWNER.socials.github
    );

    // Social icons
    expect(screen.getByTestId('footer-social-github')).toHaveAttribute('href', OWNER.socials.github);
    expect(screen.getByTestId('footer-social-linkedin')).toHaveAttribute('href', OWNER.socials.linkedin);
    expect(screen.getByTestId('footer-social-instagram')).toHaveAttribute('href', OWNER.socials.instagram);
  });

  it('renders privacy note per Spec §10.3', () => {
    render(<Footer />);

    const privacyNote = screen.getByTestId('footer-privacy-note');
    expect(privacyNote).toHaveTextContent('Your content stays in your browser. We use cookieless analytics.');
  });

  it('renders Star on GitHub link with repo URL', () => {
    render(<Footer />);

    const starBtn = screen.getByTestId('footer-star-btn');
    expect(starBtn).toHaveAttribute('href', GITHUB_URL);
    expect(starBtn).toHaveAttribute('target', '_blank');
    expect(starBtn).toHaveTextContent('Star on GitHub');
  });

  it('renders Feedback button with mailto fallback when FEEDBACK_URL is empty', () => {
    render(<Footer />);

    const feedbackBtn = screen.getByTestId('footer-feedback-btn');
    if (FEEDBACK_URL) {
      expect(feedbackBtn).toHaveAttribute('href', FEEDBACK_URL);
      expect(feedbackBtn).toHaveAttribute('target', '_blank');
    } else {
      expect(feedbackBtn.getAttribute('href')).toMatch(/^mailto:/);
    }
  });

  it('renders correctly in Arabic (RTL)', () => {
    useI18nStore.getState().setLocale('ar');
    render(<Footer />);

    expect(screen.getByText('صُمم بواسطة')).toBeInTheDocument();
    expect(screen.getByText(/نجمة على GitHub/)).toBeInTheDocument();
    expect(screen.getByText('إرسال ملاحظات')).toBeInTheDocument();
    expect(screen.getByTestId('footer-privacy-note')).toHaveTextContent(
      'بياناتك ومحتواك يبقيان بالكامل في متصفحك. نستخدم تحليلات رقمية بدون ملفات تعريف ارتباط.'
    );
  });

  it('renders compact footer variant', () => {
    render(<Footer compact />);

    expect(screen.getByTestId('app-footer')).toBeInTheDocument();
    expect(screen.getByTestId('footer-star-btn')).toBeInTheDocument();
    expect(screen.getByTestId('footer-feedback-btn')).toBeInTheDocument();
    expect(screen.getByText(OWNER.name)).toBeInTheDocument();
  });

  it('ensures all interactive links meet the touch target standard (>= 44px)', () => {
    render(<Footer />);

    const links = [
      screen.getByTestId('footer-owner-link'),
      screen.getByTestId('footer-social-github'),
      screen.getByTestId('footer-social-linkedin'),
      screen.getByTestId('footer-social-instagram'),
      screen.getByTestId('footer-star-btn'),
      screen.getByTestId('footer-feedback-btn'),
    ];

    for (const link of links) {
      expect(link).toHaveClass('min-h-[44px]');
    }
  });
});
