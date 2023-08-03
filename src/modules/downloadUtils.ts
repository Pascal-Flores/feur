
/**
 * A fetch wrapper that retries the request if it fails for a given number of times
 * @param url The url to fetch
 * @param options The fetch options 
 * @param retries The number of times the request should be retried if it fails
 * @returns A promise that resolves with the response or rejects if the request fails after all the retries
 */
export async function fetchAndRetry(url : string, options : RequestInit = {}, retries = 3) : Promise<Response> {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            return response;
        } catch (err) {
            console.warn(`Failed to fetch ${url}. Retrying...`);
        }
    }
    throw new Error(`Failed to fetch ${url} after ${retries} retries`);
}