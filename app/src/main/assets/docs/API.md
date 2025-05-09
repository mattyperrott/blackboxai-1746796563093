# API Documentation

## Core Modules

### Crypto Operations

#### CryptoBridge

Interface between the main application and the CryptoWorker.

```typescript
interface CryptoBridge {
    initializeCrypto(preKeyBundle: Uint8Array): Promise<{ success: boolean }>;
    generatePreKeyBundle(): Promise<{ publicKey: Uint8Array, privateKey: Uint8Array }>;
    seal(plaintext: any): Promise<{ nonce: number[], cipher: number[], sig: number[] }>;
    open(envelope: { nonce: number[], cipher: number[], sig: number[] }): Promise<any>;
    sealFile(fileData: { data: string, name: string, type: string }): Promise<any>;
    openFile(envelope: any): Promise<{ data: string, name: string, type: string }>;
    cleanup(): Promise<void>;
}
```

#### CryptoWorker

Web Worker implementation of cryptographic operations.

```typescript
interface CryptoWorker {
    initialize(preKeyBundle: Uint8Array): void;
    rotateRatchet(): void;
    deriveMessageKey(key: Uint8Array, counter: number): Promise<Uint8Array>;
    wipeKey(key: Uint8Array): void;
}
```

### Session Management

#### SessionManager

Handles user session creation, validation, and renewal.

```typescript
interface SessionManager {
    initialize(): Promise<void>;
    createSession(username: string, roomId: string): Promise<Session>;
    restoreSession(session: Session): Promise<Session>;
    renewSession(): Promise<void>;
    clearSession(): void;
    hasPermission(permission: string): boolean;
    addPermission(permission: string): boolean;
    removePermission(permission: string): boolean;
    getSessionInfo(): Session | null;
}

interface Session {
    id: string;
    username: string;
    roomId: string;
    permissions: string[];
    createdAt: number;
    expiresAt: number;
    lastActivity: number;
    fingerprint?: string;
}
```

### Message Store

Handles message persistence and retrieval.

```typescript
interface MessageStore {
    initialize(): Promise<void>;
    saveMessage(message: Message): Promise<void>;
    getMessage(id: string): Promise<Message | null>;
    getMessages(options: QueryOptions): Promise<Message[]>;
    deleteMessage(id: string): Promise<void>;
    cleanupOldMessages(): Promise<void>;
}

interface Message {
    id: string;
    roomId: string;
    sender: string;
    content: any;
    timestamp: number;
    type: string;
}

interface QueryOptions {
    roomId?: string;
    sender?: string;
    startTime?: number;
    endTime?: number;
    limit?: number;
    offset?: number;
}
```

### File Handling

#### FileUploadManager

Manages secure file uploads with chunking and progress tracking.

```typescript
interface FileUploadManager {
    handleFileUpload(file: File, onProgress?: ProgressCallback): Promise<UploadMetadata>;
    uploadFileInChunks(uploadId: string, onProgress?: ProgressCallback): Promise<void>;
    uploadChunk(uploadId: string, chunk: FileChunk, onProgress?: ProgressCallback): Promise<void>;
    finalizeUpload(uploadId: string): Promise<void>;
    cancelUpload(uploadId: string): void;
    resumeUpload(uploadId: string): Promise<void>;
}

interface UploadMetadata {
    uploadId: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    totalChunks: number;
    checksum: string;
}

interface FileChunk {
    index: number;
    data: Blob;
}

type ProgressCallback = (progress: { uploaded: number, total: number, percentage: number }) => void;
```

### Network Management

#### NetworkManager

Handles peer-to-peer connections and message routing.

```typescript
interface NetworkManager {
    connect(roomId: string): Promise<void>;
    disconnect(): Promise<void>;
    sendMessage(message: any): Promise<{ success: boolean }>;
    on(event: string, callback: Function): void;
    off(event: string, callback: Function): void;
    isConnected(): boolean;
    getPeers(): string[];
}

interface NetworkEvents {
    'peer': (peerId: string) => void;
    'message': (message: any) => void;
    'error': (error: Error) => void;
    'disconnected': () => void;
    'reconnecting': (attempt: number) => void;
    'connected': () => void;
}
```

### Logging

#### Logger

Provides structured logging with different severity levels.

```typescript
interface Logger {
    debug(category: string, message: string, data?: any): void;
    info(category: string, message: string, data?: any): void;
    warn(category: string, message: string, data?: any): void;
    error(category: string, message: string, data?: any): void;
    audit(category: string, message: string, data?: any): void;
    
    addListener(callback: LogCallback): () => void;
    queryLogs(options: LogQueryOptions): Promise<LogEntry[]>;
}

interface LogEntry {
    timestamp: number;
    level: LogLevel;
    category: string;
    message: string;
    data?: any;
}

interface LogQueryOptions {
    level?: LogLevel;
    category?: string;
    startTime?: number;
    endTime?: number;
    search?: string;
}

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'AUDIT';
type LogCallback = (entry: LogEntry) => void;
```

