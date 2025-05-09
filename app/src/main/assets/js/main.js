import { 
    generateRoomId, 
    generateUsername, 
    validateFileContent, 
    getFileIcon, 
    formatFileSize 
} from './utils.js';
import {
    initializeCrypto,
    generatePreKeyBundle,
    seal,
    sealFile,
    open,
    openFile,
    cleanup
} from './cryptoBridge.js';
import { SecurityConfig, RateLimiter, generateCSRFToken } from './config/security.js';
import logger from './services/logger.js';

// State management
let roomId, username;
let isConnected = false;
let cryptoInitialized = false;
let csrfToken = null;

// Rate limiters
const messageRateLimiter = new RateLimiter(SecurityConfig.rateLimit.messages);
const fileRateLimiter = new RateLimiter(SecurityConfig.rateLimit.files);

// DOM Elements cache
const elements = {};

// Initialize the application
window.onload = async () => {
    try {
        csrfToken = generateCSRFToken();
        await initializeApp();
        setupEventListeners();
        setupThemeHandler();
    } catch (error) {
        logger.error('App Initialization', 'Failed to initialize app', { error });
        showError('Failed to initialize app: ' + error.message);
    }
};

// Initialize app state and crypto
async function initializeApp() {
    // Generate identities
    roomId = generateRoomId();
    username = generateUsername();
    
    // Cache DOM elements
    cacheElements();
    
    // Update UI with room information
    elements.roomId.textContent = `Room: ${roomId}`;
    
    try {
        // Generate pre-key bundle for initial key exchange
        const preKeyBundle = await generatePreKeyBundle();
        
        // Initialize crypto system
        await initializeCrypto(preKeyBundle.publicKey);
        cryptoInitialized = true;
        
        // Initialize connection with backend
        AndroidBridge.join(roomId, JSON.stringify(preKeyBundle));
        updateConnectionStatus('connecting');
        
    } catch (error) {
        showError('Failed to initialize crypto: ' + error.message);
    }
}

// Cache DOM elements for better performance
function cacheElements() {
    elements.roomId = document.getElementById('room-id');
    elements.messages = document.getElementById('messages');
    elements.msgInput = document.getElementById('msg');
    elements.sendBtn = document.getElementById('send');
    elements.fileUploadBtn = document.getElementById('file-upload-btn');
    elements.fileInput = document.getElementById('file-upload');
    elements.connectionStatus = document.getElementById('connection-status');
    elements.connectionIndicator = elements.connectionStatus.querySelector('.connection-indicator');
    elements.connectionText = elements.connectionStatus.querySelector('span');
    elements.themeToggle = document.getElementById('theme-toggle');
    elements.errorModal = document.getElementById('error-modal');
    elements.errorMessage = document.getElementById('error-message');
}

// Set up event listeners
function setupEventListeners() {
    // Send message handler
    elements.sendBtn.addEventListener('click', sendMessage);
    elements.msgInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // File upload handlers
    elements.fileUploadBtn.addEventListener('click', () => {
        elements.fileInput.click();
    });

    elements.fileInput.addEventListener('change', handleFileUpload);

    // Error modal close button
    document.getElementById('close-error').addEventListener('click', () => {
        elements.errorModal.classList.add('hidden');
    });
}

// Handle file upload
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file || !isConnected || !cryptoInitialized) return;

    try {
        // Validate file
        validateFile(file);

        // Show upload progress
        elements.fileUploadBtn.classList.add('uploading');

        // Read file as base64
        const fileData = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]); // Remove data URL prefix
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        // Prepare file args
        const fileArgs = {
            fileData,
            fileName: file.name,
            fileType: file.type,
            fileSize: formatFileSize(file.size)
        };

        // Encrypt file
        const env = await sealFile(fileArgs);
        
        // Send to peers
        AndroidBridge.sendMessage(JSON.stringify(env));
        
        // Update UI with file icon
        const fileIcon = getFileIcon(file.type);
        appendFileMessage({ ...fileArgs, fileIcon }, true);
        
    } catch (error) {
        showError('Failed to upload file: ' + error.message);
    } finally {
        // Reset file input and remove progress indicator
        event.target.value = '';
        elements.fileUploadBtn.classList.remove('uploading');
    }
}

