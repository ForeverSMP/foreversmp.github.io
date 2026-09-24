// ====================================================================
// YOUTUBE API SETTINGS
// ====================================================================

// API key is retrieved from the GitHub Actions secret.
// It is NOT stored in this file.
const apiKey = process.env.YOUTUBE_API_KEY;


// ====================================================================
// FOREVERSMP MEMBERS
// ====================================================================

const members = [
    {
        name: "A13XplaysMC",
        channelId: "UC8vrrLcaOmp20qfjt4vV44A"
    },
    {
        name: "Boss",
        channelId: "UCBC9dlYb6jcQymCA_0xNRiQ"
    },
    {
        name: "Bleaker",
        channelId: "UCPkLG5BwZZDM1iWnYwJtOIw"
    },
    {
        name: "CoolingMystery",
        channelId: "UCbOC_8viIkOd8shtLPpzvDA"
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

// Maximum number of uploads requested per YouTube playlist page.
const videosToFetch = 50;

// Number of qualifying long-form videos to cache per creator.
const videosPerChannel = 10;

// Videos this length or shorter are treated as Shorts.
const shortsMaxDuration = 180;


// ====================================================================
// CONVERT YOUTUBE DURATION TO SECONDS
// ====================================================================
//
// YouTube provides durations using ISO 8601:
//
// PT45S       = 45 seconds
// PT2M30S     = 2 minutes 30 seconds
// PT1H20M15S  = 1 hour 20 minutes 15 seconds
// P0D         = zero duration
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

    const days =
        parseInt(match[1] || 0);

    const hours =
        parseInt(match[2] || 0);

    const minutes =
        parseInt(match[3] || 0);

    const seconds =
        parseInt(match[4] || 0);

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

async function getPlaylistPage(
    playlistId,
    pageToken = ""
) {

    let url =
        `https://www.googleapis.com/youtube/v3/playlistItems` +
        `?part=snippet` +
        `&playlistId=${playlistId}` +
        `&maxResults=${videosToFetch}` +
        `&key=${apiKey}`;

    // Only add pageToken if another page actually exists.
    if (pageToken) {

        url +=
            `&pageToken=${pageToken}`;
    }

    const response =
        await fetch(url);

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
// GET QUALIFYING VIDEOS FROM ONE CHANNEL
// ====================================================================

async function getChannelVideos(channelId) {

    // ------------------------------------------------------------
    // Find the channel's uploads playlist.
    // ------------------------------------------------------------

    const uploadsPlaylist =
        await getUploadsPlaylist(channelId);


    // ------------------------------------------------------------
    // Store qualifying long-form videos here.
    // ------------------------------------------------------------

    const qualifyingVideos = [];


    // ------------------------------------------------------------
    // The first playlist request doesn't require a page token.
    // ------------------------------------------------------------

    let nextPageToken = "";


    // ------------------------------------------------------------
    // Continue requesting playlist pages until:
    //
    // 1. We have enough qualifying videos
    //
    // OR
    //
    // 2. YouTube has no more pages.
    // ------------------------------------------------------------

    do {

        // Get next page of uploads.

        const playlistData =
            await getPlaylistPage(
                uploadsPlaylist,
                nextPageToken
            );


        // Extract video IDs.

        const videoIds =
            playlistData.items.map(video =>
                video.snippet.resourceId.videoId
            );


        // Retrieve duration information for those videos.

        const detailsData =
            await getVideoDetails(videoIds);


        // Store IDs belonging to Shorts.

        const shortVideoIds =
            new Set();


        detailsData.items.forEach(video => {

            const duration =
                durationToSeconds(
                    video.contentDetails.duration
                );


            if (
                duration !== null &&
                duration > 0 &&
                duration <= shortsMaxDuration
            ) {

                shortVideoIds.add(
                    video.id
                );
            }
        });


        // Remove Shorts from this page.

        const longFormVideos =
            playlistData.items.filter(video => {

                const videoId =
                    video.snippet.resourceId.videoId;

                return !shortVideoIds.has(
                    videoId
                );
            });


        // Add qualifying videos to our collection.

        qualifyingVideos.push(
            ...longFormVideos
        );


        // Store token for next page.

        nextPageToken =
            playlistData.nextPageToken || "";

    } while (
        qualifyingVideos.length < videosPerChannel &&
        nextPageToken
    );


    // Only return the requested number.

    return qualifyingVideos.slice(
        0,
        videosPerChannel
    );
}


// ====================================================================
// SIMPLIFY VIDEO DATA
// ====================================================================
//
// The YouTube API gives us much more information than the website
// actually requires.
//
// Instead of saving the complete YouTube response, create our own
// much smaller and easier-to-use video object.
//
// ====================================================================

function simplifyVideo(video) {

    return {

        videoId:
            video.snippet.resourceId.videoId,

        title:
            video.snippet.title,

        channelName:
            video.snippet.videoOwnerChannelTitle,

        channelId:
            video.snippet.videoOwnerChannelId,

        publishedAt:
            video.snippet.publishedAt,

        thumbnail:
            video.snippet.thumbnails.high.url
    };
}


// ====================================================================
// UPDATE VIDEO DATA
// ====================================================================

async function updateVideos() {

    // ------------------------------------------------------------
    // Make sure GitHub supplied our API key.
    // ------------------------------------------------------------

    if (!apiKey) {

        throw new Error(
            "YOUTUBE_API_KEY secret is missing."
        );
    }


    console.log(
        `Retrieving videos for ${members.length} ForeverSMP members...`
    );


    // ------------------------------------------------------------
    // Start retrieving every member concurrently.
    // ------------------------------------------------------------

    const memberRequests =
        members.map(member =>
            getChannelVideos(
                member.channelId
            )
        );


    // ------------------------------------------------------------
    // Wait until all channels have finished.
    // ------------------------------------------------------------

    const memberVideoArrays =
        await Promise.all(
            memberRequests
        );


    // ------------------------------------------------------------
    // Combine every member's videos into one array.
    // ------------------------------------------------------------

    const allVideos =
        memberVideoArrays.flat();


    console.log(
        `Retrieved ${allVideos.length} qualifying videos.`
    );


    // ------------------------------------------------------------
    // Sort newest → oldest.
    // ------------------------------------------------------------

    allVideos.sort((a, b) => {

        const dateA =
            new Date(
                a.snippet.publishedAt
            );

        const dateB =
            new Date(
                b.snippet.publishedAt
            );

        return dateB - dateA;
    });


    // ------------------------------------------------------------
    // Convert YouTube objects into our simplified format.
    // ------------------------------------------------------------

    const videos =
        allVideos.map(
            simplifyVideo
        );


    // ------------------------------------------------------------
    // Load Node's filesystem module.
    // ------------------------------------------------------------

    const fs =
        require("fs");


    // ------------------------------------------------------------
    // Make sure /data exists.
    // ------------------------------------------------------------

    fs.mkdirSync(
        "data",
        {
            recursive: true
        }
    );


    // ------------------------------------------------------------
    // Location of our existing video database.
    // ------------------------------------------------------------

    const filePath =
        "data/videos.json";


    // ------------------------------------------------------------
    // Read the existing video database if one exists.
    //
    // This allows us to determine whether the actual video data
    // has changed since the previous update.
    // ------------------------------------------------------------

    let existingData =
        null;


    if (fs.existsSync(filePath)) {

        try {

            existingData =
                JSON.parse(
                    fs.readFileSync(
                        filePath,
                        "utf8"
                    )
                );

        }
        catch (error) {

            console.warn(
                "Existing videos.json could not be read."
            );

            console.warn(
                "A new file will be generated."
            );
        }
    }


    // ------------------------------------------------------------
    // Compare the old and new video arrays.
    //
    // generatedAt is deliberately excluded from this comparison.
    // Otherwise every run would appear to contain a change.
    // ------------------------------------------------------------

    const existingVideos =
        existingData?.videos || [];


    const videosHaveChanged =
        JSON.stringify(existingVideos) !==
        JSON.stringify(videos);


    // ------------------------------------------------------------
    // Nothing changed.
    //
    // Leave videos.json untouched so Git has nothing to commit.
    // ------------------------------------------------------------

    if (!videosHaveChanged) {

        console.log(
            "No changes detected in video data."
        );

        console.log(
            "data/videos.json has not been modified."
        );

        return;
    }


    // ------------------------------------------------------------
    // Something has changed.
    //
    // Build a new JSON structure. generatedAt therefore represents
    // when the stored video data was last changed.
    // ------------------------------------------------------------

    const output = {

        generatedAt:
            new Date().toISOString(),

        videoCount:
            videos.length,

        videos:
            videos
    };


    // ------------------------------------------------------------
    // Generate the updated data/videos.json.
    // ------------------------------------------------------------

    fs.writeFileSync(
        filePath,
        JSON.stringify(
            output,
            null,
            4
        )
    );


    console.log(
        `Updated data/videos.json with ${videos.length} videos.`
    );
}


// ====================================================================
// START
// ====================================================================

updateVideos();