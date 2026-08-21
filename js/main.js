// --- DOM Elements ---
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const languageToggleBtn = document.getElementById('languageToggleBtn');
const languageToggleText = document.getElementById('languageToggleText');
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
let currentProcessingMode = null;
let currentProcessingPosition = 0;
let currentProcessingTotal = 0;
let currentLanguage = document.documentElement.dataset.language === 'zh' ? 'zh' : 'en';
const animatedPendingFileIds = new Set();
const animatedResultFileIds = new Set();
const sectionHideTimers = new WeakMap();
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let picaInstance = null;
const MAX_DIMENSION = 20000;
const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp']);
const ORIGINAL_OUTPUT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const COMPRESSION_PRESETS = {
    shrink: { quality: 0.6, maxWidth: 1280, maxHeight: 720, mimeType: 'image/jpeg' },
    normal: { quality: 0.75, maxWidth: 1920, maxHeight: 1080, mimeType: 'image/jpeg' },
    clear: { quality: 0.9, mimeType: 'image/webp' }
};
const THEME_STORAGE_KEY = 'convertPictureTheme';
const LANGUAGE_STORAGE_KEY = 'convertPictureLanguage';
const SITE_ORIGIN = 'https://convert-picture.hxdridiculous.workers.dev';
const DEPENDENCIES = {
    compressor: {
        src: 'https://cdnjs.cloudflare.com/ajax/libs/compressorjs/1.2.1/compressor.min.js',
        global: 'Compressor'
    },
    pica: {
        src: 'https://cdnjs.cloudflare.com/ajax/libs/pica/9.0.1/pica.min.js',
        global: 'pica'
    },
    jszip: {
        src: 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
        global: 'JSZip'
    }
};
const dependencyLoadPromises = new Map();
const TRANSLATIONS = {
    en: {
        'app.title': 'Free Online Image Compressor & Converter | JPG, PNG, WebP',
        'app.heading': 'Free Online Image Compressor & Converter',
        'app.subtitle': 'Compress and convert images with a simple, fast, free and efficient tool that works privately in your browser.',
        'seo.description': 'Compress and convert JPG, PNG, GIF, BMP and WebP images with a simple, fast, free and efficient browser tool. Resize, preview and batch download privately.',
        'seo.keywords': 'image compressor, image converter, compress images, convert images, simple image tool, fast image compression, free image converter, efficient image compression',
        'seo.siteName': 'Image Compressor & Converter',
        'seo.socialTitle': 'Free Online Image Compressor & Converter',
        'seo.socialDescription': 'Compress and convert images simply, quickly and privately. Free JPG, PNG and WebP processing in your browser.',
        'seo.socialImageAlt': 'Free online image compressor and converter',
        'theme.switchToLight': 'Switch to light theme',
        'theme.switchToDark': 'Switch to dark theme',
        'language.switchToChinese': 'Switch to Chinese',
        'language.switchToEnglish': 'Switch to English',
        'language.currentEnglish': 'EN - Switch to Chinese',
        'language.currentChinese': 'Chinese - Switch to English',
        'upload.drop': 'Drop images here, or',
        'upload.choose': 'choose files',
        'upload.formats': 'Supports JPG, PNG, GIF, BMP and WebP',
        'upload.gifNote': 'Animated GIFs are processed using the first frame only.',
        'settings.title': 'Compression Settings',
        'settings.modeLegend': 'Compression mode',
        'settings.customParams': 'Custom parameters',
        'settings.quality': 'Image quality',
        'settings.qualityHint': 'Lower values produce smaller files.',
        'settings.maxSize': 'Maximum size (px)',
        'settings.width': 'Width',
        'settings.height': 'Height',
        'settings.maxWidthAria': 'Maximum width',
        'settings.maxHeightAria': 'Maximum height',
        'settings.sizeHint': 'Leave blank to keep the original size.',
        'settings.outputFormat': 'Output format',
        'settings.keepOriginal': 'Keep original format',
        'settings.gifOutput': 'GIF files are exported as static images.',
        'modes.custom': 'Custom',
        'modes.shrink': 'Smaller Size',
        'modes.normal': 'Balanced',
        'modes.clear': 'High Quality',
        'presets.shrinkDescription': 'Best for web images and faster loading.',
        'presets.normalDescription': 'Balances image quality and file size.',
        'presets.clearDescription': 'Best for display images that need to retain detail.',
        'metrics.quality': 'Quality',
        'metrics.maxSize': 'Maximum size',
        'metrics.format': 'Format',
        'metrics.size': 'Size',
        'metrics.keepOriginal': 'Keep original',
        'processing.title': 'Pending Files',
        'processing.startAll': 'Process All',
        'processing.progress': 'Processing progress: {progress}%',
        'processing.previewFile': 'Preview {file}',
        'processing.startFile': 'Process {file}',
        'processing.processing': 'Processing',
        'processing.start': 'Process',
        'processing.removeFile': 'Remove {file}',
        'processing.remove': 'Remove',
        'processing.waitBeforeRemove': 'Wait for the current task to finish before removing files.',
        'processing.stopping': 'Stopping...',
        'processing.stopAfterCurrent': 'Processing will stop after the current image finishes.',
        'processing.alreadyRunning': 'An image is already being processed.',
        'processing.nonePending': 'There are no pending files.',
        'processing.stopAll': 'Stop All ({current}/{total})',
        'processing.stopCurrent': 'Stop Current',
        'processing.stopped': 'Processing stopped. Remaining files are still pending.',
        'processing.singleDone': '{file} processed successfully.',
        'processing.finishedWithErrors': 'Finished: {success} succeeded, {failure} failed.',
        'processing.allDone': 'All files have been processed.',
        'preview.title': 'Image Preview:',
        'preview.close': 'Close preview',
        'preview.before': 'Before',
        'preview.after': 'After',
        'preview.originalAlt': 'Original image',
        'preview.processedAlt': 'Processed image',
        'preview.waiting': 'Waiting',
        'preview.waitingAria': 'Image waiting to be processed',
        'preview.unavailable': 'Preview unavailable',
        'preview.loadFailed': 'After: preview failed to load',
        'preview.originalSize': 'Original: {size}',
        'preview.processedSize': 'After: {size}',
        'preview.pendingSize': 'After: -',
        'preview.savings': 'Saved: {value}%',
        'preview.increase': 'Increased: {value}%',
        'preview.unchanged': 'Size unchanged',
        'results.title': 'Results',
        'results.clear': 'Clear Results',
        'results.batchDownload': 'Download All (.zip)',
        'results.empty': 'No files have been processed yet.',
        'results.waiting': 'All files are pending or being processed.',
        'results.savings': 'Saved {value}%',
        'results.increase': 'Increased {value}%',
        'results.unchanged': 'Size unchanged',
        'results.error': 'Error: {message}',
        'results.unknownError': 'Unknown error',
        'results.download': 'Download',
        'results.retry': 'Retry',
        'results.preview': 'Preview',
        'results.remove': 'Remove',
        'messages.skippedUnsupported': 'Skipped {count} unsupported file(s).',
        'messages.resultsCleared': 'All results have been cleared.',
        'errors.imageLoad': 'Unable to load the image.',
        'errors.resize': 'Unable to resize the image.',
        'errors.processing': 'Unable to process the image.',
        'errors.dependency': 'A required processing library could not be loaded.',
        'zip.none': 'There are no processed files to download.',
        'zip.preparing': 'Preparing the ZIP file...',
        'zip.ready': 'The ZIP file is ready. Download started.',
        'zip.error': 'Unable to create the ZIP file.',
        'footer.product': 'Free Image Compressor & Converter',
        'footer.languages': 'Language versions'
    },
    zh: {
        'app.title': '免费在线图片压缩与转换工具 | JPG、PNG、WebP',
        'app.heading': '免费在线图片压缩与转换工具',
        'app.subtitle': '简单、快速、高效地压缩和转换图片，完全免费，并在浏览器本地保护您的隐私。',
        'seo.description': '免费压缩和转换 JPG、PNG、GIF、BMP 与 WebP 图片。简单、快速、高效地调整尺寸、实时预览和批量下载，图片仅在浏览器本地处理。',
        'seo.keywords': '压缩图片, 转换图片, 简单图片工具, 快速图片压缩, 免费图片转换, 高效图片压缩, 在线图片压缩, 图片格式转换',
        'seo.siteName': '图片压缩与转换工具',
        'seo.socialTitle': '免费在线图片压缩与转换工具',
        'seo.socialDescription': '简单、快速、高效地压缩和转换图片。免费处理 JPG、PNG 和 WebP，图片无需上传服务器。',
        'seo.socialImageAlt': '免费在线图片压缩与转换工具',
        'theme.switchToLight': '切换到亮色主题',
        'theme.switchToDark': '切换到暗色主题',
        'language.switchToChinese': '切换为中文',
        'language.switchToEnglish': '切换为英文',
        'language.currentEnglish': '英文 - 切换为中文',
        'language.currentChinese': '中 - 切换为英文',
        'upload.drop': '将图片拖拽至此，或',
        'upload.choose': '点击选择文件',
        'upload.formats': '支持 JPG、PNG、GIF、BMP 和 WebP 格式',
        'upload.gifNote': '动画 GIF 将仅处理第一帧。',
        'settings.title': '压缩设置',
        'settings.modeLegend': '压缩模式',
        'settings.customParams': '自定义参数',
        'settings.quality': '图片质量',
        'settings.qualityHint': '数值越小，图片体积越小。',
        'settings.maxSize': '最大尺寸 (px)',
        'settings.width': '宽',
        'settings.height': '高',
        'settings.maxWidthAria': '最大宽度',
        'settings.maxHeightAria': '最大高度',
        'settings.sizeHint': '留空则保持原始尺寸。',
        'settings.outputFormat': '输出格式',
        'settings.keepOriginal': '保持原格式',
        'settings.gifOutput': 'GIF 将输出为静态图片。',
        'modes.custom': '自定义',
        'modes.shrink': '缩小优先',
        'modes.normal': '普通压缩',
        'modes.clear': '清晰优先',
        'presets.shrinkDescription': '适合网页图片和快速加载场景。',
        'presets.normalDescription': '兼顾图片质量与文件体积。',
        'presets.clearDescription': '适合需要保留细节的展示图片。',
        'metrics.quality': '质量',
        'metrics.maxSize': '最大尺寸',
        'metrics.format': '格式',
        'metrics.size': '尺寸',
        'metrics.keepOriginal': '保持原尺寸',
        'processing.title': '待处理文件',
        'processing.startAll': '全部开始处理',
        'processing.progress': '处理进度：{progress}%',
        'processing.previewFile': '预览 {file}',
        'processing.startFile': '开始处理 {file}',
        'processing.processing': '处理中',
        'processing.start': '开始处理',
        'processing.removeFile': '移除 {file}',
        'processing.remove': '移除',
        'processing.waitBeforeRemove': '请等待当前处理任务结束后再移除文件。',
        'processing.stopping': '正在停止...',
        'processing.stopAfterCurrent': '将在当前图片处理完成后停止。',
        'processing.alreadyRunning': '已有图片正在处理。',
        'processing.nonePending': '没有待处理的文件。',
        'processing.stopAll': '停止全部 ({current}/{total})',
        'processing.stopCurrent': '停止当前处理',
        'processing.stopped': '已停止处理，剩余文件仍在待处理列表。',
        'processing.singleDone': '{file} 处理完成。',
        'processing.finishedWithErrors': '处理结束：{success} 个成功，{failure} 个失败。',
        'processing.allDone': '全部文件处理完成。',
        'preview.title': '图片预览：',
        'preview.close': '关闭预览',
        'preview.before': '处理前',
        'preview.after': '处理后',
        'preview.originalAlt': '处理前图片',
        'preview.processedAlt': '处理后图片',
        'preview.waiting': '等待处理',
        'preview.waitingAria': '图片等待处理',
        'preview.unavailable': '预览不可用',
        'preview.loadFailed': '处理后：预览加载失败',
        'preview.originalSize': '原始大小：{size}',
        'preview.processedSize': '处理后：{size}',
        'preview.pendingSize': '处理后：-',
        'preview.savings': '节省：{value}%',
        'preview.increase': '增大：{value}%',
        'preview.unchanged': '大小不变',
        'results.title': '处理结果',
        'results.clear': '清除结果',
        'results.batchDownload': '批量下载 (.zip)',
        'results.empty': '还没有处理完成的文件。',
        'results.waiting': '所有文件正在等待处理或处理中。',
        'results.savings': '节省 {value}%',
        'results.increase': '增大 {value}%',
        'results.unchanged': '大小不变',
        'results.error': '错误：{message}',
        'results.unknownError': '未知错误',
        'results.download': '下载',
        'results.retry': '重试',
        'results.preview': '预览',
        'results.remove': '移除',
        'messages.skippedUnsupported': '已跳过 {count} 个不支持的文件。',
        'messages.resultsCleared': '已清除所有处理结果。',
        'errors.imageLoad': '图片加载失败。',
        'errors.resize': '图片缩放失败。',
        'errors.processing': '图片处理失败。',
        'errors.dependency': '无法加载图片处理所需的组件。',
        'zip.none': '没有可下载的已处理文件。',
        'zip.preparing': '正在准备 ZIP 文件...',
        'zip.ready': 'ZIP 文件已准备好，开始下载。',
        'zip.error': '创建 ZIP 文件失败。',
        'footer.product': '免费图片压缩与转换工具',
        'footer.languages': '语言版本'
    }
};
const SEO_CONFIG = {
    en: {
        path: '/',
        locale: 'en_US',
        alternateLocale: 'zh_CN',
        language: 'en',
        image: '/assets/og-image.png',
        name: 'Free Online Image Compressor & Converter',
        description: 'A simple, fast, free and efficient browser tool for compressing and converting images.',
        currency: 'USD',
        features: [
            'Compress JPG, PNG, GIF, BMP and WebP images',
            'Convert images to JPG, PNG and WebP',
            'Resize and preview images in the browser',
            'Batch process and download images privately'
        ]
    },
    zh: {
        path: '/zh-CN/',
        locale: 'zh_CN',
        alternateLocale: 'en_US',
        language: 'zh-CN',
        image: '/assets/og-image-zh-CN.png',
        name: '免费在线图片压缩与转换工具',
        description: '简单、快速、免费且高效的浏览器图片压缩与转换工具。',
        currency: 'CNY',
        features: [
            '压缩 JPG、PNG、GIF、BMP 和 WebP 图片',
            '将图片转换为 JPG、PNG 和 WebP',
            '在浏览器中调整尺寸并实时预览',
            '本地批量处理并下载图片'
        ]
    }
};
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
function t(key, params = {}) {
    const template = TRANSLATIONS[currentLanguage][key] ?? TRANSLATIONS.en[key] ?? key;
    return template.replace(/\{(\w+)\}/g, (match, name) => params[name] ?? match);
}

