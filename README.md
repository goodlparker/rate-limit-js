# Rate Limit Library

A small Node.js utility to enforce rate limiting for function calls. This is particularly useful when working with APIs that impose rate limits, but the library is flexible enough to be used in other similar scenarios.

## Purpose

This library ensures that a specific number of function executions can happen within a specified time window. This is ideal for limiting API requests, preventing overuse, and avoiding throttling by external services.

For example, you might want to make only 15 requests every minute to avoid hitting an API's rate limit. The `createRateLimit` function enforces this, preventing more than the allowed number of requests within the given time window.

### How It Works

The library exports a single function, `createRateLimit`, which generates a rate-limited function. This generated function can wrap any asynchronous task or promise-returning function. If the rate limit is exceeded, the library will wait for the necessary time before allowing further executions.

## Usage

1. Clone the repository.

    ```bash
    git clone <repository-url>
    cd <repository-name>
    ```

2. Use the library in your project.

    ```js
    const createRateLimit = require('./rate-limit');

    const rateLimit = createRateLimit(15, 60000); // Limit to 15 requests per minute

    async function callAPI() {
        // Simulate an API call
        console.log("API request made");
        return Promise.resolve();
    }

    // Use the rate limit to control the API requests
    for (let i = 0; i < 20; i++) {
        await rateLimit(callAPI);
    }
    ```

### Parameters

- `limit` (number): The number of requests allowed per the given time window. Defaults to `15`.
- `perMiliseconds` (number): The time window in milliseconds. Defaults to `60000` (1 minute).

### Example

```js
const rateLimit = createRateLimit(10, 10000); // Limit to 10 requests every 10 seconds

rateLimit(() => {
  console.log("Doing something...");
});
```

## Usage

The project includes a test using Jest. You can run the tests with:

```bash
npm test
```