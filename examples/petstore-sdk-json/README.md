# Swagger Petstore - OpenAPI 3.0 SDK

TypeScript SDK for Swagger Petstore - OpenAPI 3.0 API v1.0.26.

This is a sample Pet Store Server based on the OpenAPI 3.0 specification. You can find out more about
Swagger at [https://swagger.io](https://swagger.io). In the third iteration of the pet store, we've switched to the design first approach!
You can now help us improve the API whether it's by making changes to the definition itself or to the code.
That way, with time, we can improve the API in general, and expose some of the new features in OAS3.

Some useful links:

- [The Pet Store repository](https://github.com/swagger-api/swagger-petstore)
- [The source API definition for the Pet Store](https://github.com/swagger-api/swagger-petstore/blob/master/src/main/resources/openapi.yaml)

## Installation

```bash
npm install [package-name]
```

## Usage

```typescript
import { sdkConfig } from "[package-name]";
import { pet } from "[package-name]/routes";

// Configure the SDK
sdkConfig.baseUrl = "https://your-api-url.com";
sdkConfig.headers = {
  Authorization: "Bearer YOUR_API_KEY",
};

// Use the SDK
async function example() {
  try {
    // Example API call
    const result = await pet.getPets();
    console.log(result);
  } catch (error) {
    console.error("API Error:", error);
  }
}

example();
```

## API Reference

This SDK is generated from an OpenAPI specification. All endpoints and data models are strongly typed with TypeScript.

### Configuration

You can configure the SDK by modifying the `sdkConfig` object:

```typescript
import { sdkConfig } from "[package-name]";

sdkConfig.baseUrl = "https://your-api-url.com";
sdkConfig.headers = {
  Authorization: "Bearer YOUR_API_KEY",
  "X-Custom-Header": "Custom Value",
};
```

## License

MIT