function createTranslatedError(key) {
    const error = new Error(key);
    error.translationKey = key;
    return error;
}

function loadDependency(name) {
    const dependency = DEPENDENCIES[name];
    if (!dependency) {
        return Promise.reject(createTranslatedError('errors.dependency'));
    }

    if (window[dependency.global]) {
        return Promise.resolve(window[dependency.global]);
    }

    if (dependencyLoadPromises.has(name)) {
        return dependencyLoadPromises.get(name);
    }

    const loadPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = dependency.src;
        script.async = true;
        script.dataset.dependency = name;
        script.onload = () => {
            if (window[dependency.global]) {
                resolve(window[dependency.global]);
            } else {
                reject(createTranslatedError('errors.dependency'));
            }
        };
        script.onerror = () => reject(createTranslatedError('errors.dependency'));
        document.head.appendChild(script);
    }).catch(error => {
        dependencyLoadPromises.delete(name);
        throw error;
    });

    dependencyLoadPromises.set(name, loadPromise);
    return loadPromise;
}

function getLanguageFromPath() {
    return /^\/zh-CN(?:\/|$)/i.test(window.location.pathname) ? 'zh' : 'en';
}

function syncLanguageUrl(language, historyMode = 'push') {
    const targetPath = SEO_CONFIG[language].path;
    if (window.location.pathname === targetPath) return;

    const targetUrl = new URL(targetPath, window.location.origin);
    targetUrl.search = window.location.search;
    targetUrl.hash = window.location.hash;
    window.history[`${historyMode}State`]({ language }, '', targetUrl);
}

