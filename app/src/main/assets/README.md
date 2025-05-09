# Epher Secure Chat

A secure peer-to-peer chat application with end-to-end encryption, perfect forward secrecy, and file sharing capabilities.

## Features

- End-to-end encryption using XChaCha20-Poly1305
- Perfect Forward Secrecy with Double Ratchet protocol
- Secure file sharing with chunk-based uploads
- Message persistence with IndexedDB
- Offline support via Service Worker
- Dark mode support
- Real-time typing indicators
- Message read receipts
- File preview support
- Message search functionality
- Responsive design with Tailwind CSS

## Security Features

- CSRF protection
- Rate limiting
- File content validation
- Session management with device fingerprinting
- Message expiration
- Traffic analysis prevention
- Replay attack protection
- Secure key rotation

## Getting Started

### Prerequisites

- Node.js >= 14.0.0
- Python 3 (for development server)

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

### Development

Start the development server:
```bash
npm run serve
```

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Architecture

### Components

1. **Crypto System**
   - `cryptoWorker.js`: Web Worker for crypto operations
   - `cryptoBridge.js`: Interface between UI and Crypto Worker
   - Double Ratchet implementation for Perfect Forward Secrecy

2. **Network Layer**
   - P2P connection management
   - Message delivery with acknowledgments
   - Keep-alive mechanism
   - Exponential backoff for reconnection

3. **Storage**
   - IndexedDB for message persistence
   - Message store with automatic cleanup
   - Session management
   - File upload management

4. **UI Components**
   - Responsive design with Tailwind CSS
   - Dark mode support
   - File preview modal
   - Message search
   - Typing indicators

### Security Measures

1. **Message Security**
   - End-to-end encryption
   - Message expiration
   - Perfect Forward Secrecy
   - Replay attack prevention

2. **Session Security**
   - CSRF protection
   - Device fingerprinting
   - Session timeout and renewal
   - Permission management

3. **File Security**
   - Content validation
   - Chunk-based encrypted uploads
   - Magic number verification
   - Size limitations

4. **Network Security**
   - Rate limiting
   - Connection timeout handling
   - Keep-alive monitoring
   - Traffic padding

## Testing

The project includes comprehensive test coverage:

- Unit tests for all components
- Integration tests for crypto operations
- End-to-end tests for message flow
- Security audit tests

Run specific test suites:
```bash
npm test utils
npm test crypto
npm test session
npm test network
```

## API Documentation

### Crypto Operations

#### `initializeCrypto(preKeyBundle)`
Initializes the crypto system with a pre-key bundle.
- **Parameters**: `preKeyBundle` - Uint8Array containing the initial key material
- **Returns**: Promise resolving to `{ success: true }` if initialization succeeds

#### `generatePreKeyBundle()`
Generates a new pre-key bundle for initial key exchange.
- **Returns**: Promise resolving to `{ publicKey, privateKey }`

#### `seal(plaintext)`
Encrypts a message.
- **Parameters**: `plaintext` - The message to encrypt
- **Returns**: Promise resolving to `{ nonce, cipher, sig }`

#### `open(envelope)`
Decrypts a message.
- **Parameters**: `envelope` - The encrypted message envelope
- **Returns**: Promise resolving to the decrypted message

### Session Management

#### `createSession(username, roomId)`
Creates a new session.
- **Parameters**:
  - `username` - User identifier
  - `roomId` - Room identifier
- **Returns**: Promise resolving to session object

#### `renewSession()`
Renews the current session.
- **Returns**: Promise resolving to renewed session object

### File Operations

#### `handleFileUpload(file, onProgress)`
Handles file upload with progress tracking.
- **Parameters**:
  - `file` - File object to upload
  - `onProgress` - Callback for upload progress
- **Returns**: Promise resolving to upload metadata

### Network Operations

#### `connect(roomId)`
Establishes network connection.
- **Parameters**: `roomId` - Room to connect to
- **Returns**: Promise resolving when connected

#### `sendMessage(message)`
Sends a message to peers.
- **Parameters**: `message` - Message object to send
- **Returns**: Promise resolving to delivery status

## Error Handling

The application implements comprehensive error handling:

1. **Network Errors**
   - Connection failures
   - Message delivery timeouts
   - Peer disconnections

2. **Crypto Errors**
   - Key generation failures
   - Decryption failures
   - Signature verification failures

3. **File Errors**
   - Upload failures
   - Invalid file types
   - Size limit exceeded

4. **Session Errors**
   - Authentication failures
   - Session expiration
   - Permission denied

## Contributing

1. Fork the repository
2. Create your feature branch
3. Write tests for new features
4. Ensure all tests pass
5. Submit a pull request

## Security Considerations

1. **Key Management**
   - Keys are generated using secure random number generation
   - Private keys never leave the crypto worker
   - Keys are rotated regularly

2. **Message Security**
   - All messages are encrypted and authenticated
   - Messages expire after configured time
   - Replay attacks are prevented

3. **File Security**
   - Files are validated before upload
   - Content is checked against magic numbers
   - Chunks are encrypted individually

4. **Network Security**
   - Rate limiting prevents DoS
   - Keep-alive ensures connection health
   - Traffic is padded to prevent analysis

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Security Disclosure

For security issues, please email security@example.com instead of creating a public issue.
