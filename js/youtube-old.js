// ====================================================================
// YOUTUBE API SETTINGS
// ====================================================================

const apiKey = "HIDDEN";
const members = [
    {
        name:"A13XplaysMC",
        channelId:"UC8vrrLcaOmp20qfjt4vV44A"
    },
    {
        name:"Boss",
        channelId:"UCBC9dlYb6jcQymCA_0xNRiQ"
    },
    {
        name:"Bleaker",
        channelId:"UCPkLG5BwZZDM1iWnYwJtOIw"
    },
    {
        name:"CoolingMystery",
        channelId:"UCbOC_8viIkOd8shtLPpzvDA"
    },
    {
        name: "Deathdealer",
        channelId: "UCfSOL-2WVjtCo2BSlemAQWg"
    },
    {
        name: "Geeksqueek",
        channelId: "UCyztb52Bcw_GeKGEq5vSkuQ"
    },
    {
        name: "JoshyPowerz",
        channelId: "UCvUbQLuTDCubqJSmZPIGRyw"
    },
    {
        name: "L1me",
        channelId: "UCu8veMH8PQQD6CXKNE1hYCg"
    },
    {
        name: "The Mechanic",
        channelId: "UCzDbQvTvYOiccGfGkaI9x5w"
    },
    {
        name: "Mega_Techa",
        channelId: "UCizMLDvHiDXO3GmBY-hkQyQ"
    },
    {
        name: "Mineless",
        channelId: "UCEB6J6PvAAaQElxfdKgP1bQ"
    },
    {
        name: "RickyCFT",
        channelId: "UCuzlyu89um5S9B3QtBT_eLg"
    },
    {
        name: "Time Architect",
        channelId: "UCGnMh8VTiGD0T-1hlhHImeg"
    },
    {
        name: "TheRaidingViking",
        channelId: "UCvhtHMbXv9S0cvdyve7NnKA"
    },
    {
        name: "SirRepooc",
        channelId: "UCA2CF5qFK3tSg6uIGvKgQDg"
    },
    {
        name: "Sally-Jane",
        channelId: "UC1OXRLz6oZjbzXZMMCryn3g"
    },
    {
        name: "XselStyles",
        channelId: "UCMBpmWPKaRGgvu7cOKk-G7A"
    },
    {
        name: "Zeplington",
        channelId: "UC8HVP6f5cilnwDXt22IcD8Q"
    }
    
];

// ====================================================================
// SETTINGS
// ====================================================================

// How many uploads to initially retrieve from YouTube.
const videosToFetch = 50;

// Determines how many qualifying videos we retrieve from each creator.
const videosPerChannel = 10;
// Determines how many videos appear in the combined homepage feed.
const videosToShow = 25;

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
        /P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?/
    );

    if (!match) {
        console.warn(
            "Unable to parse video duration:",
            duration
        );

        return null;
    }

    const days = parseInt(match[1] || 0);
    const hours = parseInt(match[2] || 0);
    const minutes = parseInt(match[3] || 0);
    const seconds = parseInt(match[4] || 0);

    return (
        (days * 86400) +
        (hours * 3600) +
        (minutes * 60) +
        seconds
    );
}

// ====================================================================
// GET CHANNEL'S UPLOADS PLAYLIST
// ====================================================================

async function getUploadsPlaylist(channelId) {

    const response = await fetch(
        `https://www.googleapis.com/youtube/v3/channels` +
        `?part=contentDetails` +
        `&id=${channelId}` +
        `&key=${apiKey}`
    );

    const data = await response.json();

    return data.items[0]
        .contentDetails
        .relatedPlaylists
        .uploads;
}

// ====================================================================
// GET ONE PAGE OF UPLOADS
// ====================================================================

async function getPlaylistPage(playlistId, pageToken = "") {

    let url =
        `https://www.googleapis.com/youtube/v3/playlistItems` +
        `?part=snippet` +
        `&playlistId=${playlistId}` +
        `&maxResults=${videosToFetch}` +
        `&key=${apiKey}`;


    // Only add pageToken if one actually exists.

    if (pageToken) {
        url += `&pageToken=${pageToken}`;
    }


    const response = await fetch(url);

    return await response.json();
}

// ====================================================================
// GET VIDEO DETAILS
// ====================================================================