function updateSeoMetadata() {
    const config = SEO_CONFIG[currentLanguage];
    const canonicalUrl = `${SITE_ORIGIN}${config.path}`;
    const canonicalLink = document.getElementById('canonicalLink');
    const ogUrl = document.getElementById('ogUrl');
    const ogLocale = document.getElementById('ogLocale');
    const ogLocaleAlternate = document.getElementById('ogLocaleAlternate');
    const ogImage = document.getElementById('ogImage');
    const twitterImage = document.getElementById('twitterImage');
    const structuredData = document.getElementById('structuredData');
    const socialImageUrl = `${SITE_ORIGIN}${config.image}`;

    canonicalLink.href = canonicalUrl;
    ogUrl.content = canonicalUrl;
    ogLocale.content = config.locale;
    ogLocaleAlternate.content = config.alternateLocale;
    ogImage.content = socialImageUrl;
    twitterImage.content = socialImageUrl;
    structuredData.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: config.name,
        url: canonicalUrl,
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Any',
        browserRequirements: 'Requires JavaScript and HTML5 Canvas support.',
        description: config.description,
        featureList: config.features,
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: config.currency
        },
        inLanguage: config.language
    });
}

function applyStaticTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        element.textContent = t(element.dataset.i18n);
    });

    const translatedAttributes = {
        'data-i18n-aria-label': 'aria-label',
        'data-i18n-title': 'title',
        'data-i18n-placeholder': 'placeholder',
        'data-i18n-alt': 'alt',
        'data-i18n-content': 'content'
    };

    Object.entries(translatedAttributes).forEach(([dataAttribute, targetAttribute]) => {
        document.querySelectorAll(`[${dataAttribute}]`).forEach(element => {
            element.setAttribute(targetAttribute, t(element.getAttribute(dataAttribute)));
        });
    });
}

