/**
 * Minimal async fake of the IndexedDB API used by src/page.
 * `databases` maps db name -> store name -> records. `reads` logs every store read.
 */
export function createFakeIndexedDB(databases) {
  const reads = [];

  function request(run) {
    const req = { result: undefined, error: null, onsuccess: null, onerror: null };
    setImmediate(() => run(req));
    return req;
  }

  function openDb(name) {
    const stores = databases[name] || {};
    return {
      objectStoreNames: { contains: (s) => Object.hasOwn(stores, s) },
      transaction(storeName) {
        return {
          objectStore() {
            const records = stores[storeName] || [];
            return {
              getAll() {
                reads.push({ store: storeName, method: 'getAll' });
                return request(req => { req.result = [...records]; req.onsuccess?.(); });
              },
              openCursor() {
                reads.push({ store: storeName, method: 'openCursor' });
                let index = 0;
                const req = request(step);
                function step() {
                  req.result = index < records.length
                    ? { value: records[index], continue() { index++; setImmediate(step); } }
                    : null;
                  req.onsuccess?.();
                }
                return req;
              }
            };
          }
        };
      },
      close() {}
    };
  }

  return {
    reads,
    api: {
      databases: async () => Object.keys(databases).map(name => ({ name })),
      open: (name) => request(req => { req.result = openDb(name); req.onsuccess?.(); })
    }
  };
}
