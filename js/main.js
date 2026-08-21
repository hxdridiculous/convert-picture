// --- DOM Elements ---
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const settingsSection = document.getElementById('settingsSection');
const processingSection = document.getElementById('processingSection');
const previewSection = document.getElementById('previewSection');
const resultsSection = document.getElementById('resultsSection');
const qualitySlider = document.getElementById('qualitySlider');
const qualityValue = document.getElementById('qualityValue');
const maxWidthInput = document.getElementById('maxWidthInput');
const maxHeightInput = document.getElementById('maxHeightInput');
const outputFormatSelect = document.getElementById('outputFormatSelect');
const fileListUI = document.getElementById('fileList');
const processedFileListUI = document.getElementById('processedFileList');
const startProcessingBtn = document.getElementById('startProcessingBtn');
const batchDownloadBtn = document.getElementById('batchDownloadBtn');
const clearResultsBtn = document.getElementById('clearResultsBtn');
const closePreviewBtn = document.getElementById('closePreviewBtn');
const previewArea = document.getElementById('previewArea');
const previewOriginalImg = document.getElementById('previewOriginal');
const previewProcessedImg = document.getElementById('previewProcessed');
const previewProcessedPlaceholder = document.getElementById('previewProcessedPlaceholder');
const previewPlaceholderArt = document.getElementById('previewPlaceholderArt');
const previewPlaceholderLabel = document.getElementById('previewPlaceholderLabel');
const previewOriginalSize = document.getElementById('previewOriginalSize');
const previewProcessedSize = document.getElementById('previewProcessedSize');
const previewSavings = document.getElementById('previewSavings');
const previewFileName = document.getElementById('previewFileName');
const messageArea = document.getElementById('messageArea');
const compressionModeRadios = document.querySelectorAll('input[name="compressionMode"]');

// --- Global State ---
let uploadedFiles = []; // Array of {id: string, file: File, originalURL: string, processedBlob?: Blob, processedURL?: string, originalSize: number, processedSize?: number, status: string, error?: string, progress: number }
let selectedPreviewId = null;
let isProcessing = false;
let processingCancelled = false;
let currentProcessingId = null;
const animatedPendingFileIds = new Set();
const animatedResultFileIds = new Set();
const sectionHideTimers = new WeakMap();
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const picaInstance = pica();
const MAX_DIMENSION = 20000;
const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp']);
const ORIGINAL_OUTPUT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const COMPRESSION_PRESETS = {
    shrink: { quality: 0.6, maxWidth: 1280, maxHeight: 720, mimeType: 'image/jpeg' },
    normal: { quality: 0.75, maxWidth: 1920, maxHeight: 1080, mimeType: 'image/jpeg' },
    clear: { quality: 0.9, mimeType: 'image/webp' }
};
const THEME_STORAGE_KEY = 'convertPictureTheme';
const PLACEHOLDER_PATTERNS = [
    [
        ['frame', 8, 12, 72, 64],
        ['frame', 18, 23, 56, 42],
        ['block strong', 58, 45, 24, 25],
        ['line', 10, 84, 32, 1],
        ['line', 49, 84, 29, 1]
    ],
    [
        ['block', 8, 15, 23, 31],
        ['block strong', 36, 15, 48, 14],
        ['frame', 36, 36, 22, 31],
        ['block', 63, 36, 21, 31],
        ['line', 8, 78, 76, 1]
    ],
    [
        ['block strong', 10, 16, 55, 10],
        ['block', 22, 34, 58, 10],
        ['block strong', 34, 52, 48, 10],
        ['frame', 46, 70, 36, 12],
        ['line', 10, 86, 72, 1]
    ],
    [
        ['frame', 9, 14, 21, 58],
        ['block', 36, 28, 21, 44],
        ['frame', 63, 20, 21, 52],
        ['line', 19, 80, 55, 1],
        ['block strong', 36, 14, 48, 7]
    ]
];

// --- Utility Functions ---
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));
}

function getSafeDimension(value) {
    const dimension = parseInt(value, 10);
    if (!Number.isFinite(dimension) || dimension <= 0) return undefined;
    return Math.min(dimension, MAX_DIMENSION);
}

function isSupportedImage(file) {
    return ACCEPTED_IMAGE_TYPES.has(file.type);
}

function revokeFileUrls(fileObj) {
    if (fileObj.originalURL) {
        URL.revokeObjectURL(fileObj.originalURL);
        fileObj.originalURL = '';
    }
    if (fileObj.processedURL) {
        URL.revokeObjectURL(fileObj.processedURL);
        fileObj.processedURL = '';
    }
}

function createPlaceholderPattern() {
    return Math.floor(Math.random() * PLACEHOLDER_PATTERNS.length);
}

