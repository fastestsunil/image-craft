// View management
let currentView = 'main';

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  loadStatistics();
  attachEventListeners();
  showView('main');
});

function showView(viewName) {
  // Hide all views
  document.querySelectorAll('.view').forEach(view => {
    view.style.display = 'none';
  });

  // Show selected view
  const viewElement = document.getElementById(`${viewName}View`);
  if (viewElement) {
    viewElement.style.display = 'block';
  }

  // Update header
  const backButton = document.getElementById('backButton');
  const headerTitle = document.getElementById('headerTitle');

  if (viewName === 'main') {
    backButton.style.display = 'none';
    headerTitle.textContent = 'ImageCraft';
  } else {
    backButton.style.display = 'flex';
    headerTitle.textContent = viewName === 'settings' ? 'Settings' : 'History';
  }

  // Load history if showing history view
  if (viewName === 'history') {
    loadHistory();
  }

  currentView = viewName;
}

function loadSettings() {
  chrome.storage.sync.get(
    [
      'cloudinaryCloudName',
      'cloudinaryUploadPreset',
      'removeBgApiKey',
      'defaultFormat',
      'autoDownload',
      'showNotifications',
    ],
    settings => {
      document.getElementById('cloudName').value =
        settings.cloudinaryCloudName || '';
      document.getElementById('uploadPreset').value =
        settings.cloudinaryUploadPreset || '';
      document.getElementById('removeBgKey').value =
        settings.removeBgApiKey || '';
      document.getElementById('defaultFormat').value =
        settings.defaultFormat || 'png';
      document.getElementById('autoDownload').checked =
        settings.autoDownload !== false;
      document.getElementById('showNotifications').checked =
        settings.showNotifications !== false;
    }
  );
}

function loadStatistics() {
  chrome.storage.local.get(['imagesProcessed', 'backgroundsRemoved'], stats => {
    document.getElementById('imagesProcessed').textContent =
      stats.imagesProcessed || 0;
    document.getElementById('bgRemoved').textContent =
      stats.backgroundsRemoved || 0;
  });
}

function loadHistory() {
  console.log('Loading history...');
  chrome.storage.local.get(['processHistory'], result => {
    const history = result.processHistory || [];
    console.log('History loaded:', history.length, 'items');

    const historyList = document.getElementById('historyList');
    const emptyState = document.getElementById('emptyHistory');
    const filterValue = document.getElementById('historyFilter').value;

    // Filter history based on selected filter
    const filteredHistory =
      filterValue === 'all'
        ? history
        : history.filter(item => item.type === filterValue);

    console.log('Filtered history:', filteredHistory.length, 'items');

    if (filteredHistory.length === 0) {
      historyList.style.display = 'none';
      emptyState.style.display = 'block';
      console.log('Showing empty state');
      return;
    }

    historyList.style.display = 'block';
    emptyState.style.display = 'none';

    // Display only last 20 items for performance
    const recentHistory = filteredHistory.slice(0, 20);

    historyList.innerHTML = recentHistory
      .map(
        item => `
      <div class="history-item" data-id="${item.id}">
        <img src="${item.url}" alt="${
          item.filename
        }" class="history-item-thumb" onerror="this.src='icons/icon48.png'">
        <div class="history-item-info">
          <div class="history-item-name" title="${item.filename}">${
          item.filename
        }</div>
          <div class="history-item-meta">
            ${item.format.toUpperCase()} • ${formatDate(
          item.date
        )} • ${getTypeLabel(item.type)}
          </div>
        </div>
        <div class="history-item-actions">
          <button class="history-btn" onclick="downloadHistoryItem('${
            item.id
          }')">Download</button>
          <button class="history-btn" onclick="copyHistoryItem('${
            item.id
          }')">Copy</button>
        </div>
      </div>
    `
      )
      .join('');

    console.log('History rendered:', recentHistory.length, 'items');
  });
}

