let historyData = [];
let filteredData = [];

document.addEventListener('DOMContentLoaded', () => {
  loadHistory();
  attachEventListeners();
});

function loadHistory() {
  chrome.storage.local.get(['processHistory'], result => {
    historyData = result.processHistory || [];
    filteredData = [...historyData];
    renderHistory();
  });
}

function attachEventListeners() {
  document
    .getElementById('formatFilter')
    .addEventListener('change', applyFilters);
  document
    .getElementById('typeFilter')
    .addEventListener('change', applyFilters);
  document
    .getElementById('dateFilter')
    .addEventListener('change', applyFilters);
  document
    .getElementById('searchFilter')
    .addEventListener('input', applyFilters);
  document
    .getElementById('clearHistory')
    .addEventListener('click', clearHistory);
}

function applyFilters() {
  const format = document.getElementById('formatFilter').value;
  const type = document.getElementById('typeFilter').value;
  const date = document.getElementById('dateFilter').value;
  const search = document.getElementById('searchFilter').value.toLowerCase();

  filteredData = historyData.filter(item => {
    if (format && item.format !== format) return false;
    if (type && item.type !== type) return false;
    if (date && !item.date.startsWith(date)) return false;
    if (search && !item.filename.toLowerCase().includes(search)) return false;
    return true;
  });

  renderHistory();
}

function renderHistory() {
  const grid = document.getElementById('historyGrid');
  const emptyState = document.getElementById('emptyState');

  if (filteredData.length === 0) {
    grid.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }

  grid.style.display = 'grid';
  emptyState.style.display = 'none';

  grid.innerHTML = filteredData
    .map(
      item => `
    <div class="history-item" data-id="${item.id}">
      <img src="${item.thumbnail || item.url}" alt="${item.filename}">
      <div class="history-item-info">
        <div class="history-item-title" title="${item.filename}">${
        item.filename
      }</div>
        <div class="history-item-meta">
          <span class="history-item-date">${formatDate(item.date)}</span>
          <span class="history-item-format">${item.format.toUpperCase()}</span>
        </div>
        <div class="history-item-actions">
          <button class="action-btn" onclick="downloadImage('${
            item.id
          }')">Download</button>
          <button class="action-btn" onclick="copyImage('${
            item.id
          }')">Copy</button>
          <button class="action-btn" onclick="deleteItem('${
            item.id
          }')">Delete</button>
        </div>
      </div>
    </div>
  `
    )
    .join('');
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

function downloadImage(id) {
  const item = historyData.find(i => i.id === id);
  if (item) {
    chrome.downloads.download({
      url: item.url,
      filename: item.filename,
    });
  }
}

function copyImage(id) {
  const item = historyData.find(i => i.id === id);
  if (item) {
    fetch(item.url)
      .then(res => res.blob())
      .then(blob => {
        const clipboardItem = new ClipboardItem({ [blob.type]: blob });
        navigator.clipboard
          .write([clipboardItem])
          .then(() => showNotification('Image copied to clipboard'))
          .catch(err => showNotification('Failed to copy image', 'error'));
      });
  }
}

function deleteItem(id) {
  if (confirm('Are you sure you want to delete this item?')) {
    historyData = historyData.filter(i => i.id !== id);
    filteredData = filteredData.filter(i => i.id !== id);

    chrome.storage.local.set({ processHistory: historyData }, () => {
      renderHistory();
      showNotification('Item deleted');
    });
  }
}

function clearHistory() {
  if (
    confirm(
      'Are you sure you want to clear all history? This action cannot be undone.'
    )
  ) {
    historyData = [];
    filteredData = [];

    chrome.storage.local.set({ processHistory: [] }, () => {
      renderHistory();
      showNotification('History cleared');
    });
  }
}

function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${type === 'error' ? '#ef4444' : '#10b981'};
    color: white;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);