function renderProcessedPlaceholder(patternIndex, label = '等待处理', isError = false) {
    const pattern = PLACEHOLDER_PATTERNS[patternIndex] || PLACEHOLDER_PATTERNS[0];
    const fragment = document.createDocumentFragment();

    pattern.forEach(([typeNames, x, y, width, height, rotation = 0]) => {
        const shape = document.createElement('span');
        shape.className = `placeholder-shape ${typeNames.split(' ').map(type => `is-${type}`).join(' ')}`;
        shape.style.setProperty('--shape-x', x);
        shape.style.setProperty('--shape-y', y);
        shape.style.setProperty('--shape-width', width);
        shape.style.setProperty('--shape-height', height);
        shape.style.setProperty('--shape-rotation', rotation);
        fragment.appendChild(shape);
    });

    previewPlaceholderArt.replaceChildren(fragment);
    previewPlaceholderLabel.textContent = label;
    previewProcessedPlaceholder.setAttribute('aria-label', label);
    previewProcessedPlaceholder.classList.toggle('is-error', isError);
    previewProcessedPlaceholder.classList.remove('hidden');
    previewProcessedImg.classList.add('hidden');
    previewProcessedImg.removeAttribute('src');
}

function showProcessedPreview(fileData) {
    previewProcessedPlaceholder.classList.add('hidden');
    previewProcessedImg.classList.remove('hidden');
    previewProcessedImg.onerror = () => {
        renderProcessedPlaceholder(fileData.placeholderPattern, '预览不可用', true);
        previewProcessedSize.textContent = '处理后: 预览加载失败';
        previewSavings.textContent = '';
    };
    previewProcessedImg.src = fileData.processedURL;
}

function setCollapsibleSectionVisibility(section, shouldShow) {
    const existingTimer = sectionHideTimers.get(section);

    if (shouldShow) {
        if (existingTimer) {
            clearTimeout(existingTimer);
            sectionHideTimers.delete(section);
        }
        section.classList.remove('hidden', 'is-hiding');
        section.removeAttribute('aria-hidden');
        section.style.removeProperty('--collapse-height');
        return;
    }

    if (existingTimer || section.classList.contains('hidden') || section.classList.contains('is-hiding')) {
        return;
    }

    if (prefersReducedMotion.matches) {
        section.classList.add('hidden');
        section.setAttribute('aria-hidden', 'true');
        return;
    }

    section.style.setProperty('--collapse-height', `${section.offsetHeight}px`);
    section.classList.add('is-hiding');
    section.setAttribute('aria-hidden', 'true');

    const hideTimer = setTimeout(() => {
        if (section.classList.contains('is-hiding')) {
            section.classList.add('hidden');
            section.classList.remove('is-hiding');
            section.style.removeProperty('--collapse-height');
        }
        sectionHideTimers.delete(section);
    }, 420);
    sectionHideTimers.set(section, hideTimer);
}

function updateThemeToggleState() {
    const isDarkTheme = document.documentElement.dataset.theme === 'dark';
    const label = isDarkTheme ? '切换到亮色主题' : '切换到暗色主题';
    themeToggleBtn.setAttribute('aria-label', label);
    themeToggleBtn.setAttribute('aria-pressed', String(isDarkTheme));
    themeToggleBtn.title = label;
}

