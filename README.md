# Image Converter

[English](README.md) | [简体中文](README.zh-CN.md)

A simple online image conversion and compression tool. Images are processed entirely in your browser and are never uploaded to a server.

## Features

- Supports JPG, PNG, GIF, BMP, and WebP images
- Converts images between multiple formats
- Resizes images using configurable maximum width and height
- Compresses images with adjustable quality
- Previews before-and-after images and displays file-size savings
- Processes multiple files and downloads results as a ZIP archive
- Keeps image data private by processing everything locally

## Preset Modes

The tool provides three presets for different use cases:

1. **Smaller Size**: Best for web images that need to load quickly
   - Image quality: 0.6 (medium compression)
   - Maximum size: 1280 x 720 pixels
   - Output format: JPG

2. **Balanced**: Suitable for most use cases
   - Image quality: 0.75 (good quality)
   - Maximum size: 1920 x 1080 pixels
   - Output format: JPG

3. **High Quality**: Best for images that need to retain more detail
   - Image quality: 0.9 (high quality)
   - Keeps the original dimensions
   - Output format: WebP (for better compression)

## Custom Settings

In addition to the presets, you can configure:

- Image quality (0.1-1.0)
- Maximum width and height
- Output format (JPG, PNG, WebP, or the original format)

## Usage

1. Click the upload area or drag images onto it.
2. Select a compression mode or configure custom settings.
3. Process an individual image or click **Process All**.
4. Download processed images individually or as a ZIP archive.

## Implementation

- Client-side implementation using HTML5, CSS3, and JavaScript
- Canvas API and Pica for image resizing
- Compressor.js for image compression
- JSZip for batch downloads
- Responsive layout for desktop and mobile devices

## Browser Support

All modern browsers are supported, including:

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+
