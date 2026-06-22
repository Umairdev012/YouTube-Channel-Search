const channelRenderer = (function () {
  function renderChannelResults(channels) {
    if (!channels.length) {
      $('#searchResultsList').html('<p>No channels found. Try a different name.</p>');
      ui.showScreen('results');
      return;
    }
    const html = channels
      .map((channel) => {
        const thumb = channel.snippet.thumbnails?.default?.url || 'https://via.placeholder.com/80?text=No+Image';
        const subscribers = formatNumber(channel.statistics?.subscriberCount || 0);
        const videos = formatNumber(channel.statistics?.videoCount || 0);
        const description = channel.snippet.description || 'No description available.';
        const channelUrl = `https://www.youtube.com/channel/${channel.id}`;
        const handleText = `@${channel.snippet.customUrl || channel.snippet.title.replace(/\s+/g, '')}`;
        return `<div class="result-card" data-channel-id="${channel.id}">
          <div class="result-main">
            <img src="${thumb}" alt="${channel.snippet.title}" onerror="this.src='https://via.placeholder.com/80?text=No+Image'" />
            <div>
              <h3><a href="${channelUrl}" target="_blank" rel="noopener noreferrer">${channel.snippet.title}</a></h3>
              <p class="result-subtext"><a href="${channelUrl}" target="_blank" rel="noopener noreferrer">${handleText}</a></p>
              <p class="result-subtext">${subscribers} subscribers • ${videos} videos</p>
              <p>${description.substring(0, 80)}...</p>
            </div>
            <div class="result-actions"><button class="btn btn-secondary view-profile-button" data-id="${channel.id}">View Profile</button></div>
          </div>
        </div>`;
      })
      .join('');
    $('#searchResultsList').html(html);
    ui.showScreen('results');
  }

  function renderChannelProfile(channelData) {
    const channel = channelData.items?.[0] || channelData;
    if (!channel) {
      ui.showError('notFound');
      return;
    }
    const headerHtml = renderChannelHeader(channel);
    $('#channelBannerContainer').html(headerHtml.banner);
    $('#channelHeaderContainer').html(headerHtml.details);
    initTabs(channel);
    ui.showScreen('profile');
    ui.hideSkeleton();
  }

  function renderChannelHeader(channel) {
    const bannerUrl = channel.brandingSettings?.image?.bannerExternalUrl || '';
    const avatarUrl = channel.snippet.thumbnails?.high?.url || channel.snippet.thumbnails?.default?.url || 'https://via.placeholder.com/150?text=No+Image';
    const title = channel.snippet.title;
    const handle = channel.snippet.customUrl ? `@${channel.snippet.customUrl}` : `@${title.replace(/\s+/g, '')}`;
    const verified = channel.statistics?.hiddenSubscriberCount === false;
    const subscriberText = formatNumber(channel.statistics?.subscriberCount || 0) + ' Subscribers';
    const videoText = formatNumber(channel.statistics?.videoCount || 0) + ' Videos';
    const viewText = formatNumber(channel.statistics?.viewCount || 0) + ' Views';
    const country = channel.snippet.country || 'Unknown';
    const joined = formatDate(channel.snippet.publishedAt);
    const channelUrl = `https://www.youtube.com/channel/${channel.id}`;
    const customUrlLine = channel.snippet.customUrl ? `<span class="channel-meta">Custom URL: <a href="https://www.youtube.com/@${channel.snippet.customUrl}" target="_blank" rel="noopener noreferrer">@${channel.snippet.customUrl}</a></span>` : '';
    return {
      banner: `<div class="profile-card profile-banner" style="background-image: url('${bannerUrl || 'https://via.placeholder.com/1200x300/ff0000/ffffff?text=TubeFinder'}');"></div>`,
      details: `<div class="channel-header">
        <div class="profile-avatar"><img src="${avatarUrl}" alt="${title}" onerror="this.src='https://via.placeholder.com/150?text=No+Image'" /></div>
        <div class="channel-info">
          <h2>${title}${verified ? '<span class="verified-badge"><i class="fa-solid fa-check"></i> Verified</span>' : ''}</h2>
          <p class="channel-handle">${handle}</p>
          ${customUrlLine}
          <p class="channel-meta">${subscriberText} • ${videoText} • ${viewText}</p>
          <p class="channel-meta">${country} • Joined ${joined}</p>
          <div class="channel-actions">
            <a class="btn" href="${channelUrl}" target="_blank" rel="noopener noreferrer">Open on YouTube</a>
            <button class="btn btn-secondary" id="copyChannelUrl" data-url="${channelUrl}" type="button">Copy Channel URL</button>
            <a class="btn btn-secondary" href="${channelUrl}" target="_blank" rel="noopener noreferrer">Subscribe</a>
          </div>
        </div>
      </div>`,
    };
  }

  function initTabs(channel) {
    const tabButtons = ['videos', 'about', 'playlists', 'stats', 'topVideos']
      .map((tab) => `<button class="tab-button" data-tab="${tab}">${tab === 'topVideos' ? 'Top Videos' : tab.charAt(0).toUpperCase() + tab.slice(1)}</button>`)
      .join('');
    $('#tabControls').html(tabButtons);
    $('#tabVideos').html(`<div class="video-grid" id="videoGrid"></div><div class="action-row"><button class="btn btn-secondary" id="loadMoreVideos">Load More Videos</button><div class="sort-row"><label for="videoSort">Sort by</label><select id="videoSort"><option value="latest">Latest</option><option value="views">Most Viewed</option><option value="likes">Most Liked</option></select></div></div>`);
    $('#tabAbout').html(renderAboutTab(channel));
    $('#tabPlaylists').html('<div class="playlist-grid" id="playlistGrid"></div>');
    $('#tabStats').html('<div id="statsPanel"></div>');
    $('#tabTopVideos').html('<div class="top-videos-list" id="topVideosList"></div>');
    ui.switchTab('videos');
  }

  function renderAboutTab(channel) {
    const description = channel.snippet.description || 'No description available.';
    const trimmed = description.length > 300 ? `${description.slice(0, 300)}...` : description;
    const keywords = channel.topicDetails?.topicCategories || [];
    const tags = keywords.map((tag) => `<span class="tag-pill">${tag.split('/').pop().replace(/-/g, ' ')}</span>`).join('');
    const links = channel.brandingSettings?.channel?.keywords ? channel.brandingSettings.channel.keywords.split(' ').map((item) => `<span class="tag-pill">${item}</span>`).join('') : '';
    return `<div class="tab-panel">
      <div class="section-block"><h3>About</h3><p>${description}</p></div>
      <div class="section-block"><h3>Keywords</h3><div class="tag-row">${tags || '<span class="tag-pill">No tags available</span>'}</div></div>
      <div class="section-block"><h3>Links</h3><div class="tag-row">${links || '<span class="tag-pill">No links found</span>'}</div></div>
    </div>`;
  }

  function calculateChannelAge(createdAt) {
    const created = new Date(createdAt);
    const now = new Date();
    const years = now.getFullYear() - created.getFullYear();
    const months = now.getMonth() - created.getMonth() + years * 12;
    const displayYears = Math.floor(months / 12);
    const displayMonths = months % 12;
    return `${displayYears} years ${displayMonths} months`;
  }

  function calculateUploadFrequency(totalVideos, ageMonths) {
    if (!ageMonths) return '0.0';
    return (totalVideos / ageMonths).toFixed(1);
  }

  function calculateEngagementRate(stats) {
    const views = Number(stats.viewCount) || 0;
    const likes = Number(stats.likeCount) || 0;
    const comments = Number(stats.commentCount) || 0;
    if (!views) return '0.0';
    return (((likes + comments) / views) * 100).toFixed(1);
  }

  function copyChannelURL(url) {
    navigator.clipboard.writeText(url).then(() => {
      ui.showToast('Channel URL copied!', 'success');
    });
  }

  function parseFormattedMetric(value) {
    const text = String(value).trim();
    if (text.endsWith('%')) return Number(text.replace('%', ''));
    if (text.includes(' years')) return Number(text.split(' ')[0]) * 12;
    if (text.includes(' months')) return Number(text.split(' ')[0]);
    const number = Number(text.replace(/[,\s]/g, ''));
    if (!Number.isNaN(number)) return number;
    const suffix = text.slice(-1).toUpperCase();
    const base = Number(text.slice(0, -1)) || 0;
    if (suffix === 'K') return base * 1000;
    if (suffix === 'M') return base * 1000000;
    if (suffix === 'B') return base * 1000000000;
    return base;
  }

  function renderCompareView(left, right) {
    const leftStats = getCompareStats(left);
    const rightStats = getCompareStats(right);
    const rows = [
      ['Subscribers', leftStats.subscribers, rightStats.subscribers],
      ['Total Videos', leftStats.videos, rightStats.videos],
      ['Total Views', leftStats.views, rightStats.views],
      ['Avg Views/Video', leftStats.avgViews, rightStats.avgViews],
      ['Channel Age', leftStats.ageText, rightStats.ageText],
      ['Upload Freq/Month', leftStats.uploadFreq, rightStats.uploadFreq],
      ['Engagement Rate', leftStats.engagement, rightStats.engagement],
    ];
    const tableRows = rows
      .map(([label, leftValue, rightValue]) => {
        const leftNumeric = parseFormattedMetric(leftValue);
        const rightNumeric = parseFormattedMetric(rightValue);
        const leftWin = leftNumeric > rightNumeric;
        const rightWin = rightNumeric > leftNumeric;
        return `<tr>
          <th>${label}</th>
          <td class="${leftWin ? 'compare-winner' : ''}">${leftValue}</td>
          <td class="${rightWin ? 'compare-winner' : ''}">${rightValue}</td>
        </tr>`;
      })
      .join('');
    const overall = leftStats.score >= rightStats.score ? left.snippet.title : right.snippet.title;
    $('#compareResultSection').removeClass('hidden').html(`<div class="compare-card"><h3>Winner Overall: ${overall}</h3><table class="compare-table"><thead><tr><th>Metric</th><th>Channel 1</th><th>Channel 2</th></tr></thead><tbody>${tableRows}</tbody></table><div class="chart-panel"><canvas id="compareChart"></canvas></div></div>`);
    renderCompareChart(leftStats, rightStats);
  }

  function getCompareStats(channel) {
    const subs = Number(channel.statistics?.subscriberCount) || 0;
    const videos = Number(channel.statistics?.videoCount) || 0;
    const views = Number(channel.statistics?.viewCount) || 0;
    const ageMonths = Number(calculateChannelAge(channel.snippet.publishedAt).split(' ')[0]) * 12 || 1;
    const avg = videos ? Math.round(views / videos) : 0;
    const freq = calculateUploadFrequency(videos, ageMonths);
    const engagement = calculateEngagementRate(channel.statistics) + '%';
    const ageText = calculateChannelAge(channel.snippet.publishedAt);
    const score = subs + views / 1000 + avg;
    return {
      subscribers: formatNumber(subs),
      videos: formatNumber(videos),
      views: formatNumber(views),
      avgViews: formatNumber(avg),
      uploadFreq: freq,
      engagement,
      ageText,
      score,
    };
  }

  function renderCompareChart(leftStats, rightStats) {
    videoRenderer.destroyCharts();
    const ctx = document.getElementById('compareChart');
    if (!ctx) return;
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Subscribers', 'Views'],
        datasets: [
          { label: 'Channel 1', data: [parseFormattedMetric(leftStats.subscribers), parseFormattedMetric(leftStats.views)], backgroundColor: '#ff0000' },
          { label: 'Channel 2', data: [parseFormattedMetric(rightStats.subscribers), parseFormattedMetric(rightStats.views)], backgroundColor: '#2f7cff' },
        ],
      },
      options: { responsive: true, plugins: { legend: { labels: { color: 'var(--text)' } } }, scales: { x: { ticks: { color: 'var(--text)' } }, y: { ticks: { color: 'var(--text)' } } } },
    });
    ui.charts.push(chart);
  }

  return {
    renderChannelResults,
    renderChannelProfile,
    renderChannelHeader,
    renderAboutTab,
    calculateChannelAge,
    calculateUploadFrequency,
    calculateEngagementRate,
    copyChannelURL,
    renderCompareView,
  };
})();
