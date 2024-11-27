//#region Import
import {
    fetchDataWithAlert,
    fetchDataWithRedBackgroundColor,
    fetchEpisodesData,
    getAnimeIDUsingURL,
    setEpisodeNumber,
    getEpisodeNumber,
    getTotalEpisodes,
    getAnilistId,
    resizeTriggered,
    getTotalAvailableEpisodes,
    fetchAnimeDataFromAniwatch,
    fetchAnimeDataFromConsumet,
} from "./util/main.js";
import { updateAniListMediaEntry } from "./util/anilist.js";
import { setupVideoPlayer, setVolume, loadHighestQuality, isSafari } from "./util/video.js";
//#endregion

//#region Firebase
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getFirebase } from "./firebase/init.js";
//#endregion

//#region Objects
let animeDataAniwatch = {};
let animeDataConsumet = {};
let animeEpisodes = {};
let isLoadingEpisode = false;
//#endregion

//#region Rate Limiter Object
const rateLimiter = {
    lastRequestTime: 0,
    cooldown: 1000,
    warnCooldown: function () {
        // Alert the user when requests are made too frequently
        alert("Slow down! Please wait a second before trying again");
    },
    isCooldownActive: function () {
        // Check if the minimum time interval since the last request has passed
        const currentTime = Date.now();
        return currentTime - this.lastRequestTime < this.cooldown;
    },
    updateLastRequestTime: function () {
        // Update the timestamp of the last request
        this.lastRequestTime = Date.now();
    },
};
//#endregion

//#region Generate EpisodeList
function generateEpisodeList(player) {
    try {
        // Show loading element while data is being fetched
        const cardItemDiv = document.querySelector(".card-item");
        cardItemDiv.innerHTML = '<div class="loading">Loading Episodes ...</div>';

        // Clear the loading message
        cardItemDiv.innerHTML = "";

        // Show error if no data is available
        if (animeDataAniwatch.data.anime.moreInfo.status == "Not yet aired") {
            const episodesElement = document.querySelector(".episodes");
            episodesElement.innerHTML = `<h3 class="card text-white padding-10-px" style="background-color:rgba(0, 255, 0, 0.32)">This anime has not yet aired</h3>`;
            return;
        } else if (!animeEpisodes.data.episodes.length) {
            const episodesElement = document.querySelector(".episodes");
            episodesElement.innerHTML = `<h3 class="card text-white padding-10-px" style="background-color:rgba(255, 0, 0, 0.32)">An error occurred while fetching data</h3>`;
            return;
        } else if (animeEpisodes.data.totalEpisodes == 0) {
            const episodesElement = document.querySelector(".episodes");
            episodesElement.innerHTML = `<h3 class="card text-white padding-10-px">No episodes available</h3>`;
            return;
        }

        // Check if .card h3 exists before adding
        const cardTitle = document.querySelector(".card h3");
        if (!cardTitle) {
            // Get the card element
            const card = document.querySelector(".card");
            // Create a title
            const cardTitle = document.createElement("h3");
            cardTitle.classList.add("text-white", "section-title", "underline");
            cardTitle.textContent = "Episodes";
            // Insert the cardTitle before the cardItem
            card.insertBefore(cardTitle, cardItemDiv);
        }

        // Create a document fragment for better performance
        const fragment = document.createDocumentFragment();

        // Create a card for each episode
        animeEpisodes.data.episodes.forEach((episode) => {
            const episodeLink = document.createElement("a");
            episodeLink.classList.add("link", "text-white");
            episodeLink.dataset.episodeId = episode.episodeId;
            episodeLink.dataset.episodeTitle = episode.title;
            episodeLink.dataset.episodeNumber = episode.number;
            episodeLink.textContent = episode.number;
            // Add click event listener to each episode link
            episodeLink.addEventListener("click", async () => {
                await handleEpisodeClick(player, episode);
            });
            fragment.appendChild(episodeLink);
        });

        // Append all episode links at once
        cardItemDiv.appendChild(fragment);

        // Open the recently watched episode
        onAuthStateChanged(auth, (user) => {
            if (!user) return;
            openRecentlyWatchedEpisode();
        });

        // Setup
        updateEpisodeList();
        resizeTriggered();
    } catch (error) {
        const loadingMessage = document.querySelector(".loading-message");
        if (loadingMessage) {
            loadingMessage.textContent = "Failed to load episodes. Please refresh the page";
            loadingMessage.style.backgroundColor = "rgba(255, 0, 0, 0.32)";
        }
        console.error(error.message);
    }
}
//#endregion

