document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  loadStatistics();
  attachEventListeners();
});

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

function attachEventListeners() {
  document
    .getElementById('saveSettings')
    .addEventListener('click', saveSettings);
  document
    .getElementById('resetSettings')
    .addEventListener('click', resetSettings);
  document.getElementById('openOptions').addEventListener('click', openOptions);
  document.getElementById('viewHistory').addEventListener('click', viewHistory);
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

function openOptions() {
  chrome.runtime.openOptionsPage();
}

function viewHistory() {
  chrome.tabs.create({ url: 'history.html' });
}

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
  }
});
