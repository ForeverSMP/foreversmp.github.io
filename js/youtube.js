// ====================================================================
// YOUTUBE API SETTINGS
// ====================================================================

const apiKey = "HIDDEN";
const channelId = "UCfSOL-2WVjtCo2BSlemAQWg";

// ====================================================================
// SETTINGS
// ====================================================================

// How many uploads to initially retrieve from YouTube.
const videosToFetch = 50;

// How many qualifying videos we actually want to display.
const videosToShow = 10;

// Videos this length or shorter are treated as Shorts.
const shortsMaxDuration = 180;

// ====================================================================
// FORMAT PUBLISHED DATE
// Converts YouTube's date into "X days ago"
// ====================================================================

function formatPublishedDate(publishedAt) {

    const publishedDate = new Date(publishedAt);
    const currentDate = new Date();

    const differenceInMilliseconds = currentDate - publishedDate;

    const differenceInDays = Math.floor(
        differenceInMilliseconds / (1000 * 60 * 60 * 24)
    );

    if (differenceInDays === 0) {
        return "Today";
    }

    if (differenceInDays === 1) {
        return "1 day ago";
    }

    return `${differenceInDays} days ago`;
}

// ====================================================================
// CONVERT YOUTUBE DURATION TO SECONDS
// ====================================================================
//
// YouTube gives us ISO 8601 durations:
//
// PT45S = 45 seconds
// PT2M30S = 2 minutes 30 seconds
// PT1H20M15S = 1 hour 20 minutes 15 seconds
//
// ====================================================================

function durationToSeconds(duration) {

    const match = duration.match(
        /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/
    );

    const hours = parseInt(match[1] || 0);
    const minutes = parseInt(match[2] || 0);
    const seconds = parseInt(match[3] || 0);

    return (hours * 3600) + (minutes * 60) + seconds;
}

// ====================================================================
// LOAD VIDEOS
// ====================================================================

async function loadVideos() {

    // STEP 1:
    // Ask YouTube for information about the channel.
    const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels` +
        `?part=contentDetails` +
        `&id=${channelId}` +
        `&key=${apiKey}`
    );

    const channelData = await channelResponse.json();

    // Find the channel's automatically generated uploads playlist.
    const uploadsPlaylist =
        channelData.items[0]
            .contentDetails
            .relatedPlaylists
            .uploads;


    // STEP 2:
    // Ask YouTube for the latest 50 items in that playlist.
    const videosResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems` +
        `?part=snippet` +
        `&playlistId=${uploadsPlaylist}` +
        `&maxResults=${videosToFetch}` +
        `&key=${apiKey}`
    );

    const videosData = await videosResponse.json();

    // Step 3:
    // Extract all of the video IDs.
    const videoIds = videosData.items.map(video => video.snippet.resourceId.videoId);

    // Step 4:
    // Ask YouTube for the content details of those videos.
    const detailsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos` +
        `?part=contentDetails` +
        `&id=${videoIds.join(",")}` +
        `&key=${apiKey}`
    );

    const detailsData = await detailsResponse.json();

    // Step 5:
    // Find videos that are 3 minutes or shorter.
    const shortVideoIds = new Set();

    detailsData.items.forEach(video => {
        const duration = durationToSeconds(
            video.contentDetails.duration
        );

        if (duration <= shortsMaxDuration) {
            shortVideoIds.add(video.id)
        }
    });

    // Step 6:
    // Filter shorts out of the original uploads array
    const filteredVideos = videosData.items.filter(video => {
        const videoId = video.snippet.resourceId.videoId;
        return !shortVideoIds.has(videoId);
    });

    // Step 7:
    // Take only the number of videos we actually want.
    const videosToDisplay = filteredVideos.slice(0, videosToShow);

    // Step 8:
    // Find the ForeverContainer on the webpage.
    const container = document.getElementById("ForeverContainer");

    // Step 9:
    // Generate a card for each qualifying video.
videosToDisplay.forEach(video => {

    const title = video.snippet.title;
    const publishedAt = formatPublishedDate(video.snippet.publishedAt)
    const thumbnail = video.snippet.thumbnails.high.url;
    const videoId = video.snippet.resourceId.videoId;
    const channelName = video.snippet.videoOwnerChannelTitle

    // Create card container.
    const videoCard = document.createElement("div");

    videoCard.className = "VideoCard";

    // Generate card contents.
    videoCard.innerHTML = `
    <a class="VideoThumbnail" 
       href="https://www.youtube.com/watch?v=${videoId}" 
       target="_blank">
        <img src="${thumbnail}" alt="${title}">
    </a>

    <div class="VideoInformation">

        <a class="VideoTitle"
           href="https://www.youtube.com/watch?v=${videoId}"
           target="_blank">
            <h2>${title}</h2>
        </a>

        <p class="ChannelName">${channelName}</p>
        <p class="PublishedDate">${publishedAt}</p>

    </div>
`;

    container.appendChild(videoCard);
});

}

// ====================================================================
// START
// ====================================================================
loadVideos();