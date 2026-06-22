const api = (function () {
  const BASE_URL = 'https://www.googleapis.com/youtube/v3';

  function getApiKey() {
    return localStorage.getItem('ytfinder_apikey') || '';
  }

  function request(endpoint, data) {
    const deferred = $.Deferred();
    const key = getApiKey();

    if (!key) {
      handleApiError(null, 'apiKeyMissing');
      deferred.reject({ code: 'NO_KEY' });
      return deferred.promise();
    }

    const params = Object.assign({}, data, { key });
    $.ajax({
      url: `${BASE_URL}/${endpoint}`,
      method: 'GET',
      data: params,
      dataType: 'json',
      timeout: 15000,
    })
      .done((response) => deferred.resolve(response))
      .fail((jqXHR, textStatus) => {
        handleApiError(jqXHR, textStatus);
        deferred.reject(jqXHR);
      });

    return deferred.promise();
  }

  function searchChannels(query) {
    const deferred = $.Deferred();
    if (!query || !query.trim()) {
      deferred.resolve([]);
      return deferred.promise();
    }
    request('search', {
      part: 'snippet',
      type: 'channel',
      q: query,
      maxResults: 5,
    })
      .done((response) => {
        const ids = response.items
          .map((item) => item.id?.channelId || item.snippet?.channelId)
          .filter(Boolean)
          .join(',');
        if (!ids) {
          deferred.resolve([]);
          return;
        }
        getChannelDetails(ids)
          .done((details) => deferred.resolve(details.items || []))
          .fail((error) => deferred.reject(error));
      })
      .fail((error) => deferred.reject(error));

    return deferred.promise();
  }

  function getChannelDetails(channelId) {
    return request('channels', {
      part: 'snippet,statistics,brandingSettings,contentDetails,topicDetails',
      id: channelId,
      maxResults: 5,
    });
  }

  function getChannelVideos(channelId, pageToken = '') {
    return request('search', {
      part: 'snippet',
      channelId,
      type: 'video',
      order: 'date',
      maxResults: 12,
      pageToken,
    });
  }

  function getVideoStats(videoIds) {
    return request('videos', {
      part: 'statistics,contentDetails,snippet',
      id: videoIds,
      maxResults: 12,
    });
  }

  function getChannelPlaylists(channelId) {
    return request('playlists', {
      part: 'snippet,contentDetails',
      channelId,
      maxResults: 8,
    });
  }

  function handleApiError(jqXHR, type) {
    let title = 'Something went wrong';
    let message = 'Please try again later.';
    if (type === 'apiKeyMissing') {
      title = 'API key missing';
      message = 'Please add your YouTube API key to continue.';
      ui.showError('apiKeyMissing');
      return;
    }
    if (!jqXHR) {
      ui.showError('network');
      return;
    }
    const status = jqXHR.status;
    if (status === 400) {
      title = 'Invalid API key';
      message = 'Please check your key and try again.';
      localStorage.removeItem('ytfinder_apikey');
      ui.showError('invalidKey');
      ui.showApiKeyModal();
      return;
    }
    if (status === 403) {
      title = 'Daily API quota exceeded';
      message = 'YouTube allows 10,000 units/day.';
      ui.showError('quota');
      return;
    }
    if (status === 404) {
      title = 'Channel not found';
      message = 'Try searching with a different name or @handle.';
      ui.showError('notFound');
      return;
    }
    ui.showError('network');
  }

  return {
    getApiKey,
    searchChannels,
    getChannelDetails,
    getChannelVideos,
    getVideoStats,
    getChannelPlaylists,
    handleApiError,
  };
})();