function toggleTheme() {
    const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = nextTheme;

    try {
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch (error) {
        console.warn('无法保存主题偏好:', error);
    }

    updateThemeToggleState();
}

function showMessage(type, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message-toast p-3 rounded-md text-sm mb-2 ${type === 'error' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`;
    messageDiv.textContent = text;
    messageArea.appendChild(messageDiv);
    setTimeout(() => {
        if (!messageDiv.isConnected) return;
        messageDiv.classList.add('is-leaving');
        messageDiv.addEventListener('animationend', () => messageDiv.remove(), { once: true });
        setTimeout(() => messageDiv.remove(), 300);
    }, 4700);
}

// --- File Handling ---
// 事件监听器现在通过initializeUploadArea函数添加

function handleFiles(files) {
    if (files.length === 0) return;
    const validFiles = Array.from(files).filter(isSupportedImage);
    const skippedCount = files.length - validFiles.length;

    if (skippedCount > 0) {
        showMessage('error', `已跳过 ${skippedCount} 个不支持的文件`);
    }

    if (validFiles.length === 0) {
        return;
    }

    settingsSection.classList.remove('hidden');
    processingSection.classList.remove('hidden');
    resultsSection.classList.remove('hidden'); // Show results section container

    const newFiles = validFiles.map(file => ({
        id: generateId(),
        file: file,
        originalURL: URL.createObjectURL(file),
        originalSize: file.size,
        placeholderPattern: createPlaceholderPattern(),
        status: 'pending', // pending, processing, done, error
        progress: 0
    }));
    uploadedFiles = uploadedFiles.concat(newFiles);
    renderFileList();
    renderProcessedFileList();
    if (uploadedFiles.length > 0 && !selectedPreviewId) {
        // Auto-select first file for preview if nothing is selected
        // selectForPreview(uploadedFiles[0].id);
    }
}

function renderFileList() {
    fileListUI.innerHTML = '';
    uploadedFiles.forEach(f => {
        if (f.status === 'done' || f.status === 'error') return;

        const li = document.createElement('li');
        li.className = 'file-list-item flex flex-col sm:flex-row items-start sm:items-center justify-between';
        li.dataset.id = f.id;
        if (!animatedPendingFileIds.has(f.id)) {
            li.classList.add('list-item-enter');
            animatedPendingFileIds.add(f.id);
        }
        const safeFileName = escapeHtml(f.file.name);
        const progress = Math.max(0, Math.min(100, Number(f.progress) || 0));
        const isCurrentFile = f.status === 'processing' && currentProcessingId === f.id;
        const disableRowActions = isProcessing ? 'disabled' : '';

        const stateHtml = f.status === 'processing'
            ? `<div class="file-progress" aria-label="处理进度 ${progress}%">
                    <div class="progress-bar-container"><div class="progress-bar" style="width: ${progress}%"></div></div>
                    <span>${progress}%</span>
                </div>`
            : '';

        li.innerHTML = `
            <button type="button" class="file-preview-trigger" aria-label="预览 ${safeFileName}" title="预览 ${safeFileName}">
                <span class="file-thumbnail-wrap"><img class="file-thumbnail" alt=""></span>
                <span class="min-w-0">
                    <span class="file-name block text-sm font-semibold text-gray-800 truncate">${safeFileName}</span>
                    <span class="block text-xs text-gray-500 mt-0.5">${formatBytes(f.originalSize)}</span>
                </span>
            </button>
            ${stateHtml}
            <div class="file-row-actions">
                <button type="button" class="btn-process btn btn-primary btn-row" ${disableRowActions}
                    aria-label="开始处理 ${safeFileName}">${isCurrentFile ? '处理中' : '开始处理'}</button>
                <button type="button" class="btn-remove btn btn-danger btn-row" ${disableRowActions}
                    aria-label="移除 ${safeFileName}">移除</button>
            </div>
        `;
        li.querySelector('.file-thumbnail').src = f.originalURL;
        fileListUI.appendChild(li);
    });

    fileListUI.querySelectorAll('.file-preview-trigger').forEach(trigger => {
        trigger.addEventListener('click', (event) => {
            selectForPreview(event.currentTarget.closest('li').dataset.id);
        });
    });

    fileListUI.querySelectorAll('.btn-process').forEach(button => {
        button.addEventListener('click', (event) => {
            const fileData = uploadedFiles.find(file => file.id === event.currentTarget.closest('li').dataset.id);
            if (fileData) {
                void runProcessingQueue([fileData], 'single');
            }
        });
    });

    fileListUI.querySelectorAll('.btn-remove').forEach(button => {
        button.addEventListener('click', (event) => {
            removeFile(event.currentTarget.closest('li').dataset.id);
        });
    });

    if (uploadedFiles.length === 0) {
        settingsSection.classList.add('hidden');
        resultsSection.classList.add('hidden');
    }

    updateProcessingSectionState();
}

function updateProcessingSectionState() {
    const hasPendingFiles = uploadedFiles.some(f => f.status === 'pending' || f.status === 'processing');
    const hasVisiblePreview = selectedPreviewId !== null;

    setCollapsibleSectionVisibility(processingSection, hasPendingFiles || isProcessing);
    setCollapsibleSectionVisibility(previewSection, hasVisiblePreview);
}

function removeFile(id) {
    const fileToRemove = uploadedFiles.find(f => f.id === id);
    if (isProcessing) {
        showMessage('info', '请等待当前处理任务结束后再移除文件');
        return;
    }
    if (fileToRemove) {
        revokeFileUrls(fileToRemove);
    }
    uploadedFiles = uploadedFiles.filter(f => f.id !== id);
    animatedPendingFileIds.delete(id);
    animatedResultFileIds.delete(id);
    if (selectedPreviewId === id) {
        clearPreview();
        selectedPreviewId = null;
    }
    renderFileList();
    renderProcessedFileList(); // Also update processed list if item was there
    if (uploadedFiles.length === 0) {
        settingsSection.classList.add('hidden');
        processingSection.classList.add('hidden');
        resultsSection.classList.add('hidden');
        batchDownloadBtn.classList.add('hidden');
    }
}

function selectForPreview(id) {
    const fileData = uploadedFiles.find(f => f.id === id);
    if (fileData) {
        selectedPreviewId = id;
        previewFileName.textContent = fileData.file.name;
        previewOriginalImg.src = fileData.originalURL;
        previewOriginalSize.textContent = `原始大小: ${formatBytes(fileData.originalSize)}`;

        if (fileData.processedURL && fileData.processedSize) {
            showProcessedPreview(fileData);
            previewProcessedSize.textContent = `处理后: ${formatBytes(fileData.processedSize)}`;
            const savings = ((fileData.originalSize - fileData.processedSize) / fileData.originalSize) * 100;
            previewSavings.textContent = savings > 0 ? `节省: ${savings.toFixed(1)}%` : (savings < 0 ? `增大: ${Math.abs(savings).toFixed(1)}%` : '大小不变');
            previewSavings.className = `text-center text-sm font-semibold mt-1 ${savings > 0 ? 'text-green-600' : (savings < 0 ? 'text-red-600' : 'text-gray-600')}`;

        } else {
            renderProcessedPlaceholder(fileData.placeholderPattern);
            previewProcessedSize.textContent = '处理后: -';
            previewSavings.textContent = '';
        }

        updateProcessingSectionState();
    }
}

// 清除结果按钮事件
clearResultsBtn.addEventListener('click', () => {
    uploadedFiles.filter(file => file.status === 'done').forEach(file => {
        revokeFileUrls(file);
        animatedPendingFileIds.delete(file.id);
        animatedResultFileIds.delete(file.id);
    });

    // 清空处理结果列表
    uploadedFiles = uploadedFiles.filter(file => file.status !== 'done');
    processedFileListUI.innerHTML = '';

    // 隐藏结果区域和批量下载按钮
    resultsSection.classList.add('hidden');
    batchDownloadBtn.classList.add('hidden');
    clearResultsBtn.classList.add('hidden');

    // 如果预览区域显示的是已处理文件，也隐藏预览
    if (document.getElementById('previewArea')) {
        clearPreview();
    }

    showMessage('info', '已清除所有处理结果');

    // 如果还有待处理文件，显示处理区域
    if (uploadedFiles.length > 0) {
        processingSection.classList.remove('hidden');
        renderFileList();
    } else {
        // 如果没有任何文件，显示上传区域并确保其可用
        uploadArea.classList.remove('hidden');
        settingsSection.classList.add('hidden');
        processingSection.classList.add('hidden');

        // 重新初始化上传区域的事件监听器
        initializeUploadArea();
    }
});

function clearPreview(restoreFocus = false) {
    const previousPreviewId = selectedPreviewId;
    previewFileName.textContent = '';
    previewOriginalImg.removeAttribute('src');
    previewProcessedImg.removeAttribute('src');
    previewProcessedImg.classList.add('hidden');
    previewProcessedPlaceholder.classList.add('hidden');
    previewOriginalSize.textContent = '';
    previewProcessedSize.textContent = '';
    previewSavings.textContent = '';
    selectedPreviewId = null;
    updateProcessingSectionState();

    if (restoreFocus && previousPreviewId) {
        requestAnimationFrame(() => {
            fileListUI.querySelector(`li[data-id="${previousPreviewId}"] .file-preview-trigger`)?.focus();
        });
    }
}

closePreviewBtn.addEventListener('click', () => clearPreview(true));

// --- Compression Logic ---
qualitySlider.addEventListener('input', (e) => {
    qualityValue.textContent = e.target.value;
});

function animatePendingFileExit(id) {
    const item = fileListUI.querySelector(`li[data-id="${id}"]`);
    if (!item || prefersReducedMotion.matches) {
        return Promise.resolve();
    }

    const itemStyles = getComputedStyle(item);
    item.style.setProperty('--item-height', `${item.offsetHeight}px`);
    item.style.setProperty('--item-gap', itemStyles.marginBottom);
    item.classList.add('list-item-exit');

    return new Promise(resolve => {
        let resolved = false;
        const finish = () => {
            if (resolved) return;
            resolved = true;
            item.removeEventListener('animationend', handleAnimationEnd);
            resolve();
        };
        const handleAnimationEnd = event => {
            if (event.animationName === 'listItemExit') finish();
        };

        item.addEventListener('animationend', handleAnimationEnd);
        setTimeout(finish, 430);
    });
}

function requestProcessingCancellation() {
    processingCancelled = true;
    startProcessingBtn.disabled = true;
    startProcessingBtn.textContent = '正在停止...';
    showMessage('info', '将在当前图片处理完成后停止');
    renderFileList();
}

async function runProcessingQueue(requestedFiles, mode) {
    if (isProcessing) {
        showMessage('info', '已有图片正在处理');
        return;
    }

    const filesToProcess = requestedFiles.filter(file => file.status === 'pending' && uploadedFiles.includes(file));
    if (filesToProcess.length === 0) {
        showMessage('error', '没有待处理的文件');
        return;
    }

    isProcessing = true;
    processingCancelled = false;
    let successCount = 0;
    let failureCount = 0;

    for (let index = 0; index < filesToProcess.length; index++) {
        if (processingCancelled) break;
        const fileObj = filesToProcess[index];
        currentProcessingId = fileObj.id;
        startProcessingBtn.disabled = false;
        startProcessingBtn.textContent = mode === 'all'
            ? `停止全部 (${index + 1}/${filesToProcess.length})`
            : '停止当前处理';
        renderFileList();

        if (await processImage(fileObj)) {
            successCount += 1;
        } else {
            failureCount += 1;
        }
    }

    const wasCancelled = processingCancelled;
    isProcessing = false;
    processingCancelled = false;
    currentProcessingId = null;
    startProcessingBtn.disabled = false;
    startProcessingBtn.textContent = '全部开始处理';
    renderFileList();

    const processedCount = uploadedFiles.filter(f => f.status === 'done').length;
    if (processedCount > 0) {
        batchDownloadBtn.classList.remove('hidden');
    }

    if (wasCancelled) {
        showMessage('info', '已停止处理，剩余文件仍在待处理列表');
    } else if (mode === 'single' && successCount > 0) {
        showMessage('info', `${filesToProcess[0].file.name} 处理完成`);
    } else if (mode === 'all' && failureCount > 0) {
        showMessage('info', `处理结束：${successCount} 个成功，${failureCount} 个失败`);
    } else if (mode === 'all') {
        showMessage('info', '全部文件处理完成');
    }
}

startProcessingBtn.addEventListener('click', () => {
    if (isProcessing) {
        requestProcessingCancellation();
        return;
    }

    void runProcessingQueue(uploadedFiles.filter(file => file.status === 'pending'), 'all');
});

function getCompressorOptions(mode, originalMimeType) {
    let quality = parseFloat(qualitySlider.value);
    let maxWidth = getSafeDimension(maxWidthInput.value);
    let maxHeight = getSafeDimension(maxHeightInput.value);
    let mimeType = outputFormatSelect.value;

    if (mimeType === 'original') {
        // Canvas output cannot reliably encode BMP/GIF, so fall back to JPEG for those inputs.
        if (ORIGINAL_OUTPUT_TYPES.has(originalMimeType)) {
            mimeType = originalMimeType;
        } else {
            mimeType = 'image/jpeg'; // Fallback for BMP or other types
        }
    }

    // For PNG output, quality is often ignored or handled differently (lossless)
    // Compressor.js documentation: "The compression quality for JPEG or WebP images."
    // So, for PNG, we might not need to pass quality, or it won't have an effect.

    const baseOptions = {
        strict: true, // Use original image if compressed one is larger (with exceptions)
        checkOrientation: true, // Read EXIF Orientation
        // convertSize: 5000000, // 5MB, convert to JPEG if PNG is too large (optional)
    };

    switch (mode) {
        case 'custom':
            return { ...baseOptions, quality, maxWidth, maxHeight, mimeType };
        case 'shrink':
            return { ...baseOptions, ...COMPRESSION_PRESETS.shrink };
        case 'normal':
            return { ...baseOptions, ...COMPRESSION_PRESETS.normal };
        case 'clear':
            return { ...baseOptions, ...COMPRESSION_PRESETS.clear };
        default:
            return { ...baseOptions, quality: 0.8, mimeType: 'image/jpeg' };
    }
}

async function resizeWithPica(file, options) {
    // options: { maxWidth, maxHeight }
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            let targetWidth = img.width;
            let targetHeight = img.height;

            if (options.maxWidth || options.maxHeight) {
                const widthScale = options.maxWidth ? options.maxWidth / img.width : 1;
                const heightScale = options.maxHeight ? options.maxHeight / img.height : 1;
                const scale = Math.min(widthScale, heightScale, 1);
                targetWidth = img.width * scale;
                targetHeight = img.height * scale;
            }

            // Ensure dimensions are integers
            targetWidth = Math.round(targetWidth);
            targetHeight = Math.round(targetHeight);

            if (targetWidth <= 0 || targetHeight <= 0) { // Avoid invalid canvas size
                console.warn("Pica resize resulted in zero or negative dimension, using original image.");
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                URL.revokeObjectURL(img.src);
                resolve(canvas);
                return;
            }

            const offScreenCanvas = document.createElement('canvas');
            offScreenCanvas.width = targetWidth;
            offScreenCanvas.height = targetHeight;

            picaInstance.resize(img, offScreenCanvas, {
                // Pica options: alpha (for transparency), unsharpAmount, unsharpRadius, unsharpThreshold
                alpha: true
            })
                .then(result => {
                    URL.revokeObjectURL(img.src);
                    resolve(result);
                })
                .catch(err => {
                    URL.revokeObjectURL(img.src);
                    reject(err);
                });
        };
        img.onerror = () => {
            URL.revokeObjectURL(img.src);
            reject(new Error('图片加载失败'));
        };
        img.src = URL.createObjectURL(file);
    });
}

// --- Results and Download ---
function renderProcessedFileList() {
    processedFileListUI.innerHTML = '';
    const doneFiles = uploadedFiles.filter(f => f.status === 'done' || f.status === 'error');

    if (doneFiles.length === 0 && uploadedFiles.filter(f => f.status !== 'pending' && f.status !== 'processing').length === 0) {
        processedFileListUI.innerHTML = '<p class="text-gray-500 text-sm p-4 text-center">还没有处理完成的文件。</p>';
        batchDownloadBtn.classList.add('hidden');
        clearResultsBtn.classList.add('hidden');
        return;
    }

    if (doneFiles.length === 0 && uploadedFiles.length > 0) {
        processedFileListUI.innerHTML = '<p class="text-gray-500 text-sm p-4 text-center">所有文件正在等待处理或处理中。</p>';
        batchDownloadBtn.classList.add('hidden');
        clearResultsBtn.classList.add('hidden');
        return;
    }

    doneFiles.forEach(f => {
        const li = document.createElement('li');
        li.className = 'file-list-item flex flex-col sm:flex-row items-start sm:items-center justify-between';
        if (!animatedResultFileIds.has(f.id)) {
            li.classList.add('list-item-enter');
            animatedResultFileIds.add(f.id);
        }
        const safeFileName = escapeHtml(f.file.name);

        let resultInfoHtml = '';
        if (f.status === 'done') {
            const savings = ((f.originalSize - f.processedSize) / f.originalSize) * 100;
            const savingsText = savings > 0 ? `节省 ${savings.toFixed(1)}%` : (savings < 0 ? `增大 ${Math.abs(savings).toFixed(1)}%` : '大小不变');
            const savingsColor = savings > 0 ? 'text-green-600' : (savings < 0 ? 'text-red-600' : 'text-gray-600');
            const savingsBgColor = savings > 0 ? 'bg-green-50' : (savings < 0 ? 'bg-red-50' : 'bg-gray-100');
            resultInfoHtml = `
                <div class="flex items-center space-x-2 text-xs mt-1">
                    <span class="text-gray-500 bg-gray-100 px-2 py-0.5 rounded">${formatBytes(f.originalSize)} → ${formatBytes(f.processedSize)}</span>
                    <span class="font-bold ${savingsColor} ${savingsBgColor} px-2 py-0.5 rounded">${savingsText}</span>
                </div>
            `;
        } else { // Error
            resultInfoHtml = `<p class="text-xs text-red-500 mt-1 bg-red-50 px-2 py-0.5 rounded inline-block">错误: ${escapeHtml(f.error || '未知错误')}</p>`;
        }

        li.innerHTML = `
            <div class="flex items-center flex-grow overflow-hidden mb-2 sm:mb-0 w-full sm:w-auto">
                <div class="file-icon ${f.status === 'error' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}">
                    ${f.status === 'error'
                ? '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
                : '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>'
            }
                </div>
                <div class="min-w-0">
                    <p class="text-sm font-semibold text-gray-800 truncate" title="${safeFileName}">${safeFileName}</p>
                    ${resultInfoHtml}
                </div>
            </div>
            <div class="ml-0 sm:ml-4 flex-shrink-0 mt-3 sm:mt-0 space-x-2 w-full sm:w-auto flex justify-end">
                ${f.status === 'done' ? `<button data-id="${f.id}" class="btn-download btn btn-primary btn-sm py-1.5 px-3 text-xs rounded-full">下载</button>` : ''}
                ${f.status === 'error' ? `<button data-id="${f.id}" class="btn-retry-processed btn btn-primary btn-sm py-1.5 px-3 text-xs rounded-full">重试</button>` : ''}
                <button data-id="${f.id}" class="btn-preview-processed btn btn-outline btn-sm py-1.5 px-3 text-xs rounded-full">预览</button>
                <button data-id="${f.id}" class="btn-remove-processed btn btn-danger btn-sm py-1.5 px-3 text-xs rounded-full">移除</button>
            </div>
        `;
        processedFileListUI.appendChild(li);
    });

    document.querySelectorAll('.btn-download').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const fileData = uploadedFiles.find(f => f.id === id);
            if (fileData && fileData.processedBlob) {
                downloadBlob(fileData.processedBlob, fileData.file.name);
            }
        });
    });
    document.querySelectorAll('.btn-preview-processed').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            selectForPreview(id);
        });
    });
    document.querySelectorAll('.btn-retry-processed').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const fileData = uploadedFiles.find(f => f.id === id);
            if (fileData) {
                animatedPendingFileIds.delete(id);
                animatedResultFileIds.delete(id);
                fileData.status = 'pending';
                fileData.error = '';
                fileData.progress = 0;
                renderFileList();
                renderProcessedFileList();
            }
        });
    });
    document.querySelectorAll('.btn-remove-processed').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            removeFile(id);
        });
    });

    if (uploadedFiles.filter(f => f.status === 'done').length > 0) {
        batchDownloadBtn.classList.remove('hidden');
        clearResultsBtn.classList.remove('hidden');
    } else {
        batchDownloadBtn.classList.add('hidden');
        clearResultsBtn.classList.add('hidden');
    }
    if (doneFiles.length === 0 && uploadedFiles.length === 0) {
        resultsSection.classList.add('hidden');
    } else {
        resultsSection.classList.remove('hidden');
    }
}

// --- Compression Mode Handling ---
compressionModeRadios.forEach(radio => {
    radio.addEventListener('change', handleCompressionModeChange);
});

function handleCompressionModeChange() {
    document.querySelectorAll('.settings-panel').forEach(panel => {
        panel.classList.add('hidden');
        panel.classList.remove('panel-active');
    });

    const selectedMode = document.querySelector('input[name="compressionMode"]:checked').value;
    const targetPanel = document.getElementById(`${selectedMode}SettingsPanel`);
    if (targetPanel) {
        targetPanel.classList.remove('hidden');
        setTimeout(() => {
            targetPanel.classList.add('panel-active');
        }, 10);
    }

    updateCompressionSettings();
}

function updateCompressionSettings() {
    const selectedMode = document.querySelector('input[name="compressionMode"]:checked').value;

    // 根据不同模式设置默认参数
    switch (selectedMode) {
        case 'shrink':
            qualitySlider.value = COMPRESSION_PRESETS.shrink.quality;
            qualityValue.textContent = String(COMPRESSION_PRESETS.shrink.quality);
            maxWidthInput.value = String(COMPRESSION_PRESETS.shrink.maxWidth);
            maxHeightInput.value = String(COMPRESSION_PRESETS.shrink.maxHeight);
            outputFormatSelect.value = COMPRESSION_PRESETS.shrink.mimeType;
            break;
        case 'normal':
            qualitySlider.value = COMPRESSION_PRESETS.normal.quality;
            qualityValue.textContent = String(COMPRESSION_PRESETS.normal.quality);
            maxWidthInput.value = String(COMPRESSION_PRESETS.normal.maxWidth);
            maxHeightInput.value = String(COMPRESSION_PRESETS.normal.maxHeight);
            outputFormatSelect.value = COMPRESSION_PRESETS.normal.mimeType;
            break;
        case 'clear':
            qualitySlider.value = COMPRESSION_PRESETS.clear.quality;
            qualityValue.textContent = String(COMPRESSION_PRESETS.clear.quality);
            maxWidthInput.value = '';
            maxHeightInput.value = '';
            outputFormatSelect.value = COMPRESSION_PRESETS.clear.mimeType;
            break;
        case 'custom':
            // 保持用户自定义设置
            break;
    }
}

function downloadBlob(blob, filename) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    // Try to infer extension or add one
    const nameParts = filename.split('.');
    let baseName = filename;
    if (nameParts.length > 1) {
        baseName = nameParts.slice(0, -1).join('.');
    }

    let newExtension = 'jpg'; // Default
    if (blob.type === 'image/png') newExtension = 'png';
    else if (blob.type === 'image/webp') newExtension = 'webp';
    else if (blob.type === 'image/gif') newExtension = 'gif';

    link.download = `${baseName}_processed.${newExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

// 获取文件扩展名的辅助函数
function getFileExtension(filename) {
    const dotIndex = filename.lastIndexOf('.');
    return dotIndex > 0 ? filename.slice(dotIndex + 1).toLowerCase() : '';
}

function getBaseFileName(filename) {
    const dotIndex = filename.lastIndexOf('.');
    return dotIndex > 0 ? filename.slice(0, dotIndex) : filename;
}

// --- Batch Download ---
batchDownloadBtn.addEventListener('click', async () => {
    if (uploadedFiles.filter(f => f.status === 'done').length === 0) {
        showMessage('error', '没有可下载的已处理文件');
        return;
    }

    try {
        showMessage('info', '正在准备ZIP文件...');
        const zip = new JSZip();

        // 添加所有已处理的文件到zip
        uploadedFiles.filter(f => f.status === 'done').forEach(file => {
            // 获取正确的文件扩展名
            let extension = getFileExtension(file.file.name);

            // 如果输出格式不是"original"，则根据输出格式更新扩展名
            if (file.processedBlob && file.processedBlob.type) {
                extension = file.processedBlob.type.split('/')[1];
                // 特殊处理jpeg格式
                if (extension === 'jpeg') extension = 'jpg';
            }

            // 创建不带扩展名的文件名基础部分
            const baseFileName = getBaseFileName(file.file.name);
            // 创建新的文件名，添加"_compressed"后缀和正确的扩展名
            const newFileName = `${baseFileName}_compressed.${extension}`;

            // 将处理后的文件添加到zip中
            zip.file(newFileName, file.processedBlob);
        });

        // 生成zip文件
        const zipBlob = await zip.generateAsync({ type: 'blob' });

        // 创建下载链接
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(zipBlob);
        downloadLink.download = 'compressed_images.zip';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(downloadLink.href);

        showMessage('info', 'ZIP文件已准备好，开始下载');
    } catch (error) {
        console.error('批量下载出错:', error);
        showMessage('error', '创建ZIP文件时出错: ' + error.message);
    }
});

// 在处理图片时保存输出格式信息
async function processImage(fileObj) {
    try {
        fileObj.status = 'processing';
        fileObj.progress = 0;
        renderFileList();

        const mode = document.querySelector('input[name="compressionMode"]:checked').value;
        const options = getCompressorOptions(mode, fileObj.file.type);

        // If mode is 'shrink' and it's not a GIF, use Pica first for resizing
        let fileToCompress = fileObj.file;
        if (mode === 'shrink' && fileObj.file.type !== 'image/gif') {
            if (options.maxWidth || options.maxHeight) {
                fileObj.progress = 10; renderFileList();
                const resizedCanvas = await resizeWithPica(fileObj.file, {
                    maxWidth: options.maxWidth,
                    maxHeight: options.maxHeight
                });
                fileToCompress = await new Promise((resolve, reject) => {
                    resizedCanvas.toBlob(blob => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('图片缩放失败'));
                        }
                    }, fileObj.file.type, options.quality || 0.7);
                });
                fileObj.progress = 40; renderFileList();
            }
        }

        // Compressor.js doesn't have a direct progress callback for the compression itself.
        // We can simulate some progress.
        // If Pica was used, progress is already at 40. Otherwise, start from 10.
        fileObj.progress = fileObj.progress > 0 ? fileObj.progress : 10;
        renderFileList();

        const compressedBlob = await new Promise((resolve, reject) => {
            new Compressor(fileToCompress, {
                ...options,
                success: resolve,
                error: reject,
            });
        });

        fileObj.progress = 90; renderFileList();

        fileObj.processedBlob = compressedBlob;
        fileObj.processedURL = URL.createObjectURL(compressedBlob);
        fileObj.processedSize = compressedBlob.size;
        fileObj.progress = 100;

        // 保存输出格式信息
        fileObj.outputFormat = options.mimeType || fileObj.file.type;

        renderFileList();
        await animatePendingFileExit(fileObj.id);
        fileObj.status = 'done';
        renderFileList();
        renderProcessedFileList();
        if (selectedPreviewId === fileObj.id) {
            selectForPreview(fileObj.id);
        }
        return true;
    } catch (error) {
        console.error("处理图片出错:", error);
        fileObj.error = error.message || '处理失败';
        showMessage('error', `${fileObj.file.name}: ${fileObj.error}`);
        await animatePendingFileExit(fileObj.id);
        fileObj.status = 'error';
        renderFileList();
        renderProcessedFileList();
        return false;
    }
}

// 将上传区域的初始化逻辑封装为函数，以便可以重复调用
function initializeUploadArea() {
    // 移除可能存在的旧事件监听器
    uploadArea.removeEventListener('click', handleUploadAreaClick);
    uploadArea.removeEventListener('dragover', handleDragOver);
    uploadArea.removeEventListener('dragleave', handleDragLeave);
    uploadArea.removeEventListener('drop', handleDrop);
    fileInput.removeEventListener('change', handleFileInputChange);

    // 添加新的事件监听器
    uploadArea.addEventListener('click', handleUploadAreaClick);
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileInputChange);
}

// 上传区域点击事件处理函数
function handleUploadAreaClick() {
    fileInput.click();
}

// 拖拽相关事件处理函数
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('dragover');

    if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
    }
}

// 文件输入变化事件处理函数
function handleFileInputChange() {
    if (fileInput.files.length > 0) {
        handleFiles(fileInput.files);
        fileInput.value = '';
    }
}

// --- File Upload ---
// 替换原有的事件绑定代码
initializeUploadArea();
themeToggleBtn.addEventListener('click', toggleTheme);

// --- Initialize ---
document.addEventListener('DOMContentLoaded', function () {
    // 初始化上传区域
    initializeUploadArea();
    updateThemeToggleState();

    // 默认选中自定义压缩并显示对应面板
    document.getElementById('modeCustom').checked = true;
    document.getElementById('customSettingsPanel').classList.remove('hidden');
    setTimeout(() => {
        document.getElementById('customSettingsPanel').classList.add('panel-active');
    }, 10);

    // 初始化年份
    document.getElementById('currentYear').textContent = new Date().getFullYear();
});
