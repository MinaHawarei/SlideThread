export function formatSlideCounterValue(
  index: number,
  total: number,
  format: 'nn/nn' | 'n' | 'n/nn' = 'nn/nn'
): string {
  const current = index + 1;
  switch (format) {
    case 'n':
      return `${current}`;
    case 'n/nn':
      return `${current} / ${total}`;
    case 'nn/nn':
    default: {
      const padLen = Math.max(2, String(total).length);
      const curStr = String(current).padStart(padLen, '0');
      const totStr = String(total).padStart(padLen, '0');
      return `${curStr}/${totStr}`;
    }
  }
}
