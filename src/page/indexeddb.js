/**
 * Promise wrappers over the IndexedDB API
 */

export function openDatabase(dbName, version) {
  return new Promise((resolve, reject) => {
    try {
      const req = version ? indexedDB.open(dbName, version) : indexedDB.open(dbName);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () => resolve(null);
    } catch (err) {
      reject(err);
    }
  });
}

export function getAllFromStore(db, storeName) {
  return new Promise((resolve) => {
    try {
      if (!db.objectStoreNames.contains(storeName)) {
        return resolve([]);
      }
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    } catch (e) {
      resolve([]);
    }
  });
}

/** Visits every record with a cursor, so large stores never load into memory at once. */
export function forEachInStore(db, storeName, visit) {
  return new Promise((resolve) => {
    try {
      if (!db.objectStoreNames.contains(storeName)) {
        return resolve();
      }
      const tx = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).openCursor();
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor) return resolve();
        try { visit(cursor.value); } catch (e) {}
        cursor.continue();
      };
      req.onerror = () => resolve();
    } catch (e) {
      resolve();
    }
  });
}
