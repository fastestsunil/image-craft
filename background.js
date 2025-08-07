// Default values - users must configure their own
const CLOUDINARY_CLOUD_NAME = '';
const CLOUDINARY_UPLOAD_PRESET = '';
const REMOVE_BG_API_KEY = '';

chrome.runtime.onInstalled.addListener(() => {
  createContextMenus();
  loadSettings();
});

function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'imagecraft-parent',
      title: 'ImageCraft',
      contexts: ['image'],
    });

    chrome.contextMenus.create({
      id: 'save-as',
      parentId: 'imagecraft-parent',
      title: 'Save As...',
      contexts: ['image'],
    });

    chrome.contextMenus.create({
      id: 'save-as-png',
      parentId: 'save-as',
      title: 'PNG',
      contexts: ['image'],
    });

    chrome.contextMenus.create({
      id: 'save-as-jpg',
      parentId: 'save-as',
      title: 'JPG',
      contexts: ['image'],
    });

    chrome.contextMenus.create({
      id: 'save-as-webp',
      parentId: 'save-as',
      title: 'WEBP',
      contexts: ['image'],
    });

    chrome.contextMenus.create({
      id: 'copy-as',
      parentId: 'imagecraft-parent',
      title: 'Copy Image As...',
      contexts: ['image'],
    });

    chrome.contextMenus.create({
      id: 'copy-as-png',
      parentId: 'copy-as',
      title: 'PNG',
      contexts: ['image'],
    });

    chrome.contextMenus.create({
      id: 'copy-as-png-no-bg',
      parentId: 'copy-as',
      title: 'PNG without Background',
      contexts: ['image'],
    });

    chrome.contextMenus.create({
      id: 'copy-as-jpg',
      parentId: 'copy-as',
      title: 'JPG',
      contexts: ['image'],
    });

    chrome.contextMenus.create({
      id: 'copy-as-webp',
      parentId: 'copy-as',
      title: 'WEBP',
      contexts: ['image'],
    });

    chrome.contextMenus.create({
      type: 'separator',
      id: 'separator-1',
      parentId: 'imagecraft-parent',
      contexts: ['image'],
    });

    chrome.contextMenus.create({
      id: 'open-in-new-tab',
      parentId: 'imagecraft-parent',
      title: 'Open Image in New Tab',
      contexts: ['image'],
    });

    chrome.contextMenus.create({
      id: 'search-with-lens',
      parentId: 'imagecraft-parent',
      title: 'Search with Google Lens',
      contexts: ['image'],
    });
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const imageUrl = info.srcUrl;

  if (!imageUrl) {
    showNotification('Error', 'No image URL found');
    return;
  }

  try {
    switch (info.menuItemId) {
      case 'save-as-png':
        await saveImageAs(imageUrl, 'png', tab.id);
        break;
      case 'save-as-jpg':
        await saveImageAs(imageUrl, 'jpg', tab.id);
        break;
      case 'save-as-webp':
        await saveImageAs(imageUrl, 'webp', tab.id);
        break;
      case 'copy-as-png':
        await copyImageAs(imageUrl, 'png', tab.id);
        break;
      case 'copy-as-png-no-bg':
        await copyImageWithoutBackground(imageUrl, tab.id);
        break;
      case 'copy-as-jpg':
        await copyImageAs(imageUrl, 'jpg', tab.id);
        break;
      case 'copy-as-webp':
        await copyImageAs(imageUrl, 'webp', tab.id);
        break;
      case 'open-in-new-tab':
        chrome.tabs.create({ url: imageUrl });
        break;
      case 'search-with-lens':
        const lensUrl = `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(
          imageUrl
        )}`;
        chrome.tabs.create({ url: lensUrl });
        break;
    }
  } catch (error) {
    console.error('Error processing image:', error);
    showNotification('Error', error.message || 'Failed to process image');
  }
});

