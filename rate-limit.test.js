const createRateLimit = require('./rate-limit');

describe("RATE LIMIT TESTS", () => {
    jest.setTimeout(60000);
    test("limit 1, per 5 seconds", async () => {
        
        const rateLimit = createRateLimit(1, 5000);

        let count = 0;

        function promiseFnTest() {
            count++;
            return Promise.resolve(count);
        }

        const startTime = Date.now();
        for ( let x = 0; x < 5; x++ ) {
            await rateLimit(promiseFnTest)
        }
        const end = Date.now();
        const totalTimeInSeconds = (end - startTime) / 1000;

        expect(totalTimeInSeconds).toBeGreaterThan(19);
        expect(totalTimeInSeconds).toBeLessThan(22);
        expect(count).toBe(5);
    });

    test("limit 15, per 5 seconds; 20 requests", async () => {
        
        const rateLimit = createRateLimit(15, 5000);

        let count = 0;

        function promiseFnTest() {
            count++;
            return Promise.resolve(count);
        }

        const startTime = Date.now();
        for ( let x = 0; x < 20; x++ ) {
            await rateLimit(promiseFnTest);
        }
        const end = Date.now();
        const totalTimeInSeconds = (end - startTime) / 1000;

        expect(totalTimeInSeconds).toBeGreaterThan(5);
        expect(totalTimeInSeconds).toBeLessThan(6);
        expect(count).toBe(20);
    });

    /**
     * edge case 1, such as sending exactly the limit of requests and checking whether the subsequent requests are indeed blocked
     */
    test("sending exactly the limit of requests", async () => {
        const rateLimit = createRateLimit(5, 10000); // Limit of 5 requests per 10 seconds

        let count = 0;

        function promiseFnTest() {
            count++;
            return Promise.resolve(count);
        }

        const startTime = Date.now();
        
        // Send exactly 5 requests, which should all be allowed
        for (let x = 0; x < 5; x++) {
            await rateLimit(promiseFnTest);
        }

        // Try to send the 6th request immediately after
        const sixthRequestPromise = rateLimit(promiseFnTest);
        
        // Ensure that the count is 5 and the sixth request is not processed yet
        expect(count).toBe(5);
        
        // Check if the 6th request is still pending
        expect(sixthRequestPromise).toBeInstanceOf(Promise);
        
        // Wait until just before the rate limit resets
        await new Promise(resolve => setTimeout(resolve, 9000));
        
        // After waiting, the sixth request should now be processed
        const result = await sixthRequestPromise;

        const endTime = Date.now();
        const totalTimeInSeconds = (endTime - startTime) / 1000;
        // Final assertions
        expect(result).toBe(6); // The sixth request should have been processed
        expect(count).toBe(6); // Total count should now be 6
        expect(totalTimeInSeconds).toBeGreaterThan(10);
        expect(totalTimeInSeconds).toBeLessThan(11);
    });

    /**
     * This approach simulates a burst of requests and confirms the limiter behaves as expected under high-frequency, back-to-back requests
     */
    test("handling burst requests exceeding the limit", async () => {
        const rateLimit = createRateLimit(3, 5000); // Limit of 3 requests per 5 seconds

        let count = 0;

        function promiseFnTest() {
            count++;
            return Promise.resolve(count);
        }

        const startTime = Date.now();

        // Send 5 requests quickly, exceeding the limit of 3 requests per 5 seconds
        const promises = [];
        for (let x = 0; x < 5; x++) {
            promises.push(rateLimit(promiseFnTest));
        }

        // Wait for all requests to complete
        await Promise.all(promises);

        const endTime = Date.now();
        const totalTimeInSeconds = (endTime - startTime) / 1000;

        // Verify the count is 5, meaning all 5 requests were eventually processed
        expect(count).toBe(5);

        // Ensure the time is greater than or equal to 5 seconds since we expect the 4th and 5th request to wait
        expect(totalTimeInSeconds).toBeGreaterThanOrEqual(5);

        // We expect the total time to be less than 6 seconds because the limiter should have processed the 4th and 5th request after the first time window reset
        expect(totalTimeInSeconds).toBeLessThan(6);
    });

    test('simple error handling test', async () => {
        const rateLimit = createRateLimit(5, 5000);
        function promiseFnTest() {
            return Promise.reject(new Error("Simulated error"));
        }

        try {
            const res = await rateLimit(promiseFnTest);
        } catch(err) {
            expect(err.message).toBe("Simulated error");
        }
    });

    test('error handling test, multiple calls', async () => {
        const rateLimit = createRateLimit(5, 5000);
        const responses = [];
        let count = 0;
        function promiseFnTest() {
            if ( count++ === 0 ) {
                return Promise.reject(new Error("error"));
            } else {
                return Promise.resolve('success');
            }
        }

        for ( let x = 0; x < 3; x++ ) {
            rateLimit(promiseFnTest).then((result) => {
                responses.push(result);
            })
            .catch(err => {
                responses.push(err.message);
            });
        }

        await new Promise(resolve => setTimeout(resolve, 500));
        expect(responses.length).toBe(3);
        expect(responses.find(x => x === 'error')).toBe('error');
        expect(responses.filter(x => x === 'success').length).toBe(2);
    });

    /**
     * This ensures that the rate limiter correctly processes further requests even if an error occurs during one of them, maintaining its behavior without crashing or skipping other requests.
     */
    test("should handle errors in promiseFn without breaking rate limiting", async () => {
        const rateLimit = createRateLimit(3, 5000); // Limit of 3 requests per 5 seconds

        // Simulates a function that will fail on the second call and succeed on others
        function promiseFnTest(index) {
            if (index === 1) {
                return Promise.reject(new Error("error"));
            }
            return Promise.resolve('success');
        }

        const startTime = Date.now();

        // Send 5 requests where one of them will throw an error
        const promises = [];
        for (let x = 0; x < 5; x++) {
            promises.push(
                rateLimit(() => promiseFnTest(x))
                    .then(result => result) // Handle success
                    .catch(error => error.message) // Catch error and continue
            );
        }

        const results = await Promise.all(promises);

        const endTime = Date.now();
        const totalTimeInSeconds = (endTime - startTime) / 1000;

        // The first request should succeed, the second should throw an error, then continue normally
        const numberOfErrors = results.filter(r => r === 'error').length;
        expect(numberOfErrors).toBe(1);
        const numberOfSuccess = results.filter(r => r === 'success').length;
        expect(numberOfSuccess).toBe(4);

        // Ensure the time is greater than or equal to 5 seconds since the limit is 3 per 5 seconds
        expect(totalTimeInSeconds).toBeGreaterThanOrEqual(5);
    });
});