//#region Open Recently Watched
function openRecentlyWatchedEpisode() {
    // Retrieve the recently watched data from local storage
    const playRecentlyWatchedData = JSON.parse(localStorage.getItem("play-recently-watched"));

    // Check if there is a recently watched episode
    if (!playRecentlyWatchedData) return;

    // Get the episode number
    const currentEpisodeNumber = playRecentlyWatchedData["episode-number"];

    // Get sub or dub value
    let subOrDub = playRecentlyWatchedData["sub-or-dub"];

    // Find and trigger a click on the corresponding episode link
    const episodeElement = document.querySelector(`[data-episode-number="${currentEpisodeNumber}"]`);
    if (episodeElement) {
        // Check if the .value even exists before proceeding
        const subOrDubSelectElement = document.querySelector(".sub-or-dub-dropdown-select");
        if (subOrDubSelectElement && subOrDubSelectElement.value) {
            subOrDubSelectElement.value = subOrDub;
        }
        // Click on the episode element
        episodeElement.click();
    }

    // Remove the entry for this episode from local storage
    localStorage.removeItem("play-recently-watched");
}
//#endregion

//#region Episode Click Handler
async function handleEpisodeClick(player, episode) {
    // Prevents new requests if one is in progress
    if (isLoadingEpisode) return;
    isLoadingEpisode = true;

    // Prevent spam clicking
    if (rateLimiter.isCooldownActive()) {
        rateLimiter.warnCooldown();
        return;
    }
    // Record the time of the request
    rateLimiter.updateLastRequestTime();

    try {
        // Pause the video player
        player.pause();
        // Show loading element
        document.getElementById("videoplayer").classList.add("vjs-waiting");

        // Get the episode title element
        const episodeTitle = document.querySelector(".main-title.episode-title");
        // Check if episode.title starts with "EP" and avoid duplication
        const titleText = episode.title && !episode.title.startsWith("EP") ? ": " + episode.title : "";
        // Construct the full title text
        let fullTitle = "EP " + episode.number + titleText;
        // Truncate the full title if it exceeds 40 characters and add ellipsis
        if (fullTitle.length > 40) {
            fullTitle = fullTitle.slice(0, 42) + "..";
        }
        // Set episode title and number to the episodeTitle element
        episodeTitle.textContent = fullTitle;

        // Set data attribute
        setEpisodeNumber(episode.number);

        // Setup the available servers dropdown
        await setupAvailableServersDropdown(player, episode.episodeId);

        // Get the sub or dub element
        const subOrDubSelectElement = document.querySelector(".sub-or-dub-dropdown-select");

        // Get the server element
        const serverSelectElement = document.querySelector(".server-dropdown-select");

        // Fetch the episode sources data for the selected episode, sub or dub value and server name
        const episodeData = await fetchDataWithRedBackgroundColor(
            `https://aniwatch.tuncay.be/api/v2/hianime/episode/sources?animeEpisodeId=${episode.episodeId}&category=${subOrDubSelectElement.value}&server=${serverSelectElement.value}`
        );

        // Set the video source
        player.src({ src: episodeData.data.sources[0].url, type: "application/x-mpegURL" });

        // Proceed when the metadata of the video is loaded
        player.one("loadedmetadata", () => {
            // Load the highest quality
            loadHighestQuality(player);

            // Check authentication state
            onAuthStateChanged(auth, (user) => {
                if (!user) return;

                // Resume episode from the last watched position
                resumeEpisodeProgress(player, animeDataAniwatch.data.anime.info.id);
                // Save the episode in the recently watched list
                saveEpisodeInRecentlyWatched({
                    animeId: getAnimeIDUsingURL(),
                    animeTitle: animeDataAniwatch.data.anime.info.name,
                    episodeTitle: episode.title,
                    episodeImage: animeDataAniwatch.data.anime.info.poster,
                    episodeNumber: episode.number,
                    episodeTotal: animeDataConsumet.totalEpisodes,
                    episodeId: episode.episodeId,
                    episodeDuration: Math.floor(player.duration()),
                    subOrDub: subOrDubSelectElement.value,
                });
                // Save the episode progress
                saveEpisodeProgress(player, episode.episodeId);
            });

            // Setup subtitles
            setupSubtitles(player, episodeData.data);

            // Update the episodes list
            updateEpisodeList();
        });

        // Setup AniList update
        setupAniListUpdate(player);

        // Setup Buttons
        setupSkipButtons(player, episodeData.data.intro, episodeData.data.outro);
        setupNextEpisodeHandler(player);
    } catch (error) {
        console.error(error.message);
    } finally {
        // Reset once the process finishes
        isLoadingEpisode = false;
    }
}
//#endregion

