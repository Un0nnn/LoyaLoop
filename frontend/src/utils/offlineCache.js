const CACHE_KEY = 'll_offline_payloads_v1';

const readCache = () => {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (err) {
        return [];
    }
};

const writeCache = (entries) => {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(entries));
    } catch (err) {
        console.error('Failed to persist offline queue', err);
    }
};

export const queueOffline = (entry) => {
    const current = readCache();
    current.push({ ...entry, id: Date.now() });
    writeCache(current);
};

export const flushOffline = async (sendFn) => {
    const entries = readCache();
    const succeeded = [];
    for (const entry of entries) {
        try {
            await sendFn(entry);
            succeeded.push(entry.id);
        } catch (err) {
            console.warn('Still offline for entry', entry.id);
        }
    }
    if (succeeded.length) {
        writeCache(entries.filter(e => !succeeded.includes(e.id)));
    }
    return succeeded.length;
};

