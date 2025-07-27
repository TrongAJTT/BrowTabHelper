// Background script to handle storage
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed/updated');
  initializeStorage();
});

// Initialize storage with default values
function initializeStorage() {
  chrome.storage.local.get(['urlPattern', 'startId', 'endId', 'savedUrls'], (items) => {
    if (chrome.runtime.lastError) {
      console.error('Error initializing storage:', chrome.runtime.lastError);
      return;
    }
    
    // Set default values if they don't exist
    const defaultData = {
      urlPattern: items.urlPattern || '',
      startId: items.startId || '',
      endId: items.endId || '',
      savedUrls: items.savedUrls || []
    };
    
    chrome.storage.local.set(defaultData, () => {
      if (chrome.runtime.lastError) {
        console.error('Error setting default values:', chrome.runtime.lastError);
      } else {
        console.log('Storage initialized with default values');
      }
    });
  });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request.type);
  
  if (request.type === 'saveData') {
    chrome.storage.local.set(request.data, () => {
      if (chrome.runtime.lastError) {
        console.error('Error saving data:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError });
      } else {
        console.log('Data saved successfully');
        sendResponse({ success: true });
      }
    });
    return true; // Will respond asynchronously
  }
  
  if (request.type === 'loadData') {
    chrome.storage.local.get(['urlPattern', 'startId', 'endId', 'savedUrls'], (items) => {
      if (chrome.runtime.lastError) {
        console.error('Error loading data:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError });
      } else {
        console.log('Data loaded successfully');
        sendResponse({ success: true, data: items });
      }
    });
    return true; // Will respond asynchronously
  }
}); 