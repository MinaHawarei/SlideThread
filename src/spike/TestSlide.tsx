import React, { useMemo } from 'react';
import { generateNetwork } from '../core/network';
import { createSampleDataUrl } from './sampleImages';

export interface TestSlideProps {
  id: string;
  width: number;
  height: number;
  scale?: number;
}

export const TestSlide: React.FC<TestSlideProps> = ({ id, width, height, scale = 1 }) => {
  const network = useMemo(() => generateNetwork(width, height, 36, 7), [width, height]);
  const largeImageUrl = useMemo(() => createSampleDataUrl(4000, 3000, false), []);
  const transparentPngUrl = useMemo(() => createSampleDataUrl(400, 400, true), []);

  return (
    <div
      style={{
        width: `${width * scale}px`,
        height: `${height * scale}px`,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        id={id}
        data-testid={id}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: '"IBM Plex Sans", "IBM Plex Sans Arabic", sans-serif',
          background: 'linear-gradient(135deg, var(--bg, #0C1624) 0%, var(--bg2, #13263F) 100%)',
          color: 'var(--ink, #EAF2FB)',
          ['--ink' as string]: '#EAF2FB',
          ['--bg' as string]: '#0C1624',
          ['--bg2' as string]: '#13263F',
          ['--acc' as string]: '#35D0E6',
          ['--acc2' as string]: '#8B7CF6',
          ['--line' as string]: 'rgba(53, 208, 230, 0.26)',
          ['--card' as string]: 'rgba(19, 38, 63, 0.72)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px',
          boxSizing: 'border-box',
        }}
      >
        {/* 1. Inline SVG Network Background (~100 nodes/lines) */}
        <svg
          data-testid="network-bg"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          {network.lines.map((l, i) => (
            <line
              key={`line-${i}`}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              stroke="var(--line)"
              strokeWidth="2.5"
            />
          ))}
          {network.nodes.map((n, i) =>
            n.isAccent ? (
              <circle
                key={`node-${i}`}
                cx={n.x}
                cy={n.y}
                r="7"
                fill="none"
                stroke="var(--acc2)"
                strokeWidth="2"
              />
            ) : (
              <circle
                key={`node-${i}`}
                cx={n.x}
                cy={n.y}
                r="3.5"
                fill="var(--acc)"
                opacity="0.5"
              />
            )
          )}
        </svg>

        {/* Content Area */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {/* Header with pill tag */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                background: 'rgba(53, 208, 230, 0.12)',
                color: 'var(--acc)',
                border: '1px solid rgba(53, 208, 230, 0.3)',
                borderRadius: '999px',
                padding: '10px 24px',
                fontSize: '24px',
                fontWeight: 600,
              }}
            >
              Export Spike · {width}×{height}
            </span>
            <span style={{ fontSize: '24px', color: '#8FA3BC' }}>#SlideThread</span>
          </div>

          {/* Main Card with rgba border, box-shadow, linear-gradient, border-radius */}
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid rgba(234, 242, 251, 0.14)',
              borderRadius: '24px',
              padding: '40px',
              boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {/* Arabic Paragraph with ligatures, diacritics, and mixed bidi */}
            <div dir="rtl" style={{ textAlign: 'right', marginBottom: '24px' }}>
              <h2
                style={{
                  fontSize: '44px',
                  fontWeight: 700,
                  marginBottom: '16px',
                  color: 'var(--acc)',
                  lineHeight: 1.3,
                }}
              >
                تَجْرِبَةُ التَّصْدِيرِ: الخَطُّ العَرَبِيُّ والمُطَابَقَةُ الرَّقْمِيَّةُ (2026)
              </h2>
              <p
                style={{
                  fontSize: '28px',
                  lineHeight: 1.6,
                  color: 'var(--ink)',
                }}
              >
                نَبْدَأُ بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ. هَذَا نَصٌّ اخْتِبَارِيٌّ لِلتَّأَكُّدِ مِنْ
                اتِّصَالِ الحُرُوفِ العَرَبِيَّةِ وَالتَّشْكِيلِ مَعَ كَلِمَاتٍ مُشْتَرَكَةٍ مِثْلَ
                SlideThread و React بنسبة نَجَاحٍ تَفُوقُ 99.8%.
              </p>
            </div>

            {/* Monospace code block (LTR) inside RTL context */}
            <div
              dir="ltr"
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                background: '#080E17',
                border: '1px solid rgba(53, 208, 230, 0.25)',
                borderRadius: '12px',
                padding: '20px',
                fontSize: '22px',
                color: '#35D0E6',
                overflowX: 'auto',
                marginBottom: '24px',
              }}
            >
              <code>
                {`// Verify LTR code inside RTL container\nconst exportTest = async (format: string) => {\n  const ready = await fontsReady();\n  return { format, ready, width: ${width}, height: ${height} };\n};`}
              </code>
            </div>

            {/* Images: Large JPEG (simulated 4000x3000) and Transparent PNG */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <img
                src={largeImageUrl}
                alt="Large Test Asset"
                style={{
                  width: '160px',
                  height: '100px',
                  objectFit: 'cover',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              />
              <img
                src={transparentPngUrl}
                alt="Transparent PNG Asset"
                style={{
                  width: '100px',
                  height: '100px',
                  objectFit: 'contain',
                }}
              />
              <div style={{ fontSize: '20px', color: '#8FA3BC' }}>
                Images: 4000×3000 JPEG + Alpha PNG
              </div>
            </div>
          </div>
        </div>

        {/* Signature Bar with circular avatar + ring box-shadow + gradient fallback */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              data-testid="avatar-fallback"
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #35D0E6, #8B7CF6)',
                boxShadow: '0 0 0 4px #0C1624, 0 0 0 7px #35D0E6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '28px',
                color: '#0C1624',
              }}
            >
              M
            </div>
            <div>
              <div style={{ fontSize: '26px', fontWeight: 600 }}>Mina Hawarei</div>
              <div style={{ fontSize: '20px', color: '#8FA3BC' }}>@minahawarei</div>
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 600, color: '#8FA3BC', fontFamily: '"JetBrains Mono", monospace' }}>
            01/04
          </div>
        </div>
      </div>
    </div>
  );
};
