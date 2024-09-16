//#region Fetch Data
export async function fetchDataWithAlert(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) console.error("Network response was not ok");
        return await response.json();
    } catch (error) {
        // Display an error message
        alert("An error occurred while fetching data. Please try refreshing the page");
        throw new Error(error.message);
    }
}

export async function fetchDataWithRedBackgroundColor(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) console.error("Network response was not ok");
        return await response.json();
    } catch (error) {
        // Get the loading element and display an error message
        const loadingMessage = document.querySelector(".loading-message");
        if (loadingMessage) {
            loadingMessage.textContent = "An error occurred while fetching data. Please try refreshing the page";
            loadingMessage.style.backgroundColor = "rgba(255, 0, 0, 0.32)";
        }
        throw new Error(error.message);
    }
}

export async function fetchDataWithoutRedBackgroundColor(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) console.error("Network response was not ok");
        return await response.json();
    } catch (error) {
        // Get the loading element and display an error message
        const loadingMessage = document.querySelector(".loading-message");
        if (loadingMessage) {
            loadingMessage.textContent = "An error occurred while fetching data. Please try refreshing the page";
        }
        throw new Error(error.message);
    }
}
//#endregion

//#region Fetch Anime/Episodes Data
// Function to fetch anime data
export async function fetchAnimeData() {
    // Get anime id from the URL
    const animeId = getAnimeIDUsingURL();

    // Fetch anime data
    return await fetchDataWithRedBackgroundColor(`https://aniwatch.tuncay.be/anime/info?id=${animeId}`);
}

// Function to fetch episodes data
export async function fetchEpisodesData() {
    // Get anime id from the URL
    const animeId = getAnimeIDUsingURL();

    // Fetch episodes data
    return await fetchDataWithRedBackgroundColor(`https://aniwatch.tuncay.be/anime/episodes/${animeId}`);
}
//#endregion

//#region Check Title Overflow
export function checkTitleOverflow() {
    // Select .card-title
    document.querySelectorAll(".card-title").forEach((title) => {
        if (title.scrollHeight > title.clientHeight) {
            title.classList.add("start");
        } else {
            title.classList.remove("start");
        }
    });
    // Select .card-anime-title
    document.querySelectorAll(".card-anime-title").forEach((title) => {
        if (title.scrollHeight > title.clientHeight) {
            title.classList.add("start");
        } else {
            title.classList.remove("start");
        }
    });
}
//#endregion

//#region Get/Set Episode Info
// Function to retrieve the anime ID from the URL
export function getAnimeIDUsingURL() {
    return new URLSearchParams(window.location.search).get("id");
}

// Function to store the currently watching episode ID in the video player element as a data attribute
export function setEpisodeId(episodeId) {
    document.querySelector(".main-title.episode-title").dataset.episodeId = episodeId;
}
// Function to retrieve the currently watching episode ID from the video player element data attribute
export function getEpisodeId() {
    return document.querySelector(".main-title.episode-title").dataset.episodeId;
}

// Function to store the currently watching episode number in the video player element as a data attribute
export function setEpisodeNumber(episodeNumber) {
    document.querySelector(".main-title.episode-title").dataset.episodeNumber = episodeNumber;
}
// Function to retrieve the currently watching episode number from the video player element data attribute
export function getEpisodeNumber() {
    return document.querySelector(".main-title.episode-title").dataset.episodeNumber;
}

// Function to retrieve the total available episodes
export function getTotalEpisodes(animeData) {
    return animeData.totalEpisodes;
}
// Function to retrieve the total number of episodes
export function getTotalAvailableEpisodes() {
    return document.querySelectorAll(".episodes .card-item a.link").length;
}

// Function to retrieve the anilistId
export function getAnilistId(animeData) {
    return animeData.anime.info.anilistId;
}
//#endregion

//#region Resize Triggered
export function resizeTriggered() {
    const pipElement = document.querySelector(".vjs-picture-in-picture-control.vjs-control.vjs-button");
    const volumeElement = document.querySelector(".vjs-volume-panel.vjs-control.vjs-volume-panel-vertical");
    const fullscreenElement = document.querySelector(".vjs-fullscreen-control.vjs-control.vjs-button");

    //
    if (pipElement && window.innerWidth < 800) {
        pipElement.style.display = "none";
    }
    if (volumeElement && window.innerWidth < 800) {
        volumeElement.style.display = "none";
    }
    if (fullscreenElement && window.innerWidth < 600) {
        fullscreenElement.style.display = "none";
    }

    //
    if (pipElement && window.innerWidth > 800) {
        pipElement.style.display = "inherit";
    }
    if (volumeElement && window.innerWidth > 800) {
        volumeElement.style.display = "inherit";
    }
    if (fullscreenElement && window.innerWidth > 600) {
        fullscreenElement.style.display = "inherit";
    }
}
//#endregion
