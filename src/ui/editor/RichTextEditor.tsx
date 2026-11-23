import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import type { RichText } from '../../core/schema';
import { richTextToTiptapJSON, tiptapJSONToRichText, resolveFontFamily } from '../../core/richText';
import { useT } from '../../i18n';

const CustomParagraph = Paragraph.extend({
  addAttributes() {
    return {
      dir: {
        default: null,
        parseHTML: (element) => element.getAttribute('dir') || null,
        renderHTML: (attributes) => {
          if (!attributes.dir) return {};
          return { dir: attributes.dir };
        },
      },
    };
  },
});

const CustomTextStyle = TextStyle.extend({
  addAttributes() {
    return {
      fontSize: {
        default: null,
        parseHTML: (element) => element.style.fontSize || null,
        renderHTML: (attributes) => {
          if (!attributes.fontSize) return {};
          return { style: `font-size: ${attributes.fontSize}` };
        },
      },
      fontFamily: {
        default: null,
        parseHTML: (element) => element.style.fontFamily || null,
        renderHTML: (attributes) => {
          if (!attributes.fontFamily) return {};
          return { style: `font-family: ${attributes.fontFamily}` };
        },
      },
    };
  },
});

export interface RichTextEditorProps {
  content: RichText;
  onChange: (doc: RichText) => void;
  onDone?: () => void;
  touchLayout?: boolean;
  autoFocus?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

const FONT_OPTIONS = [
  { id: 'ibm-plex-sans', label: 'IBM Plex Sans' },
  { id: 'ibm-plex-sans-arabic', label: 'IBM Plex Sans Arabic' },
  { id: 'jetbrains-mono', label: 'JetBrains Mono' },
  { id: 'noto-sans-coptic', label: 'Noto Sans Coptic' },
];

const SIZE_OPTIONS = [
  { value: 75, label: '75%' },
  { value: 100, label: '100%' },
  { value: 125, label: '125%' },
  { value: 150, label: '150%' },
  { value: 200, label: '200%' },
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  onDone,
  touchLayout = false,
  autoFocus = true,
  style = {},
  className = '',
}) => {
  const { t } = useT();
  const initialJSON = useRef(richTextToTiptapJSON(content));

  const editor = useEditor({
    extensions: [
      Document,
      CustomParagraph,
      Text,
      Bold,
      Underline,
      CustomTextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['paragraph'] }),
    ],
    content: initialJSON.current,
    autofocus: autoFocus ? 'all' : false,
    editorProps: {
      attributes: {
        class: 'rich-text-tiptap-content outline-none w-full h-full min-h-[1.5em]',
        'data-testid': 'rich-text-contenteditable',
      },
      // Enforce plain-text paste only (§5.3)
      handlePaste: (view, event) => {
        const text = event.clipboardData?.getData('text/plain');
        if (text !== undefined) {
          event.preventDefault();
          view.dispatch(view.state.tr.insertText(text));
          return true;
        }
        return false;
      },
      transformPastedHTML: () => '',
    },
    onUpdate: ({ editor: activeEditor }) => {
      const updated = tiptapJSONToRichText(activeEditor.getJSON());
      onChange(updated);
    },
  });

  useEffect(() => {
    if (!editor) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onDone?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [editor, onDone]);

  if (!editor) return null;

  const isBold = editor.isActive('bold');
  const isUnderline = editor.isActive('underline');
  const isHighlight = editor.isActive('highlight');
  const isLeft = editor.isActive({ textAlign: 'left' });
  const isCenter = editor.isActive({ textAlign: 'center' });
  const isRight = editor.isActive({ textAlign: 'right' });

  return (
    <div
      className={`rich-text-editor-container ${className}`.trim()}
      style={{ position: 'relative', width: '100%', height: '100%', ...style }}
      data-testid="rich-text-editor-container"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Floating Toolbar */}
      <div
        role="toolbar"
        aria-label={t('editor.richTextToolbar')}
        data-testid="rich-text-floating-toolbar"
        onMouseDown={(e) => e.preventDefault()}
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        style={
          touchLayout
            ? {
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: 6,
                padding: '8px 12px',
                background: '#ffffff',
                borderTop: '1px solid #cbd5e1',
                boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.15)',
              }
            : {
                position: 'absolute',
                top: -56,
                insetInlineStart: 0,
                zIndex: 100,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 8px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                whiteSpace: 'nowrap',
              }
        }
      >
        {/* Font Select */}
        <select
          aria-label={t('editor.font')}
          data-testid="toolbar-font-family"
          onChange={(e) => {
            const font = e.target.value;
            editor.chain().focus().setMark('textStyle', { fontFamily: resolveFontFamily(font) }).run();
          }}
          style={{ minHeight: touchLayout ? 44 : 32, fontSize: 13, borderRadius: 6, border: '1px solid #94a3b8', padding: '0 4px', background: 'white' }}
        >
          {FONT_OPTIONS.map((f) => (
            <option key={f.id} value={f.id}>{f.label}</option>
          ))}
        </select>

        {/* Size Select */}
        <select
          aria-label={t('editor.fontSize')}
          data-testid="toolbar-font-size"
          defaultValue={100}
          onChange={(e) => {
            const size = Number(e.target.value);
            editor.chain().focus().setMark('textStyle', { fontSize: `${size}%` }).run();
          }}
          style={{ minHeight: touchLayout ? 44 : 32, fontSize: 13, borderRadius: 6, border: '1px solid #94a3b8', padding: '0 4px', background: 'white' }}
        >
          {SIZE_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        {/* Color picker */}
        <label
          aria-label={t('editor.textColor')}
          style={{ display: 'inline-flex', alignItems: 'center', minWidth: touchLayout ? 44 : 32, minHeight: touchLayout ? 44 : 32, cursor: 'pointer' }}
        >
          <input
            type="color"
            aria-label={t('editor.textColor')}
            data-testid="toolbar-color-picker"
            onChange={(e) => {
              editor.chain().focus().setColor(e.target.value).run();
            }}
            style={{ width: touchLayout ? 36 : 26, height: touchLayout ? 36 : 26, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer' }}
          />
        </label>

        {/* Bold */}
        <button
          type="button"
          aria-label={t('editor.bold')}
          data-testid="toolbar-bold"
          aria-pressed={isBold}
          onClick={() => editor.chain().focus().toggleBold().run()}
          style={{
            minWidth: touchLayout ? 44 : 32,
            minHeight: touchLayout ? 44 : 32,
            borderRadius: 6,
            fontWeight: 700,
            background: isBold ? '#0891b2' : '#f1f5f9',
            color: isBold ? 'white' : '#0f172a',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          B
        </button>

        {/* Underline */}
        <button
          type="button"
          aria-label={t('editor.underline')}
          data-testid="toolbar-underline"
          aria-pressed={isUnderline}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          style={{
            minWidth: touchLayout ? 44 : 32,
            minHeight: touchLayout ? 44 : 32,
            borderRadius: 6,
            textDecoration: 'underline',
            background: isUnderline ? '#0891b2' : '#f1f5f9',
            color: isUnderline ? 'white' : '#0f172a',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          U
        </button>

        {/* Highlight */}
        <button
          type="button"
          aria-label={t('editor.highlight')}
          data-testid="toolbar-highlight"
          aria-pressed={isHighlight}
          onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()}
          style={{
            minWidth: touchLayout ? 44 : 32,
            minHeight: touchLayout ? 44 : 32,
            borderRadius: 6,
            background: isHighlight ? '#fef08a' : '#f1f5f9',
            color: '#0f172a',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          H
        </button>

        {/* Alignment controls */}
        <button
          type="button"
          aria-label={t('editor.alignLeft')}
          data-testid="toolbar-align-left"
          aria-pressed={isLeft}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          style={{
            minWidth: touchLayout ? 44 : 32,
            minHeight: touchLayout ? 44 : 32,
            borderRadius: 6,
            background: isLeft ? '#0891b2' : '#f1f5f9',
            color: isLeft ? 'white' : '#0f172a',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          ⇤
        </button>
        <button
          type="button"
          aria-label={t('editor.alignCenter')}
          data-testid="toolbar-align-center"
          aria-pressed={isCenter}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          style={{
            minWidth: touchLayout ? 44 : 32,
            minHeight: touchLayout ? 44 : 32,
            borderRadius: 6,
            background: isCenter ? '#0891b2' : '#f1f5f9',
            color: isCenter ? 'white' : '#0f172a',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          ⇥⇤
        </button>
        <button
          type="button"
          aria-label={t('editor.alignRight')}
          data-testid="toolbar-align-right"
          aria-pressed={isRight}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          style={{
            minWidth: touchLayout ? 44 : 32,
            minHeight: touchLayout ? 44 : 32,
            borderRadius: 6,
            background: isRight ? '#0891b2' : '#f1f5f9',
            color: isRight ? 'white' : '#0f172a',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          ⇥
        </button>

        {/* Direction controls */}
        <button
          type="button"
          aria-label={t('editor.dirLtr')}
          data-testid="toolbar-dir-ltr"
          onClick={() => editor.chain().focus().updateAttributes('paragraph', { dir: 'ltr' }).run()}
          style={{
            minWidth: touchLayout ? 44 : 32,
            minHeight: touchLayout ? 44 : 32,
            borderRadius: 6,
            fontSize: 12,
            background: '#f1f5f9',
            color: '#0f172a',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          LTR
        </button>
        <button
          type="button"
          aria-label={t('editor.dirRtl')}
          data-testid="toolbar-dir-rtl"
          onClick={() => editor.chain().focus().updateAttributes('paragraph', { dir: 'rtl' }).run()}
          style={{
            minWidth: touchLayout ? 44 : 32,
            minHeight: touchLayout ? 44 : 32,
            borderRadius: 6,
            fontSize: 12,
            background: '#f1f5f9',
            color: '#0f172a',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          RTL
        </button>

        {/* Done / Close Button */}
        {onDone && (
          <button
            type="button"
            aria-label={t('editor.doneEditing')}
            data-testid="toolbar-done"
            onClick={onDone}
            style={{
              minWidth: touchLayout ? 44 : 32,
              minHeight: touchLayout ? 44 : 32,
              borderRadius: 6,
              background: '#0e7490',
              color: 'white',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              padding: '0 8px',
            }}
          >
            ✓
          </button>
        )}
      </div>

      {/* Editor Content Area */}
      <EditorContent
        editor={editor}
        style={{
          width: '100%',
          height: '100%',
          background: 'rgba(255, 255, 255, 0.95)',
          color: '#0f172a',
          padding: 4,
          borderRadius: 4,
          boxShadow: '0 0 0 2px #0891b2',
          overflowY: 'auto',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
};
