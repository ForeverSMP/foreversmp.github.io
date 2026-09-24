// ====================================================================
// SETTINGS
// ====================================================================

// Determines how many videos appear in the combined homepage feed.
const videosToShow = 25;


// ====================================================================
// FORMAT PUBLISHED DATE
// Converts the stored date into "X days ago"
// ====================================================================

function formatPublishedDate(publishedAt) {

    const publishedDate =
        new Date(publishedAt);

    const currentDate =
        new Date();

    const differenceInMilliseconds =
        currentDate - publishedDate;

    const differenceInDays =
        Math.floor(
            differenceInMilliseconds /
            (1000 * 60 * 60 * 24)
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
// CREATE VIDEO CARD
// ====================================================================

function createVideoCard(video) {

    // Our JSON file now contains simplified video objects,
    // so we no longer need to navigate YouTube's API structure.

    const title =
        video.title;

    const channelName =
        video.channelName;

    const publishedAt =
        formatPublishedDate(
            video.publishedAt
        );

    const thumbnail =
        video.thumbnail;

    const videoId =
        video.videoId;


    // Create the video card.

    const videoCard =
        document.createElement("div");

    videoCard.className =
        "VideoCard";


    // Add the contents of the card.

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
// LOAD VIDEOS
// ====================================================================

async function loadVideos() {

    // ------------------------------------------------------------
    // Find the video container.
    // ------------------------------------------------------------

    const container =
        document.getElementById(
            "ForeverContainer"
        );
        
    try {
        // ------------------------------------------------------------
        // Load our pre-generated video data.
        // ------------------------------------------------------------

        const response =
            await fetch("data/videos.json");

        if (!response.ok) {
            throw new Error(`Failed to load video data: ${response.status}`);
        }


        const data =
            await response.json();

        // ------------------------------------------------------------
        // The JSON file is already sorted newest → oldest.
        //
        // We only need the first videosToShow entries for the homepage.
        // ------------------------------------------------------------

        const videosToDisplay =
            data.videos.slice(
                0,
                videosToShow
            );

        // ------------------------------------------------------------
        // Create the video cards.
        // ------------------------------------------------------------

        videosToDisplay.forEach(video => {

            const videoCard =
                createVideoCard(video);

            container.appendChild(
                videoCard
            );
        });
    }
    catch (error) {

        console.error(
            "Unable to load video feed:",
            error
        );

        container.innerHTML = `
            <p class="VideoFeedError">
                The video feed is temporarily unavailable.
                Please try again later.
            </p>
        `;

    }
}

// ====================================================================
// START
// ====================================================================

loadVideos();