async function saveImageAs(imageUrl, format, tabId) {
  try {
    console.log('Starting image conversion:', { imageUrl, format });
    showLoadingIndicator(tabId, 'Converting image...');

    const processedUrl = await processImageWithCloudinary(imageUrl, format);
    console.log('Image processed, URL:', processedUrl);

    const filename = generateFilename(imageUrl, format);
    console.log('Generated filename:', filename);

    chrome.downloads.download(
      {
        url: processedUrl,
        filename: filename,
        saveAs: false, // Changed to false for automatic download
      },
      downloadId => {
        hideLoadingIndicator(tabId);
        if (chrome.runtime.lastError) {
          console.error('Download failed:', chrome.runtime.lastError);
          showNotification(
            'Error',
            `Download failed: ${chrome.runtime.lastError.message}`
          );
          // Show error in page as well
          showPageError(
            tabId,
            `Download failed: ${chrome.runtime.lastError.message}`
          );
        } else {
          console.log('Download started, ID:', downloadId);
          showNotification('Success', `Image saved as ${format.toUpperCase()}`);
          addToHistory({
            url: processedUrl,
            originalUrl: imageUrl,
            format: format,
            filename: filename,
            type: 'converted',
            date: new Date().toISOString(),
          });
          updateStatistics('imagesProcessed');
        }
      }
    );
  } catch (error) {
    console.error('Error in saveImageAs:', error);
    hideLoadingIndicator(tabId);
    showNotification('Error', error.message || 'Failed to process image');
    showPageError(tabId, error.message || 'Failed to process image');
  }
}

async function copyImageAs(imageUrl, format, tabId) {
  try {
    showLoadingIndicator(tabId, 'Converting image...');

    const processedUrl = await processImageWithCloudinary(imageUrl, format);
    console.log('Image processed for copy, URL:', processedUrl);

    const response = await fetch(processedUrl);
    const blob = await response.blob();

    // Copy to clipboard
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: copyBlobToClipboard,
      args: [await blobToBase64(blob), blob.type],
    });

    // Also auto-download the image
    const filename = generateFilename(imageUrl, format);
    console.log('Auto-downloading copied image:', filename);

    chrome.downloads.download(
      {
        url: processedUrl,
        filename: `copied_${filename}`,
        saveAs: false, // Auto-download without dialog
      },
      downloadId => {
        if (chrome.runtime.lastError) {
          console.error('Auto-download failed:', chrome.runtime.lastError);
        } else {
          console.log(
            'Auto-download started for copied image, ID:',
            downloadId
          );
        }
      }
    );

    hideLoadingIndicator(tabId);
    showNotification(
      'Success',
      `Image copied and saved as ${format.toUpperCase()}`
    );

    // Add to history
    addToHistory({
      url: processedUrl,
      originalUrl: imageUrl,
      format: format,
      filename: filename,
      type: 'copied',
      date: new Date().toISOString(),
    });
    updateStatistics('imagesProcessed');
  } catch (error) {
    hideLoadingIndicator(tabId);
    throw error;
  }
}

async function copyImageWithoutBackground(imageUrl, tabId) {
  try {
    showLoadingIndicator(tabId, 'Removing background...');

    const settings = await getSettings();
    const bgRemovedUrl = await removeBackground(imageUrl, settings);

    const response = await fetch(bgRemovedUrl);
    const blob = await response.blob();

    // Copy to clipboard
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: copyBlobToClipboard,
      args: [await blobToBase64(blob), 'image/png'],
    });

    // Also auto-download the image with background removed
    const filename = `no_bg_${generateFilename(imageUrl, 'png')}`;
    console.log('Auto-downloading background-removed image:', filename);

    chrome.downloads.download(
      {
        url: bgRemovedUrl,
        filename: filename,
        saveAs: false, // Auto-download without dialog
      },
      downloadId => {
        if (chrome.runtime.lastError) {
          console.error('Auto-download failed:', chrome.runtime.lastError);
        } else {
          console.log(
            'Auto-download started for bg-removed image, ID:',
            downloadId
          );
        }
      }
    );

    hideLoadingIndicator(tabId);
    showNotification('Success', 'Image copied and saved without background');

    addToHistory({
      url: bgRemovedUrl,
      originalUrl: imageUrl,
      format: 'png',
      filename: filename,
      type: 'bg-removed',
      date: new Date().toISOString(),
    });
    updateStatistics('backgroundsRemoved');
  } catch (error) {
    hideLoadingIndicator(tabId);
    throw error;
  }
}

