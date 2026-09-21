const apiKey = "HIDDEN";
const channelId = "UCfSOL-2WVjtCo2BSlemAQWg";

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
    //console.log(channelData)

    // Find the channel's automatically generated uploads playlist.
    const uploadsPlaylist =
        channelData.items[0]
            .contentDetails
            .relatedPlaylists
            .uploads;


    // STEP 2:
    // Ask YouTube for the latest 10 items in that playlist.
    const videosResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems` +
        `?part=snippet` +
        `&playlistId=${uploadsPlaylist}` +
        `&maxResults=10` +
        `&key=${apiKey}`
    );

    const videosData = await videosResponse.json();

    //console.log(videosData);
    const container = document.getElementById("ForeverContainer");

videosData.items.forEach(video => {

    const title = video.snippet.title;
    const publishedAt = formatPublishedDate(video.snippet.publishedAt)
    const thumbnail = video.snippet.thumbnails.high.url;
    const videoId = video.snippet.resourceId.videoId;
    const channelName = video.snippet.videoOwnerChannelTitle

    const videoCard = document.createElement("div");

    videoCard.className = "VideoCard";

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

loadVideos();