document.addEventListener('DOMContentLoaded', function () {
    // Tab elements
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Generate tab elements
    const urlPatternInput = document.getElementById('urlPattern');
    const startIdInput = document.getElementById('startId');
    const endIdInput = document.getElementById('endId');
	  const switchBtn = document.getElementById('switchBtn');
    const generateBtn = document.getElementById('generateBtn');
    const copyBtn = document.getElementById('copyBtn');
    const openAllBtn = document.getElementById('openAllBtn');
    const resultArea = document.getElementById('resultArea');
    // const syncOpen = document.getElementById('syncOpen');

    // Open tab elements
    const urlList = document.getElementById('urlList');
    const batchSizeInput = document.getElementById('batchSize');
    const openBatchBtn = document.getElementById('openBatchBtn');
    const openAllUrlsBtn = document.getElementById('openAllUrlsBtn');
    const clearUrlsBtn = document.getElementById('clearUrlsBtn');
    const openStatus = document.getElementById('openStatus');
    const progressBar = document.querySelector('.progress');
    
    const messageDiv = document.getElementById('message');
    let generatedUrls = [];
    let isExtensionReady = false;
    let openBatchIndex = 0; // Lưu vị trí batch hiện tại

    // --- Profile Management ---
    const profileSelect = document.getElementById('profileSelect');
    const addProfileBtn = document.getElementById('addProfileBtn');
    const renameProfileBtn = document.getElementById('renameProfileBtn');
    const deleteProfileBtn = document.getElementById('deleteProfileBtn');

    let profiles = {};
    let currentProfile = '';

    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const currentProfileName = document.getElementById('currentProfileName');

    // Tab switching
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        
        // Update active tab button
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Show active tab content
        tabContents.forEach(content => {
          content.classList.remove('active');
          if (content.id === `${tabId}-tab`) {
            content.classList.add('active');
          }
        });

        // If switching to open tab, load URLs from generate tab
        if (tabId === 'open' && urlList.value.trim() === '' && generatedUrls.length > 0) {
          urlList.value = generatedUrls.join('\n');
          saveUrlList(urlList.value);
        }

        saveActiveTab(tabId); // Lưu state tab
      });
    });

    // Function to check if extension is ready
    function checkExtensionReady() {
      return new Promise((resolve) => {
        if (chrome?.runtime?.connect) {
          isExtensionReady = true;
          resolve();
        } else {
          setTimeout(() => checkExtensionReady().then(resolve), 100);
        }
      });
    }
  
    // Function to save data
    function saveData(data) {
      return new Promise((resolve, reject) => {
        if (!isExtensionReady) {
          reject(new Error('Extension not ready'));
          return;
        }

        try {
          chrome.runtime.sendMessage({ type: 'saveData', data: data }, (response) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else if (response && response.success) {
              resolve();
            } else {
              reject(response?.error || new Error('Failed to save data'));
            }
          });
        } catch (error) {
          reject(error);
        }
      });
    }
  
    // Function to load data
    function loadData() {
      return new Promise((resolve, reject) => {
        if (!isExtensionReady) {
          reject(new Error('Extension not ready'));
          return;
        }

        try {
          chrome.runtime.sendMessage({ type: 'loadData' }, (response) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else if (response && response.success) {
              resolve(response.data || {});
            } else {
              reject(response?.error || new Error('Failed to load data'));
            }
          });
        } catch (error) {
          reject(error);
        }
      });
    }
  
    // Initialize storage and load saved data
    async function initializeStorage() {
      try {
        await checkExtensionReady();
        const items = await loadData();
        
        if (items.urlPattern) urlPatternInput.value = items.urlPattern;
        if (items.startId) startIdInput.value = items.startId;
        if (items.endId) endIdInput.value = items.endId;
        
        if (items.savedUrls && items.savedUrls.length > 0) {
          generatedUrls = items.savedUrls;
          resultArea.value = generatedUrls.join('\n');
          copyBtn.style.display = 'inline-block';
          openAllBtn.style.display = 'inline-block';
          showMessage(`Restored ${generatedUrls.length} previously generated URLs.`, 'success');
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        showMessage('Failed to load saved data. Please reload the extension.', 'error');
      }
    }

    // Initialize storage when popup opens
    initializeStorage();
	
	// Switch to new generation
	switchBtn.addEventListener('click', () => {
		startIdInput.value = parseInt(endIdInput.value) + 1;
		endIdInput.value = "";
		endIdInput.focus();
	});

    // Generate URLs
    generateBtn.addEventListener('click', async () => {
      const pattern = urlPatternInput.value.trim();
      const startId = parseInt(startIdInput.value);
      const endId = parseInt(endIdInput.value);
  
      generatedUrls = []; // Reset
      resultArea.value = '';
      copyBtn.style.display = 'none';
      openAllBtn.style.display = 'none';
      messageDiv.textContent = '';
      messageDiv.className = 'message';
  
      if (!pattern) {
        showMessage('URL pattern is required.', 'error');
        return;
      }
      if (!pattern.includes('{id}')) {
        showMessage('URL pattern must contain {id} placeholder.', 'error');
        return;
      }
      if (isNaN(startId) || isNaN(endId)) {
        showMessage('Start ID and End ID must be numbers.', 'error');
        return;
      }
      if (startId > endId) {
        showMessage('Start ID cannot be greater than End ID.', 'error');
        return;
      }
      if ((endId - startId + 1) > 500) { // Limit to prevent browser freeze
          showMessage('Generating more than 500 URLs is not recommended. Please reduce the range.', 'error');
          return;
      }
  
      for (let i = startId; i <= endId; i++) {
        generatedUrls.push(pattern.replace('{id}', i));
      }
  
      if (generatedUrls.length > 0) {
        const urlsText = generatedUrls.join('\n');
        resultArea.value = urlsText;
        resultArea.textContent = urlsText; // Backup method to ensure text is displayed
        copyBtn.style.display = 'inline-block';
        openAllBtn.style.display = 'inline-block';
        showMessage(`Successfully generated ${generatedUrls.length} URLs.`, 'success');
  
        // Save data
        const dataToSave = {
          urlPattern: pattern,
          startId: startIdInput.value,
          endId: endIdInput.value,
          savedUrls: generatedUrls
        };
  
        try {
          await saveData(dataToSave);
        } catch (error) {
          console.error('Failed to save data:', error);
          showMessage('Failed to save data.', 'error');
        }
      } else {
        showMessage('No URLs generated. Check your inputs.', 'error');
      }
    });
  
    // Copy URLs
    copyBtn.addEventListener('click', () => {
      if (resultArea.value) {
        navigator.clipboard.writeText(resultArea.value)
          .then(() => {
            showMessage('URLs copied to clipboard!', 'success');
          })
          .catch(err => {
            showMessage('Failed to copy URLs.', 'error');
            console.error('Clipboard copy error:', err);
          });
      }
    });

    // syncOpen.addEventListener('click', () => {
    //   // Lấy URL từ tab hiện tại, nếu có thì di chuyển sag tab Open và điền vào ô URL list
    //   chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    //     if (tabs.length > 0 && tabs[0].url) {
    //       const currentUrl = tabs[0].url;
    //       urlList.value += currentUrl + '\n';
    //       saveUrlList(urlList.value);
    //       showMessage(`Current tab URL added: ${currentUrl}`, 'success');
    //     } else {
    //       showMessage('No active tab found.', 'error');
    //     }
    //   });
      
    // });
  
    // Open all URLs from generate tab
    openAllBtn.addEventListener('click', () => {
      if (generatedUrls.length === 0) {
        showMessage('No URLs to open.', 'error');
        return;
      }
  
      if (generatedUrls.length > 20) { // Warning for opening many tabs
          if (!confirm(`You are about to open ${generatedUrls.length} tabs. This might slow down your browser. Continue?`)) {
              return;
          }
      }
  
      generatedUrls.forEach(url => {
        chrome.tabs.create({ url: url, active: false }); // active: false opens them in the background
      });
      showMessage(`Opening ${generatedUrls.length} URLs in new tabs...`, 'success');
    });

    // --- State Persistence ---
    // Lưu tab đang chọn
    function saveActiveTab(tabId) {
      chrome.storage.local.set({ activeTab: tabId });
    }
    // Lưu batch size
    function saveBatchSize(size) {
      chrome.storage.local.set({ batchSize: size });
    }
    // Lưu tiến trình batch
    function saveBatchIndex(idx) {
      chrome.storage.local.set({ openBatchIndex: idx });
    }
    // Lưu danh sách url đã mở
    function saveOpenedUrls(urls) {
      chrome.storage.local.set({ openedUrls: urls });
    }
    // Lưu urlList
    function saveUrlList(val) {
      chrome.storage.local.set({ urlList: val });
    }
    // Đọc state tab, batch size, batch index, openedUrls, urlList
    function restoreUIState() {
      chrome.storage.local.get(['activeTab', 'batchSize', 'openBatchIndex', 'openedUrls', 'urlList'], (items) => {
        // Tab
        if (items.activeTab) {
          tabBtns.forEach(b => b.classList.remove('active'));
          tabContents.forEach(content => content.classList.remove('active'));
          const btn = document.querySelector(`.tab-btn[data-tab="${items.activeTab}"]`);
          const content = document.getElementById(`${items.activeTab}-tab`);
          if (btn && content) {
            btn.classList.add('active');
            content.classList.add('active');
          }
        }
        // Batch size
        if (items.batchSize) {
          batchSizeInput.value = items.batchSize;
        }
        // Batch index
        if (typeof items.openBatchIndex === 'number') {
          openBatchIndex = items.openBatchIndex;
        }
        // Opened URLs
        if (Array.isArray(items.openedUrls)) {
          openedUrls = items.openedUrls;
        }
        // urlList
        if (typeof items.urlList === 'string') {
          urlList.value = items.urlList;
        }
        // --- Đồng bộ lại UI batch ---
        const urls = urlList.value.trim().split('\n').filter(url => url.trim());
        const batchSize = parseInt(batchSizeInput.value) || 10;
        const totalBatches = Math.ceil(urls.length / batchSize);
        // Progress bar
        if (openBatchIndex > 0 && totalBatches > 0) {
          const progress = (openBatchIndex) / totalBatches * 100;
          progressBar.style.width = `${progress}%`;
        } else {
          progressBar.style.width = '0';
        }
        // Status text
        if (openBatchIndex > 0 && totalBatches > 0) {
          const start = (openBatchIndex - 1) * batchSize + 1;
          const end = Math.min(openBatchIndex * batchSize, urls.length);
          openStatus.textContent = `Opened batch ${openBatchIndex} of ${totalBatches} (${start}-${end} of ${urls.length})`;
        } else {
          openStatus.textContent = '';
        }
        updateBatchButtons();
      });
    }

    // --- Batch UI logic ---
    const cancelBatchBtn = document.getElementById('cancelBatchBtn');
    const resetBatchDeleteBtn = document.getElementById('resetBatchDeleteBtn');
    let openedUrls = [];

    function updateBatchButtons() {
      const urls = urlList.value.trim().split('\n').filter(url => url.trim());
      const batchSize = parseInt(batchSizeInput.value) || 10;
      const totalBatches = Math.ceil(urls.length / batchSize);
      // Nếu đang có batch dở dang (openBatchIndex > 0 và < tổng batch)
      if (openBatchIndex > 0 && openBatchIndex < totalBatches) {
        openAllUrlsBtn.style.display = 'none';
        clearUrlsBtn.style.display = 'none';
        cancelBatchBtn.style.display = '';
        resetBatchDeleteBtn.style.display = '';
      } else {
        openAllUrlsBtn.style.display = '';
        clearUrlsBtn.style.display = '';
        cancelBatchBtn.style.display = 'none';
        resetBatchDeleteBtn.style.display = 'none';
      }
    }

    // --- Batch size change ---
    batchSizeInput.addEventListener('input', (e) => {
      saveBatchSize(e.target.value);
      updateBatchButtons();
    });

    // --- Khi clear URL list thì reset batch index và tiến độ
    clearUrlsBtn.addEventListener('click', () => {
      urlList.value = '';
      openStatus.textContent = '';
      progressBar.style.width = '0';
      openBatchIndex = 0;
      saveBatchIndex(0);
      openedUrls = [];
      saveOpenedUrls([]);
      saveUrlList('');
      updateBatchButtons();
      showMessage('URL list cleared.', 'success');
    });

    // --- Khi nhập/chỉnh sửa danh sách URL thì reset batch index và tiến độ
    urlList.addEventListener('input', () => {
      openBatchIndex = 0;
      saveBatchIndex(0);
      openStatus.textContent = '';
      progressBar.style.width = '0';
      openedUrls = [];
      saveOpenedUrls([]);
      saveUrlList(urlList.value);
      updateBatchButtons();
    });

    // --- Open Batch logic ---
    openBatchBtn.addEventListener('click', () => {
      const urls = urlList.value.trim().split('\n').filter(url => url.trim());
      const batchSize = parseInt(batchSizeInput.value) || 10;
      const totalBatches = Math.ceil(urls.length / batchSize);

      if (urls.length === 0) {
        showMessage('No URLs to open.', 'error');
        return;
      }
      if (batchSize < 1) {
        showMessage('Batch size must be at least 1.', 'error');
        return;
      }
      if (openBatchIndex >= totalBatches) {
        showMessage('All URLs have been opened.', 'success');
        return;
      }

      const start = openBatchIndex * batchSize;
      const end = Math.min(start + batchSize, urls.length);
      const batchUrls = urls.slice(start, end);

      // Mở batch hiện tại
      batchUrls.forEach(url => {
        chrome.tabs.create({ url: url.trim(), active: false });
      });
      // Lưu các url đã mở
      openedUrls = openedUrls.concat(batchUrls);
      saveOpenedUrls(openedUrls);

      openBatchIndex++;
      saveBatchIndex(openBatchIndex);
      // Cập nhật tiến độ
      const progress = (openBatchIndex) / totalBatches * 100;
      progressBar.style.width = `${progress}%`;
      openStatus.textContent = `Opened batch ${openBatchIndex} of ${totalBatches} (${start + 1}-${end} of ${urls.length})`;

      updateBatchButtons();

      if (openBatchIndex >= totalBatches) {
        showMessage('All URLs have been opened.', 'success');
      } else {
        showMessage(`Batch ${openBatchIndex} opened. Click again for next batch.`, 'success');
      }
    });

    // --- Cancel Batch ---
    cancelBatchBtn.addEventListener('click', () => {
      openBatchIndex = 0;
      saveBatchIndex(0);
      openStatus.textContent = '';
      progressBar.style.width = '0';
      updateBatchButtons();
      showMessage('Batch progress has been reset.', 'success');
    });

    // --- Reset Batch and Delete Opened URLs ---
    resetBatchDeleteBtn.addEventListener('click', () => {
      const urls = urlList.value.trim().split('\n').filter(url => url.trim());
      // Xóa các url đã mở khỏi danh sách
      const remaining = urls.filter(url => !openedUrls.includes(url));
      urlList.value = remaining.join('\n');
      openBatchIndex = 0;
      saveBatchIndex(0);
      openedUrls = [];
      saveOpenedUrls([]);
      saveUrlList(urlList.value);
      openStatus.textContent = '';
      progressBar.style.width = '0';
      updateBatchButtons();
      showMessage('Batch progress reset and opened URLs removed.', 'success');
    });

    // --- Khôi phục state khi mở popup ---
    restoreUIState();
  
    function showMessage(text, type) {
      messageDiv.textContent = text;
      messageDiv.className = `message ${type}`; // 'success' or 'error'
    }

    // Lưu toàn bộ state của profile hiện tại
    function saveCurrentProfileState() {
      if (!currentProfile) return;
      profiles[currentProfile] = {
        activeTab: getActiveTab(),
        batchSize: batchSizeInput.value,
        openBatchIndex,
        openedUrls,
        urlList: urlList.value,
        // Có thể thêm các state khác nếu muốn
      };
      chrome.storage.local.set({ profiles, currentProfile });
    }
    // Lấy tab đang active
    function getActiveTab() {
      const btn = document.querySelector('.tab-btn.active');
      return btn ? btn.dataset.tab : 'generate';
    }
    // Khôi phục state từ profile
    function restoreProfileState(profileName) {
      if (!profiles[profileName]) return;
      const state = profiles[profileName];
      // Tab
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      const btn = document.querySelector(`.tab-btn[data-tab="${state.activeTab}"]`);
      const content = document.getElementById(`${state.activeTab}-tab`);
      if (btn && content) {
        btn.classList.add('active');
        content.classList.add('active');
      }
      // Batch size
      batchSizeInput.value = state.batchSize || 10;
      // Batch index
      openBatchIndex = state.openBatchIndex || 0;
      // Opened URLs
      openedUrls = Array.isArray(state.openedUrls) ? state.openedUrls : [];
      // urlList
      urlList.value = state.urlList || '';
      // Đồng bộ lại UI batch
      const urls = urlList.value.trim().split('\n').filter(url => url.trim());
      const batchSize = parseInt(batchSizeInput.value) || 10;
      const totalBatches = Math.ceil(urls.length / batchSize);
      if (openBatchIndex > 0 && totalBatches > 0) {
        const progress = (openBatchIndex) / totalBatches * 100;
        progressBar.style.width = `${progress}%`;
      } else {
        progressBar.style.width = '0';
      }
      if (openBatchIndex > 0 && totalBatches > 0) {
        const start = (openBatchIndex - 1) * batchSize + 1;
        const end = Math.min(openBatchIndex * batchSize, urls.length);
        openStatus.textContent = `Opened batch ${openBatchIndex} of ${totalBatches} (${start}-${end} of ${urls.length})`;
      } else {
        openStatus.textContent = '';
      }
      updateBatchButtons();
    }
    // Hiển thị tên profile hiện tại
    function updateCurrentProfileName() {
      currentProfileName.textContent = currentProfile;
    }
    // Cập nhật dropdown profile
    function updateProfileDropdown() {
      profileSelect.innerHTML = '';
      Object.keys(profiles).forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        profileSelect.appendChild(opt);
      });
      profileSelect.value = currentProfile;
      updateCurrentProfileName();
    }
    // Đổi profile
    profileSelect.addEventListener('change', () => {
      saveCurrentProfileState();
      currentProfile = profileSelect.value;
      chrome.storage.local.set({ currentProfile });
      restoreProfileState(currentProfile);
      updateCurrentProfileName();
    });
    // Thêm profile
    addProfileBtn.addEventListener('click', () => {
      const name = prompt('Profile name?');
      if (!name || profiles[name]) return;
      saveCurrentProfileState();
      profiles[name] = {
        activeTab: 'generate',
        batchSize: 10,
        openBatchIndex: 0,
        openedUrls: [],
        urlList: '',
      };
      currentProfile = name;
      chrome.storage.local.set({ profiles, currentProfile });
      updateProfileDropdown();
      restoreProfileState(currentProfile);
      updateCurrentProfileName();
    });
    // Đổi tên profile
    renameProfileBtn.addEventListener('click', () => {
      const newName = prompt('New profile name?', currentProfile);
      if (!newName || profiles[newName]) return;
      profiles[newName] = profiles[currentProfile];
      delete profiles[currentProfile];
      currentProfile = newName;
      chrome.storage.local.set({ profiles, currentProfile });
      updateProfileDropdown();
      restoreProfileState(currentProfile);
      updateCurrentProfileName();
    });
    // Xóa profile
    deleteProfileBtn.addEventListener('click', () => {
      if (Object.keys(profiles).length <= 1) {
        alert('At least one profile is required.');
        return;
      }
      if (!confirm(`Delete profile "${currentProfile}"?`)) return;
      delete profiles[currentProfile];
      currentProfile = Object.keys(profiles)[0];
      chrome.storage.local.set({ profiles, currentProfile });
      updateProfileDropdown();
      restoreProfileState(currentProfile);
      updateCurrentProfileName();
    });
    // Khi bất kỳ state nào thay đổi, lưu lại profile
    [batchSizeInput, urlList].forEach(el => {
      el.addEventListener('input', saveCurrentProfileState);
    });
    tabBtns.forEach(btn => {
      btn.addEventListener('click', saveCurrentProfileState);
    });
    // Khi batch tiến trình thay đổi, lưu lại profile
    [openBatchBtn, cancelBatchBtn, resetBatchDeleteBtn, clearUrlsBtn,
     generateBtn, copyBtn, openAllBtn, openAllUrlsBtn].forEach(btn => {
      if (btn) btn.addEventListener('click', () => setTimeout(saveCurrentProfileState, 100));
    });
    // Khởi tạo: load profiles từ storage
    function loadProfiles() {
      chrome.storage.local.get(['profiles', 'currentProfile'], (items) => {
        profiles = items.profiles || { Default: {
          activeTab: 'generate', batchSize: 10, openBatchIndex: 0, openedUrls: [], urlList: ''
        }};
        currentProfile = items.currentProfile || Object.keys(profiles)[0];
        updateProfileDropdown();
        restoreProfileState(currentProfile);
      });
    }
    loadProfiles();

    const exportProfileBtn = document.getElementById('exportProfileBtn');
    const importProfileBtn = document.getElementById('importProfileBtn');
    const importProfileFile = document.getElementById('importProfileFile');
    const profileMessage = document.getElementById('profileMessage');

    // Export profiles to JSON file
    exportProfileBtn.addEventListener('click', () => {
      const dataStr = JSON.stringify(profiles, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pattern-url-profiles.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      showProfileMessage('Exported profiles to JSON.', 'success');
    });

    // Import profiles from JSON file
    importProfileBtn.addEventListener('click', () => {
      importProfileFile.value = '';
      importProfileFile.click();
    });
    importProfileFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(evt) {
        try {
          const imported = JSON.parse(evt.target.result);
          if (!imported || typeof imported !== 'object') throw new Error('Invalid file');
          if (!confirm('Importing will overwrite your current profiles. Continue?')) return;
          profiles = imported;
          currentProfile = Object.keys(profiles)[0];
          chrome.storage.local.set({ profiles, currentProfile }, () => {
            updateProfileDropdown();
            restoreProfileState(currentProfile);
            updateCurrentProfileName();
            showProfileMessage('Imported profiles successfully.', 'success');
          });
        } catch (err) {
          showProfileMessage('Invalid JSON file.', 'error');
        }
      };
      reader.readAsText(file);
    });
    function showProfileMessage(text, type) {
      profileMessage.textContent = text;
      profileMessage.className = `message ${type}`;
    }
  });
  