function updateLanguageToggleState() {
    const isChinese = currentLanguage === 'zh';
    const actionLabel = isChinese ? t('language.switchToEnglish') : t('language.switchToChinese');
    const accessibleLabel = isChinese ? t('language.currentChinese') : t('language.currentEnglish');
    languageToggleText.textContent = isChinese ? '中' : 'EN';
    languageToggleBtn.setAttribute('aria-label', accessibleLabel);
    languageToggleBtn.setAttribute('aria-pressed', String(isChinese));
    languageToggleBtn.title = actionLabel;
    document.querySelectorAll('[data-language-link]').forEach(link => {
        const isCurrentLanguage = link.dataset.languageLink === currentLanguage;
        if (isCurrentLanguage) {
            link.setAttribute('aria-current', 'page');
        } else {
            link.removeAttribute('aria-current');
        }
    });
}

function setLanguage(language, persist = false) {
    const nextLanguage = language === 'zh' ? 'zh' : 'en';
    const languageChanged = currentLanguage !== nextLanguage;
    currentLanguage = nextLanguage;
    document.documentElement.dataset.language = nextLanguage;
    document.documentElement.lang = nextLanguage === 'zh' ? 'zh-CN' : 'en';

    applyStaticTranslations();
    updateSeoMetadata();
    updateLanguageToggleState();
    updateThemeToggleState();
    updateProcessingButtonState();
    renderFileList();
    renderProcessedFileList();

    if (selectedPreviewId) {
        selectForPreview(selectedPreviewId);
    }

    if (languageChanged) {
        messageArea.replaceChildren();
    }

    if (persist) {
        try {
            localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
        } catch (error) {
            console.warn('Unable to save language preference:', error);
        }
    }
}