// Append file message to chat
function appendFileMessage(file, isMine = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isMine ? 'message-sent' : 'message-received'}`;
    
    const time = new Date().toLocaleTimeString();
    let content = '';

    // Create appropriate content based on file type
    if (file.fileType.startsWith('image/')) {
        content = `
            <div class="file-attachment">
                <img src="data:${file.fileType};base64,${file.fileData}" alt="${escapeHtml(file.fileName)}">
                <div class="file-info">
                    <span class="file-name">${escapeHtml(file.fileName)}</span>
                    <span class="file-size">${file.fileSize}</span>
                </div>
            </div>
        `;
    } else if (file.fileType.startsWith('video/')) {
        content = `
            <div class="file-attachment">
                <video controls>
                    <source src="data:${file.fileType};base64,${file.fileData}" type="${file.fileType}">
                    Your browser does not support video playback.
                </video>
                <div class="file-info">
                    <span class="file-name">${escapeHtml(file.fileName)}</span>
                    <span class="file-size">${file.fileSize}</span>
                </div>
            </div>
        `;
    } else {
        content = `
            <a href="data:${file.fileType};base64,${file.fileData}" 
               download="${escapeHtml(file.fileName)}"
               class="file-download">
                <i class="fas ${file.fileIcon}"></i>
                <div class="file-info">
                    <span class="file-name">${escapeHtml(file.fileName)}</span>
                    <span class="file-size">${file.fileSize}</span>
                </div>
            </a>
        `;
    }

    messageDiv.innerHTML = `
        ${content}
        <span class="timestamp">${time} - ${isMine ? username : 'peer'}</span>
    `;
    
    elements.messages.appendChild(messageDiv);
    messageDiv.scrollIntoView({ behavior: 'smooth' });
}

// Handle theme switching
function setupThemeHandler() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.documentElement.classList.add('dark');
        elements.themeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
    }

    elements.themeToggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        const isDark = document.documentElement.classList.contains('dark');
        localStorage.setItem('darkMode', isDark);
        
        const icon = elements.themeToggle.querySelector('i');
        icon.classList.replace(isDark ? 'fa-moon' : 'fa-sun', isDark ? 'fa-sun' : 'fa-moon');
    });
}

// Send message function with rate limiting and logging
async function sendMessage() {
    const text = elements.msgInput.value.trim();
    if (!text || !isConnected || !cryptoInitialized) return;

    try {
        // Check rate limit
        if (!messageRateLimiter.isAllowed(username)) {
            throw new Error('Message rate limit exceeded. Please wait before sending more messages.');
        }

        // Validate message
        const validation = validateMessage(text);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        // Add CSRF token and message metadata
        const messageData = {
            text,
            timestamp: Date.now(),
            csrfToken,
            messageId: generateMessageId(),
            type: 'text'
        };

        // Encrypt message
        const env = await seal(messageData);
        
        // Send to peers with delivery tracking
        const deliveryPromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Message delivery timeout'));
            }, SecurityConfig.network.connectionTimeout);

            AndroidBridge.sendMessage(JSON.stringify(env), (status) => {
                clearTimeout(timeout);
                if (status.success) {
                    resolve(status);
                } else {
                    reject(new Error(status.error));
                }
            });
        });

        // Update UI immediately but mark as pending
        const messageElement = appendMessage(text, true, true);
        
        // Wait for delivery confirmation
        const deliveryStatus = await deliveryPromise;
        
        // Update UI with delivery status
        updateMessageStatus(messageElement, deliveryStatus);
        
        // Clear input
        elements.msgInput.value = '';
        
        // Log successful message
        logger.info('Message', 'Message sent successfully', {
            messageId: messageData.messageId,
            timestamp: messageData.timestamp
        });

    } catch (error) {
        logger.error('Message', 'Failed to send message', { error });
        showError(error.message);
    }
}

// Generate unique message ID
function generateMessageId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Update message status in UI
function updateMessageStatus(messageElement, status) {
    const statusIndicator = messageElement.querySelector('.message-status');
    if (statusIndicator) {
        statusIndicator.className = `message-status ${status.success ? 'delivered' : 'failed'}`;
        statusIndicator.title = status.success ? 'Delivered' : 'Failed to deliver';
    }
}

// Append message to chat
function appendMessage(text, isMine = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isMine ? 'message-sent' : 'message-received'}`;
    
    const time = new Date().toLocaleTimeString();
    messageDiv.innerHTML = `
        <div class="message-content">${escapeHtml(text)}</div>
        <span class="timestamp">${time} - ${isMine ? username : 'peer'}</span>
    `;
    
    elements.messages.appendChild(messageDiv);
    messageDiv.scrollIntoView({ behavior: 'smooth' });
}

// Update connection status
function updateConnectionStatus(status) {
    const indicator = elements.connectionIndicator;
    const text = elements.connectionText;
    
    indicator.classList.remove('connected', 'connecting');
    
    switch (status) {
        case 'connected':
            isConnected = true;
            indicator.classList.add('connected');
            text.textContent = 'Connected';
            break;
        case 'connecting':
            isConnected = false;
            indicator.classList.add('connecting');
            text.textContent = 'Connecting...';
            break;
        default:
            isConnected = false;
            text.textContent = 'Disconnected';
    }
}

// Show error modal
function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorModal.classList.remove('hidden');
    elements.errorModal.classList.remove('modal-exit');
    elements.errorModal.classList.add('modal-enter');
}

// Escape HTML to prevent XSS
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .replace(/'/g, '&#039;');
}

// Backend message handler
window._onBackendMessage = async (env) => {
    if (!cryptoInitialized) return;
    
    try {
        // Parse envelope if it's a string
        const envelope = typeof env === 'string' ? JSON.parse(env) : env;

        // Handle message based on type
        if (envelope.type === 'file') {
            // Decrypt and verify file message
            const fileMessage = await openFile(envelope);
            
            // Update UI with decrypted file
            appendFileMessage(fileMessage, false);
        } else {
            // Decrypt and verify text message
            const plain = await open(envelope);
            
            // Update UI with decrypted message
            appendMessage(plain, false);
        }
        
    } catch (error) {
        if (error.message.includes('replay')) {
            console.warn('Replay attack prevented:', error);
        } else {
            showError('Failed to decrypt message: ' + error.message);
        }
    }
};

// Handle page cleanup
window.addEventListener('beforeunload', () => {
    // Wipe DOM content
    if (elements.messages) {
        elements.messages.innerHTML = '';
    }
    
    // Cleanup crypto
    cleanup();
});

// Handle visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Wipe sensitive DOM content when page is hidden
        if (elements.messages) {
            elements.messages.innerHTML = '';
        }
    }
});

// Backend connection status handler
window._onConnectionStatus = (status) => {
    updateConnectionStatus(status);
};

// Backend error handler
window._onBackendError = (error) => {
    showError('Backend error: ' + error);
    updateConnectionStatus('disconnected');
};