//#region Episode Helpers
// Function to resume episode from the last watched position
function resumeEpisodeProgress(player, animeId) {
    // Retrieve the recently watched data from local storage
    const recentlyWatchedData = JSON.parse(localStorage.getItem("recently-watched")) || [];

    // Get the episode number
    const episodeNumber = getEpisodeNumber();

    // Find the object for the current episode
    const episodeData = recentlyWatchedData.find((item) => item["anime-id"] == animeId && item["episode-number"] == episodeNumber);

    // If the object exists, resume playback from the saved position
    if (episodeData && episodeData["episode-progress"] != 0) {
        player.currentTime(parseFloat(episodeData["episode-progress"]));
    }

    // Play the video
    player.play();
}

// Function to add/update an episode in recently watched
function saveEpisodeInRecentlyWatched(data) {
    // Destructure the data object
    const { animeId, animeTitle, episodeTitle, episodeImage, episodeNumber, episodeTotal, episodeId, episodeDuration, subOrDub } = data;

    // Retrieve the recently watched data from local storage
    let recentlyWatchedData = JSON.parse(localStorage.getItem("recently-watched")) || [];

    // Remove the existing entry if it exists
    recentlyWatchedData = recentlyWatchedData.filter((item) => item["anime-id"] != animeId);

    // Prepend the new episode to the list
    recentlyWatchedData.unshift({
        "anime-id": animeId,
        "anime-title": animeTitle,
        "episode-title": episodeTitle,
        "episode-image": episodeImage,
        "episode-number": episodeNumber,
        "episode-total": episodeTotal,
        "episode-id": episodeId,
        "episode-progress": 0,
        "episode-duration": episodeDuration,
        "sub-or-dub": subOrDub,
    });

    // Update local storage with the updated list
    localStorage.setItem("recently-watched", JSON.stringify(recentlyWatchedData));
}

// Function to save the progress of an episode in local storage
function saveEpisodeProgress(player, episodeId) {
    // Retrieve the recently watched data from local storage
    const recentlyWatchedData = JSON.parse(localStorage.getItem("recently-watched")) || [];

    // Find the index for the current episode
    const animeIndex = recentlyWatchedData.findIndex((item) => item["episode-id"] == episodeId);

    // Flag to indicate whether progress should be saved
    let shouldSaveProgress = true;

    // Function to update the progress of an episode in local storage
    const handleTimeUpdate = () => {
        // Return if progress saving is disabled
        if (!shouldSaveProgress || animeIndex == -1) return;

        // Update progress
        recentlyWatchedData[animeIndex]["episode-progress"] = Math.floor(player.currentTime());

        // Save the updated data to local storage
        localStorage.setItem("recently-watched", JSON.stringify(recentlyWatchedData));
    };

    // Function to handle player state changes
    const handlePlayerStateChange = () => {
        if (player.paused() || player.currentSrc() == "") {
            // Disable progress saving when paused or during loading
            shouldSaveProgress = false;
        } else {
            // Enable progress saving when playing
            shouldSaveProgress = true;
        }
    };

    // Add event listener
    player.on("timeupdate", handleTimeUpdate);
    player.on("play", handlePlayerStateChange);
    player.on("pause", handlePlayerStateChange);
    player.on("waiting", handlePlayerStateChange); // During loading
    player.on("loadeddata", handlePlayerStateChange); // After loading

    // Return the cleanup function
    return () => {
        player.off("timeupdate", handleTimeUpdate);
        player.off("play", handlePlayerStateChange);
        player.off("pause", handlePlayerStateChange);
        player.off("waiting", handlePlayerStateChange);
        player.off("loadeddata", handlePlayerStateChange);
    };
}

// Function to setup subtitles and default caption styles
function setupSubtitles(player, episode) {
    // Remove existing text tracks
    const tracks = player.textTracks();
    for (let i = tracks.length - 1; i >= 0; i--) {
        player.removeRemoteTextTrack(tracks[i]);
    }

    // Only select English Subtitles
    const englishTrack = episode.tracks.find((track) => track.kind === "captions" && track.label === "English");
    if (englishTrack) {
        // Add the new track
        player.addRemoteTextTrack(
            {
                kind: englishTrack.kind,
                label: "English",
                srclang: "en",
                src: englishTrack.file,
            },
            false
        );

        // Set the default caption style
        for (var i = 0; i < tracks.length; i++) {
            var track = tracks[i];
            // Find the English captions track and mark it as "showing"
            if (track.kind === "captions" && track.language === "en") {
                track.mode = "showing";
            }
        }
    }
}
//#endregion