function getTypeLabel(type) {
  const labels = {
    converted: 'Converted',
    copied: 'Copied',
    'bg-removed': 'BG Removed',
  };
  return labels[type] || type;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function attachEventListeners() {
  // View navigation
  document.getElementById('showSettingsBtn').addEventListener('click', () => {
    showView('settings');
  });

  document.getElementById('showHistoryBtn').addEventListener('click', () => {
    showView('history');
  });

  document.getElementById('backButton').addEventListener('click', () => {
    showView('main');
  });

  // Settings
  document
    .getElementById('saveSettings')
    .addEventListener('click', saveSettings);
  document
    .getElementById('resetSettings')
    .addEventListener('click', resetSettings);

  // History
  document
    .getElementById('historyFilter')
    .addEventListener('change', loadHistory);
  document
    .getElementById('clearHistory')
    .addEventListener('click', clearHistory);

  // Footer links
  document.getElementById('help').addEventListener('click', openHelp);
  document.getElementById('about').addEventListener('click', openAbout);
}

function saveSettings() {
  const settings = {
    cloudinaryCloudName: document.getElementById('cloudName').value.trim(),
    cloudinaryUploadPreset: document
      .getElementById('uploadPreset')
      .value.trim(),
    removeBgApiKey: document.getElementById('removeBgKey').value.trim(),
    defaultFormat: document.getElementById('defaultFormat').value,
    autoDownload: document.getElementById('autoDownload').checked,
    showNotifications: document.getElementById('showNotifications').checked,
  };

  if (!settings.cloudinaryCloudName || !settings.cloudinaryUploadPreset) {
    showToast('Please provide Cloudinary credentials', 'error');
    return;
  }

  chrome.storage.sync.set(settings, () => {
    chrome.runtime.sendMessage({ action: 'updateSettings' }, response => {
      if (response && response.success) {
        showToast('Settings saved successfully!', 'success');
        setTimeout(() => showView('main'), 1000);
      }
    });
  });
}

function resetSettings() {
  if (confirm('Are you sure you want to reset all settings to default?')) {
    chrome.storage.sync.clear(() => {
      chrome.storage.local.clear(() => {
        loadSettings();
        loadStatistics();
        showToast('Settings reset to default', 'warning');
        chrome.runtime.sendMessage({ action: 'updateSettings' });
      });
    });
  }
}

function clearHistory() {
  if (confirm('Are you sure you want to clear all history?')) {
    chrome.storage.local.set({ processHistory: [] }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error clearing history:', chrome.runtime.lastError);
        showToast('Failed to clear history', 'error');
      } else {
        console.log('History cleared successfully');
        loadHistory();
        showToast('History cleared successfully', 'success');
      }
    });
  }
}

// Global functions for history actions
window.downloadHistoryItem = function (id) {
  chrome.storage.local.get(['processHistory'], result => {
    const history = result.processHistory || [];
    const item = history.find(h => h.id === id);
    if (item) {
      chrome.downloads.download({
        url: item.url,
        filename: item.filename,
      });
      showToast('Download started');
    }
  });
};

window.copyHistoryItem = function (id) {
  chrome.storage.local.get(['processHistory'], result => {
    const history = result.processHistory || [];
    const item = history.find(h => h.id === id);
    if (item) {
      fetch(item.url)
        .then(res => res.blob())
        .then(blob => {
          const clipboardItem = new ClipboardItem({ [blob.type]: blob });
          navigator.clipboard
            .write([clipboardItem])
            .then(() => showToast('Image copied to clipboard'))
            .catch(err => showToast('Failed to copy image', 'error'));
        });
    }
  });
};

function openHelp() {
  chrome.tabs.create({
    url: 'https://github.com/yourusername/imagecraft/wiki',
  });
}

function openAbout() {
  chrome.tabs.create({ url: 'https://github.com/yourusername/imagecraft' });
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Add password toggle functionality
document.querySelectorAll('input[type="password"]').forEach(input => {
  const wrapper = document.createElement('div');
  wrapper.style.position = 'relative';
  input.parentNode.insertBefore(wrapper, input);
  wrapper.appendChild(input);

  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.style.cssText = `
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    color: #6b7280;
  `;
  toggleBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  `;

  toggleBtn.addEventListener('click', () => {
    if (input.type === 'password') {
      input.type = 'text';
      toggleBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
          <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
      `;
    } else {
      input.type = 'password';
      toggleBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      `;
    }
  });

  wrapper.appendChild(toggleBtn);
});

// Listen for storage changes to update statistics in real-time
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    if (changes.imagesProcessed) {
      document.getElementById('imagesProcessed').textContent =
        changes.imagesProcessed.newValue || 0;
    }
    if (changes.backgroundsRemoved) {
      document.getElementById('bgRemoved').textContent =
        changes.backgroundsRemoved.newValue || 0;
    }
    // Refresh history if it's currently visible and history changed
    if (currentView === 'history' && changes.processHistory) {
      loadHistory();
    }
  }
});
