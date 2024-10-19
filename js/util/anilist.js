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

    // No auth code
    if (!authCode) return;

    try {
        // Fetch the access token from the Cloudflare Worker
        const workerUrl = "https://anilist.letswatch.site/token";
        const workerResponse = await fetch(workerUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                code: authCode, // Send the auth code to your Worker
            }),
        });

        // Handle the response from the Worker
        if (workerResponse.ok) {
            const data = await workerResponse.json();
            // Store it in localStorage
            localStorage.setItem("anilist-token", data.access_token);
        } else {
            // Log error
            console.error(await workerResponse.text());
        }
    } catch (error) {
        // Log error
        console.error(error);
    }
});

// DOMContentLoaded: Update the AniList button text according to the login status
document.addEventListener("DOMContentLoaded", function () {
    // Get the token from localStorage
    let token = localStorage.getItem("anilist-token");

    // Get the AniList button
    const anilistButton = document.querySelector(".anilist-button-container a");

    // Check if the token is available
    if (token) {
        // Change the button text according to the AniList login status
        anilistButton.textContent = "Logout from AniList";
    } else {
        // Change the button text according to the AniList login status
        anilistButton.textContent = "Login to AniList";
    }
});

// DOMContentLoaded
document.addEventListener("DOMContentLoaded", function () {
    // Get the AniList button
    const anilistButton = document.querySelector(".anilist-button-container a");

    // Add event listener to the AniList button
    anilistButton.addEventListener("click", function () {
        // Prevent the default action
        event.preventDefault();

        // Check if the user is logged in
        if (anilistButton.textContent === "Login to AniList") {
            // Redirect the user to the AniList login page
            window.location.href = "https://anilist.co/api/v2/oauth/authorize?client_id=21793&redirect_uri=https://letswatch.site/html/account.html&response_type=code";
        } else if (anilistButton.textContent === "Logout from AniList") {
            // Remove the token from localStorage
            localStorage.removeItem("anilist-token");
            // Change the button text according to the AniList login status
            anilistButton.textContent = "Login to AniList";
        }
    });
});
