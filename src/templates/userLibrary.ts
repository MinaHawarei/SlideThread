import type { ValidatedTemplateData } from './schema';

const DATABASE_NAME = 'slidethread-user-templates';
const STORE_NAME = 'template-packages';
export const USER_TEMPLATE_LIBRARY_EVENT = 'slidethread:user-template-library-changed';

export interface StoredUserTemplatePackage {
  id: string;
  manifest: ValidatedTemplateData;
  files: Record<string, Blob>;
  installedAt: number;
}

export interface UserTemplateSummary {
  id: string;
  manifest: ValidatedTemplateData;
  preview?: Blob;
  installedAt: number;
}

let databasePromise: Promise<IDBDatabase> | undefined;

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('Your browser does not support IndexedDB, so template packages cannot be stored.'));
  if (databasePromise) return databasePromise;
  databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open the template library database.'));
    request.onblocked = () => reject(new Error('The template library database is blocked by another browser tab.'));
  }).catch((error) => {
    databasePromise = undefined;
    throw error;
  });
  return databasePromise!;
}

function quotaFriendly(error: unknown): Error {
  if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
    return new Error('There is not enough browser storage space to save this template. Free some storage and try again.');
  }
  return error instanceof Error ? error : new Error('Could not save the template package to browser storage.');
}

function announceChange(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(USER_TEMPLATE_LIBRARY_EVENT));
}

export async function listUserTemplatePackages(): Promise<StoredUserTemplatePackage[]> {
  const db = await openDatabase();
  return await new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result as StoredUserTemplatePackage[]);
    request.onerror = () => reject(request.error ?? new Error('Could not read the template library.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Could not read the template library.'));
  });
}

export async function getUserTemplatePackage(id: string): Promise<StoredUserTemplatePackage | undefined> {
  const db = await openDatabase();
  return await new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result as StoredUserTemplatePackage | undefined);
    request.onerror = () => reject(request.error ?? new Error(`Could not load imported template “${id}”.`));
    transaction.onabort = () => reject(transaction.error ?? new Error(`Could not load imported template “${id}”.`));
  });
}

/** Add the manifest and all binary files as one IndexedDB record and one transaction. */
export async function saveUserTemplatePackage(record: StoredUserTemplatePackage): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).add(record, record.id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Could not save the imported template.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Could not save the imported template.'));
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'ConstraintError') throw new Error(`A user template with ID “${record.id}” already exists.`);
    throw quotaFriendly(error);
  }
  announceChange();
}

export async function deleteUserTemplatePackage(id: string): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error(`Could not delete imported template “${id}”.`));
    transaction.onabort = () => reject(transaction.error ?? new Error(`Could not delete imported template “${id}”.`));
  });
  announceChange();
}