function toggleLanguage() {
    const nextLanguage = currentLanguage === 'en' ? 'zh' : 'en';
    syncLanguageUrl(nextLanguage);
    setLanguage(nextLanguage, true);
}

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

function renderProcessedPlaceholder(patternIndex, label = t('preview.waiting'), isError = false) {
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
        renderProcessedPlaceholder(fileData.placeholderPattern, t('preview.unavailable'), true);
        previewProcessedSize.textContent = t('preview.loadFailed');
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
    const label = isDarkTheme ? t('theme.switchToLight') : t('theme.switchToDark');
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
    messageDiv.className = `message-toast p-3 rounded-md text-sm ${type === 'error' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`;
    messageDiv.textContent = text;
    messageArea.appendChild(messageDiv);
    setTimeout(() => {
        if (!messageDiv.isConnected) return;
        messageDiv.classList.add('is-leaving');
        messageDiv.addEventListener('animationend', () => messageDiv.remove(), { once: true });
        setTimeout(() => messageDiv.remove(), 300);
    }, 1700);
}

// --- File Handling ---
// 事件监听器现在通过initializeUploadArea函数添加

function handleFiles(files) {
    if (files.length === 0) return;
    const validFiles = Array.from(files).filter(isSupportedImage);
    const skippedCount = files.length - validFiles.length;

    if (skippedCount > 0) {
        showMessage('error', t('messages.skippedUnsupported', { count: skippedCount }));
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
        const previewFileLabel = escapeHtml(t('processing.previewFile', { file: f.file.name }));
        const startFileLabel = escapeHtml(t('processing.startFile', { file: f.file.name }));
        const removeFileLabel = escapeHtml(t('processing.removeFile', { file: f.file.name }));
        const progress = Math.max(0, Math.min(100, Number(f.progress) || 0));
        const isCurrentFile = f.status === 'processing' && currentProcessingId === f.id;
        const disableRowActions = isProcessing ? 'disabled' : '';

        const stateHtml = f.status === 'processing'
            ? `<div class="file-progress" aria-label="${escapeHtml(t('processing.progress', { progress }))}">
                    <div class="progress-bar-container"><div class="progress-bar" style="width: ${progress}%"></div></div>
                    <span>${progress}%</span>
                </div>`
            : '';

        li.innerHTML = `
            <button type="button" class="file-preview-trigger" aria-label="${previewFileLabel}" title="${previewFileLabel}">
                <span class="file-thumbnail-wrap"><img class="file-thumbnail" alt=""></span>
                <span class="min-w-0">
                    <span class="file-name block text-sm font-semibold text-gray-800 truncate">${safeFileName}</span>
                    <span class="block text-xs text-gray-500 mt-0.5">${formatBytes(f.originalSize)}</span>
                </span>
            </button>
            ${stateHtml}
            <div class="file-row-actions">
                <button type="button" class="btn-process btn btn-primary btn-row" ${disableRowActions}
                    aria-label="${startFileLabel}">${isCurrentFile ? t('processing.processing') : t('processing.start')}</button>
                <button type="button" class="btn-remove btn btn-danger btn-row" ${disableRowActions}
                    aria-label="${removeFileLabel}">${t('processing.remove')}</button>
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
        showMessage('info', t('processing.waitBeforeRemove'));
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
        previewOriginalSize.textContent = t('preview.originalSize', { size: formatBytes(fileData.originalSize) });

        if (fileData.processedURL && fileData.processedSize) {
            showProcessedPreview(fileData);
            previewProcessedSize.textContent = t('preview.processedSize', { size: formatBytes(fileData.processedSize) });
            const savings = ((fileData.originalSize - fileData.processedSize) / fileData.originalSize) * 100;
            previewSavings.textContent = savings > 0
                ? t('preview.savings', { value: savings.toFixed(1) })
                : (savings < 0
                    ? t('preview.increase', { value: Math.abs(savings).toFixed(1) })
                    : t('preview.unchanged'));
            previewSavings.className = `text-center text-sm font-semibold mt-1 ${savings > 0 ? 'text-green-600' : (savings < 0 ? 'text-red-600' : 'text-gray-600')}`;

        } else {
            renderProcessedPlaceholder(fileData.placeholderPattern);
            previewProcessedSize.textContent = t('preview.pendingSize');
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

    showMessage('info', t('messages.resultsCleared'));

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

function updateProcessingButtonState() {
    if (processingCancelled) {
        startProcessingBtn.textContent = t('processing.stopping');
        return;
    }

    if (isProcessing) {
        startProcessingBtn.textContent = currentProcessingMode === 'all'
            ? t('processing.stopAll', {
                current: currentProcessingPosition,
                total: currentProcessingTotal
            })
            : t('processing.stopCurrent');
        return;
    }

    startProcessingBtn.textContent = t('processing.startAll');
}

function requestProcessingCancellation() {
    processingCancelled = true;
    startProcessingBtn.disabled = true;
    updateProcessingButtonState();
    showMessage('info', t('processing.stopAfterCurrent'));
    renderFileList();
}

async function runProcessingQueue(requestedFiles, mode) {
    if (isProcessing) {
        showMessage('info', t('processing.alreadyRunning'));
        return;
    }

    const filesToProcess = requestedFiles.filter(file => file.status === 'pending' && uploadedFiles.includes(file));
    if (filesToProcess.length === 0) {
        showMessage('error', t('processing.nonePending'));
        return;
    }

    isProcessing = true;
    processingCancelled = false;
    currentProcessingMode = mode;
    currentProcessingPosition = 0;
    currentProcessingTotal = filesToProcess.length;
    let successCount = 0;
    let failureCount = 0;

    for (let index = 0; index < filesToProcess.length; index++) {
        if (processingCancelled) break;
        const fileObj = filesToProcess[index];
        currentProcessingId = fileObj.id;
        currentProcessingPosition = index + 1;
        startProcessingBtn.disabled = false;
        updateProcessingButtonState();
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
    currentProcessingMode = null;
    currentProcessingPosition = 0;
    currentProcessingTotal = 0;
    startProcessingBtn.disabled = false;
    updateProcessingButtonState();
    renderFileList();

    const processedCount = uploadedFiles.filter(f => f.status === 'done').length;
    if (processedCount > 0) {
        batchDownloadBtn.classList.remove('hidden');
    }

    if (wasCancelled) {
        showMessage('info', t('processing.stopped'));
    } else if (mode === 'single' && successCount > 0) {
        showMessage('info', t('processing.singleDone', { file: filesToProcess[0].file.name }));
    } else if (mode === 'all' && failureCount > 0) {
        showMessage('info', t('processing.finishedWithErrors', {
            success: successCount,
            failure: failureCount
        }));
    } else if (mode === 'all') {
        showMessage('info', t('processing.allDone'));
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
    if (!picaInstance) {
        await loadDependency('pica');
        picaInstance = window.pica();
    }

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
            reject(createTranslatedError('errors.imageLoad'));
        };
        img.src = URL.createObjectURL(file);
    });
}

// --- Results and Download ---
function renderProcessedFileList() {
    processedFileListUI.innerHTML = '';
    const doneFiles = uploadedFiles.filter(f => f.status === 'done' || f.status === 'error');

    if (doneFiles.length === 0 && uploadedFiles.filter(f => f.status !== 'pending' && f.status !== 'processing').length === 0) {
        processedFileListUI.innerHTML = `<p class="text-gray-500 text-sm p-4 text-center">${t('results.empty')}</p>`;
        batchDownloadBtn.classList.add('hidden');
        clearResultsBtn.classList.add('hidden');
        return;
    }

    if (doneFiles.length === 0 && uploadedFiles.length > 0) {
        processedFileListUI.innerHTML = `<p class="text-gray-500 text-sm p-4 text-center">${t('results.waiting')}</p>`;
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
            const savingsText = savings > 0
                ? t('results.savings', { value: savings.toFixed(1) })
                : (savings < 0
                    ? t('results.increase', { value: Math.abs(savings).toFixed(1) })
                    : t('results.unchanged'));
            const savingsColor = savings > 0 ? 'text-green-600' : (savings < 0 ? 'text-red-600' : 'text-gray-600');
            const savingsBgColor = savings > 0 ? 'bg-green-50' : (savings < 0 ? 'bg-red-50' : 'bg-gray-100');
            resultInfoHtml = `
                <div class="flex items-center space-x-2 text-xs mt-1">
                    <span class="text-gray-500 bg-gray-100 px-2 py-0.5 rounded">${formatBytes(f.originalSize)} → ${formatBytes(f.processedSize)}</span>
                    <span class="font-bold ${savingsColor} ${savingsBgColor} px-2 py-0.5 rounded">${savingsText}</span>
                </div>
            `;
        } else { // Error
            const errorMessage = f.errorKey ? t(f.errorKey) : t('results.unknownError');
            resultInfoHtml = `<p class="text-xs text-red-500 mt-1 bg-red-50 px-2 py-0.5 rounded inline-block">${escapeHtml(t('results.error', { message: errorMessage }))}</p>`;
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
                ${f.status === 'done' ? `<button data-id="${f.id}" class="btn-download btn btn-primary btn-sm py-1.5 px-3 text-xs rounded-full">${t('results.download')}</button>` : ''}
                ${f.status === 'error' ? `<button data-id="${f.id}" class="btn-retry-processed btn btn-primary btn-sm py-1.5 px-3 text-xs rounded-full">${t('results.retry')}</button>` : ''}
                <button data-id="${f.id}" class="btn-preview-processed btn btn-outline btn-sm py-1.5 px-3 text-xs rounded-full">${t('results.preview')}</button>
                <button data-id="${f.id}" class="btn-remove-processed btn btn-danger btn-sm py-1.5 px-3 text-xs rounded-full">${t('results.remove')}</button>
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
                fileData.errorKey = '';
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
        showMessage('error', t('zip.none'));
        return;
    }

    try {
        showMessage('info', t('zip.preparing'));
        await loadDependency('jszip');
        const zip = new window.JSZip();

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

        showMessage('info', t('zip.ready'));
    } catch (error) {
        console.error('Batch download failed:', error);
        showMessage('error', t('zip.error'));
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
        await loadDependency('compressor');

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
                            reject(createTranslatedError('errors.resize'));
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
            new window.Compressor(fileToCompress, {
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
        console.error('Image processing failed:', error);
        fileObj.errorKey = error.translationKey || 'errors.processing';
        fileObj.error = error.message || fileObj.errorKey;
        showMessage('error', `${fileObj.file.name}: ${t(fileObj.errorKey)}`);
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
languageToggleBtn.addEventListener('click', toggleLanguage);
themeToggleBtn.addEventListener('click', toggleTheme);
document.querySelectorAll('[data-language-link]').forEach(link => {
    link.addEventListener('click', event => {
        event.preventDefault();
        const nextLanguage = link.dataset.languageLink === 'zh' ? 'zh' : 'en';
        syncLanguageUrl(nextLanguage);
        setLanguage(nextLanguage, true);
    });
});
window.addEventListener('popstate', () => {
    setLanguage(getLanguageFromPath(), true);
});

// --- Initialize ---
document.addEventListener('DOMContentLoaded', function () {
    // 初始化上传区域
    initializeUploadArea();
    if (getLanguageFromPath() !== currentLanguage) {
        syncLanguageUrl(currentLanguage, 'replace');
    }
    setLanguage(currentLanguage, true);

    // 默认选中自定义压缩并显示对应面板
    document.getElementById('modeCustom').checked = true;
    document.getElementById('customSettingsPanel').classList.remove('hidden');
    setTimeout(() => {
        document.getElementById('customSettingsPanel').classList.add('panel-active');
    }, 10);

    // 初始化年份
    document.getElementById('currentYear').textContent = new Date().getFullYear();
});
