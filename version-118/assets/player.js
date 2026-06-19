
import { H as Hls } from './hls-dru42stk.js';

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }
  var minutes = Math.floor(seconds / 60);
  var remain = Math.floor(seconds % 60);
  return minutes + ':' + String(remain).padStart(2, '0');
}

function initializePlayer(player) {
  var video = player.querySelector('video');
  var playOverlay = player.querySelector('[data-player-play]');
  var toggle = player.querySelector('[data-player-toggle]');
  var progress = player.querySelector('[data-player-progress]');
  var time = player.querySelector('[data-player-time]');
  var mute = player.querySelector('[data-player-mute]');
  var fullscreen = player.querySelector('[data-player-fullscreen]');
  var hlsUrl = player.dataset.hls;
  var mp4Url = player.dataset.mp4;
  var hlsInstance = null;

  if (!video || !hlsUrl) {
    return;
  }

  function useMp4Fallback() {
    if (mp4Url && video.src !== mp4Url) {
      video.src = mp4Url;
      video.load();
    }
  }

  if (Hls && Hls.isSupported()) {
    hlsInstance = new Hls({
      enableWorker: true,
      lowLatencyMode: true
    });
    hlsInstance.loadSource(hlsUrl);
    hlsInstance.attachMedia(video);
    hlsInstance.on(Hls.Events.ERROR, function (_event, data) {
      if (data && data.fatal) {
        hlsInstance.destroy();
        hlsInstance = null;
        useMp4Fallback();
      }
    });
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = hlsUrl;
  } else {
    useMp4Fallback();
  }

  function updateState() {
    player.classList.toggle('is-playing', !video.paused);
    if (toggle) {
      toggle.textContent = video.paused ? '播放' : '暂停';
    }
  }

  function updateProgress() {
    if (progress) {
      progress.max = Number.isFinite(video.duration) ? String(video.duration) : '0';
      progress.value = Number.isFinite(video.currentTime) ? String(video.currentTime) : '0';
    }
    if (time) {
      time.textContent = formatTime(video.currentTime) + ' / ' + formatTime(video.duration);
    }
  }

  function togglePlay() {
    if (video.paused) {
      video.play().catch(function () {
        useMp4Fallback();
        video.play().catch(function () {});
      });
    } else {
      video.pause();
    }
  }

  if (playOverlay) {
    playOverlay.addEventListener('click', togglePlay);
  }
  if (toggle) {
    toggle.addEventListener('click', togglePlay);
  }
  if (mute) {
    mute.addEventListener('click', function () {
      video.muted = !video.muted;
      mute.textContent = video.muted ? '取消静音' : '静音';
    });
  }
  if (fullscreen) {
    fullscreen.addEventListener('click', function () {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        player.requestFullscreen().catch(function () {});
      }
    });
  }
  if (progress) {
    progress.addEventListener('input', function () {
      video.currentTime = Number(progress.value || 0);
    });
  }

  video.addEventListener('play', updateState);
  video.addEventListener('pause', updateState);
  video.addEventListener('loadedmetadata', updateProgress);
  video.addEventListener('timeupdate', updateProgress);
  video.addEventListener('ended', updateState);

  updateState();
  updateProgress();
}

document.querySelectorAll('[data-player]').forEach(initializePlayer);
