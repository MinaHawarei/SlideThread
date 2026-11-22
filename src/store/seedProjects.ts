import type { Project } from '../core/schema';
import { CURRENT_SCHEMA_VERSION } from '../core/schema';

export function getDemoProjectEn(): Project {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    id: 'demo_en_architecture',
    title: 'Modern Frontend Architecture',
    platform: 'linkedin',
    contentType: 'carousel',
    formatId: 'r_4_5',
    orientation: 'portrait',
    templateId: 'network',
    primaryColor: '#35D0E6',
    theme: 'dark',
    textDir: 'ltr',
    createdAt: 1732300000000,
    updatedAt: 1732300000000,
    slides: [
      {
        id: 'demo_en_1_cover',
        type: 'cover',
        fields: {
          tag: 'ARCHITECTURE',
          title: 'Building High-Fidelity Web Apps with Zero Server Overhead',
          sub: 'How pure client-side tools achieve 60fps rendering and seamless export in modern browsers.',
          rule: 'npx create-slidethread@latest',
        },
      },
      {
        id: 'demo_en_2_explain',
        type: 'explain',
        fields: {
          title: 'Three Architectural Pillars',
          body: '- Deterministic rendering functions for predictable UI\n- IndexedDB local persistence preserving user privacy\n- Zero-telemetry offline execution without remote databases',
        },
      },
      {
        id: 'demo_en_3_rule',
        type: 'rule',
        fields: {
          title: 'State Architecture Rule',
          cond: 'State can be derived purely from existing props or stores',
          res: 'Derive it on the fly; never duplicate it into local component state',
          note: 'Guarantees 100% synchronization and eliminates stale closures',
          condLabel: 'IF',
          resLabel: 'THEN',
        },
      },
      {
        id: 'demo_en_4_compare',
        type: 'compare',
        fields: {
          title: 'State Management Approaches',
          l1: 'Heavy Client Cache',
          t1: 'Global prop drilling and monolithic context providers re-rendering all nodes',
          l2: 'Atomic Selectors',
          t2: 'Granular Zustand selectors ensuring only changed slide elements re-render',
        },
      },
      {
        id: 'demo_en_5_code',
        type: 'code',
        fields: {
          title: 'Granular Selector Hook',
          code: 'export const useActiveSlide = () =>\n  useProjectStore((state) =>\n    state.project.slides.find((s) => s.id === state.activeSlideId)\n  );',
          note: 'Subscribers only re-evaluate when active slide updates',
        },
      },
      {
        id: 'demo_en_6_stat',
        type: 'stat',
        fields: {
          value: '0ms',
          label: 'Backend Latency',
          note: 'All rendering, image processing, and PDF assembly happen client-side',
        },
      },
      {
        id: 'demo_en_7_quote',
        type: 'quote',
        fields: {
          text: 'The best code is the code you never have to send over a network socket.',
          author: 'Frontend Engineering Principle',
        },
      },
      {
        id: 'demo_en_8_image',
        type: 'image',
        fields: {
          caption: 'Visualizing component tree hierarchy and data flow',
        },
      },
      {
        id: 'demo_en_9_cta',
        type: 'cta',
        fields: {
          title: 'Build Faster, Ship Cleaner',
          body: 'Explore the open source repo, contribute new templates, or star SlideThread on GitHub.',
          action: 'Star on GitHub',
        },
      },
    ],
  };
}

export function getDemoProjectAr(): Project {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    id: 'demo_ar_design_systems',
    title: 'أنظمة التصميم والواجهات الحديثة',
    platform: 'instagram',
    contentType: 'carousel',
    formatId: 'r_4_5',
    orientation: 'portrait',
    templateId: 'network',
    primaryColor: '#0B7FA6',
    theme: 'dark',
    textDir: 'rtl',
    createdAt: 1732300000000,
    updatedAt: 1732300000000,
    slides: [
      {
        id: 'demo_ar_1_cover',
        type: 'cover',
        fields: {
          tag: 'هندسة الواجهات',
          title: 'بناء تطبيقات الويب الحديثة بدون أي خوادم خلفية',
          sub: 'دليل شامل لتصدير شرائح عالية الجودة مباشرة من المتصفح مع دعم ثنائي الاتجاه.',
          rule: 'git clone slidethread && npm install',
        },
      },
      {
        id: 'demo_ar_2_explain',
        type: 'explain',
        fields: {
          title: 'الركائز الأساسية لهندسة الواجهات',
          body: '- دوال تحويل نقية ونظام تصميم حتمي يضمن نتائج دقيقة وموثوقة\n- تخزين محلي كامل يحفظ خصوصية بيانات المستخدم في المتصفح عبر IndexedDB\n- خطوط محلية مدمجة تدعم التشكيل والخطوط الطباعية المعقدة بدون CDN',
        },
      },
      {
        id: 'demo_ar_3_rule',
        type: 'rule',
        fields: {
          title: 'قاعدة البنية المعمارية',
          cond: 'إذا كانت الحالة البرمجية للمكون قابلة للاشتقاق رياضياً من الخصائص',
          res: 'قم باشتقاقها فوراً أثناء دورة التصيير وتجنب تكرارها في الحالة المحلية',
          note: 'تطبيق هذه القاعدة يضمن التزامن الكامل بنسبة 100% ويمنع التعارض',
          condLabel: 'إذا',
          resLabel: 'إذن',
        },
      },
      {
        id: 'demo_ar_4_compare',
        type: 'compare',
        fields: {
          title: 'إدارة الحالة البرمجية',
          l1: 'السياق المترابط المعقد',
          t1: 'تمرير الخصائص لجميع المكونات مما يتسبب في إعادة تصيير كامل الشاشة',
          l2: 'المحددات الذرية المعزولة',
          t2: 'استخدام محددات دقيقة تضمن إعادة تصيير الشريحة المعدلة فقط دون غيرها',
        },
      },
      {
        id: 'demo_ar_5_code',
        type: 'code',
        fields: {
          title: 'محدد الشريحة الفعالة',
          code: 'export const useActiveSlide = () =>\n  useProjectStore((state) =>\n    state.project.slides.find((s) => s.id === state.activeSlideId)\n  );',
          note: 'يتم استدعاء المكون فقط عند تغير الشريحة المحددة',
        },
      },
      {
        id: 'demo_ar_6_stat',
        type: 'stat',
        fields: {
          value: '100%',
          label: 'تنفيذ كامل في المتصفح',
          note: 'خصوصية تامة بدون قواعد بيانات أو خوادم وسيطة',
        },
      },
      {
        id: 'demo_ar_7_quote',
        type: 'quote',
        fields: {
          text: 'إن البساطة في التصميم ليست غياب التعقيد، بل هي نتيجة التحكم الكامل فيه وفهم المشكلة بحق.',
          author: 'مبدأ هندسة النظم البرمجية',
        },
      },
      {
        id: 'demo_ar_8_image',
        type: 'image',
        fields: {
          caption: 'مخطط بياني لتوزيع مكونات العرض وانسياب البيانات',
        },
      },
      {
        id: 'demo_ar_9_cta',
        type: 'cta',
        fields: {
          title: 'شاركنا التجربة وطوّر معنا',
          body: 'مشروع مفتوح المصدر بالكامل، ندعوك للمشاركة وإضافة قوالب جديدة على GitHub.',
          action: 'متابعة ومشاركة',
        },
      },
    ],
  };
}