//#region Extra Card Setups
// Function to setup the seasons or related anime card
function setupSeasonsCard() {
    // Get the main container element
    const mainSection = document.querySelector(".main-container");

    // Create a container
    const cardContainer = document.createElement("div");
    cardContainer.classList.add("seasons");

    // Create a title element
    const cardTitle = document.createElement("h3");
    cardTitle.classList.add("text-white", "section-title", "underline");

    // Create a div element
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card");

    // Create a div element
    const cardContent = document.createElement("div");
    cardContent.classList.add("card-item");

    // Check if seasons data is available
    if (animeDataAniwatch.data.seasons.length > 0) {
        // Set the card title
        cardTitle.textContent = "Seasons";

        // Loop through the seasons and create a link for each
        animeDataAniwatch.data.seasons.forEach((season) => {
            const seasonLink = document.createElement("a");
            seasonLink.href = `../html/detail.html?id=${season.id}`;
            seasonLink.textContent = season.name;
            seasonLink.classList.add("link", "text-white");
            // Add the "currently-watching" class to the currently watching season
            if (season.isCurrent) {
                seasonLink.classList.add("currently-watching");
            }

            // Append season links to the card content
            cardContent.appendChild(seasonLink);
        });
    } else {
        // Set the card title
        cardTitle.textContent = "Related";

        // Loop through the related anime and create a link for each
        animeDataAniwatch.data.relatedAnimes.forEach((related) => {
            const relatedLink = document.createElement("a");
            relatedLink.href = `../html/detail.html?id=${related.id}`;
            relatedLink.textContent = related.name;
            relatedLink.classList.add("link", "text-white");

            // Append related links to the card content
            cardContent.appendChild(relatedLink);
        });
    }

    // Append the card elements to the card div
    cardDiv.appendChild(cardTitle);
    cardDiv.appendChild(cardContent);

    // Append the constructed card to the card container
    cardContainer.appendChild(cardDiv);

    // Append the card container to the main section
    mainSection.appendChild(cardContainer);
}

// Function to setup the next airing episode information
async function setupNextAiringEpisodeCard() {
    // Check if the next airing episode data is available
    if (!animeDataConsumet.nextAiringEpisode) return;

    // Create a div element for the section title
    let div = document.createElement("div");
    div.classList.add("next-airing");

    // Get the time until airing in seconds
    let timeUntilAiring = animeDataConsumet.nextAiringEpisode.timeUntilAiring;
    let episode = animeDataConsumet.nextAiringEpisode.episode;

    // Create a div element for the airing time with appropriate classes
    let airingTimeDiv = document.createElement("div");
    airingTimeDiv.classList.add("card", "text-white", "main-title");
    airingTimeDiv.innerHTML = `<div class="episode-info">Episode <span class="underline">${episode}</span> airing in</div>`;
    let timeInfoDiv = document.createElement("div");
    timeInfoDiv.classList.add("time-info");
    airingTimeDiv.appendChild(timeInfoDiv);
    div.appendChild(airingTimeDiv);

    // Insert the airing time div into the main container
    let mainContainer = document.querySelector(".main-container");
    mainContainer.appendChild(div);

    // Function to format the time until airing
    function formatTimeUntilAiring(seconds) {
        // Calculate the days, hours, and minutes left until airing
        let days = Math.floor(seconds / (24 * 60 * 60));
        let hoursLeft = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
        let minutesLeft = Math.floor((seconds % (60 * 60)) / 60);

        // Construct the formatted time string
        let formattedTime = "";
        if (days > 0) {
            formattedTime += `${days} day${days == 1 ? "" : "s"}, `;
        }
        if (hoursLeft > 0) {
            formattedTime += `${hoursLeft} hour${hoursLeft == 1 ? "" : "s"}, `;
        }
        formattedTime += `${minutesLeft} minute${minutesLeft == 1 ? "" : "s"}`;

        // Return
        return formattedTime;
    }

    // Function to update the time info div
    function updateTimeInfo() {
        timeInfoDiv.innerText = formatTimeUntilAiring(timeUntilAiring);
        timeUntilAiring -= 60;
    }

    // Initial update and setup interval to update every minute
    updateTimeInfo();
    setInterval(updateTimeInfo, 60000); // 60000ms = 1 minute

    // Add animation class
    setTimeout(() => {
        div.classList.add("loaded");
    }, 10);
}
//#endregion

