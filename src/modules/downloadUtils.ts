
/**
 * A fetch wrapper that retries the request if it fails for a given number of times
 * @param url The url to fetch
 * @param options The fetch options 
 * @param retries The number of times the request should be retried if it fails
 * @returns A promise that resolves with the response or rejects if the request fails after all the retries
 * @see {@link https://markmichon.com/automatic-retries-with-fetch}
 */
export async function fetchAndRetry(url : string, options : RequestInit = {}, retries = 3) : Promise<Response> {
    return fetch(url, options).then((response) => {
        if (response.ok)
            return response;
        else
            throw new Error('Failed to fetch ' + url);
    }).catch((error) => {
        if (retries > 0)
            return fetchAndRetry(url, options, retries - 1);
        else
            throw error;
    });
}