const videoRenderer = (function () {
  const state = {
    videos: [],
    sortedVideos: [],
    nextPageToken: '',
    currentChannelId: '',
    statsById: {},
  };

  function renderVideoGrid(videos) {
    if (!videos.length) {
      $('#videoGrid').html('<p>No videos available.</p>');
      return;
    }
    const html = videos
      .map((video) => {
        const thumb = getVideoThumbnail(video);
        const duration = parseDuration(video.contentDetails?.duration || 'PT0S');
        const date = formatRelativeTime(video.snippet?.publishedAt);
        const views = formatNumber(video.statistics?.viewCount || 0);
        const likes = formatNumber(video.statistics?.likeCount || 0);
        const comments = formatNumber(video.statistics?.commentCount || 0);
        return `<div class="video-card" data-video-id="${video.id}">
          <div class="thumbnail-wrap">
            <img src="${thumb}" alt="${video.snippet.title}" onerror="this.src='https://via.placeholder.com/480x270?text=No+Image'" />
            <div class="play-overlay"><i class="fa-solid fa-circle-play fa-2x"></i></div>
            <span class="duration-badge">${duration}</span>
          </div>
          <div class="video-details">
            <h3>${video.snippet.title}</h3>
            <div class="video-meta">
              <span><i class="fa-regular fa-clock"></i> ${date}</span>
              <span><i class="fa-regular fa-eye"></i> ${views}</span>
              <span><i class="fa-regular fa-thumbs-up"></i> ${likes}</span>
              <span><i class="fa-regular fa-comment"></i> ${comments}</span>
            </div>
          </div>
        </div>`;
      })
      .join('');
    $('#videoGrid').html(html);
    $('.video-card').on('click', function () {
      const videoId = $(this).data('video-id');
      if (videoId) {
        window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank', 'noopener');
      }
    });
    $('.video-card').each(function (index) {
      $(this).css({ animationDelay: `${index * 80}ms` });
    });
  }

  function renderTopVideos(videos) {
    const top = [...videos].sort((a, b) => (Number(b.statistics?.viewCount) || 0) - (Number(a.statistics?.viewCount) || 0)).slice(0, 10);
    const html = top
      .map((video, index) => {
        const thumb = getVideoThumbnail(video);
        const views = formatNumber(video.statistics?.viewCount || 0);
        const likes = formatNumber(video.statistics?.likeCount || 0);
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
        return `<div class="top-video-item" data-video-id="${video.id}">
          <div class="top-video-rank">${medal || `#${index + 1}`}</div>
          <img src="${thumb}" alt="${video.snippet.title}" onerror="this.src='https://via.placeholder.com/160x90?text=No+Image'" />
          <div class="top-video-meta">
            <h4>${video.snippet.title}</h4>
            <p>${views} views • ${likes} likes</p>
          </div>
        </div>`;
      })
      .join('');
    $('#topVideosList').html(html);
    $('.top-video-item').on('click', function () {
      const videoId = $(this).data('video-id');
      if (videoId) window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank', 'noopener');
    });
  }

  function renderPlaylists(playlists) {
    if (!playlists.items || !playlists.items.length) {
      $('#tabPlaylists').html('<p>No playlists available.</p>');
      return;
    }
    const html = playlists.items
      .map((playlist) => {
        const thumb = playlist.snippet.thumbnails?.high?.url || playlist.snippet.thumbnails?.default?.url || 'https://via.placeholder.com/320x180?text=Playlist';
        return `<div class="playlist-card">
          <img src="${thumb}" alt="${playlist.snippet.title}" onerror="this.src='https://via.placeholder.com/320x180?text=Playlist'" />
          <h4>${playlist.snippet.title}</h4>
          <span class="playlist-count"><i class="fa-solid fa-list"></i> ${formatNumber(playlist.contentDetails?.itemCount || 0)} videos</span>
          <a class="btn btn-search" href="https://www.youtube.com/playlist?list=${playlist.id}" target="_blank" rel="noopener noreferrer">View Playlist</a>
        </div>`;
      })
      .join('');
    $('#tabPlaylists').html(`<div class="playlist-grid">${html}</div>`);
  }

  function sortVideos(by) {
    const sorted = [...state.videos];
    if (by === 'views') {
      sorted.sort((a, b) => Number(b.statistics?.viewCount || 0) - Number(a.statistics?.viewCount || 0));
    } else if (by === 'likes') {
      sorted.sort((a, b) => Number(b.statistics?.likeCount || 0) - Number(a.statistics?.likeCount || 0));
    } else {
      sorted.sort((a, b) => new Date(b.snippet?.publishedAt) - new Date(a.snippet?.publishedAt));
    }
    state.sortedVideos = sorted;
    renderVideoGrid(sorted);
  }

  function loadMoreVideos(channelId) {
    if (!state.nextPageToken) return;
    ui.showLoading();
    api.getChannelVideos(channelId, state.nextPageToken)
      .done((response) => {
        const ids = response.items.map((item) => item.id.videoId).join(',');
        state.nextPageToken = response.nextPageToken || '';
        if (!ids) {
          ui.hideLoading();
          return;
        }
        api.getVideoStats(ids).done((stats) => {
          stats.items.forEach((item) => {
            item.snippet = response.items.find((clip) => clip.id.videoId === item.id)?.snippet || item.snippet;
          });
          state.videos = state.videos.concat(stats.items);
          sortVideos($('#videoSort').val() || 'latest');
          renderTopVideos(state.videos);
          renderCharts(state.videos);
          ui.hideLoading();
        }).fail(() => ui.hideLoading());
      })
      .fail(() => ui.hideLoading());
  }

  function parseDuration(iso) {
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const match = iso.match(regex);
    if (!match) return '0:00';
    const hours = Number(match[1] || 0);
    const minutes = Number(match[2] || 0);
    const seconds = Number(match[3] || 0);
    const parts = [];
    if (hours) parts.push(hours);
    parts.push(String(hours ? minutes : minutes).padStart(hours ? 2 : 1, '0'));
    parts.push(String(seconds).padStart(2, '0'));
    return parts.join(':');
  }

  function formatRelativeTime(dateStr) {
    const date = new Date(dateStr);
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} days ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks} weeks ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} months ago`;
    const years = Math.floor(months / 12);
    return `${years} years ago`;
  }

  function getVideoThumbnail(video) {
    return video.snippet?.thumbnails?.high?.url || video.snippet?.thumbnails?.medium?.url || video.snippet?.thumbnails?.default?.url || 'https://via.placeholder.com/480x270?text=No+Image';
  }

  function renderCharts(videos, channel) {
    destroyCharts();
    const recent = videos.slice(0, 10);
    const labels = recent.map((item) => item.snippet.title.substring(0, 15));
    const viewData = recent.map((item) => Number(item.statistics?.viewCount) || 0);
    const likeData = recent.map((item) => Number(item.statistics?.likeCount) || 0);
    const commentData = recent.map((item) => Number(item.statistics?.commentCount) || 0);
    const monthly = getMonthlyUploads(videos);
    const months = monthly.map((item) => item.month);
    const uploads = monthly.map((item) => item.count);
    const chart1 = createChart('videoPerformanceChart', 'bar', { labels, datasets: [{ label: 'Views', data: viewData, backgroundColor: '#ff0000' }] });
    const chart2 = createChart('engagementChart', 'doughnut', { labels: ['Views', 'Likes', 'Comments'], datasets: [{ data: [sum(viewData), sum(likeData), sum(commentData)], backgroundColor: ['#ff0000', '#2f7cff', '#2ecc71'] }] });
    const chart3 = createChart('uploadFrequencyChart', 'line', { labels: months, datasets: [{ label: 'Uploads', data: uploads, borderColor: '#ff0000', backgroundColor: 'rgba(255,0,0,0.2)', fill: true }] });
    $('#tabStats').html(`<div class="stats-grid"><div class="stat-card"><strong id="statSubscribers">0</strong><p>Subscribers</p></div><div class="stat-card"><strong id="statViews">0</strong><p>Total Views</p></div><div class="stat-card"><strong id="statVideos">0</strong><p>Total Videos</p></div><div class="stat-card"><strong id="statAvgViews">0</strong><p>Average Views</p></div><div class="stat-card"><strong id="statEstViews">0</strong><p>Est. Views/Day</p></div><div class="stat-card"><strong id="statUploadFreq">0</strong><p>Uploads / Month</p></div></div><div class="chart-panel"><canvas id="videoPerformanceChart"></canvas></div><div class="chart-panel"><canvas id="engagementChart"></canvas></div><div class="chart-panel"><canvas id="uploadFrequencyChart"></canvas></div>`);
    if (channel) {
      const channelAge = channelRenderer.calculateChannelAge(channel.snippet.publishedAt);
      const days = Math.max(1, Math.floor((Date.now() - new Date(channel.snippet.publishedAt)) / 86400000));
      ui.animateCountUp('#statSubscribers', channel.statistics?.subscriberCount || 0);
      ui.animateCountUp('#statViews', channel.statistics?.viewCount || 0);
      ui.animateCountUp('#statVideos', channel.statistics?.videoCount || 0);
      ui.animateCountUp('#statAvgViews', Math.round((channel.statistics?.viewCount || 0) / Math.max(1, channel.statistics?.videoCount || 1)));
      ui.animateCountUp('#statEstViews', Math.round((channel.statistics?.viewCount || 0) / days));
      $('#statUploadFreq').text(channelRenderer.calculateUploadFrequency(channel.statistics?.videoCount || 0, Number(channelAge.split(' ')[0]) * 12));
    }
    $('#tabStats').append(`<div class="section-block"><p>Channel age: ${channel ? channelRenderer.calculateChannelAge(channel.snippet.publishedAt) : 'Unknown'}</p></div>`);
    ui.charts.push(chart1, chart2, chart3);
  }

  function createChart(elementId, type, data) {
    const container = $(`#${elementId}`);
    if (!container.length) {
      $(`#tabStats`).append(`<div class="chart-panel"><canvas id="${elementId}"></canvas></div>`);
    }
    const ctx = document.getElementById(elementId).getContext('2d');
    return new Chart(ctx, {
      type,
      data,
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: 'var(--text)' } } },
        scales: { x: { ticks: { color: 'var(--text)' } }, y: { ticks: { color: 'var(--text)' } } },
      },
    });
  }

  function destroyCharts() {
    ui.charts.forEach((chart) => {
      if (chart && typeof chart.destroy === 'function') chart.destroy();
    });
    ui.charts.length = 0;
  }

  function getMonthlyUploads(videos) {
    const months = {};
    videos.forEach((video) => {
      const date = new Date(video.snippet.publishedAt);
      const label = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      months[label] = (months[label] || 0) + 1;
    });
    return Object.entries(months)
      .slice(-12)
      .map(([month, count]) => ({ month, count }));
  }

  function sum(values) {
    return values.reduce((total, value) => total + Number(value || 0), 0);
  }

  return {
    state,
    renderVideoGrid,
    renderTopVideos,
    renderPlaylists,
    sortVideos,
    loadMoreVideos,
    parseDuration,
    formatRelativeTime,
    getVideoThumbnail,
    renderCharts,
    destroyCharts,
  };
})();
