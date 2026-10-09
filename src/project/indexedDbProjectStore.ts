import {
  PROJECT_DATABASE_NAME,
  PROJECT_RECORD_KEY,
  PROJECT_STORE_NAME,
  type ProjectSnapshot,
  type ProjectStore,
} from './types'

const DB_VERSION = 1

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB is not available in this environment.'))
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(PROJECT_DATABASE_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(PROJECT_STORE_NAME)) {
        database.createObjectStore(PROJECT_STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Failed to open local storage.'))
  })
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const database = await openDatabase()
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = database.transaction(PROJECT_STORE_NAME, mode)
      const request = run(transaction.objectStore(PROJECT_STORE_NAME))
      transaction.oncomplete = () => resolve(request.result)
      transaction.onerror = () =>
        reject(transaction.error ?? new Error('Local storage request failed.'))
      transaction.onabort = () => reject(transaction.error ?? new Error('Local storage aborted.'))
    })
  } finally {
    database.close()
  }
}

/** Browser persistence backed by IndexedDB (one record per origin). */
export class IndexedDbProjectStore implements ProjectStore {
  async load(): Promise<ProjectSnapshot | null> {
    const result = await withStore<ProjectSnapshot | undefined>(
      'readonly',
      (store) => store.get(PROJECT_RECORD_KEY) as IDBRequest<ProjectSnapshot | undefined>,
    )
    return result ?? null
  }

  async save(snapshot: ProjectSnapshot): Promise<void> {
    await withStore('readwrite', (store) => store.put(snapshot, PROJECT_RECORD_KEY))
  }

  async clear(): Promise<void> {
    await withStore('readwrite', (store) => store.delete(PROJECT_RECORD_KEY))
  }
}
