let processingImages = new Set();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getImageInfo') {
    const img = document.querySelector(`img[src="${request.imageUrl}"]`);
    if (img) {
      sendResponse({
        width: img.naturalWidth,
        height: img.naturalHeight,
        alt: img.alt,
        title: img.title,
      });
    } else {
      sendResponse(null);
    }
    return true;
  }

  if (request.action === 'markProcessing') {
    markImageAsProcessing(request.imageUrl);
    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'unmarkProcessing') {
    unmarkImageAsProcessing(request.imageUrl);
    sendResponse({ success: true });
    return true;
  }
});

function markImageAsProcessing(imageUrl) {
  processingImages.add(imageUrl);
  const img = document.querySelector(`img[src="${imageUrl}"]`);
  if (img) {
    img.style.opacity = '0.7';
    img.style.filter = 'brightness(0.8)';
    img.dataset.imagecraftProcessing = 'true';
  }
}

function unmarkImageAsProcessing(imageUrl) {
  processingImages.delete(imageUrl);
  const img = document.querySelector(`img[src="${imageUrl}"]`);
  if (img && img.dataset.imagecraftProcessing) {
    img.style.opacity = '';
    img.style.filter = '';
    delete img.dataset.imagecraftProcessing;
  }
}

document.addEventListener('dragstart', e => {
  if (e.target.tagName === 'IMG') {
    const imageUrl = e.target.src;
    chrome.runtime.sendMessage({
      action: 'imageDragStart',
      imageUrl: imageUrl,
    });
  }
});

const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (node.tagName === 'IMG') {
        enhanceImage(node);
      } else if (node.querySelectorAll) {
        node.querySelectorAll('img').forEach(enhanceImage);
      }
    });
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

document.querySelectorAll('img').forEach(enhanceImage);

function enhanceImage(img) {
  if (img.dataset.imagecraftEnhanced) return;

  img.dataset.imagecraftEnhanced = 'true';

  img.addEventListener('error', () => {
    console.log('ImageCraft: Image failed to load', img.src);
  });

  if (img.loading !== 'lazy' && !img.complete) {
    img.loading = 'lazy';
  }
}

function injectStyles() {
  if (document.getElementById('imagecraft-styles')) return;

  const style = document.createElement('style');
  style.id = 'imagecraft-styles';
  style.textContent = `
    img[data-imagecraft-processing="true"] {
      transition: opacity 0.3s, filter 0.3s;
    }

    .imagecraft-overlay {
      position: absolute;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-family: system-ui, -apple-system, sans-serif;
      pointer-events: none;
      z-index: 10000;
      display: none;
    }

    .imagecraft-overlay.show {
      display: block;
    }
  `;
  document.head.appendChild(style);
}

injectStyles();

let tooltip = null;

document.addEventListener('mouseover', e => {
  if (e.target.tagName === 'IMG' && e.altKey) {
    showImageTooltip(e.target);
  }
});

document.addEventListener('mouseout', e => {
  if (e.target.tagName === 'IMG') {
    hideImageTooltip();
  }
});

function showImageTooltip(img) {
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.className = 'imagecraft-overlay';
    document.body.appendChild(tooltip);
  }

  const rect = img.getBoundingClientRect();
  const info = `
    ${img.naturalWidth} × ${img.naturalHeight}px
    ${getImageFormat(img.src)}
    ${formatFileSize(estimateImageSize(img))}
  `;

  tooltip.textContent = info;
  tooltip.style.left = rect.left + 'px';
  tooltip.style.top = rect.bottom + 5 + 'px';
  tooltip.classList.add('show');
}

function hideImageTooltip() {
  if (tooltip) {
    tooltip.classList.remove('show');
  }
}

function getImageFormat(url) {
  const extension = url.split('.').pop().split('?')[0].toUpperCase();
  const validFormats = [
    'PNG',
    'JPG',
    'JPEG',
    'GIF',
    'WEBP',
    'SVG',
    'BMP',
    'ICO',
  ];
  return validFormats.includes(extension) ? extension : 'Unknown';
}

function estimateImageSize(img) {
  const pixels = img.naturalWidth * img.naturalHeight;
  const bytesPerPixel = 3;
  return pixels * bytesPerPixel;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