//#region Setup Player Buttons
// Function to setup the sub or dub dropdown
function setupSubOrDubDropdown(player) {
    // Check if the dropdown already exists
    if (document.querySelector(".sub-or-dub-dropdown")) return;

    // Create the div element
    const divElement = document.createElement("div");
    divElement.classList.add("sub-or-dub-dropdown");

    // Create the select element
    const selectElement = document.createElement("select");
    selectElement.classList.add("sub-or-dub-dropdown-select");

    // Create the options
    const subOption = document.createElement("option");
    subOption.value = "sub";
    subOption.textContent = "Sub";
    const dubOption = document.createElement("option");
    dubOption.value = "dub";
    dubOption.textContent = "Dub";
    const rawOption = document.createElement("option");
    rawOption.value = "raw";
    rawOption.textContent = "Raw";

    // Append options to select element
    selectElement.appendChild(subOption);
    selectElement.appendChild(dubOption);
    selectElement.appendChild(rawOption);
    // Append select element to div element
    divElement.appendChild(selectElement);

    // Insert dropdown before target element
    const targetElement = document.querySelector(".vjs-remaining-time");
    targetElement.parentNode.insertBefore(divElement, targetElement.nextSibling);

    // Handle changes in selected value
    selectElement.addEventListener("change", function () {
        // Pause the video player
        player.pause();
        // Show loading element
        document.getElementById("videoplayer").classList.add("vjs-waiting");

        // Get the episode id
        const episodeNumber = getEpisodeNumber();
        // Select the element with the specified class and data attributes
        const episodeElement = document.querySelector(`a.link.text-white[data-episode-number="${episodeNumber}"]`);
        // Check if the element exists
        if (episodeElement) {
            episodeElement.click();
        }
    });
}

// Function to get the available servers for the selected episode
async function setupAvailableServersDropdown(player, episodeId) {
    // Fetch available servers
    const servers = await fetchDataWithAlert(`https://aniwatch.tuncay.be/api/v2/hianime/episode/servers?animeEpisodeId=${episodeId}`);

    // Initialize variable to store the previous value of the selected server
    let previousValue = "";
    // Clear the existing server dropdown
    const existingServerDropdown = document.querySelector(".server-dropdown");
    if (existingServerDropdown) {
        // Save the previous value of the selected server
        previousValue = existingServerDropdown.querySelector(".server-dropdown-select").value || "";
        // Remove the existing server dropdown
        existingServerDropdown.parentNode.removeChild(existingServerDropdown);
    }

    // Return if no servers are available
    if (!servers.data.sub && !servers.data.dub && !servers.data.raw) return;

    // Create select element
    const serverSelectElement = document.createElement("select");
    serverSelectElement.classList.add("server-dropdown-select");

    // Get the sub or dub element
    const subOrDubSelectElement = document.querySelector(".sub-or-dub-dropdown-select");
    // Save the previous value of the selected sub or dub
    const previousSubOrDubValue = subOrDubSelectElement.value;
    // Set the default value based on the previous value based on the available servers
    if (previousSubOrDubValue == "sub" && servers.data.sub.length > 0) {
        subOrDubSelectElement.value = "sub";
    } else if (previousSubOrDubValue == "dub" && servers.data.dub.length > 0) {
        subOrDubSelectElement.value = "dub";
    } else if (previousSubOrDubValue == "raw" && servers.data.raw.length > 0) {
        subOrDubSelectElement.value = "raw";
    }
    // Set sub, dub then raw as the default value if the previous value is not available
    else if (servers.data.sub.length > 0) {
        subOrDubSelectElement.value = "sub";
    } else if (servers.data.dub.length > 0) {
        subOrDubSelectElement.value = "dub";
    } else if (servers.data.raw.length > 0) {
        subOrDubSelectElement.value = "raw";
    }
    // Get the selected sub or dub value
    const subOrDub = subOrDubSelectElement.value;

    // Populate options based on data fetched
    if (Array.isArray(servers.data[subOrDub])) {
        servers.data[subOrDub].forEach((server) => {
            // Rename servers if necessary
            let serverName = server.serverName;

            // Mapping of server names to display names
            const serverNameMapping = {
                "hd-1": "VidStreaming",
                megacloud: "MegaCloud",
                streamsb: "StreamSB",
                streamtape: "StreamTape",
                "hd-2": "VidCloud",
                asianload: "AsianLoad",
                gogocdn: "GogoCDN",
                mixdrop: "MixDrop",
            };

            // Create option element
            const option = document.createElement("option");
            option.value = serverName;

            // Check if serverName exists in the mapping object and replace textContent
            if (serverNameMapping[serverName]) {
                option.textContent = serverNameMapping[serverName];
            } else {
                option.textContent = "N/A";
            }

            // Append option to select element
            serverSelectElement.appendChild(option);
        });
    }

    // Set the initial previous value for the select element
    serverSelectElement.dataset.previousValue = previousValue;
    // Set the default value to the previous value
    let firstOptionValue = serverSelectElement.options[0]?.value;
    serverSelectElement.value = previousValue && previousValue !== "" ? previousValue : firstOptionValue && firstOptionValue !== "" ? firstOptionValue : "N/A";

    // Create div element for dropdown
    const divElement = document.createElement("div");
    divElement.classList.add("server-dropdown");
    divElement.appendChild(serverSelectElement);

    // Insert dropdown before target element
    const targetElement = document.querySelector(".vjs-remaining-time");
    targetElement.parentNode.insertBefore(divElement, targetElement.nextSibling);

    // Event listener for select change
    serverSelectElement.addEventListener("change", function () {
        // Pause the video player
        player.pause();
        // Show loading element
        document.getElementById("videoplayer").classList.add("vjs-waiting");

        // Get the episode id
        const episodeNumber = getEpisodeNumber();
        // Select the element with the specified class and data attributes
        const episodeElement = document.querySelector(`a.link.text-white[data-episode-number="${episodeNumber}"]`);
        // Check if the element exists
        if (episodeElement) {
            episodeElement.click();
        }
    });
}

