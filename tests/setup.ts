import '@testing-library/jest-dom';
import { Blob as NodeBlob, File as NodeFile } from 'node:buffer';

if (typeof window !== 'undefined') {
  // Polyfill window and globalThis with Node's native Blob & File so structuredClone (used by fake-indexeddb) preserves binary data
  // @ts-expect-error Node Blob is structurally compatible with DOM Blob
  window.Blob = NodeBlob;
  // @ts-expect-error Node File is structurally compatible with DOM File
  window.File = NodeFile;
  // @ts-expect-error globalThis
  globalThis.Blob = NodeBlob;
  // @ts-expect-error globalThis
  globalThis.File = NodeFile;
}
