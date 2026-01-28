# APP-006: App Store Connect OAuth

## Overview

Authentication service for App Store Connect API using JWT-based authentication. Provides credential management, token generation, caching, and authenticated API requests.

## Features

- **JWT Token Generation**: Generate signed JWT tokens for App Store Connect API
- **Token Caching**: Automatic caching with expiration management
- **Credential Storage**: Secure storage of API credentials on disk
- **Multiple Credentials**: Support for multiple credential sets with default selection
- **Validation**: Test credentials against live API
- **CLI Tool**: Interactive command-line tool for credential management

## Quick Start

### 1. Get App Store Connect API Credentials

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Navigate to **Users and Access** → **Keys**
3. Click **Generate API Key** (or use existing key)
4. Download the private key (.p8 file)
5. Note the **Key ID** and **Issuer ID**

### 2. Add Credentials

```bash
npm run asc-creds add
```

Follow the interactive prompts to add your credentials.

### 3. Test Credentials

```bash
npm run asc-creds test
```

### 4. Use in Code

```typescript
import { makeRequest, getDefaultCredentials } from '@/services/ascAuth';

// Get default credentials
const credentials = await getDefaultCredentials();

// Make authenticated request
const response = await makeRequest(credentials, {
  method: 'GET',
  path: '/v1/apps',
  query: { limit: 10 }
});

console.log('Apps:', response.data);
```

## API Reference

### Token Generation

#### `generateToken(credentials, expirationSeconds?)`

Generate a new JWT token.

```typescript
import { generateToken } from '@/services/ascAuth';

const token = generateToken(credentials, 1200); // 20 minutes

console.log('Token:', token.token);
console.log('Expires at:', new Date(token.expiresAt * 1000));
console.log('Is valid:', token.isValid);
```

**Parameters:**
- `credentials`: ASC API credentials (issuer ID, key ID, private key)
- `expirationSeconds`: Token expiration in seconds (default: 1200, max: 1200)

**Returns:** `ASCToken` with token string, expiration timestamp, and validity flag

#### `getToken(credentials, credentialsId?)`

Get a valid token (from cache or generate new).

```typescript
import { getToken } from '@/services/ascAuth';

// Get cached or new token
const token = getToken(credentials, 'my-creds-id');

// Token is automatically cached and reused until expiration
```

**Parameters:**
- `credentials`: ASC API credentials
- `credentialsId`: Optional ID for caching (default: 'default')

**Returns:** `ASCToken`

#### `validateToken(token)`

Validate JWT token structure and expiration.

```typescript
import { validateToken } from '@/services/ascAuth';

const isValid = validateToken(tokenString);
console.log('Token valid:', isValid);
```

**Parameters:**
- `token`: JWT token string

**Returns:** `boolean` indicating if token is valid

### API Requests

#### `makeRequest<T>(credentials, options, config?)`

Make authenticated request to App Store Connect API.

```typescript
import { makeRequest } from '@/services/ascAuth';

// Get apps
const response = await makeRequest(credentials, {
  method: 'GET',
  path: '/v1/apps',
  query: { limit: 10 }
});

// Create resource
const createResponse = await makeRequest(credentials, {
  method: 'POST',
  path: '/v1/appCustomProductPages',
  body: {
    data: {
      type: 'appCustomProductPages',
      attributes: {
        name: 'My Custom Page'
      }
    }
  }
});
```

**Parameters:**
- `credentials`: ASC API credentials
- `options`: Request options (method, path, query, body, headers)
- `config`: Optional configuration (base URL, token expiration)

**Returns:** `Promise<ASCResponse<T>>` with response data

**Throws:** Error if request fails or API returns error

### Credential Management

#### `saveCredentials(credentials, name, isDefault?)`

Save credentials to disk.

