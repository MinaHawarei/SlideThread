/**
 * Generates lightweight data URLs for testing image rendering in the spike.
 */
export function createSampleDataUrl(
  width: number,
  height: number,
  isTransparent: boolean = false
): string {
  if (typeof document === 'undefined') {
    // Fallback SVG data URL for SSR/test environments
    const bg = isTransparent ? 'none' : '#2563eb';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="${bg}"/>
      <circle cx="${width / 2}" cy="${height / 2}" r="${Math.min(width, height) / 4}" fill="#38bdf8"/>
      <text x="50%" y="50%" fill="#ffffff" font-size="24" text-anchor="middle" dy=".3em">Sample ${width}x${height}</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  if (!isTransparent) {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#1e293b');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(width * 0.1, height * 0.1, width * 0.8, height * 0.8);
  } else {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, Math.min(width, height) / 3, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas.toDataURL(isTransparent ? 'image/png' : 'image/jpeg', 0.85);
}