## Utility Functions

### Message Utilities

```typescript
function validateMessage(text: string): { valid: boolean, error?: string };
function formatTimestamp(date: Date): string;
function generateMessageId(): string;
```

### File Utilities

```typescript
function validateFile(file: File): boolean;
function formatFileSize(bytes: number): string;
function getFileIcon(fileType: string): string;
```

### Security Utilities

```typescript
function generateCSRFToken(): string;
function generateDeviceFingerprint(): string;
function validateFileContent(file: File): Promise<boolean>;
```

### UI Utilities

```typescript
function debounce<T extends Function>(func: T, wait: number): T;
function copyToClipboard(text: string): Promise<boolean>;
function safeJsonParse(str: string): { data: any | null, error: string | null };
```

## Event System

### Message Events

```typescript
interface MessageEvents {
    'message:sent': (message: Message) => void;
    'message:received': (message: Message) => void;
    'message:edited': (messageId: string, newContent: any) => void;
    'message:deleted': (messageId: string) => void;
    'message:error': (error: Error) => void;
}
```

### File Events

```typescript
interface FileEvents {
    'file:upload:start': (metadata: UploadMetadata) => void;
    'file:upload:progress': (progress: { uploadId: string, progress: number }) => void;
    'file:upload:complete': (metadata: UploadMetadata) => void;
    'file:upload:error': (error: Error) => void;
}
```

### Session Events

```typescript
interface SessionEvents {
    'session:created': (session: Session) => void;
    'session:renewed': (session: Session) => void;
    'session:expired': () => void;
    'session:error': (error: Error) => void;
}
```

## Error Handling

### Error Types

```typescript
interface AppError extends Error {
    code: string;
    details?: any;
}

interface CryptoError extends AppError {
    code: 'CRYPTO_ERROR';
    operation: string;
}

interface NetworkError extends AppError {
    code: 'NETWORK_ERROR';
    attempt?: number;
}

interface ValidationError extends AppError {
    code: 'VALIDATION_ERROR';
    field?: string;
}
```

### Error Codes

```typescript
enum ErrorCode {
    CRYPTO_INIT_FAILED = 'CRYPTO_INIT_FAILED',
    MESSAGE_ENCRYPTION_FAILED = 'MESSAGE_ENCRYPTION_FAILED',
    MESSAGE_DECRYPTION_FAILED = 'MESSAGE_DECRYPTION_FAILED',
    FILE_VALIDATION_FAILED = 'FILE_VALIDATION_FAILED',
    NETWORK_CONNECTION_FAILED = 'NETWORK_CONNECTION_FAILED',
    SESSION_EXPIRED = 'SESSION_EXPIRED',
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}
```

## Configuration

### Security Configuration

```typescript
interface SecurityConfig {
    csrf: CSRFConfig;
    rateLimit: RateLimitConfig;
    files: FileSecurityConfig;
    session: SessionConfig;
    messages: MessageConfig;
    network: NetworkConfig;
    logging: LoggingConfig;
    accessControl: AccessControlConfig;
}
```

### Network Configuration

```typescript
interface NetworkConfig {
    connectionTimeout: number;
    reconnectAttempts: number;
    reconnectDelay: number;
    keepAliveInterval: number;
    bandwidthLimit: number;
}
```

## Service Worker

### Registration

```typescript
async function registerServiceWorker(): Promise<ServiceWorkerRegistration>;
```

### Cache Management

```typescript
interface CacheOperations {
    addToCache(request: Request, response: Response): Promise<void>;
    getCachedResponse(request: Request): Promise<Response | undefined>;
    clearOldCaches(): Promise<void>;
}
```

## Usage Examples

### Basic Message Flow

```javascript
// Initialize crypto
await cryptoBridge.initializeCrypto(preKeyBundle);

// Create session
const session = await sessionManager.createSession('username', 'room-123');

// Connect to network
await networkManager.connect(session.roomId);

// Send message
const message = { type: 'text', content: 'Hello!' };
const encrypted = await cryptoBridge.seal(message);
await networkManager.sendMessage(encrypted);

// Receive message
networkManager.on('message', async (envelope) => {
    const decrypted = await cryptoBridge.open(envelope);
    await messageStore.saveMessage(decrypted);
});
```

### File Upload Example

```javascript
// Upload file
const file = new File(['content'], 'test.txt', { type: 'text/plain' });
const uploadManager = new FileUploadManager();

await uploadManager.handleFileUpload(file, (progress) => {
    console.log(`Upload progress: ${progress.percentage}%`);
});
```

### Error Handling Example

```javascript
try {
    await operation();
} catch (error) {
    if (error instanceof CryptoError) {
        logger.error('Crypto', 'Operation failed', { 
            operation: error.operation,
            details: error.details 
        });
    } else if (error instanceof NetworkError) {
        networkManager.attemptReconnect();
    }
}