// Function to get the available servers for the selected episode
/*async function getAvailableServers(episodeId) {
    // Fetch available servers
    const servers = await fetchDataWithAlert(`https://aniwatch.tuncay.be/api/v2/hianime/episode/servers?animeEpisodeId=${episodeId}`);

    // Initialize array to store selected servers
    const selectedServers = [];

    // Order of serverIds to select
    const serverIds = [4, 1, 2, 3, 5, 6, 7, 8];

    // Get the sub or dub element
    const subOrDubSelectElement = document.querySelector(".sub-or-dub-dropdown-select");
    // Get the selected sub or dub value
    const subOrDub = subOrDubSelectElement.value;

    // Iterate through serverIds and select corresponding servers from fetched data
    for (const serverId of serverIds) {
        // Check sub or dub value
        if (subOrDub == "sub") {
            // Find server in sub array
            let subServer = servers.data.sub.find((server) => server.serverId == serverId);
            if (subServer) {
                selectedServers.push(subServer);
                continue;
            }
        } else if (subOrDub == "dub") {
            // Find server in dub array
            let dubServer = servers.data.dub.find((server) => server.serverId == serverId);
            if (dubServer) {
                selectedServers.push(dubServer);
                continue;
            }
        }
    }

    // Return
    return selectedServers;
}*/
//#endregion

