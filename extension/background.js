// TileSpace Quick Capture - Background Service Worker
// 
// CONFIGURATION: Update these values with your Supabase project details
const CONFIG = {
  // Your Supabase project URL (from Project Settings > API)
  SUPABASE_URL: 'https://YOUR_PROJECT_ID.supabase.co',
  
  // Your Supabase anon key (from Project Settings > API)
  SUPABASE_ANON_KEY: 'YOUR_ANON_KEY_HERE',
  
  // Edge function URL (after deploying the quick-capture function)
  EDGE_FUNCTION_URL: 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/quick-capture',
};

// Storage key for auth session
const AUTH_STORAGE_KEY = 'tilespace_auth_session';

/**
 * Get stored auth session
 */
async function getAuthSession() {
  return new Promise((resolve) => {
    chrome.storage.local.get([AUTH_STORAGE_KEY], (result) => {
      resolve(result[AUTH_STORAGE_KEY] || null);
    });
  });
}

/**
 * Store auth session
 */
async function setAuthSession(session) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [AUTH_STORAGE_KEY]: session }, resolve);
  });
}

/**
 * Clear auth session
 */
async function clearAuthSession() {
  return new Promise((resolve) => {
    chrome.storage.local.remove([AUTH_STORAGE_KEY], resolve);
  });
}

/**
 * Show badge notification
 */
function showBadge(text, color) {
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color });

  setTimeout(() => {
    chrome.action.setBadgeText({ text: '' });
  }, 2000);
}

/**
 * Save the current tab to TileSpace Inbox
 */
async function saveCurrentTab() {
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.url) {
      showBadge('!', '#EF4444');
      return { success: false, error: 'No active tab' };
    }

    // Don't save browser internal pages
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      showBadge('!', '#EF4444');
      return { success: false, error: 'Cannot save browser pages' };
    }

    // Get auth session
    const session = await getAuthSession();
    
    if (!session?.access_token) {
      showBadge('!', '#F59E0B'); // Yellow for "not logged in"
      return { 
        success: false, 
        error: 'Not logged in',
        message: 'Please log in to TileSpace first'
      };
    }

    // Send to edge function
    const response = await fetch(CONFIG.EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': CONFIG.SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        url: tab.url,
        title: tab.title || '',
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      showBadge('✓', '#22C55E');
      return { success: true };
    } else {
      // Check if auth error
      if (response.status === 401) {
        await clearAuthSession();
        showBadge('!', '#F59E0B');
        return { 
          success: false, 
          error: 'Session expired',
          message: 'Please log in to TileSpace again'
        };
      }
      
      showBadge('!', '#EF4444');
      return { success: false, error: data.error || 'Failed to save' };
    }
  } catch (error) {
    console.error('Quick capture error:', error);
    showBadge('!', '#EF4444');
    return { success: false, error: error.message };
  }
}

// Listen for keyboard shortcut
chrome.commands.onCommand.addListener((command) => {
  if (command === 'save-link') {
    saveCurrentTab();
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveLink') {
    saveCurrentTab().then(sendResponse);
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'getAuthStatus') {
    getAuthSession().then((session) => {
      sendResponse({ 
        isLoggedIn: !!session?.access_token,
        email: session?.user?.email || null
      });
    });
    return true;
  }
  
  if (request.action === 'setAuthSession') {
    setAuthSession(request.session).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === 'clearAuthSession') {
    clearAuthSession().then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
});
