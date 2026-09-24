async function loadVideos() {

    const response =
        await fetch("data/videos.json");

    const data =
        await response.json();

    console.log(
        "Generated:",
        data.generatedAt
    );

    console.log(
        "Cached videos:",
        data.videoCount
    );

    console.log(
        "Videos:",
        data.videos
    );
}


loadVideos();