const express = require('express');
const axios = require('axios');
const ytdl = require('ytdl-core');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Keys
const API_KEYS = {
  instagram: '9fce6e4548mshf560a01f53c8e50p10d78fjsn35aab00f5a91',
  tiktok: '9fce6e4548mshf560a01f53c8e50p10d78fjsn35aab00f5a91',
  youtube: '9fce6e4548mshf560a01f53c8e50p10d78fjsn35aab00f5a91'
};

// Platform Validation
const validatePlatform = (url) => {
  const platforms = {
    youtube: /(youtube\.com|youtu\.be)/i,
    facebook: /(facebook\.com|fb\.watch)/i,
    instagram: /instagram\.com/i,
    tiktok: /tiktok\.com/i,
    capcut: /capcut\.com/i
  };

  for (const [platform, regex] of Object.entries(platforms)) {
    if (regex.test(url)) return platform;
  }
  return null;
};

// API Endpoint
app.get('/alldown', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ 
        status: 'error',
        message: 'URL parameter is required',
        example: '/alldown?url=YOUR_VIDEO_URL'
      });
    }

    const platform = validatePlatform(url);
    if (!platform) {
      return res.status(400).json({
        status: 'error',
        message: 'Unsupported URL',
        supported_platforms: ['YouTube', 'Instagram', 'TikTok', 'Facebook', 'CapCut']
      });
    }

    console.log(`Processing ${platform} URL: ${url}`);

    let result;
    switch (platform) {
      case 'youtube':
        result = await handleYouTube(url);
        break;
      case 'facebook':
        result = await handleFacebook(url);
        break;
      case 'instagram':
        result = await handleInstagram(url);
        break;
      case 'tiktok':
        result = await handleTikTok(url);
        break;
      case 'capcut':
        result = await handleCapCut(url);
        break;
    }

    return res.json({
      status: 'success',
      platform,
      ...result
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to process URL',
      error: error.message
    });
  }
});

// YouTube Handler
async function handleYouTube(url) {
  // Using ytdl-core for direct YouTube processing
  const info = await ytdl.getInfo(url);
  const formats = ytdl.filterFormats(info.formats, 'videoandaudio');

  return {
    title: info.videoDetails.title,
    thumbnail: info.videoDetails.thumbnails[0].url,
    duration: info.videoDetails.lengthSeconds,
    qualities: {
      high: formats.find(f => f.qualityLabel === '1080p')?.url || 
           formats.find(f => f.qualityLabel === '720p')?.url,
      medium: formats.find(f => f.qualityLabel === '480p')?.url,
      low: formats.find(f => f.qualityLabel === '360p')?.url
    }
  };
}

// Instagram Handler
async function handleInstagram(url) {
  const options = {
    method: 'GET',
    url: 'https://instagram-downloader-download-instagram-videos-stories.p.rapidapi.com/index',
    params: { url },
    headers: {
      'X-RapidAPI-Key': API_KEYS.instagram,
      'X-RapidAPI-Host': 'instagram-downloader-download-instagram-videos-stories.p.rapidapi.com'
    }
  };

  const response = await axios.request(options);
  
  return {
    title: response.data.title || 'Instagram Video',
    thumbnail: response.data.thumbnail || null,
    media: {
      url: response.data.media,
      type: response.data.type // 'video' or 'image'
    }
  };
}

// TikTok Handler
async function handleTikTok(url) {
  const options = {
    method: 'GET',
    url: 'https://tiktok-downloader-download-tiktok-videos-without-watermark.p.rapidapi.com/vid/index',
    params: { url },
    headers: {
      'X-RapidAPI-Key': API_KEYS.tiktok,
      'X-RapidAPI-Host': 'tiktok-downloader-download-tiktok-videos-without-watermark.p.rapidapi.com'
    }
  };

  const response = await axios.request(options);
  
  return {
    title: response.data.title || 'TikTok Video',
    author: response.data.author || null,
    duration: response.data.duration || null,
    video: response.data.video[0] || response.data.video,
    music: response.data.music || null
  };
}

// Facebook Handler (using a proxy service)
async function handleFacebook(url) {
  const options = {
    method: 'GET',
    url: 'https://facebook-reel-and-video-downloader.p.rapidapi.com/app/main.php',
    params: { url },
    headers: {
      'X-RapidAPI-Key': API_KEYS.youtube, // Using the same key as YouTube
      'X-RapidAPI-Host': 'facebook-reel-and-video-downloader.p.rapidapi.com'
    }
  };

  const response = await axios.request(options);
  
  return {
    title: response.data.title || 'Facebook Video',
    thumbnail: response.data.thumbnail || null,
    duration: response.data.duration || null,
    video_url: response.data.links?.hd || response.data.links?.sd
  };
}

// CapCut Handler (uses TikTok as CapCut templates are hosted there)
async function handleCapCut(url) {
  // CapCut templates are typically hosted on TikTok
  return handleTikTok(url);
}

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Global Error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Try: http://localhost:${PORT}/alldown?url=YOUR_VIDEO_URL`);
});

module.exports = app;
