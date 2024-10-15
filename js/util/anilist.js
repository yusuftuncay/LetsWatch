// Function to update AniList media entry
export async function updateAniListMediaEntry(token, anilistId, episodeNumber, totalEpisodes) {
    // Determine Anime Status
    let animeStatus;
    if (episodeNumber >= parseInt(totalEpisodes)) {
        animeStatus = "COMPLETED";
    } else {
        animeStatus = "CURRENT";
    }

    // Mutation to create or update media entry
    const query = `mutation { SaveMediaListEntry(mediaId: ${anilistId}, status: ${animeStatus}, progress: ${episodeNumber}) { id } }`;

    // Define the config we'll need for our API request
    var url = "https://graphql.anilist.co",
        options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                query: query,
            }),
        };

    // Make the HTTP request
    await fetch(url, options)
        .then((response) => response.json().then((json) => (response.ok ? json : Promise.reject(json))))
        .catch((error) => console.error(JSON.stringify(error)));
}

// DOMContentLoaded
document.addEventListener("DOMContentLoaded", async function () {
    // Check if the token is already available
    const token = localStorage.getItem("anilist-token");
    if (token) return;

    // Check if the URL contains the authorization code
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get("code");
    if (authCode) {
        // Fetch the access token from the Cloudflare Worker instead of AniList API to avoid CORS issues
        const workerUrl = "https://anilist.yusuftuncay.workers.dev/token";
        const workerResponse = await fetch(workerUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                // Send the auth code to your Worker
                code: authCode,
            }),
        });

        // Handle the response from the Worker
        if (workerResponse.ok) {
            const data = await workerResponse.json();
            // Store it in localStorage
            localStorage.setItem("anilist-token", data.access_token);
        } else {
            console.error(await workerResponse.text());
        }
    }
});
