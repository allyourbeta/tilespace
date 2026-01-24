// TileSpace Quick Capture - Popup Script

// CONFIGURATION: Update this with your TileSpace URL
const TILESPACE_URL = 'http://localhost:5173'; // Change to your deployed URL

// DOM Elements
const statusEl = document.getElementById('status');
const loggedInView = document.getElementById('logged-in-view');
const loggedOutView = document.getElementById('logged-out-view');
const loadingView = document.getElementById('loading-view');
const saveBtn = document.getElementById('save-btn');
const openTileSpaceBtn = document.getElementById('open-tilespace-btn');

/**
 * Show a status message
 */
function showStatus(message, type = 'info') {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  statusEl.classList.remove('hidden');
}

/**
 * Hide status message
 */
function hideStatus() {
  statusEl.classList.add('hidden');
}

/**
 * Show the appropriate view based on auth status
 */
function showView(view) {
  loadingView.classList.add('hidden');
  loggedInView.classList.add('hidden');
  loggedOutView.classList.add('hidden');
  
  if (view === 'loading') {
    loadingView.classList.remove('hidden');
  } else if (view === 'logged-in') {
    loggedInView.classList.remove('hidden');
  } else {
    loggedOutView.classList.remove('hidden');
  }
}

/**
 * Check auth status and update UI
 */
async function checkAuthStatus() {
  showView('loading');
  
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getAuthStatus' });
    
    if (response.isLoggedIn) {
      showView('logged-in');
      if (response.email) {
        showStatus(`Logged in as ${response.email}`, 'logged-in');
      }
    } else {
      showView('logged-out');
    }
  } catch (error) {
    console.error('Error checking auth status:', error);
    showView('logged-out');
  }
}

/**
 * Save current tab to TileSpace
 */
async function saveLink() {
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';
  hideStatus();
  
  try {
    const response = await chrome.runtime.sendMessage({ action: 'saveLink' });
    
    if (response.success) {
      showStatus('Saved to Inbox!', 'success');
      saveBtn.textContent = 'Saved ✓';
      
      // Reset after a moment
      setTimeout(() => {
        saveBtn.textContent = 'Save to Inbox';
        saveBtn.disabled = false;
      }, 2000);
    } else {
      if (response.error === 'Not logged in' || response.error === 'Session expired') {
        showView('logged-out');
        showStatus(response.message || 'Please log in to TileSpace', 'logged-out');
      } else {
        showStatus(response.error || 'Failed to save', 'error');
        saveBtn.textContent = 'Save to Inbox';
        saveBtn.disabled = false;
      }
    }
  } catch (error) {
    console.error('Error saving link:', error);
    showStatus('Failed to save link', 'error');
    saveBtn.textContent = 'Save to Inbox';
    saveBtn.disabled = false;
  }
}

/**
 * Open TileSpace in a new tab
 */
function openTileSpace() {
  chrome.tabs.create({ url: TILESPACE_URL });
}

// Event listeners
saveBtn.addEventListener('click', saveLink);
openTileSpaceBtn.addEventListener('click', openTileSpace);

// Initialize
checkAuthStatus();
