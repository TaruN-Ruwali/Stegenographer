// DOM Elements
const carrierTypeRadios = document.querySelectorAll('input[name="carrier_type"]');
const uploadArea = document.getElementById('uploadArea');
const carrierFileInput = document.getElementById('carrierFile');
const filePreview = document.getElementById('filePreview');
const fileRequirements = document.getElementById('fileRequirements');
const secretText = document.getElementById('secretText');
const charCount = document.getElementById('charCount');
const encodeBtn = document.getElementById('encodeBtn');
const decodeBtn = document.getElementById('decodeBtn');
const results = document.getElementById('results');
const resultContent = document.getElementById('resultContent');

// Current state
let currentCarrierType = 'image';

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    updateFileAccept();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    // Carrier type change
    carrierTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            currentCarrierType = this.value;
            updateFileAccept();
            clearFilePreview();
        });
    });

    // Upload area click
    uploadArea.addEventListener('click', () => carrierFileInput.click());

    // File input change
    carrierFileInput.addEventListener('change', handleFileSelect);

    // Drag and drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);

    // Secret text input
    secretText.addEventListener('input', updateCharCount);

    // Action buttons
    encodeBtn.addEventListener('click', encodeText);
    decodeBtn.addEventListener('click', decodeText);
}

// Update file input accept attribute based on carrier type
function updateFileAccept() {
    const acceptMap = {
        'image': '.png,.jpg,.jpeg,.bmp',
        'audio': '.wav',
        'video': '.mp4,.avi,.mov'
    };
    
    const requirementMap = {
        'image': 'Supports: PNG, JPG, BMP',
        'audio': 'Supports: WAV (lossless audio)',
        'video': 'Supports: MP4, AVI, MOV'
    };

    carrierFileInput.accept = acceptMap[currentCarrierType];
    fileRequirements.textContent = requirementMap[currentCarrierType];
}

// Drag and drop handlers
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        carrierFileInput.files = files;
        handleFileSelect();
    }
}

// Handle file selection
function handleFileSelect() {
    const file = carrierFileInput.files[0];
    if (!file) return;

    // Validate file type
    if (!isValidFileType(file)) {
        showResult('error', `Invalid file type for ${currentCarrierType} carrier`);
        clearFilePreview();
        return;
    }

    displayFilePreview(file);
}

// Validate file type
function isValidFileType(file) {
    const typeMap = {
        'image': ['image/png', 'image/jpeg', 'image/bmp'],
        'audio': ['audio/wav', 'audio/x-wav'],
        'video': ['video/mp4', 'video/avi', 'video/quicktime']
    };

    return typeMap[currentCarrierType].includes(file.type);
}

// Display file preview
function displayFilePreview(file) {
    const url = URL.createObjectURL(file);
    
    let previewHTML = '';
    
    if (currentCarrierType === 'image') {
        previewHTML = `
            <img src="${url}" alt="Preview">
            <div class="file-info">
                <strong>${file.name}</strong> (${formatFileSize(file.size)})
            </div>
        `;
    } else if (currentCarrierType === 'audio') {
        previewHTML = `
            <audio controls src="${url}"></audio>
            <div class="file-info">
                <strong>${file.name}</strong> (${formatFileSize(file.size)})
            </div>
        `;
    } else if (currentCarrierType === 'video') {
        previewHTML = `
            <video controls src="${url}" style="max-width: 100%;"></video>
            <div class="file-info">
                <strong>${file.name}</strong> (${formatFileSize(file.size)})
            </div>
        `;
    }

    filePreview.innerHTML = previewHTML;
    filePreview.style.display = 'block';
}

// Clear file preview
function clearFilePreview() {
    filePreview.innerHTML = '';
    filePreview.style.display = 'none';
    carrierFileInput.value = '';
}

// Update character count
function updateCharCount() {
    charCount.textContent = secretText.value.length;
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Encode text into carrier file
async function encodeText() {
    const file = carrierFileInput.files[0];
    const text = secretText.value.trim();

    if (!file) {
        showResult('error', 'Please select a carrier file');
        return;
    }

    if (!text) {
        showResult('error', 'Please enter a secret message');
        return;
    }

    // Disable buttons and show loading
    setButtonsLoading(true);

    const formData = new FormData();
    formData.append('carrier_file', file);
    formData.append('secret_text', text);
    formData.append('carrier_type', currentCarrierType);

    try {
        const response = await fetch('/encode', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            showResult('success', 
                `Message encoded successfully!`,
                `<a href="${result.download_url}" class="download-btn" download="${result.filename}">
                    📥 Download Encoded File
                </a>`
            );
        } else {
            showResult('error', result.error);
        }
    } catch (error) {
        showResult('error', 'Network error: ' + error.message);
    } finally {
        setButtonsLoading(false);
    }
}

// Decode text from carrier file
async function decodeText() {
    const file = carrierFileInput.files[0];

    if (!file) {
        showResult('error', 'Please select a file with hidden data');
        return;
    }

    // Disable buttons and show loading
    setButtonsLoading(true);

    const formData = new FormData();
    formData.append('stego_file', file);
    formData.append('carrier_type', currentCarrierType);

    try {
        const response = await fetch('/decode', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            showResult('success', 
                'Message extracted successfully!',
                `<div class="decoded-text">${result.decoded_text}</div>`
            );
        } else {
            showResult('error', result.error);
        }
    } catch (error) {
        showResult('error', 'Network error: ' + error.message);
    } finally {
        setButtonsLoading(false);
    }
}

// Show result message
function showResult(type, message, additionalContent = '') {
    const typeClass = type === 'success' ? 'result-success' : 'result-error';
    
    resultContent.innerHTML = `
        <div class="${typeClass}">
            ${message}
        </div>
        ${additionalContent}
    `;
    
    results.style.display = 'block';
    results.scrollIntoView({ behavior: 'smooth' });
}

// Set buttons loading state
function setButtonsLoading(loading) {
    encodeBtn.disabled = loading;
    decodeBtn.disabled = loading;
    
    if (loading) {
        encodeBtn.innerHTML = '<div class="loading"></div> Encoding...';
        decodeBtn.innerHTML = '<div class="loading"></div> Decoding...';
    } else {
        encodeBtn.innerHTML = '<span class="btn-icon">🔒</span> Hide Text in File';
        decodeBtn.innerHTML = '<span class="btn-icon">🔍</span> Extract Text from File';
    }
}