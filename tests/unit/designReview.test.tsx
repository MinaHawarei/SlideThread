import { plainTextFieldsToRichText, richTextToPlainText } from '../../src/core/schema';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SlideRenderer } from '../../src/slides/SlideRenderer';
import { generatePalette } from '../../src/core/palette';
import { SAMPLE_BRAND_AR, SAMPLE_BRAND_EN } from '../../src/slides/sampleSlides';
import type { AspectClass, Slide, TemplateId } from '../../src/core/schema';
import { getTemplate } from '../../src/templates';

describe('Design Review Pass: Long Arabic Text & Image-Heavy Slides (Spec §7.1, Task P2-4)', () => {
  const templates: TemplateId[] = ['tech-mesh', 'clean-minimal', 'bold-marketing', 'soft-gradient', 'heritage-geometric'];
  const aspects: AspectClass[] = ['landscape', 'square', 'portrait', 'tall'];
  const darkPalette = generatePalette('#35D0E6', 'dark');
  const lightPalette = generatePalette('#0B7FA6', 'light');

  describe('Long Arabic Text Handling Across Templates', () => {
    const longArabicSlides: Record<string, Slide> = {
      longExplain: {
        id: 's_long_ar_explain',
        type: 'explain',
        fields: plainTextFieldsToRichText({
          title: 'دليل شامل ومفصل حول هندسة البرمجيات وتطبيقات الويب بدون خوادم خلفية لعام 2026',
          body: `- النقطة الأولى: استخدام دوال التحويل الحتمية الرياضية لضمان تطابق التصميم والشاشات على كافة المتصفحات الحديثة\n- النقطة الثانية: تخزين البيانات بالكامل محلياً داخل المتصفح عبر IndexedDB مع احترام كامل لخصوصية المستخدمين\n- النقطة الثالثة: دعم كامل ومتكامل للنصوص ثنائية الاتجاه مع الحفاظ على تشبيك الحروف العربية والخطوط الطباعية الأصيلة\n- النقطة الرابعة: تجزئة الحزم وتوليد ملفات PDF وZIP عالية الدقة دون إرسال أي بايت واحد إلى خوادم خارجية`,
        }),
      },
      longRule: {
        id: 's_long_ar_rule',
        type: 'rule',
        fields: plainTextFieldsToRichText({
          title: 'قاعدة البنية المعمارية وتوزيع المسؤوليات في الأنظمة الموزعة عالية التوافر',
          cond: 'إذا كانت الحالة البرمجية للمكون قابلة للاشتقاق رياضياً وحتمياً من الخصائص الممررة أو المخزن المركزي',
          res: 'إذن قم باشتقاقها فوراً أثناء دورة التصيير وتجنب تماماً تكرارها داخل خطافات الحالة المحلية لتفادي عدم الاتساق',
          note: 'تطبيق هذه القاعدة يضمن التزامن الكامل بنسبة 100% ويمنع حدوث أي تعارض في البيانات',
          condLabel: 'إذا تحقق الشرط',
          resLabel: 'فإن النتيجة الحتمية',
        }),
      },
      longQuote: {
        id: 's_long_ar_quote',
        type: 'quote',
        fields: plainTextFieldsToRichText({
          text: 'إن البساطة في التصميم ليست غياب التعقيد، بل هي نتيجة التحكم الكامل فيه وفهم جوهر المشكلة وحلها بأقل قدر ممكن من الفوضى البصرية.',
          author: 'مينا هواري — استشاري هندسة البرمجيات والواجهات',
        }),
      },
    };

    for (const tmpl of templates) {
      it(`renders long Arabic explain, rule, and quote in ${tmpl} template without errors`, () => {
        for (const slide of Object.values(longArabicSlides)) {
          for (const aspectClass of aspects) {
            for (const themeMode of ['dark', 'light'] as const) {
              const palette = themeMode === 'dark' ? darkPalette : lightPalette;
              const { container, unmount } = render(
                <SlideRenderer
                  slide={slide}
                  palette={palette}
                  aspectClass={aspectClass}
                  templateId={tmpl}
                  themeMode={themeMode}
                  brand={SAMPLE_BRAND_AR}
                  textDir="rtl"
                  slideIndex={3}
                  totalSlides={10}
                />
              );

              const canvas = container.querySelector('.slide-canvas');
              expect(canvas).toBeInTheDocument();
              expect(canvas).toHaveClass(`template-${getTemplate(tmpl).className}`);

              // Slide counter retains LTR direction.
              const counter = container.querySelector('.sig-counter-badge');
              if (counter) {
                expect(counter).toHaveTextContent('04/10');
              }

              unmount();
            }
          }
        }
      });
    }
  });

  describe('Image-Heavy Slides & Media Placements Across Templates', () => {
    const mediaSlides: Record<string, Slide> = {
      imageSlide: {
        id: 's_media_image',
        type: 'image',
        fields: plainTextFieldsToRichText({
          caption: 'لقطة توضيحية لواجهة التطبيق بعد التحديث الأخير بنمط التصميم المختار',
          imageUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzM1RDBFNiIvPjwvc3ZnPg==',
        }),
        media: {
          assetId: 'asset_img_1',
          fit: 'cover',
          placement: 'top',
        },
      },
      explainWithSideMedia: {
        id: 's_media_explain_side',
        type: 'explain',
        fields: plainTextFieldsToRichText({
          title: 'Three Architectural Pillars with Attached Visual',
          body: '- Pure functions\n- Local persistence\n- Offline fonts',
          imageUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzM1RDBFNiIvPjwvc3ZnPg==',
        }),
        media: {
          assetId: 'asset_img_2',
          fit: 'contain',
          placement: 'side',
        },
      },
      explainWithReplaceText: {
        id: 's_media_explain_replace',
        type: 'explain',
        fields: plainTextFieldsToRichText({
          title: 'Visual Representation of Component Hierarchy',
          imageUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzM1RDBFNiIvPjwvc3ZnPg==',
        }),
        media: {
          assetId: 'asset_img_3',
          fit: 'cover',
          placement: 'replace-text',
        },
      },
    };

    for (const tmpl of templates) {
      it(`renders full-bleed image and media placements in ${tmpl} template`, () => {
        for (const slide of Object.values(mediaSlides)) {
          const { container, unmount } = render(
            <SlideRenderer
              slide={slide}
              palette={lightPalette}
              aspectClass="square"
              templateId={tmpl}
              brand={SAMPLE_BRAND_EN}
              slideIndex={1}
              totalSlides={6}
            />
          );

          const canvas = container.querySelector('.slide-canvas');
          expect(canvas).toBeInTheDocument();
          expect(canvas).toHaveClass(`template-${getTemplate(tmpl).className}`);

          // Check caption bar on image slide
          if (slide.type === 'image') {
            const caption = container.querySelector('.image-caption-bar');
            expect(caption).toBeInTheDocument();
            expect(caption).toHaveTextContent(richTextToPlainText(slide.fields.caption!));
          }

          unmount();
        }
      });
    }
  });
});
