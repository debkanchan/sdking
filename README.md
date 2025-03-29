# 👑 SDKing

A blazing-fast command-line tool to generate fully-typed TypeScript SDKs from OpenAPI specifications.

## ✨ Features

- **Type-Safe SDKs** – Generate a complete TypeScript SDK with full type safety.
- **Zod-Powered Validation** – Validate API inputs and outputs effortlessly.
- **Comprehensive OpenAPI Support** – Works with all HTTP methods, parameters, and schemas.
- **Flexible Spec Loading** – Use local files or remote URLs.
- **Minimal Setup, Maximum Productivity** – Instantly ready to use with no boilerplate.

## 🚀 Installation

```bash
# Install globally
npm install -g sdking

# Or use directly with npx
npx sdking -i path/to/spec.yaml -o ./sdk
```

## 📚 Usage

### Generating an SDK

```bash
# Generate an SDK
npx sdking -i path/to/spec.yaml -o ./sdk

# Enable verbose logging
npx sdking -i path/to/spec.yaml -o ./sdk -v

# Use an OpenAPI spec from a URL
npx sdking -i https://petstore3.swagger.io/api/v3/openapi.yaml -o ./petstore-sdk
```

> **Note:** You must update the `baseUrl` in `config.ts` to match your API server.

### Using the Generated SDK

For API endpoints like these:

```typescript
// Fetch all pets
await client.pets.get();

// Create a new pet
await client.pets.post({ name: "Buddy" });

// Get a pet by ID
await client.pets.get({ petId: 1 });

// Delete a pet by ID
await client.pets.del({ petId: 1 }); // Note: `del()` is used instead of `delete()`

// Pass custom headers
await client.pets.get({ petId: 1 }, { Authorization: "Bearer token" });
```

> **Note:** The SDK uses `.del()` instead of `.delete()` because `delete` is a reserved word in JavaScript.

### Using the SDK with React Query

Integrate the generated SDK with **React Query (TanStack Query)** for seamless data fetching:

```typescript
import { useQuery } from "@tanstack/react-query";
import { client } from "./sdk";

const usePets = () => {
  return useQuery({
    queryKey: ["pets"],
    queryFn: () => client.pets.get(),
  });
};

const PetsList = () => {
  const { data: pets, isLoading } = usePets();

  if (isLoading) return <p>Loading...</p>;

  return (
    <ul>
      {pets?.map((pet) => (
        <li key={pet.id}>{pet.name}</li>
      ))}
    </ul>
  );
};
```

### Generating SDKs from FastAPI

You can easily generate SDKs from your **FastAPI** endpoints by ensuring your OpenAPI schema is accessible. Enable the OpenAPI endpoint in your FastAPI app like this:

```python
from fastapi import FastAPI

app = FastAPI(openapi_url="/api/v1/openapi.json")

@app.get("/items/")
async def read_items():
    return [{"name": "Foo"}]
```

Then, generate the SDK using:

```bash
npx sdking -i http://localhost:8000/api/v1/openapi.json -o ./sdk
```

## 🔧 Ownership & Configuration

All generated code is **fully owned** by the user, offering complete flexibility for customization.

A prime example is `config.ts`, which stores all central configurations. A `config.ts` file looks like this:

```typescript
/**
 * Default SDK configuration
 * This can be modified by the user after importing the SDK
 */
export const sdkConfig: SDKConfig = {
  /**
   * Default API server from OpenAPI spec: /api/v3
   * Change this to your API server URL
   */
  baseUrl: '/api/v3',
  
  /**
   * Default headers sent with each request
   */
  headers: {
    'Accept': 'application/json',
  },
};
```

## ⚙️ Requirements

- **Node.js** 16 or later
- **TypeScript** 4.7 or later

## 🛠️ CLI Options

| Option            | Alias | Description                                                                             |
| ----------------- | ----- | --------------------------------------------------------------------------------------- |
| `--input`         | `-i`  | Path or URL to the OpenAPI YAML spec (required)                                         |
| `--output`        | `-o`  | Output directory for the generated SDK (required)                                       |
| `--verbose`       | `-v`  | Enable verbose logging                                                                  |
| `--import-prefix` | `-p`  | Import prefix for generated files (.js, .ts, or false for no prefix). Defaults to `.js` |
| `--version`       |       | Show version number                                                                     |
| `--help`          |       | Show help                                                                               |

## 💂️ Generated SDK Structure

The generated SDK follows a clean, modular structure:

```
sdk/
├── config.ts               # SDK configuration
├── index.ts                # Main exports
├── package.json            # Package metadata
├── README.md               # Usage documentation
├── schemas/                # Zod validation schemas
│   ├── index.ts            # Re-exports all schemas
│   └── ...                 # Individual schema files
└── routes/                 # API route handlers
    ├── index.ts            # Re-exports all routes
    └── ...                 # Individual route files
```

## 📜 License

Released under the **MIT License** – free to use, modify, and distribute. 🎉