```typescript
import { saveCredentials } from '@/services/ascAuth';

const saved = await saveCredentials(
  {
    issuerId: '12345678-...',
    keyId: 'ABC123',
    privateKey: '-----BEGIN PRIVATE KEY-----...'
  },
  'Production Credentials',
  true // Set as default
);

console.log('Saved ID:', saved.id);
```

**Parameters:**
- `credentials`: ASC API credentials
- `name`: Display name for credentials
- `isDefault`: Whether to set as default (default: false)

**Returns:** `Promise<StoredASCCredentials>` with saved credentials including ID

#### `loadCredentials(id)`

Load credentials from disk by ID.

```typescript
import { loadCredentials } from '@/services/ascAuth';

const creds = await loadCredentials('asc_1234567890_abc123');

if (creds) {
  console.log('Loaded:', creds.name);
}
```

**Parameters:**
- `id`: Credentials ID

**Returns:** `Promise<StoredASCCredentials | null>`

#### `listCredentials()`

List all stored credentials.

```typescript
import { listCredentials } from '@/services/ascAuth';

const allCreds = await listCredentials();

allCreds.forEach(cred => {
  console.log(`${cred.name} ${cred.isDefault ? '(default)' : ''}`);
});
```

**Returns:** `Promise<StoredASCCredentials[]>` sorted by default first, then creation date

#### `getDefaultCredentials()`

Get default credentials.

```typescript
import { getDefaultCredentials } from '@/services/ascAuth';

const defaultCreds = await getDefaultCredentials();

if (!defaultCreds) {
  console.log('No credentials configured');
}
```

**Returns:** `Promise<StoredASCCredentials | null>`

#### `deleteCredentials(id)`

Delete credentials by ID.

```typescript
import { deleteCredentials } from '@/services/ascAuth';

await deleteCredentials('asc_1234567890_abc123');
```

**Parameters:**
- `id`: Credentials ID

**Returns:** `Promise<void>`

#### `testCredentials(credentials)`

Test credentials by making API call.

```typescript
import { testCredentials } from '@/services/ascAuth';

const isValid = await testCredentials(credentials);

if (isValid) {
  console.log('Credentials are valid!');
} else {
  console.log('Invalid credentials');
}
```

**Parameters:**
- `credentials`: ASC API credentials

**Returns:** `Promise<boolean>` indicating if credentials are valid

### Utilities

#### `clearTokenCache()`

Clear all cached tokens.

```typescript
import { clearTokenCache } from '@/services/ascAuth';

clearTokenCache(); // Force regeneration of all tokens
```

**Returns:** `void`

## CLI Commands

### Add Credentials

```bash
npm run asc-creds add
```

Interactive prompt to add new credentials:
- Enter Issuer ID
- Enter Key ID
- Provide path to private key (.p8 file)
- Set display name
- Choose whether to set as default

Credentials are automatically tested before saving.

### List Credentials

```bash
npm run asc-creds list
```

Shows all stored credentials with:
- Name and ID
- Issuer ID and Key ID
- Created and last used timestamps
- Default indicator

### Show Default Credentials

```bash
npm run asc-creds show
```

Display details of default credentials.

### Test Credentials

```bash
npm run asc-creds test
```

Interactively select and test credentials against live API.

### Delete Credentials

```bash
npm run asc-creds delete
```

Interactively select and delete credentials (with confirmation).

## Data Storage

Credentials are stored in:
```
data/asc-credentials/
├── asc_1234567890_abc123.json
├── asc_1234567891_def456.json
└── ...
```

Each file contains:
```json
{
  "id": "asc_1234567890_abc123",
  "name": "Production Credentials",
  "issuerId": "12345678-1234-1234-1234-123456789012",
  "keyId": "ABC1234DEF",
  "privateKey": "-----BEGIN PRIVATE KEY-----\n...",
  "createdAt": "2026-01-28T12:00:00.000Z",
  "lastUsedAt": "2026-01-28T13:30:00.000Z",
  "isDefault": true
}
```

