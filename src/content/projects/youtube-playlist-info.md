---
title: YouTube Playlist Info
summary: How long does that playlist really take? Paste the URL and find out.
description: Totals the watch time of any YouTube playlist, lists every video with its duration, and plays them inline. React, Material UI, YouTube Data API.
year: 2020
stack: [React, Material UI, YouTube Data API]
repo: https://github.com/thoughtlessmind/youtube-playlist-info
live: https://youtube-playlist-info.netlify.app
image: ../../assets/projects/ytPlaylistinfoSS1.png
featured: true
order: 3
---

The YouTube Data API returns durations per video in ISO 8601, paginated 50 at a time. The app walks the pages, sums the durations, and shows the total alongside the list.