async function processImageWithCloudinary(imageUrl, format) {
  const settings = await getSettings();
  const cloudName = settings.cloudinaryCloudName || CLOUDINARY_CLOUD_NAME;
  const uploadPreset =
    settings.cloudinaryUploadPreset || CLOUDINARY_UPLOAD_PRESET;

  console.log('Cloudinary settings:', { cloudName, uploadPreset });

  if (!cloudName || cloudName.trim() === '') {
    throw new Error(
      'Please configure your Cloudinary cloud name in extension settings'
    );
  }

  if (!uploadPreset || uploadPreset.trim() === '') {
    throw new Error(
      'Please configure your Cloudinary upload preset in extension settings'
    );
  }

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  console.log('Upload URL:', uploadUrl);

  const formData = new FormData();
  formData.append('file', imageUrl);
  formData.append('upload_preset', uploadPreset);
  // Don't add format here - unsigned uploads don't allow it

  try {
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    console.log('Cloudinary response:', data);

    if (!response.ok) {
      console.error('Cloudinary error:', data);
      if (data.error) {
        throw new Error(`Cloudinary error: ${data.error.message}`);
      }
      throw new Error('Failed to process image with Cloudinary');
    }

    // Now apply format transformation in the URL
    if (data.secure_url) {
      // Extract the public_id and build a new URL with format transformation
      const publicId = data.public_id;
      const version = data.version ? `v${data.version}/` : '';

      // Build URL with format transformation
      const transformedUrl = `https://res.cloudinary.com/${cloudName}/image/upload/f_${format}/${version}${publicId}`;
      console.log('Transformed URL with format:', transformedUrl);

      return transformedUrl;
    }

    return data.secure_url;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

async function removeBackground(imageUrl, settings) {
  const cloudName = settings.cloudinaryCloudName || CLOUDINARY_CLOUD_NAME;
  const uploadPreset =
    settings.cloudinaryUploadPreset || CLOUDINARY_UPLOAD_PRESET;

  console.log('Starting background removal with Cloudinary AI...');

  // First, upload the image to Cloudinary
  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  const formData = new FormData();
  formData.append('file', imageUrl);
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    console.log('Image uploaded for background removal:', data);

    if (!response.ok) {
      console.error('Upload failed:', data);
      // Fallback to Remove.bg API if available
      const apiKey = settings.removeBgApiKey || REMOVE_BG_API_KEY;
      if (apiKey) {
        console.log('Falling back to Remove.bg API...');
        return await removeBackgroundWithAPI(imageUrl, apiKey);
      }
      throw new Error(
        `Upload failed: ${data.error?.message || 'Unknown error'}`
      );
    }

    // Build URL with background removal transformation
    const publicId = data.public_id;
    const version = data.version ? `v${data.version}/` : '';

    // Use Cloudinary's built-in background removal effect (e_background_removal)
    // Combined with PNG format for transparency
    const bgRemovedUrl = `https://res.cloudinary.com/${cloudName}/image/upload/e_background_removal/f_png/${version}${publicId}`;

    console.log('Background removed URL:', bgRemovedUrl);

    // Note: First request might take a few seconds as Cloudinary processes the image
    // Subsequent requests will be cached

    return bgRemovedUrl;
  } catch (error) {
    console.error('Background removal error:', error);

    // Try Remove.bg API as fallback if available
    const apiKey = settings.removeBgApiKey || REMOVE_BG_API_KEY;
    if (apiKey) {
      console.log('Attempting Remove.bg API as fallback...');
      return await removeBackgroundWithAPI(imageUrl, apiKey);
    }

    throw error;
  }
}

async function removeBackgroundWithAPI(imageUrl, apiKey) {
  const response = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: {
      'X-Api-Key': apiKey,
    },
    body: JSON.stringify({
      image_url: imageUrl,
      size: 'auto',
      format: 'png',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to remove background with Remove.bg API');
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

function copyBlobToClipboard(base64Data, mimeType) {
  return new Promise((resolve, reject) => {
    fetch(`data:${mimeType};base64,${base64Data}`)
      .then(res => res.blob())
      .then(blob => {
        const item = new ClipboardItem({ [mimeType]: blob });
        navigator.clipboard.write([item]).then(resolve).catch(reject);
      })
      .catch(reject);
  });
}

async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function generateFilename(imageUrl, format) {
  try {
    const url = new URL(imageUrl);
    const pathname = url.pathname;
    const originalName = pathname.split('/').pop().split('.')[0] || 'image';
    const timestamp = new Date().getTime();
    return `${originalName}_${timestamp}.${format}`;
  } catch {
    const timestamp = new Date().getTime();
    return `image_${timestamp}.${format}`;
  }
}

function showLoadingIndicator(tabId, message) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: msg => {
      const existing = document.getElementById('imagecraft-loading');
      if (existing) existing.remove();

      const loader = document.createElement('div');
      loader.id = 'imagecraft-loading';
      loader.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        z-index: 999999;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      `;

      const spinner = document.createElement('div');
      spinner.style.cssText = `
        width: 20px;
        height: 20px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: imagecraft-spin 0.8s linear infinite;
      `;

      const style = document.createElement('style');
      style.textContent = `
        @keyframes imagecraft-spin {
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);

      loader.appendChild(spinner);
      loader.appendChild(document.createTextNode(msg));
      document.body.appendChild(loader);
    },
    args: [message],
  });
}

function hideLoadingIndicator(tabId) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: () => {
      const loader = document.getElementById('imagecraft-loading');
      if (loader) loader.remove();
    },
  });
}