⚠️ **Security Note**: Private keys are stored in plain text. Ensure proper file system permissions and do not commit to version control.

## JWT Token Structure

### Header
```json
{
  "alg": "ES256",
  "kid": "ABC1234DEF",
  "typ": "JWT"
}
```

### Payload
```json
{
  "iss": "12345678-1234-1234-1234-123456789012",
  "iat": 1706443200,
  "exp": 1706444400,
  "aud": "appstoreconnect-v1"
}
```

### Token Format
```
eyJhbGciOiJFUzI1NiIsImtpZCI6IkFCQzEyMzREsInR5cCI6IkpXVCJ9.
eyJpc3MiOiIxMjM0NTY3OC0xMjM0LTEyMzQtMTIzNCIsImlhdCI6MTcwNjQ0MzIwMCwiZXhwIjoxNzA2NDQ0NDAwLCJhdWQiOiJhcHBzdG9yZWNvbm5lY3QtdjEifQ.
MEUCIQDxyz... (signature)
```

## Token Caching

Tokens are cached in-memory with the following behavior:

- Cache key: Credentials ID (or 'default')
- Cache duration: Until token expires (minus 1 minute buffer)
- Auto-refresh: New token generated when cached token is expired or near expiration
- Manual clear: Use `clearTokenCache()` to force regeneration

Example:
```typescript
// First call - generates new token
const token1 = getToken(credentials, 'prod');

// Second call - returns cached token
const token2 = getToken(credentials, 'prod');

// token1.token === token2.token (same token)

// Clear cache
clearTokenCache();

// Third call - generates new token
const token3 = getToken(credentials, 'prod');

// token1.token !== token3.token (different token)
```

## Error Handling

All API requests throw errors on failure:

```typescript
try {
  const response = await makeRequest(credentials, {
    method: 'GET',
    path: '/v1/apps'
  });
} catch (error) {
  console.error('API Error:', error.message);
  // Error format: "App Store Connect API error: [title] - [detail]"
}
```

Common errors:
- **401 Unauthorized**: Invalid or expired token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **429 Too Many Requests**: Rate limit exceeded

## Rate Limits

App Store Connect API rate limits:
- **3600 requests per hour** per credentials
- Rate limit resets every hour

Monitor headers in responses:
- `X-Rate-Limit-Limit`: Total requests allowed
- `X-Rate-Limit-Remaining`: Requests remaining
- `X-Rate-Limit-Reset`: Unix timestamp when limit resets

## Security Best Practices

1. **Never commit credentials**: Add `data/asc-credentials/` to `.gitignore`
2. **Restrict file permissions**: `chmod 600 data/asc-credentials/*.json`
3. **Use environment variables** for CI/CD:
   ```bash
   export ASC_ISSUER_ID="..."
   export ASC_KEY_ID="..."
   export ASC_PRIVATE_KEY="$(cat AuthKey_ABC123.p8)"
   ```
4. **Rotate keys regularly**: Generate new API keys periodically
5. **Limit key permissions**: Use role-based access in App Store Connect

## Testing

Run test suite:
```bash
npm run test:asc-auth
```

Tests include:
- ✓ Token Generation (structure, validity, expiration)
- ✓ Token Validation (valid/invalid tokens)
- ✓ Token Caching (cache hit/miss, expiration)
- ✓ Save and Load Credentials (persistence)
- ✓ List Credentials (ordering, filtering)
- ✓ Get Default Credentials (default selection)
- ✓ Delete Credentials (removal, cleanup)
- ✓ Token Expiration (custom duration, max enforcement)
- ✓ Token Payload Structure (header, payload, signature)
- ✓ Clear Token Cache (force refresh)

Expected output:
```
Running APP-006 ASC Auth Tests...

✓ Token Generation
✓ Token Validation
✓ Token Caching
✓ Save and Load Credentials
✓ List Credentials
✓ Get Default Credentials
✓ Delete Credentials
✓ Token Expiration
✓ Token Payload Structure
✓ Clear Token Cache

============================================================
Total: 10 | Passed: 10 | Failed: 0

Average test duration: 15.23ms
============================================================
```