//#region Update EpisodeList
function updateEpisodeList() {
    // Check authentication state
    onAuthStateChanged(auth, (user) => {
        const isUserLoggedIn = !!user;
        const episodeNumber = isUserLoggedIn ? getEpisodeNumberFromLocalStorage() : getEpisodeNumber();

        // Select all episode elements
        const allEpisodeElements = document.querySelectorAll(".card-item a[data-episode-number]");

        // Loop over each episode element
        allEpisodeElements.forEach((element) => {
            const elementEpisodeNumber = parseInt(element.getAttribute("data-episode-number"));

            // Remove previously set classes
            element.classList.remove("currently-watching", "watched");

            // Add "currently-watching" class to the current episode
            if (elementEpisodeNumber == episodeNumber) {
                element.classList.add("currently-watching");
            }

            // Only when user is logged in
            // Add "watched" class to episodes watched before the current one
            if (isUserLoggedIn && elementEpisodeNumber < episodeNumber) {
                element.classList.add("watched");
            }

            // Add "filler" class to filler episodes
            if (animeEpisodes.data.episodes[elementEpisodeNumber - 1].isFiller) {
                element.classList.add("filler");
            }
        });

        // Scroll to the current episode element if not Safari
        const episodeElement = document.querySelector(`.card-item a[data-episode-number="${episodeNumber}"]`);
        if (episodeElement && !isSafari()) {
            episodeElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    });

    // Function to get the episode number from localStorage
    function getEpisodeNumberFromLocalStorage() {
        const recentlyWatchedData = JSON.parse(localStorage.getItem("recently-watched")) || [];
        const animeID = getAnimeIDUsingURL();
        const recentlyWatched = recentlyWatchedData.find((anime) => anime["anime-id"] == animeID);
        return recentlyWatched && parseInt(recentlyWatched["episode-number"]);
    }
}
//#endregion

//#region AniList Update
function setupAniListUpdate(player) {
    // Flag to track if update has already been triggered
    let updateTriggered = false;

    // Monitor playback to update AniList media entry
    function handleTimeUpdate() {
        // Update the AniList media entry when the episode is almost finished
        let currentPercentage = (player.currentTime() / player.duration()) * 100;

        // Ensure update is fired only once when time reaches between 90 and 100 percent
        if (!updateTriggered && currentPercentage >= 90 && currentPercentage <= 100) {
            updateTriggered = true; // Set flag to true to prevent multiple firings

            // Update AniList media entry
            onAuthStateChanged(auth, async () => {
                // Check if the token is available
                const token = localStorage.getItem("anilist-token");
                if (!token) return;

                // Parameters: Token, AniList ID, Episode Number, Total Episodes
                await updateAniListMediaEntry(token, getAnilistId(animeDataAniwatch), getEpisodeNumber(), getTotalEpisodes(animeDataAniwatch));
            });
        }
    }

    // Add event listener to monitor time updates
    player.on("timeupdate", handleTimeUpdate);
}
//#endregion

//#region Intro/Outro Skip Handler
function setupSkipButtons(player, intro, outro) {
    // Get the video player element
    const videoContainer = document.querySelector(".video-js");

    // Create the skip intro button
    let skipIntroButton = document.querySelector(".skip-intro-button");
    if (!skipIntroButton) {
        skipIntroButton = document.createElement("button");
        skipIntroButton.textContent = "Skip Intro";
        skipIntroButton.classList.add("skip-intro-button");
        skipIntroButton.style.display = "none";
        videoContainer.appendChild(skipIntroButton);
    }

    // Create the skip outro button
    let skipOutroButton = document.querySelector(".skip-outro-button");
    if (!skipOutroButton) {
        skipOutroButton = document.createElement("button");
        skipOutroButton.textContent = "Skip Outro";
        skipOutroButton.classList.add("skip-outro-button");
        skipOutroButton.style.display = "none";
        videoContainer.appendChild(skipOutroButton);
    }

    // Monitor current time to show the skip intro and outro buttons at the right time
    function handleTimeUpdate() {
        // Get the current time
        const currentTime = player.currentTime();

        // Check if intro exists and handle the skip intro button
        if (intro.start > 0 && intro.end > 0) {
            // Show the skip intro button when the current time is within the intro interval
            if (currentTime >= intro.start && currentTime <= intro.end) {
                skipIntroButton.style.display = "block";
            } else {
                skipIntroButton.style.display = "none";
            }
        } else {
            // If intro does not exist, hide the skip intro button
            skipIntroButton.style.display = "none";
        }

        // Check if outro exists and handle the skip outro button
        if (outro.start > 0 && outro.end > 0) {
            // Show the skip outro button when the current time is within the outro interval
            if (currentTime >= outro.start && currentTime <= outro.end) {
                skipOutroButton.style.display = "block";
            } else {
                skipOutroButton.style.display = "none";
            }
        } else {
            // If outro does not exist, hide the skip outro button
            skipOutroButton.style.display = "none";
        }
    }

    // Add event listener to show the skip intro/outro buttons
    player.on("timeupdate", handleTimeUpdate);

    // Handle click events on the skip intro button
    skipIntroButton.addEventListener("click", () => {
        skipIntroButton.style.display = "none";
        player.currentTime(intro.end);
        player.play();
    });
    // Handle click events on the skip outro button
    skipOutroButton.addEventListener("click", () => {
        skipOutroButton.style.display = "none";
        player.currentTime(outro.end);
        player.play();
    });
}
//#endregion

//#region Next Episode Handler
function setupNextEpisodeHandler(player) {
    // Get the video player element
    const videoContainer = document.querySelector(".video-js");

    // Create the next episode button
    let nextEpisodeBtn = document.querySelector(".next-episode");
    if (!nextEpisodeBtn) {
        nextEpisodeBtn = document.createElement("button");
        nextEpisodeBtn.textContent = "Next Episode";
        nextEpisodeBtn.classList.add("next-episode");
        nextEpisodeBtn.style.display = "none";
        videoContainer.appendChild(nextEpisodeBtn);
    } else {
        // Hide the next episode button
        nextEpisodeBtn.style.display = "none";
    }

    // Monitor playback to show the next episode button at the right time
    function handleTimeUpdate() {
        // Check if the current episode is the last one
        if (getTotalEpisodes(animeDataAniwatch) == getEpisodeNumber() || getTotalAvailableEpisodes(animeDataAniwatch) == getEpisodeNumber()) {
            nextEpisodeBtn.style.display = "none";
            return;
        }

        // Show the next episode button when the current episode is almost finished
        let percentage = (player.currentTime() / player.duration()) * 100;
        nextEpisodeBtn.style.display = percentage >= 88 && percentage <= 100 ? "block" : "none";
    }

    // Add event listener to show the next episode button
    player.on("timeupdate", handleTimeUpdate);
    // Add event listener for video end events
    player.on("ended", () => playNextEpisode(player, nextEpisodeBtn));

    // Handle click events on the next episode button
    nextEpisodeBtn.addEventListener("click", () => playNextEpisode(player, nextEpisodeBtn));

    // Return the cleanup function
    return () => {
        player.off("timeupdate", handleTimeUpdate);
        nextEpisodeBtn.removeEventListener("click", () => playNextEpisode(player, nextEpisodeBtn));
        nextEpisodeBtn.remove();
    };
}

// Function to start playing the next episode
export function playNextEpisode(player, nextEpisodeBtn) {
    // Hide the next episode button
    nextEpisodeBtn.style.display = "none";
    // Pause the video player
    player.pause();
    // Show loading element
    document.getElementById("videoplayer").classList.add("vjs-waiting");

    // Update the episodes list
    updateEpisodeList();

    // Get and hide the next episode button
    const nextEpisodeButton = document.querySelector(".next-episode");
    nextEpisodeButton.style.display = "none";

    // Get the current episode number and calculate the next episode number
    const currentEpisodeNumber = parseInt(getEpisodeNumber());
    const nextEpisodeNumber = currentEpisodeNumber + 1;

    // Find the <a> element with the corresponding data-episode-number attribute
    const episodeLink = document.querySelector(`a[data-episode-number="${nextEpisodeNumber}"]`);

    // Check if the episode link exists and click it
    if (episodeLink) {
        episodeLink.click();
    }
}
//#endregion

//#region Event Listener Functions
// Function to handle window focus
function handleFocusChange(player) {
    // Pause the player when the window is unfocused
    if (!document.hasFocus()) {
        player.pause();
    }
}
// Function to handle keyboard controls
function handleKeyboardControls(event, player) {
    switch (event.code) {
        case "Space":
            // Toggle play/pause
            if (player.paused()) player.play();
            else player.pause();
            event.preventDefault(); // Prevent scrolling
            break;
        case "ArrowRight":
            // Seek forward 10 seconds
            player.currentTime(player.currentTime() + 10);
            event.preventDefault(); // Prevent scrolling
            break;
        case "ArrowLeft":
            // Seek backward 10 seconds
            player.currentTime(player.currentTime() - 10);
            event.preventDefault(); // Prevent scrolling
            break;
        case "ArrowUp":
            // Increase volume
            player.volume(player.volume() + 0.1);
            event.preventDefault(); // Prevent scrolling
            break;
        case "ArrowDown":
            // Decrease volume
            player.volume(player.volume() - 0.1);
            event.preventDefault(); // Prevent scrolling
            break;
        default:
            break;
    }
}
//#endregion

//#region DOMContentLoaded
document.addEventListener("DOMContentLoaded", async function () {
    // Fetch Firebase
    const firebase = await getFirebase();
    auth = firebase.auth;

    // Fetch anime and episodes data
    animeDataAniwatch = await fetchAnimeDataFromAniwatch();
    animeEpisodes = await fetchEpisodesData();

    // Get the video player instance
    const player = setupVideoPlayer();

    // Display the anime title
    document.querySelector(".anime-title").textContent = animeDataAniwatch?.data.anime.info.name;

    // Generate the Cards
    generateEpisodeList(player);
    updateEpisodeList();

    // Additional player settings
    setupSubOrDubDropdown(player);
    setVolume(player);

    // Setup season card
    setupSeasonsCard();

    // Fetch the anime data from Consumet and setup the next airing episode card
    animeDataConsumet = await fetchAnimeDataFromConsumet(animeDataAniwatch);
    await setupNextAiringEpisodeCard();

    // Trigger a resize event to adjust the UI components
    window.dispatchEvent(new Event("resize"));
    // Add event listener to handle window resizing
    window.addEventListener("resize", function () {
        resizeTriggered();
    });

    // Event listener for window focus and blur
    //window.addEventListener("focus", function () {
    //    handleFocusChange(player);
    //});
    //window.addEventListener("blur", function () {
    //    handleFocusChange(player);
    //});
    // Event listener for keyboard controls
    document.addEventListener("keydown", function (event) {
        handleKeyboardControls(event, player);
    });

    // Event listener for beforeunload to handle cases like refreshing the page and page navigation
    //window.addEventListener("beforeunload", () => {
        // Pause the video player
    //    player.pause();
    //});
    // Event listener for pagehide to handle cases like closing the tab or switching to another app
    //window.addEventListener("pagehide", () => {
        // Pause the video player
    //    player.pause();
    //});
});
//#endregion
