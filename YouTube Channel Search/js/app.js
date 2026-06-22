const app = (function () {
  const state = {
    apiKey: '',
    currentChannel: null,
    theme: 'dark-mode',
    history: [],
    compareMode: false,
  };

  const selectors = {
    searchInput: '#searchInput',
    clearSearchButton: '#clearSearchButton',
    searchButton: '#searchButton',
    saveApiKeyButton: '#saveApiKeyButton',
    apiKeyInput: '#apiKeyInput',
    footerChangeKey: '#footerChangeKey',
    themeToggle: '#themeToggle',
    footerThemeToggle: '#footerThemeToggle',
    compareButton: '#compareButton',
    exitCompareButton: '#exitCompareButton',
    historyBar: '#historyBar',
    searchDropdown: '#searchDropdown',
    searchResultsList: '#searchResultsList',
    copyChannelUrl: '#copyChannelUrl',
  };

  let searchTimer = null;

  function init() {
    state.apiKey = api.getApiKey();
    state.theme = localStorage.getItem('ytfinder_theme') || 'dark-mode';
    setTheme(state.theme);
    loadHistory();
    bindEvents();
    if (!state.apiKey) {
      ui.showApiKeyModal();
      setSearchDisabled(true);
      return;
    }
    setSearchDisabled(false);
    ui.showScreen('results');
  }

  function bindEvents() {
    $(selectors.saveApiKeyButton).on('click', saveApiKey);
    $(selectors.footerChangeKey).on('click', () => ui.showApiKeyModal());
    $(selectors.themeToggle).on('click', toggleTheme);
    $(selectors.footerThemeToggle).on('click', toggleTheme);
    $(selectors.searchInput).on('input', handleSearchInput);
    $(selectors.searchInput).on('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        doSearch();
      }
    });
    $(selectors.clearSearchButton).on('click', clearSearch);
    $(selectors.searchButton).on('click', doSearch);
    $(selectors.searchDropdown).on('click', '.search-result-item', function () {
      const channelId = $(this).data('channel-id');
      if (channelId) loadChannelProfile(channelId);
      ui.hideSearchDropdown();
    });
    $(document).on('click', function (event) {
      if (!$(event.target).closest('#searchDropdown, #searchInput').length) ui.hideSearchDropdown();
    });
    $(selectors.historyBar).on('click', '.history-item', function (event) {
      const channelId = $(this).data('channel-id');
      if ($(event.target).is('button')) {
        removeHistoryItem(channelId);
        return;
      }
      if (channelId) loadChannelProfile(channelId);
    });
    $('#historyBar').on('click', '.clear-history', clearHistory);
    $('#searchResultsList').on('click', '.view-profile-button', function () {
      const id = $(this).data('id');
      if (id) loadChannelProfile(id);
    });
    $(selectors.compareButton).on('click', ui.initCompareMode);
    $(selectors.exitCompareButton).on('click', () => { ui.showScreen('results'); });
    $(document).on('keydown', (event) => {
      if (event.key === '/') {
        event.preventDefault();
        $(selectors.searchInput).focus();
      }
    });
    $('body').on('click', '#copyChannelUrl', function () {
      channelRenderer.copyChannelURL($(this).data('url'));
    });
    $('body').on('click', '#errorChangeKey', function () {
      ui.showApiKeyModal();
    });
    $('body').on('click', '#videoSort', function () {
      videoRenderer.sortVideos($(this).val());
    });
    $('body').on('click', '#loadMoreVideos', function () {
      if (videoRenderer.state.currentChannelId) videoRenderer.loadMoreVideos(videoRenderer.state.currentChannelId);
    });
    $('body').on('click', '.compare-search-button', function () {
      const panel = $(this).closest('.compare-panel');
      const query = panel.find('.compare-search-input').val().trim();
      const side = panel.data('side');
      searchCompareChannel(query, side, panel);
    });
    $('body').on('input', '.compare-search-input', debounce(function () {
      const panel = $(this).closest('.compare-panel');
      const query = $(this).val().trim();
      searchCompareSuggestions(query, panel);
    }, 600));
    $('body').on('click', '.compare-dropdown .search-result-item', function () {
      const channelId = $(this).data('channel-id');
      const panel = $(this).closest('.compare-panel');
      if (channelId && panel.length) {
        loadCompareChannel(channelId, panel);
      }
    });
  }

  function saveApiKey() {
    const key = $(selectors.apiKeyInput).val().trim();
    if (!key) {
      ui.showToast('Please enter a valid API key.', 'error');
      return;
    }
    localStorage.setItem('ytfinder_apikey', key);
    state.apiKey = key;
    ui.hideApiKeyModal();
    setSearchDisabled(false);
    ui.showToast('API key saved successfully', 'success');
  }

  function setTheme(theme) {
    state.theme = theme;
    $('body').removeClass('dark-mode light-mode').addClass(theme);
    localStorage.setItem('ytfinder_theme', theme);
    $(selectors.themeToggle).html(`<i class="fa-solid ${theme === 'dark-mode' ? 'fa-sun' : 'fa-moon'}"></i>`);
    $(selectors.footerThemeToggle).html(`<i class="fa-solid ${theme === 'dark-mode' ? 'fa-sun' : 'fa-moon'}"></i>`);
  }

  function toggleTheme() {
    const nextTheme = state.theme === 'dark-mode' ? 'light-mode' : 'dark-mode';
    setTheme(nextTheme);
  }

  function handleSearchInput() {
    const query = $(selectors.searchInput).val().trim();
    if (query.length) {
      $(selectors.clearSearchButton).removeClass('hidden');
      scheduleSearch(query);
    } else {
      $(selectors.clearSearchButton).addClass('hidden');
      ui.hideSearchDropdown();
    }
  }

  function clearSearch() {
    $(selectors.searchInput).val('');
    $(selectors.clearSearchButton).addClass('hidden');
    ui.hideSearchDropdown();
  }

  function scheduleSearch(query) {
    if (!api.getApiKey()) {
      ui.showApiKeyModal();
      return;
    }
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      api.searchChannels(query)
        .done((channels) => ui.renderSearchDropdown(channels))
        .fail(() => {});
    }, 600);
  }

  function setSearchDisabled(disabled) {
    $(selectors.searchButton).prop('disabled', disabled);
    $(selectors.searchButton).toggleClass('disabled', disabled);
  }

  function doSearch() {
    const query = $(selectors.searchInput).val().trim();
    if (!query) return;
    if (!api.getApiKey()) {
      ui.showApiKeyModal();
      return;
    }
    setSearchDisabled(true);
    ui.showSkeleton();
    api.searchChannels(query)
      .done((channels) => {
        channelRenderer.renderChannelResults(channels);
        if (channels.length) ui.showToast('Added to search history', 'info');
      })
      .always(() => {
        ui.hideSkeleton();
        setSearchDisabled(false);
      });
  }

  function loadChannelProfile(channelId) {
    ui.showLoading();
    ui.showSkeleton();
    api.getChannelDetails(channelId)
      .done((data) => {
        state.currentChannel = data.items?.[0];
        channelRenderer.renderChannelProfile(data);
        addHistoryItem(state.currentChannel);
        const channel = state.currentChannel;
        videoRenderer.state.currentChannelId = channelId;
        api.getChannelVideos(channelId)
          .done((videoResponse) => {
            videoRenderer.state.nextPageToken = videoResponse.nextPageToken || '';
            const ids = videoResponse.items.map((item) => item.id.videoId).join(',');
            if (!ids) {
              ui.hideLoading();
              return;
            }
            api.getVideoStats(ids)
              .done((statsResponse) => {
                statsResponse.items.forEach((item) => {
                  item.snippet = videoResponse.items.find((clip) => clip.id.videoId === item.id)?.snippet || item.snippet;
                });
                videoRenderer.state.videos = statsResponse.items;
                videoRenderer.sortVideos('latest');
                videoRenderer.renderTopVideos(videoRenderer.state.videos);
                videoRenderer.renderCharts(videoRenderer.state.videos, channel);
                api.getChannelPlaylists(channelId).done((playlists) => videoRenderer.renderPlaylists(playlists));
                ui.hideLoading();
              })
              .fail(() => ui.hideLoading());
          })
          .fail(() => ui.hideLoading());
      })
      .fail(() => ui.hideLoading());
  }

  function addHistoryItem(channel) {
    if (!channel) return;
    const item = {
      channelId: channel.id,
      name: channel.snippet.title,
      handle: channel.snippet.customUrl || channel.snippet.title.replace(/\s+/g, ''),
      avatar: channel.snippet.thumbnails?.default?.url || '',
      subscribers: formatNumber(channel.statistics?.subscriberCount || 0),
    };
    state.history = state.history.filter((entry) => entry.channelId !== item.channelId);
    state.history.unshift(item);
    state.history = state.history.slice(0, 10);
    saveHistory();
    renderHistory();
  }

  function loadHistory() {
    const raw = localStorage.getItem('ytfinder_history');
    state.history = raw ? JSON.parse(raw) : [];
    renderHistory();
  }

  function saveHistory() {
    localStorage.setItem('ytfinder_history', JSON.stringify(state.history));
  }

  function renderHistory() {
    if (!state.history.length) {
      $(selectors.historyBar).html('');
      return;
    }
    const html = state.history
      .map((item) => `<div class="history-item" data-channel-id="${item.channelId}"><img src="${item.avatar}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/40?text=No'" /><span>${item.name}</span><button type="button" aria-label="Remove history item"><i class="fa-solid fa-xmark"></i></button></div>`)
      .join('');
    $(selectors.historyBar).html(`${html}<button class="btn btn-link clear-history" type="button">Clear All</button>`);
  }

  function removeHistoryItem(channelId) {
    state.history = state.history.filter((item) => item.channelId !== channelId);
    saveHistory();
    renderHistory();
  }

  function clearHistory() {
    state.history = [];
    saveHistory();
    renderHistory();
  }

  function searchCompareChannel(query, side, panel) {
    if (!query) return;
    api.searchChannels(query).done((channels) => {
      const html = channels
        .map((channel) => `<div class="search-result-item" data-channel-id="${channel.id}"><img src="${channel.snippet.thumbnails?.default?.url || 'https://via.placeholder.com/80?text=No'}" alt="${channel.snippet.title}" onerror="this.src='https://via.placeholder.com/80?text=No'" /><div><strong>${channel.snippet.title}</strong><span class="result-subtext">${formatNumber(channel.statistics?.subscriberCount || 0)} subs</span></div></div>`)
        .join('');
      panel.find('.compare-dropdown').html(html).removeClass('hidden');
    });
  }

  function searchCompareSuggestions(query, panel) {
    if (!query) {
      panel.find('.compare-dropdown').addClass('hidden');
      return;
    }
    api.searchChannels(query).done((channels) => {
      const html = channels
        .map((channel) => `<div class="search-result-item" data-channel-id="${channel.id}"><img src="${channel.snippet.thumbnails?.default?.url || 'https://via.placeholder.com/80?text=No'}" alt="${channel.snippet.title}" onerror="this.src='https://via.placeholder.com/80?text=No'" /><div><strong>${channel.snippet.title}</strong><span class="result-subtext">${formatNumber(channel.statistics?.subscriberCount || 0)} subs</span></div></div>`)
        .join('');
      panel.find('.compare-dropdown').html(html).removeClass('hidden');
    });
  }

  function loadCompareChannel(channelId, panel) {
    api.getChannelDetails(channelId).done((data) => {
      const summary = data.items?.[0];
      if (!summary) return;
      panel.find('.compare-card-body').html(`<div class="result-card"><h4>${summary.snippet.title}</h4><p>${formatNumber(summary.statistics?.subscriberCount || 0)} subscribers</p><p>${formatNumber(summary.statistics?.viewCount || 0)} views</p><p>${formatNumber(summary.statistics?.videoCount || 0)} videos</p></div>`);
      panel.data('channel-data', summary);
      const leftData = $('.compare-panel[data-side="left"]').data('channel-data');
      const rightData = $('.compare-panel[data-side="right"]').data('channel-data');
      if (leftData && rightData) {
        channelRenderer.renderCompareView(leftData, rightData);
      }
    });
  }

  function debounce(fn, delay) {
    let timer = null;
    return function () {
      const args = arguments;
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  window.formatNumber = function (value) {
    const num = Number(value) || 0;
    if (num < 1000) return `${num}`;
    if (num < 1000000) return `${+(num / 1000).toFixed(num < 10000 ? 1 : 0)}K`;
    if (num < 1000000000) return `${+(num / 1000000).toFixed(1)}M`;
    return `${+(num / 1000000000).toFixed(1)}B`;
  };

  window.formatDate = function (dateStr) {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

  return {
    init,
    state,
  };
})();

$(document).ready(function () {
  app.init();
});