## Integration Examples

### Fetch Apps

```typescript
import { getDefaultCredentials, makeRequest } from '@/services/ascAuth';

async function fetchApps() {
  const credentials = await getDefaultCredentials();
  if (!credentials) {
    throw new Error('No credentials configured');
  }

  const response = await makeRequest(credentials, {
    method: 'GET',
    path: '/v1/apps',
    query: {
      limit: 20,
      'fields[apps]': 'name,bundleId,sku'
    }
  });

  return response.data;
}
```

### Create Custom Product Page

```typescript
import { getDefaultCredentials, makeRequest } from '@/services/ascAuth';

async function createCPP(appId: string, name: string) {
  const credentials = await getDefaultCredentials();
  if (!credentials) {
    throw new Error('No credentials configured');
  }

  const response = await makeRequest(credentials, {
    method: 'POST',
    path: '/v1/appCustomProductPages',
    body: {
      data: {
        type: 'appCustomProductPages',
        attributes: { name },
        relationships: {
          app: {
            data: { type: 'apps', id: appId }
          }
        }
      }
    }
  });

  return response.data;
}
```

### Upload Screenshot

```typescript
import { getDefaultCredentials, makeRequest } from '@/services/ascAuth';
import * as fs from 'fs/promises';

async function uploadScreenshot(
  localizationId: string,
  filePath: string
) {
  const credentials = await getDefaultCredentials();
  if (!credentials) {
    throw new Error('No credentials configured');
  }

  // 1. Create screenshot reservation
  const reservation = await makeRequest(credentials, {
    method: 'POST',
    path: '/v1/appScreenshots',
    body: {
      data: {
        type: 'appScreenshots',
        attributes: {
          fileName: path.basename(filePath),
          fileSize: (await fs.stat(filePath)).size
        },
        relationships: {
          appScreenshotSet: {
            data: { type: 'appScreenshotSets', id: localizationId }
          }
        }
      }
    }
  });

  // 2. Upload file to reserved URL
  const uploadUrl = reservation.data.attributes.uploadOperations[0].url;
  const fileContent = await fs.readFile(filePath);

  await fetch(uploadUrl, {
    method: 'PUT',
    body: fileContent,
    headers: {
      'Content-Type': 'image/png'
    }
  });

  // 3. Commit reservation
  await makeRequest(credentials, {
    method: 'PATCH',
    path: `/v1/appScreenshots/${reservation.data.id}`,
    body: {
      data: {
        type: 'appScreenshots',
        id: reservation.data.id,
        attributes: {
          uploaded: true
        }
      }
    }
  });

  return reservation.data;
}
```

## Troubleshooting

### "Token is invalid"

- Check that Issuer ID and Key ID are correct
- Ensure private key file is complete and not corrupted
- Verify key is still active in App Store Connect

### "Credentials are invalid" during test

- Verify credentials have API access enabled
- Check that key has not been revoked
- Ensure network connectivity to api.appstoreconnect.apple.com

### "Rate limit exceeded"

- Wait until rate limit resets (check `X-Rate-Limit-Reset` header)
- Reduce request frequency
- Consider using multiple API keys for different services

### Token expiration issues

- Tokens expire after 20 minutes maximum
- System automatically refreshes when needed
- Call `clearTokenCache()` to force immediate refresh

## References

- [App Store Connect API Documentation](https://developer.apple.com/documentation/appstoreconnectapi)
- [Creating API Keys](https://developer.apple.com/documentation/appstoreconnectapi/creating_api_keys_for_app_store_connect_api)
- [Generating Tokens](https://developer.apple.com/documentation/appstoreconnectapi/generating_tokens_for_api_requests)
- [JWT Specification](https://tools.ietf.org/html/rfc7519)

## License

MIT
