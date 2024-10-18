/**
 * @module rateLimit
 */

/**
 * Creates a rate limit function that ensures a maximum number of function calls can be made in a given period.
 *
 * @function
 * @param {number} [limit=15] - The maximum number of allowed requests within the defined time period.
 * @param {number} [perMiliseconds=60000] - The time window for rate limiting in milliseconds (default is 1 minute).
 * @returns {function} rateLimit - A function that takes an asynchronous function (promiseFn) and enforces the rate limit on its execution.
 * 
 * @example
 * const rateLimit = createRateLimit(10, 10000); // Limit to 10 requests every 10 seconds.
 * rateLimit(someAsyncFunction);
 */
module.exports = function createRateLimit(limit = 15, perMiliseconds = 60000) {
    let requestCount = 0;
    let lastResetTime = Date.now();
    return rateLimit;

    /**
     * Enforces rate limiting on the provided asynchronous function.
     *
     * @async
     * @function rateLimit
     * @param {Function} promiseFn - The asynchronous function to be rate limited.
     * @returns {Promise<any>} - The result of the provided promiseFn.
     * 
     * @throws Will wait if the rate limit is exceeded and retry the promiseFn after the delay.
     */
    async function rateLimit(promiseFn) {

        const currentTime = Date.now();

        // Reset request count if more than 1 minute has passed
        if (currentTime - lastResetTime >= perMiliseconds) {
            requestCount = 0;
            lastResetTime = currentTime;
        }

        // Check if we're within the rate limit (15 requests per minute)
        if (requestCount >= limit) {
            console.log(`Rate limit exceeded. Waiting for ${Math.ceil(perMiliseconds / 1000)} seconds.`);
            await wait(perMiliseconds);

            // After waiting, reset the request count and continue
            requestCount = 0;
            lastResetTime = Date.now();
        }

        requestCount++; // Increment the request count

        return await promiseFn();
    }
}

/**
 * Delays execution by the given time.
 *
 * @param {number} time - The time to wait in milliseconds.
 * @returns {Promise<void>} - A promise that resolves after the specified delay.
 */
function wait(time) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, time);
    });
}