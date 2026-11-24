import { plainTextFieldsToRichText, type Slide } from '../core/schema';

export const SAMPLE_SLIDES: Record<string, Slide> = {
  cover_en: {
    id: 's_cover_en',
    type: 'cover',
    fields: plainTextFieldsToRichText({
      tag: 'ARCHITECTURE',
      title: 'Building Modern React Web Apps with Zero Server Overhead',
      sub: 'How we build high-fidelity client-side canvas tools using modern web standards.',
      rule: 'npx create-slidethread@latest',
    }),
  },
  cover_ar: {
    id: 's_cover_ar',
    type: 'cover',
    fields: plainTextFieldsToRichText({
      tag: 'تصميم الويب',
      title: 'بناء تطبيقات الويب الحديثة بدون أي خوادم خلفية',
      sub: 'دليل عملي شامل لتصدير شرائح عالية الجودة مباشرة من المتصفح مع دعم ثنائي الاتجاه.',
      rule: 'git clone slidethread && npm install',
    }),
  },
  explain_en: {
    id: 's_explain_en',
    type: 'explain',
    fields: plainTextFieldsToRichText({
      title: 'Three Pillars of Modern Frontend Architecture',
      body: `- Deterministic pure rendering functions for perfect predictability\n- Local-first persistence keeping your data in IndexedDB\n- Offline-ready fonts and assets bundled without CDNs`,
    }),
  },
  explain_ar: {
    id: 's_explain_ar',
    type: 'explain',
    fields: plainTextFieldsToRichText({
      title: 'الركائز الأساسية لهندسة الواجهات الحديثة',
      body: `- دوال تحويل نقية ونظام تصميم حتمي يضمن نتائج دقيقة\n- تخزين محلي كامل يحفظ خصوصية بيانات المستخدم في المتصفح\n- خطوط محلية مدمجة تدعم التشكيل والخطوط الطباعية المعقدة`,
    }),
  },
  rule_en: {
    id: 's_rule_en',
    type: 'rule',
    fields: plainTextFieldsToRichText({
      title: 'State Architecture Guideline',
      cond: 'State can be derived purely from existing props or store',
      res: 'Derive it on the fly; never duplicate it into useState or useEffect',
      note: 'Avoids race conditions and guarantees 100% synchronization',
    }),
  },
  rule_ar: {
    id: 's_rule_ar',
    type: 'rule',
    fields: plainTextFieldsToRichText({
      title: 'قاعدة ذهبية في إدارة الحالة',
      cond: 'إذا كانت الحالة قابلة للحساب المباشر من البيانات الحالية',
      res: 'احسبها فوراً ولا تكرر تخزينها في متغيرات حالة مستقلة',
      note: 'تمنع التعارض وتضمن اتساق الواجهة بشكل حتمي',
    }),
  },
  compare_en: {
    id: 's_compare_en',
    type: 'compare',
    fields: plainTextFieldsToRichText({
      title: 'Responsive Design in Slide Canvases',
      l1: '✗ Viewport Units (vw / vh)',
      t1: 'Breaks export fidelity because server or headless renders use unexpected viewport sizes.',
      l2: '✓ Fixed Coordinate Scaling',
      t2: 'Renders in a known pixel box (1080px short side) and scales via CSS transform.',
    }),
  },
  compare_ar: {
    id: 's_compare_ar',
    type: 'compare',
    fields: plainTextFieldsToRichText({
      title: 'مقارنة بين أساليب القياس والتحجيم',
      l1: '✗ وحدات العرض الديناميكية (vw/vh)',
      t1: 'تؤدي إلى تشوه التصدير واختلاف الأحجام بين أجهزة الهواتف والمتصفحات.',
      l2: '✓ الإحداثيات الثابتة مع التحجيم',
      t2: 'تضمن تطابقاً بنسبة 100% بين المعاينة والملف النهائي المصدّر بدقة عالية.',
    }),
  },
  code_en: {
    id: 's_code_en',
    type: 'code',
    fields: plainTextFieldsToRichText({
      title: 'Pure OKLCH Palette Generator',
      code: `export function generatePalette(primaryHex: string, theme: ThemeMode): Palette {
  const parsed = oklch(primaryHex);
  const bgL = theme === 'dark' ? 0.17 : 0.97;
  return {
    bg: formatHex({ mode: 'oklch', l: bgL, c: 0.02, h: parsed.h }),
    ink: formatHex({ mode: 'oklch', l: 0.95, c: 0.01, h: parsed.h }),
  };
}`,
      note: 'Maintains WCAG contrast ratios across arbitrary primary colors.',
    }),
  },
  code_ar: {
    id: 's_code_ar',
    type: 'code',
    fields: plainTextFieldsToRichText({
      title: 'كود توليد لوحات الألوان المتوافقة',
      code: `const palette = generatePalette('#35D0E6', 'dark');
console.log('Contrast ink/bg:', getContrastRatio(palette.ink, palette.bg));
// Result: 16.08 (exceeds WCAG AAA 7:1 threshold)`,
      note: 'كود المعالجة المنطقية البرمجية يعمل دائماً من اليسار إلى اليمين LTR.',
    }),
  },
  stat_en: {
    id: 's_stat_en',
    type: 'stat',
    fields: plainTextFieldsToRichText({
      value: '100%',
      label: 'Client-side processing',
      note: 'Zero server uploads or latency during generation and export.',
    }),
  },
  stat_ar: {
    id: 's_stat_ar',
    type: 'stat',
    fields: plainTextFieldsToRichText({
      value: '١٠٠٪',
      label: 'معالجة محلية كاملة داخل المتصفح',
      note: 'لا يتم إرسال أي صورة أو نص إلى أي خادم خارجي على الإطلاق.',
    }),
  },
  quote_en: {
    id: 's_quote_en',
    type: 'quote',
    fields: plainTextFieldsToRichText({
      text: 'Simplicity is about subtracting the obvious and adding the meaningful.',
      author: 'John Maeda, The Laws of Simplicity',
    }),
  },
  quote_ar: {
    id: 's_quote_ar',
    type: 'quote',
    fields: plainTextFieldsToRichText({
      text: 'البساطة لا تعني غياب التعقيد، بل تعني وضوح الرؤية والقدرة على التركيز على ما يهم حقاً.',
      author: 'حكمة معمارية عربية',
    }),
  },
  image_en: {
    id: 's_image_en',
    type: 'image',
    fields: plainTextFieldsToRichText({
      caption: 'High-contrast design with full-bleed media and clean typography overlay.',
    }),
  },
  image_ar: {
    id: 's_image_ar',
    type: 'image',
    fields: plainTextFieldsToRichText({
      caption: 'عرض بصري ملء الشاشة مع طبقة نصية علوية تدعم الخطوط العربية بوضوح فائق.',
    }),
  },
  cta_en: {
    id: 's_cta_en',
    type: 'cta',
    fields: plainTextFieldsToRichText({
      name: 'Mina',
      handle: '@mina_tech',
      title: 'Start Creating Beautiful Slide Carousels Today',
      body: 'Open source, 100% free, runs entirely in your browser without sign-ups.',
      action: 'Launch SlideThread →',
    }),
  },
  cta_ar: {
    id: 's_cta_ar',
    type: 'cta',
    fields: plainTextFieldsToRichText({
      name: 'مينا',
      handle: '@mina_tech',
      title: 'ابدأ بإنشاء منشوراتك المميزة الآن مجاناً',
      body: 'أداة مفتوحة المصدر تعمل بالكامل في جهازك دون الحاجة لتسجيل حساب.',
      action: 'ابدأ الاستخدام مجاناً ←',
    }),
  },
};

export const SAMPLE_BRAND_EN: import('../core/schema').BrandSettings = {
  displayName: 'user name',
  handle: '',
  showSignature: true,
  showSocials: false,
  socials: [],
  language: 'en',
  defaultTemplateId: 'network',
  defaultPrimaryColor: '#0A84FF',
  defaultTheme: 'dark',
  appTheme: 'light',
};

export const SAMPLE_BRAND_AR: import('../core/schema').BrandSettings = {
  displayName: 'user name',
  handle: '',
  showSignature: true,
  showSocials: false,
  socials: [],
  language: 'ar',
  defaultTemplateId: 'network',
  defaultPrimaryColor: '#0A84FF',
  defaultTheme: 'dark',
  appTheme: 'light',
};