function showNotification(title, message) {
  // Check if we have notification permission
  if (chrome.notifications) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: title,
      message: message,
      priority: 1,
    });
  }
  console.log(`Notification: ${title} - ${message}`);
}

function showPageError(tabId, message) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: errorMessage => {
      const errorDiv = document.createElement('div');
      errorDiv.id = 'imagecraft-error';
      errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ef4444;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        z-index: 999999;
        max-width: 400px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      `;
      errorDiv.textContent = errorMessage;

      // Remove any existing error
      const existing = document.getElementById('imagecraft-error');
      if (existing) existing.remove();

      document.body.appendChild(errorDiv);

      // Auto-remove after 5 seconds
      setTimeout(() => {
        if (errorDiv.parentNode) {
          errorDiv.remove();
        }
      }, 5000);
    },
    args: [message],
  });
}

async function loadSettings() {
  return new Promise(resolve => {
    chrome.storage.sync.get(
      ['cloudinaryCloudName', 'cloudinaryUploadPreset', 'removeBgApiKey'],
      settings => {
        resolve(settings);
      }
    );
  });
}

async function getSettings() {
  return await loadSettings();
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateSettings') {
    loadSettings().then(() => {
      createContextMenus();
      sendResponse({ success: true });
    });
    return true;
  }
});

function addToHistory(item) {
  item.id = Date.now().toString();

  chrome.storage.local.get(['processHistory'], result => {
    const history = result.processHistory || [];
    history.unshift(item);

    if (history.length > 100) {
      history.pop();
    }

    chrome.storage.local.set({ processHistory: history });
  });
}

function updateStatistics(statType) {
  chrome.storage.local.get([statType], result => {
    const currentValue = result[statType] || 0;
    chrome.storage.local.set({ [statType]: currentValue + 1 });
  });
}
