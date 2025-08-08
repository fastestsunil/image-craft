// Backend configuration
const BACKEND_URL = 'http://localhost:5001/api';
let authToken = null;
let isBackendAvailable = false;

// Check backend availability on startup
checkBackendHealth();

chrome.runtime.onInstalled.addListener(() => {
  createContextMenus();
  loadSettings();
  checkBackendHealth();
});

// Check if backend is available
async function checkBackendHealth() {
  try {
    const response = await fetch('http://localhost:5001/health');
    isBackendAvailable = response.ok;
    console.log('Backend health check:', isBackendAvailable ? 'OK' : 'Failed');
  } catch (error) {
    isBackendAvailable = false;
    console.log('Backend not available:', error.message);
  }
}

// Backend API functions
async function makeBackendRequest(endpoint, options = {}) {
  if (!isBackendAvailable) {
    throw new Error('Backend is not available');
  }

  const url = `${BACKEND_URL}${endpoint}`;
  const config = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Backend request failed');
  }

  return data;
}

// Authentication functions
async function loginToBackend(email, password) {
  try {
    const data = await makeBackendRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    authToken = data.data.token;
    chrome.storage.local.set({ authToken });

    return data.data.user;
  } catch (error) {
    console.error('Backend login failed:', error);
    throw error;
  }
}

async function registerToBackend(name, email, password) {
  try {
    const data = await makeBackendRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });

    authToken = data.data.token;
    chrome.storage.local.set({ authToken });

    return data.data.user;
  } catch (error) {
    console.error('Backend registration failed:', error);
    throw error;
  }
}

async function getCurrentUser() {
  try {
    const data = await makeBackendRequest('/auth/me');
    return data.data.user;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}

// Load auth token on startup
chrome.storage.local.get(['authToken'], result => {
  if (result.authToken) {
    authToken = result.authToken;
    console.log('Auth token loaded from storage');
  }
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'login') {
    loginToBackend(request.email, request.password)
      .then(user => {
        sendResponse({ success: true, user });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  }

  if (request.action === 'register') {
    registerToBackend(request.name, request.email, request.password)
      .then(user => {
        sendResponse({ success: true, user });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (request.action === 'getCurrentUser') {
    getCurrentUser()
      .then(user => {
        sendResponse({ success: true, user });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (request.action === 'logout') {
    authToken = null;
    chrome.storage.local.remove(['authToken']);
    sendResponse({ success: true });
  }

  if (request.action === 'checkBackendHealth') {
    checkBackendHealth()
      .then(() => {
        sendResponse({ success: true, isAvailable: isBackendAvailable });
      })
      .catch(() => {
        sendResponse({ success: false, isAvailable: false });
      });
    return true;
  }
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

    let processedUrl;

    // Use backend for all image processing
    if (isBackendAvailable && authToken) {
      try {
        processedUrl = await processImageWithBackend(imageUrl, format);
        console.log('Image processed via backend');
      } catch (backendError) {
        console.error('Backend processing failed:', backendError.message);
        throw new Error(
          'Image processing failed. Please ensure you are logged in and try again.'
        );
      }
    } else {
      throw new Error(
        'Backend is not available. Please log in to use ImageCraft.'
      );
    }

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

    let processedUrl;

    // Use backend for all image processing
    if (isBackendAvailable && authToken) {
      try {
        processedUrl = await processImageWithBackend(imageUrl, format);
        console.log('Image processed for copy via backend, URL:', processedUrl);
      } catch (backendError) {
        console.error(
          'Backend processing failed for copy:',
          backendError.message
        );
        throw new Error(
          'Image processing failed. Please ensure you are logged in and try again.'
        );
      }
    } else {
      throw new Error(
        'Backend is not available. Please log in to use ImageCraft.'
      );
    }

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

    let bgRemovedUrl;

    // Use backend for all background removal
    if (isBackendAvailable && authToken) {
      try {
        bgRemovedUrl = await removeBackgroundWithBackend(imageUrl);
        console.log('Background removed via backend');
      } catch (backendError) {
        console.error(
          'Backend background removal failed:',
          backendError.message
        );
        throw new Error(
          'Background removal failed. Please ensure you are logged in and try again.'
        );
      }
    } else {
      throw new Error(
        'Backend is not available. Please log in to use ImageCraft.'
      );
    }

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

// This function is no longer needed as backend handles all Cloudinary operations
async function processImageWithBackend(imageUrl, format) {
  if (!isBackendAvailable || !authToken) {
    throw new Error(
      'Backend is not available. Please ensure you are logged in.'
    );
  }

  try {
    const data = await makeBackendRequest('/images/convert', {
      method: 'POST',
      body: JSON.stringify({
        imageUrl,
        format,
        quality: 80,
      }),
    });

    return data.data.image.processedUrl;
  } catch (error) {
    console.error('Backend image processing failed:', error);
    throw new Error('Failed to process image. Please try again.');
  }
}

async function removeBackgroundWithBackend(imageUrl) {
  if (!isBackendAvailable || !authToken) {
    throw new Error(
      'Backend is not available. Please ensure you are logged in.'
    );
  }

  try {
    const data = await makeBackendRequest('/images/remove-background', {
      method: 'POST',
      body: JSON.stringify({
        imageUrl,
        quality: 80,
      }),
    });

    return data.data.image.processedUrl;
  } catch (error) {
    console.error('Backend background removal failed:', error);
    throw new Error('Failed to remove background. Please try again.');
  }
}

// Remove.bg API function removed - backend handles all background removal

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
      ['defaultFormat', 'autoDownload', 'showNotifications'],
      settings => {
        resolve({
          defaultFormat: settings.defaultFormat || 'png',
          autoDownload: settings.autoDownload !== false,
          showNotifications: settings.showNotifications !== false,
        });
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
