import { jsPDF } from 'jspdf';

export interface SlidePng {
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Creates a raster PDF from an array of slide PNG data URLs.
 * Page size strictly matches the slide dimensions in pixels.
 */
export async function createPdfFromPngs(
  slides: SlidePng[],
  title: string = 'carousel'
): Promise<Blob> {
  if (slides.length === 0) {
    throw new Error('No slides provided to build PDF');
  }

  const first = slides[0]!;
  const firstOrientation = first.width > first.height ? 'landscape' : 'portrait';

  const doc = new jsPDF({
    orientation: firstOrientation,
    unit: 'px',
    format: [first.width, first.height],
    hotfixes: ['px_scaling'],
  });

  doc.setProperties({ title });

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i]!;
    if (i > 0) {
      const orientation = slide.width > slide.height ? 'landscape' : 'portrait';
      doc.addPage([slide.width, slide.height], orientation);
    }
    doc.addImage(slide.dataUrl, 'PNG', 0, 0, slide.width, slide.height);
  }

  return doc.output('blob');
}
