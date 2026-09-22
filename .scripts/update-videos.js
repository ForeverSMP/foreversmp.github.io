const apiKey = process.env.YOUTUBE_API_KEY;

async function testYouTubeAPI() {

    // Make sure GitHub provided the secret.
    if (!apiKey) {
        throw new Error("YOUTUBE_API_KEY secret is missing.");
    }


    // Deathdealer channel ID.
    const channelId = "UCfSOL-2WVjtCo2BSlemAQWg";


    // Ask YouTube for basic channel information.
    const response = await fetch(
        `https://www.googleapis.com/youtube/v3/channels` +
        `?part=snippet` +
        `&id=${channelId}` +
        `&key=${apiKey}`
    );


    const data = await response.json();


    // Check whether YouTube returned an error.
    if (!response.ok) {
        console.error(data);
        throw new Error(
            `YouTube API request failed: ${response.status}`
        );
    }


    // Create some simple test data.
    const output = {
        generatedAt: new Date().toISOString(),
        channelName: data.items[0].snippet.title,
        channelId: data.items[0].id
    };


    console.log(output);


    // Import Node's filesystem module.
    const fs = require("fs");


    // Make sure the data folder exists.
    fs.mkdirSync("data", {
        recursive: true
    });


    // Write our JSON file.
    fs.writeFileSync(
        "data/videos.json",
        JSON.stringify(output, null, 4)
    );
}


testYouTubeAPI();