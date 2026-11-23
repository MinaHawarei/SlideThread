import React from 'react';
import type { RichText, RichTextBlock, RichTextRun } from '../core/schema';
import { parsePlainTextToRichText, isArabicText, resolveFontFamily, detectRunDirection } from '../core/richText';

export interface RichTextRendererProps {
  content: RichText | string;
  className?: string;
  style?: React.CSSProperties;
  dir?: 'ltr' | 'rtl' | 'auto';
  inline?: boolean;
}

export const RichTextRenderer: React.FC<RichTextRendererProps> = ({
  content,
  className = '',
  style = {},
  dir = 'auto',
  inline = false,
}) => {
  const doc: RichText = typeof content === 'string' ? parsePlainTextToRichText(content) : content;

  if (!doc || !doc.blocks || doc.blocks.length === 0) {
    return null;
  }

  // If single block and single run and inline requested:
  if (inline && doc.blocks.length === 1 && doc.blocks[0]!.type === 'p') {
    return (
      <span className={`rich-text-inline ${className}`.trim()} style={{ ...style }} dir={dir}>
        {doc.blocks[0]!.runs.map((run, i) => (
          <RunRenderer key={i} run={run} />
        ))}
      </span>
    );
  }

  // Group contiguous list items into <ul> or <ol>
  type Segment =
    | { type: 'p'; block: RichTextBlock }
    | { type: 'ul'; items: RichTextBlock[] }
    | { type: 'ol'; items: RichTextBlock[] };

  const segments: Segment[] = [];
  let currentList: { ordered: boolean; items: RichTextBlock[] } | null = null;

  for (const block of doc.blocks) {
    if (block.type === 'li') {
      const isOrdered = Boolean(block.ordered);
      if (currentList && currentList.ordered === isOrdered) {
        currentList.items.push(block);
      } else {
        if (currentList) {
          segments.push({
            type: currentList.ordered ? 'ol' : 'ul',
            items: currentList.items,
          });
        }
        currentList = { ordered: isOrdered, items: [block] };
      }
    } else {
      if (currentList) {
        segments.push({
          type: currentList.ordered ? 'ol' : 'ul',
          items: currentList.items,
        });
        currentList = null;
      }
      segments.push({ type: 'p', block });
    }
  }

  if (currentList) {
    segments.push({
      type: currentList.ordered ? 'ol' : 'ul',
      items: currentList.items,
    });
  }

  return (
    <div
      className={`rich-text-document ${className}`.trim()}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35em',
        ...style,
      }}
      dir={dir}
    >
      {segments.map((seg, idx) => {
        if (seg.type === 'p') {
          return (
            <p
              key={idx}
              className="rich-text-paragraph"
              style={{
                margin: 0,
                padding: 0,
                textAlign: seg.block.align,
              }}
              dir={seg.block.dir || 'auto'}
            >
              {seg.block.runs.map((run, runIdx) => (
                <RunRenderer key={runIdx} run={run} />
              ))}
            </p>
          );
        }

        const ListTag = seg.type === 'ol' ? 'ol' : 'ul';
        return (
          <ListTag
            key={idx}
            className={`rich-text-list rich-text-${seg.type}`}
            style={{
              margin: 0,
              paddingInlineStart: '1.25em',
              listStyleType: seg.type === 'ol' ? 'decimal' : 'disc',
            }}
            dir="auto"
          >
            {seg.items.map((liBlock, liIdx) => (
              <li
                key={liIdx}
                className="rich-text-list-item"
                style={{
                  margin: 0,
                  padding: 0,
                  textAlign: liBlock.align,
                }}
                dir={liBlock.dir || 'auto'}
              >
                {liBlock.runs.map((run, runIdx) => (
                  <RunRenderer key={runIdx} run={run} />
                ))}
              </li>
            ))}
          </ListTag>
        );
      })}
    </div>
  );
};

export const RunRenderer: React.FC<{ run: RichTextRun }> = ({ run }) => {
  const marks = run.marks;
  const isArabic = isArabicText(run.text);
  const runDir = detectRunDirection(run.text);

  const runStyle: React.CSSProperties = {
    fontWeight: marks?.bold ? 700 : undefined,
    textDecoration: marks?.underline ? 'underline' : undefined,
    color: marks?.color || undefined,
    backgroundColor: marks?.highlight || undefined,
    fontSize: marks?.size ? `${marks.size}%` : undefined,
    fontFamily: marks?.font ? resolveFontFamily(marks.font) : undefined,
    // Arabic ligatures must not be broken by positive letter-spacing
    letterSpacing: isArabic ? 0 : undefined,
  };

  return (
    <bdi dir={runDir} style={runStyle} className="rich-text-run">
      {run.text}
    </bdi>
  );
};
