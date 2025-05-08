const express = require("express");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Multi-Platform Video Downloader API");
});

app.get("/download", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Missing ?url=" });

  try {
    let apiUrl = "";

    if (url.includes("tiktok.com")) {
      apiUrl = `https://tikwm.com/api?url=${encodeURIComponent(url)}`;
    } else if (url.includes("instagram.com")) {
      apiUrl = `https://saveinsta.app/api/ajaxSearch?url=${encodeURIComponent(url)}`;
    } else if (url.includes("facebook.com") || url.includes("fb.watch")) {
      apiUrl = `https://facebook.akadownload.com/api?url=${encodeURIComponent(url)}`;
    } else {
      return res.status(400).json({ error: "Unsupported platform" });
    }

    const response = await axios.get(apiUrl);
    res.json({ success: true, data: response.data });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Download failed", details: error.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
