const PROXY_URL = "https://jjlabsio.github.io/korea-stock-mcp/corp-codes.json";
const FETCH_TIMEOUT_MS = 10_000;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1시간
let cachedList = null;
let cacheTimestamp = 0;
export async function fetchCorpListFromProxy() {
    const now = Date.now();
    if (cachedList !== null && now - cacheTimestamp < CACHE_TTL_MS) {
        return cachedList;
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
        const response = await fetch(PROXY_URL, { signal: controller.signal });
        if (!response.ok) {
            if (cachedList !== null) {
                console.error(`[corp-code-proxy] fetch failed (HTTP ${response.status}), using stale cache`);
                return cachedList;
            }
            throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0 || !data[0].c) {
            throw new Error("Invalid proxy response shape");
        }
        const mapped = data.map((entry) => ({
            corp_code: entry.c,
            corp_name: entry.n,
            corp_eng_name: entry.e ?? "",
            stock_code: entry.s ?? "",
        }));
        cachedList = mapped;
        cacheTimestamp = now;
        console.error(`[corp-code-proxy] cached ${mapped.length} entries`);
        return mapped;
    }
    finally {
        clearTimeout(timeoutId);
    }
}
