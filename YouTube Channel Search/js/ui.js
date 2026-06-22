const ui = (function () {
  const selectors = {
    apiKeyModal: '#apiKeyModal',
    searchResultsSection: '#searchResultsSection',
    channelProfileSection: '#channelProfileSection',
    compareSection: '#compareSection',
    skeletonUI: '#skeletonUI',
    errorPanel: '#errorPanel',
    quotaBadge: '#quotaBadge',
    searchDropdown: '#searchDropdown',
  };
  const toastQueue = [];
  const maxToasts = 3;
  let charts = [];

  function showScreen(name) {
    $(selectors.searchResultsSection).addClass('hidden');
    $(selectors.channelProfileSection).addClass('hidden');
    $(selectors.compareSection).addClass('hidden');
    if (name === 'results') {
      $(selectors.searchResultsSection).removeClass('hidden');
    }
    if (name === 'profile') {
      $(selectors.channelProfileSection).removeClass('hidden');
    }
    if (name === 'compare') {
      $(selectors.compareSection).removeClass('hidden');
    }
  }

  function switchTab(tabName) {
    $('.tab-button').removeClass('active');
    $(`.tab-button[data-tab="${tabName}"]`).addClass('active');
    $('.tab-content').addClass('hidden');
    $(`#tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`).removeClass('hidden');
  }

  function showApiKeyModal() {
    $('#apiKeyModal').addClass('active').attr('aria-hidden', 'false');
    setTimeout(() => $('#apiKeyInput').focus(), 120);
  }

  function hideApiKeyModal() {
    $('#apiKeyModal').removeClass('active').attr('aria-hidden', 'true');
    $('#apiKeyInput').blur();
    $(':focus').blur();
  }

  function saveApiKey(key) {
    localStorage.setItem('ytfinder_apikey', key.trim());
    showToast('API key saved successfully', 'success');
  }

  function showSkeleton() {
    $(selectors.skeletonUI).removeClass('hidden');
    $(selectors.searchResultsSection).addClass('hidden');
    $(selectors.channelProfileSection).addClass('hidden');
    $(selectors.compareSection).addClass('hidden');
    $(selectors.errorPanel).addClass('hidden');
  }

  function hideSkeleton() {
    $(selectors.skeletonUI).addClass('hidden');
  }

  function showError(type, data = {}) {
    hideSkeleton();
    $(selectors.errorPanel).removeClass('hidden');
    let title = 'Something went wrong';
    let message = 'Unable to complete your request.';
    if (type === 'invalidKey') {
      title = 'Invalid API key';
      message = 'Please check your key and try again.';
      message += ' Use the button below to update your key.';
    }
    if (type === 'quota') {
      title = 'Daily API quota exceeded';
      message = `YouTube allows 10,000 units/day. Quota resets at midnight Pacific Time.`;
      const reset = calculateMidnightPT();
      message += ` Reset in ${reset}.`;
      $('#quotaBadge').removeClass('hidden');
    }
    if (type === 'notFound') {
      title = 'Channel not found';
      message = 'Try searching with a different name or @handle.';
    }
    if (type === 'network') {
      title = 'Connection failed';
      message = 'Please check your connection and retry.';
    }
    if (type === 'apiKeyMissing') {
      title = 'API key missing';
      message = 'Please add your YouTube API key to continue.';
      showApiKeyModal();
    }
    let html = `<h3>${title}</h3><p>${message}</p>`;
    if (type === 'invalidKey') {
      html += '<button class="btn btn-primary" id="errorChangeKey" type="button">Change API Key</button>';
    }
    $(selectors.errorPanel).html(html);
  }

  function showLoading() {
    $('#topLoadingBar').css({ width: '30%', opacity: 1 });
    setTimeout(() => {
      $('#topLoadingBar').css({ width: '70%' });
    }, 80);
  }

  function hideLoading() {
    $('#topLoadingBar').css({ width: '100%' });
    setTimeout(() => {
      $('#topLoadingBar').css({ opacity: 0, width: '0' });
    }, 250);
  }

  function renderSearchDropdown(channels) {
    if (!channels.length) {
      hideSearchDropdown();
      return;
    }
    const html = channels
      .map((channel) => {
        const thumb = channel.snippet.thumbnails?.default?.url || 'https://via.placeholder.com/80?text=No+Image';
        const subs = formatNumber(channel.statistics?.subscriberCount || 0);
        const channelUrl = `https://www.youtube.com/channel/${channel.id}`;
        return `<div class="search-result-item" data-channel-id="${channel.id}">
          <img src="${thumb}" alt="${channel.snippet.title}" onerror="this.src='https://via.placeholder.com/80?text=No+Image'" />
          <div class="search-result-meta">
            <strong><a href="${channelUrl}" target="_blank" rel="noopener noreferrer">${channel.snippet.title}</a></strong>
            <span class="result-subtext">${subs} subscribers</span>
          </div>
        </div>`;
      })
      .join('');
    $('#searchDropdown').html(html).removeClass('hidden');
  }

  function hideSearchDropdown() {
    $('#searchDropdown').addClass('hidden');
  }

  function initCompareMode() {
    $('#compareSplit').empty();
    $('#compareResultSection').addClass('hidden').empty();
    showScreen('compare');
    const leftPanel = createComparePanel('left');
    const rightPanel = createComparePanel('right');
    $('#compareSplit').append(leftPanel, rightPanel);
  }

  function createComparePanel(side) {
    return $(`<div class="compare-card compare-panel" data-side="${side}">
      <div class="section-header"><h3>Search ${side === 'left' ? 'Channel 1' : 'Channel 2'}</h3></div>
      <div class="search-form">
        <div class="search-input-group">
          <span class="search-icon"><i class="fa-brands fa-youtube"></i></span>
          <input type="text" class="compare-search-input" placeholder="Search channel name or @handle..." autocomplete="off" />
          <button class="clear-button hidden" type="button"></button>
        </div>
        <button class="btn btn-search compare-search-button" type="button">Search</button>
      </div>
      <div class="search-dropdown hidden compare-dropdown"></div>
      <div class="compare-card-body"></div>
    </div>`);
  }

  function animateCountUp(element, target, duration = 1500) {
    const node = $(element);
    const start = 0;
    const end = Number(target) || 0;
    const range = end - start;
    const startTime = performance.now();
    function step(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const value = Math.floor(start + range * progress);
      node.text(formatNumber(value));
      if (progress < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }

  function showToast(message, type = 'info') {
    if (toastQueue.length >= maxToasts) {
      const oldest = toastQueue.shift();
      oldest.remove();
    }
    const toast = $(`<div class="toast ${type}"><button type="button">&times;</button><div>${message}</div></div>`);
    toast.find('button').on('click', () => toast.remove());
    $('#toastContainer').append(toast);
    toastQueue.push(toast);
    setTimeout(() => toast.fadeOut(300, () => toast.remove()), 4000);
  }

  function calculateMidnightPT() {
    const now = new Date();
    const utcOffset = now.getTimezoneOffset();
    const pacificOffset = 8 * 60; // PT offset from UTC in minutes (standard)
    const localUtc = now.getTime() + utcOffset * 60000;
    const ptTime = new Date(localUtc - pacificOffset * 60000);
    const reset = new Date(ptTime);
    reset.setHours(24, 0, 0, 0);
    const diff = reset - ptTime;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  }

  return {
    showScreen,
    switchTab,
    showApiKeyModal,
    hideApiKeyModal,
    saveApiKey,
    showSkeleton,
    hideSkeleton,
    showError,
    showLoading,
    hideLoading,
    renderSearchDropdown,
    hideSearchDropdown,
    initCompareMode,
    animateCountUp,
    showToast,
    charts,
  };
})();