async function getVideoDetails(videoIds) {

    const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos` +
        `?part=contentDetails` +
        `&id=${videoIds.join(",")}` +
        `&key=${apiKey}`
    );

    return await response.json();
}

// ====================================================================
// CREATE VIDEO CARD
// ====================================================================

function createVideoCard(video) {

    const title =
        video.snippet.title;

    const channelName =
        video.snippet.videoOwnerChannelTitle;

    const publishedAt =
        formatPublishedDate(
            video.snippet.publishedAt
        );

    const thumbnail =
        video.snippet.thumbnails.high.url;

    const videoId =
        video.snippet.resourceId.videoId;


    const videoCard =
        document.createElement("div");

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

            <p class="ChannelName">
                ${channelName}
            </p>

            <p class="PublishedDate">
                ${publishedAt}
            </p>

        </div>
    `;


    return videoCard;
}

// ====================================================================
// GET CHANNEL VIDEOS
// ====================================================================

async function getChannelVideos(channelId) {

    // Get the uploads playlist.

    const uploadsPlaylist =
        await getUploadsPlaylist(channelId);


    // This will contain our qualifying long-form videos.

    const qualifyingVideos = [];


    // The first request doesn't have a page token.

    let nextPageToken = "";


    // Keep requesting pages until:
    //
    // 1. We have enough qualifying videos
    //
    // OR
    //
    // 2. YouTube has no more pages.

    do {

        // ----------------------------------------------------
        // Get the next page of uploads.
        // ----------------------------------------------------

        const playlistData =
            await getPlaylistPage(
                uploadsPlaylist,
                nextPageToken
            );


        // ----------------------------------------------------
        // Extract IDs from this page.
        // ----------------------------------------------------

        const videoIds =
            playlistData.items.map(video =>
                video.snippet.resourceId.videoId
            );


        // ----------------------------------------------------
        // Retrieve durations.
        // ----------------------------------------------------

        const detailsData =
            await getVideoDetails(videoIds);


        // ----------------------------------------------------
        // Build a collection of videos that should be excluded.
        // ----------------------------------------------------

        const shortVideoIds = new Set();


        detailsData.items.forEach(video => {

            const duration =
                durationToSeconds(
                    video.contentDetails.duration
                );


            if (duration !== null && duration > 0 && duration <= shortsMaxDuration) {

                shortVideoIds.add(video.id);

            }

        });


        // ----------------------------------------------------
        // Keep only long-form videos from this page.
        // ----------------------------------------------------

        const longFormVideos =
            playlistData.items.filter(video => {

                const videoId =
                    video.snippet.resourceId.videoId;

                return !shortVideoIds.has(videoId);

            });


        // ----------------------------------------------------
        // Add those videos to our main collection.
        // ----------------------------------------------------

        qualifyingVideos.push(
            ...longFormVideos
        );


        // ----------------------------------------------------
        // Store the token for the NEXT page.
        //
        // If there isn't another page, use an empty string.
        // ----------------------------------------------------

        nextPageToken =
            playlistData.nextPageToken || "";

    } while (
        qualifyingVideos.length < videosPerChannel &&
        nextPageToken
    );

    // Return the videos instead of displaying them

    return qualifyingVideos.slice(0, videosPerChannel);
}

// ====================================================================
// LOAD VIDEOS
// ====================================================================

async function loadVideos() {

    // Start loading every member at the same time.
    const memberRequests = members.map(member => getChannelVideos(member.channelId));

    // Wait until all members have finished loading.
    const memberVideoArrays = await Promise.all(memberRequests);
    
    // Combine the arrays into one large array
    const allVideos = memberVideoArrays.flat();

    console.log(
        "Combined videos:",
        allVideos.length
    );

    // Sort newest to oldest.

    allVideos.sort((a, b) => {

        const dateA =
            new Date(a.snippet.publishedAt);

        const dateB =
            new Date(b.snippet.publishedAt);

        return dateB - dateA;

    });


    // Take only the newest videos.

    const videosToDisplay =
        allVideos.slice(0, videosToShow);


    // Find the webpage container.

    const container =
        document.getElementById(
            "ForeverContainer"
        );


    // Render them.

    videosToDisplay.forEach(video => {

        const videoCard =
            createVideoCard(video);

        container.appendChild(videoCard);

    });

}

// ====================================================================
// START
// ====================================================================

loadVideos();