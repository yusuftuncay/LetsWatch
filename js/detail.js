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
import { setupVideoPlayer, setVolume, isSafari } from "./util/video.js";
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
        // Alert user on rapid requests
        alert("Slow down! Please wait a second before trying again");
    },
    isCooldownActive: function () {
        // Check cooldown period
        const currentTime = Date.now();
        return currentTime - this.lastRequestTime < this.cooldown;
    },
    updateLastRequestTime: function () {
        // Update timestamp
        this.lastRequestTime = Date.now();
    },
};
//#endregion

//#region Generate EpisodeList
function generateEpisodeList(player) {
    try {
        // Show loading
        const cardItemDiv = document.querySelector(".card-item");
        cardItemDiv.innerHTML = '<div class="loading">Loading Episodes ...</div>';

        // Clear loading
        cardItemDiv.innerHTML = "";

        // Handle no episodes
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

        // Add title if missing
        const cardTitle = document.querySelector(".card h3");
        if (!cardTitle) {
            // Get card
            const card = document.querySelector(".card");
            // Create title
            const cardTitle = document.createElement("h3");
            cardTitle.classList.add("text-white", "section-title", "underline");
            cardTitle.textContent = "Episodes";
            // Insert title
            card.insertBefore(cardTitle, cardItemDiv);
        }

        // Create fragment
        const fragment = document.createDocumentFragment();

        // Add episodes
        animeEpisodes.data.episodes.forEach((episode) => {
            const episodeLink = document.createElement("a");
            episodeLink.classList.add("link", "text-white");
            episodeLink.dataset.episodeId = episode.episodeId;
            episodeLink.dataset.episodeTitle = episode.title;
            episodeLink.dataset.episodeNumber = episode.number;
            episodeLink.textContent = episode.number;
            // Add click event
            episodeLink.addEventListener("click", async () => {
                await handleEpisodeClick(player, episode);
            });
            fragment.appendChild(episodeLink);
        });

        // Add all episodes
        cardItemDiv.appendChild(fragment);

        // Resume watched episode
        onAuthStateChanged(auth, (user) => {
            if (!user) return;
            openRecentlyWatchedEpisode();
        });

        // Setup UI
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
    // Get saved data
    const playRecentlyWatchedData = JSON.parse(localStorage.getItem("play-recently-watched"));

    // Check data exists
    if (!playRecentlyWatchedData) return;

    // Get episode number
    const currentEpisodeNumber = playRecentlyWatchedData["episode-number"];

    // Get sub/dub setting
    let subOrDub = playRecentlyWatchedData["sub-or-dub"];

    // Find episode
    const episodeElement = document.querySelector(`[data-episode-number="${currentEpisodeNumber}"]`);
    if (episodeElement) {
        // Set sub/dub option
        const subOrDubSelectElement = document.querySelector(".sub-or-dub-dropdown-select");
        if (subOrDubSelectElement && subOrDubSelectElement.value) {
            subOrDubSelectElement.value = subOrDub;
        }
        // Play episode
        episodeElement.click();
    }

    // Clear stored data
    localStorage.removeItem("play-recently-watched");
}
//#endregion

//#region Episode Click Handler
async function handleEpisodeClick(player, episode) {
    // Prevent multiple requests
    if (isLoadingEpisode) return;
    isLoadingEpisode = true;

    // Check rate limit
    if (rateLimiter.isCooldownActive()) {
        rateLimiter.warnCooldown();
        return;
    }
    // Update rate limiter
    rateLimiter.updateLastRequestTime();

    try {
        // Pause video
        player.pause();
        // Show loading
        document.getElementById("videoplayer").classList.add("vjs-waiting");

        // Set episode title
        const episodeTitle = document.querySelector(".main-title.episode-title");
        // Format title
        const titleText = episode.title && !episode.title.startsWith("EP") ? ": " + episode.title : "";
        // Create title
        let fullTitle = "EP " + episode.number + titleText;
        // Truncate if needed
        if (fullTitle.length > 40) {
            fullTitle = fullTitle.slice(0, 42) + "..";
        }
        // Update title
        episodeTitle.textContent = fullTitle;

        // Set episode number
        setEpisodeNumber(episode.number);

        // Setup servers
        await setupAvailableServersDropdown(player, episode.episodeId);

        // Get settings
        const subOrDubSelectElement = document.querySelector(".sub-or-dub-dropdown-select");
        const serverSelectElement = document.querySelector(".server-dropdown-select");

        // Get episode source
        const episodeData = await fetchDataWithRedBackgroundColor(
            `https://aniwatch.tuncay.be/api/v2/hianime/episode/sources?animeEpisodeId=${episode.episodeId}&category=${subOrDubSelectElement.value}&server=${serverSelectElement.value}`
        );

        // Setup video URL
        const sourceUrl = episodeData?.data?.sources?.[0]?.url;
        const proxiedM3u8Url = "https://proxy.letswatch.one/m3u8-proxy" + `?url=${sourceUrl}`;
        player.src({ src: proxiedM3u8Url, type: "application/x-mpegURL" });

        // Handle errors
        player.one("error", () => {
            // Get container
            const videoContainer = document.getElementById("videoplayer");

            // Remove loading state
            videoContainer.classList.remove("vjs-waiting", "vjs-controls-disabled", "vjs-error");

            // Show controls
            const controlBar = videoContainer.querySelector(".vjs-control-bar");
            if (controlBar) {
                controlBar.style.display = "flex";
            }

            // Show error message
            const errorDisplay = videoContainer.querySelector(".vjs-modal-dialog-content");
            if (errorDisplay) {
                errorDisplay.innerHTML = "An error occurred while loading the video. Please try changing servers or refreshing the page.";
            }

            // Enable controls
            player.controls(true);
        });

        // Setup video on load
        player.one("loadedmetadata", () => {
            // Check auth
            onAuthStateChanged(auth, (user) => {
                if (!user) return;

                // Set volume
                setVolume(player);
                // Resume from saved position
                resumeEpisodeProgress(player, animeDataAniwatch.data.anime.info.id);
                // Save to history
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
                // Track progress
                saveEpisodeProgress(player, episode.episodeId);
            });

            // Setup subtitles
            setupSubtitles(player, episodeData.data);
            // Update UI
            updateEpisodeList();
        });

        // Setup AniList
        setupAniListUpdate(player);

        // Setup controls
        setupSkipButtons(player, episodeData.data.intro, episodeData.data.outro);
        setupNextEpisodeHandler(player);
    } catch (error) {
        console.error(error.message);
    } finally {
        // Reset flag
        isLoadingEpisode = false;
    }
}
//#endregion

//#region Episode Helpers
// Function to resume episode from the last watched position
function resumeEpisodeProgress(player, animeId) {
    // Get watched data
    const recentlyWatchedData = JSON.parse(localStorage.getItem("recently-watched")) || [];

    // Get current episode
    const episodeNumber = getEpisodeNumber();

    // Find saved position
    const episodeData = recentlyWatchedData.find((item) => item["anime-id"] == animeId && item["episode-number"] == episodeNumber);

    // Resume if saved
    if (episodeData && episodeData["episode-progress"] != 0) {
        player.currentTime(parseFloat(episodeData["episode-progress"]));
    }

    // Start playback
    player.play();
}

// Function to add/update an episode in recently watched
function saveEpisodeInRecentlyWatched(data) {
    // Get props
    const { animeId, animeTitle, episodeTitle, episodeImage, episodeNumber, episodeTotal, episodeId, episodeDuration, subOrDub } = data;

    // Get history
    let recentlyWatchedData = JSON.parse(localStorage.getItem("recently-watched")) || [];

    // Remove if exists
    recentlyWatchedData = recentlyWatchedData.filter((item) => item["anime-id"] != animeId);

    // Add to top
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

    // Save history
    localStorage.setItem("recently-watched", JSON.stringify(recentlyWatchedData));
}

// Function to save the progress of an episode in local storage
function saveEpisodeProgress(player, episodeId) {
    // Get history
    const recentlyWatchedData = JSON.parse(localStorage.getItem("recently-watched")) || [];

    // Find episode
    const animeIndex = recentlyWatchedData.findIndex((item) => item["episode-id"] == episodeId);

    // Track progress state
    let shouldSaveProgress = true;

    // Update progress handler
    const handleTimeUpdate = () => {
        // Skip if disabled
        if (!shouldSaveProgress || animeIndex == -1) return;

        // Save current time
        recentlyWatchedData[animeIndex]["episode-progress"] = Math.floor(player.currentTime());

        // Update storage
        localStorage.setItem("recently-watched", JSON.stringify(recentlyWatchedData));
    };

    // Toggle progress tracking
    const handlePlayerStateChange = () => {
        if (player.paused() || player.currentSrc() == "") {
            // Disable when paused/loading
            shouldSaveProgress = false;
        } else {
            // Enable when playing
            shouldSaveProgress = true;
        }
    };

    // Add listeners
    player.on("timeupdate", handleTimeUpdate);
    player.on("play", handlePlayerStateChange);
    player.on("pause", handlePlayerStateChange);
    player.on("waiting", handlePlayerStateChange); // Loading
    player.on("loadeddata", handlePlayerStateChange); // After load

    // Cleanup function
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
    // Remove existing tracks
    const tracks = player.textTracks();
    for (let i = tracks.length - 1; i >= 0; i--) {
        player.removeRemoteTextTrack(tracks[i]);
    }

    // Check for tracks
    if (!episode.tracks || !Array.isArray(episode.tracks)) return;

    // Get subtitles only
    const subtitleTracks = episode.tracks.filter((track) => track.lang && track.lang.toLowerCase() !== "thumbnails");

    let defaultTrackLabel = null;

    // Add tracks
    subtitleTracks.forEach((track) => {
        // Proxy track URL
        const trackUrl = track.url;
        const proxiedTrackUrl = "https://proxy.letswatch.one/m3u8-proxy" + `?url=${trackUrl}`;

        // Create track
        const trackObj = {
            kind: "captions",
            label: track.lang || "Unknown",
            srclang: track.lang ? track.lang.toLowerCase().substring(0, 2) : "en",
            src: proxiedTrackUrl,
        };

        player.addRemoteTextTrack(trackObj, false);

        // Prefer English
        if (track.lang && track.lang.toLowerCase() === "english") {
            defaultTrackLabel = track.lang;
        }
    });

    // Set first track as fallback
    if (!defaultTrackLabel && subtitleTracks.length) {
        defaultTrackLabel = subtitleTracks[0].lang;
    }

    // Enable default track
    setTimeout(() => {
        const textTracks = player.textTracks();

        // Disable all tracks first
        for (let i = 0; i < textTracks.length; i++) {
            textTracks[i].mode = "disabled";
        }

        // Enable preferred track
        if (defaultTrackLabel) {
            for (let i = 0; i < textTracks.length; i++) {
                if (textTracks[i].label === defaultTrackLabel) {
                    textTracks[i].mode = "showing";
                    break;
                }
            }
        } else if (textTracks.length > 0) {
            // Use first track
            for (let i = 0; i < textTracks.length; i++) {
                if (textTracks[i].kind === "captions") {
                    textTracks[i].mode = "showing";
                    break;
                }
            }
        }
    }, 500);
}
//#endregion

//#region Extra Card Setups
// Function to setup the seasons or related anime card
function setupSeasonsCard() {
    // Get container
    const mainSection = document.querySelector(".main-container");

    // Create elements
    const cardContainer = document.createElement("div");
    cardContainer.classList.add("seasons");

    const cardTitle = document.createElement("h3");
    cardTitle.classList.add("text-white", "section-title", "underline");

    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card");

    const cardContent = document.createElement("div");
    cardContent.classList.add("card-item");

    // Check for seasons
    if (animeDataAniwatch.data.seasons.length > 0) {
        // Show seasons
        cardTitle.textContent = "Seasons";

        // Add season links
        animeDataAniwatch.data.seasons.forEach((season) => {
            const seasonLink = document.createElement("a");
            seasonLink.href = `../html/detail.html?id=${season.id}`;
            seasonLink.textContent = season.name;
            seasonLink.classList.add("link", "text-white");
            // Highlight current season
            if (season.isCurrent) {
                seasonLink.classList.add("currently-watching");
            }

            // Add to card
            cardContent.appendChild(seasonLink);
        });
    } else {
        // Show related anime
        cardTitle.textContent = "Related";

        // Add related links
        animeDataAniwatch.data.relatedAnimes.forEach((related) => {
            const relatedLink = document.createElement("a");
            relatedLink.href = `../html/detail.html?id=${related.id}`;
            relatedLink.textContent = related.name;
            relatedLink.classList.add("link", "text-white");

            // Add to card
            cardContent.appendChild(relatedLink);
        });
    }

    // Assemble card
    cardDiv.appendChild(cardTitle);
    cardDiv.appendChild(cardContent);
    cardContainer.appendChild(cardDiv);
    mainSection.appendChild(cardContainer);
}

// Function to setup the next airing episode information
async function setupNextAiringEpisodeCard() {
    // Check for airing data
    if (!animeDataConsumet.nextAiringEpisode) return;

    // Create container
    let div = document.createElement("div");
    div.classList.add("next-airing");

    // Get time info
    let timeUntilAiring = animeDataConsumet.nextAiringEpisode.timeUntilAiring;
    let episode = animeDataConsumet.nextAiringEpisode.episode;

    // Create airing display
    let airingTimeDiv = document.createElement("div");
    airingTimeDiv.classList.add("card", "text-white", "main-title");
    airingTimeDiv.innerHTML = `<div class="episode-info">Episode <span class="underline">${episode}</span> airing in</div>`;
    let timeInfoDiv = document.createElement("div");
    timeInfoDiv.classList.add("time-info");
    airingTimeDiv.appendChild(timeInfoDiv);
    div.appendChild(airingTimeDiv);

    // Add to page
    let mainContainer = document.querySelector(".main-container");
    mainContainer.appendChild(div);

    // Format time
    function formatTimeUntilAiring(seconds) {
        // Calculate time units
        let days = Math.floor(seconds / (24 * 60 * 60));
        let hoursLeft = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
        let minutesLeft = Math.floor((seconds % (60 * 60)) / 60);

        // Build string
        let formattedTime = "";
        if (days > 0) {
            formattedTime += `${days} day${days == 1 ? "" : "s"}, `;
        }
        if (hoursLeft > 0) {
            formattedTime += `${hoursLeft} hour${hoursLeft == 1 ? "" : "s"}, `;
        }
        formattedTime += `${minutesLeft} minute${minutesLeft == 1 ? "" : "s"}`;

        return formattedTime;
    }

    // Update timer
    function updateTimeInfo() {
        timeInfoDiv.innerText = formatTimeUntilAiring(timeUntilAiring);
        timeUntilAiring -= 60;
    }

    // Start timer
    updateTimeInfo();
    setInterval(updateTimeInfo, 60000); // Every minute

    // Animate in
    setTimeout(() => {
        div.classList.add("loaded");
    }, 10);
}
//#endregion

//#region Setup Player Buttons
// Function to setup the sub or dub dropdown
function setupSubOrDubDropdown(player) {
    // Skip if exists
    if (document.querySelector(".sub-or-dub-dropdown")) return;

    // Create container
    const divElement = document.createElement("div");
    divElement.classList.add("sub-or-dub-dropdown");

    // Create dropdown
    const selectElement = document.createElement("select");
    selectElement.classList.add("sub-or-dub-dropdown-select");

    // Create options
    const subOption = document.createElement("option");
    subOption.value = "sub";
    subOption.textContent = "Sub";
    const dubOption = document.createElement("option");
    dubOption.value = "dub";
    dubOption.textContent = "Dub";
    const rawOption = document.createElement("option");
    rawOption.value = "raw";
    rawOption.textContent = "Raw";

    // Build dropdown
    selectElement.appendChild(subOption);
    selectElement.appendChild(dubOption);
    selectElement.appendChild(rawOption);
    divElement.appendChild(selectElement);

    // Add to player
    const targetElement = document.querySelector(".vjs-remaining-time");
    targetElement.parentNode.insertBefore(divElement, targetElement.nextSibling);

    // Handle selection
    selectElement.addEventListener("change", function () {
        // Pause video
        player.pause();
        // Show loading
        document.getElementById("videoplayer").classList.add("vjs-waiting");

        // Get episode
        const episodeNumber = getEpisodeNumber();
        // Find episode
        const episodeElement = document.querySelector(`a.link.text-white[data-episode-number="${episodeNumber}"]`);
        // Reload episode
        if (episodeElement) {
            episodeElement.click();
        }
    });
}

// Function to get the available servers for the selected episode
async function setupAvailableServersDropdown(player, episodeId) {
    // Get servers
    const servers = await fetchDataWithAlert(`https://aniwatch.tuncay.be/api/v2/hianime/episode/servers?animeEpisodeId=${episodeId}`);

    // Save previous selection
    let previousValue = "";
    // Remove old dropdown
    const existingServerDropdown = document.querySelector(".server-dropdown");
    if (existingServerDropdown) {
        // Save selection
        previousValue = existingServerDropdown.querySelector(".server-dropdown-select").value || "";
        // Remove dropdown
        existingServerDropdown.parentNode.removeChild(existingServerDropdown);
    }

    // Skip if no servers
    if (!servers.data.sub && !servers.data.dub && !servers.data.raw) return;

    // Create dropdown
    const serverSelectElement = document.createElement("select");
    serverSelectElement.classList.add("server-dropdown-select");

    // Get current language
    const subOrDubSelectElement = document.querySelector(".sub-or-dub-dropdown-select");
    // Save selection
    const previousSubOrDubValue = subOrDubSelectElement.value;
    // Set best available language
    if (previousSubOrDubValue == "sub" && servers.data.sub.length > 0) {
        subOrDubSelectElement.value = "sub";
    } else if (previousSubOrDubValue == "dub" && servers.data.dub.length > 0) {
        subOrDubSelectElement.value = "dub";
    } else if (previousSubOrDubValue == "raw" && servers.data.raw.length > 0) {
        subOrDubSelectElement.value = "raw";
    }
    // Fallback priorities
    else if (servers.data.sub.length > 0) {
        subOrDubSelectElement.value = "sub";
    } else if (servers.data.dub.length > 0) {
        subOrDubSelectElement.value = "dub";
    } else if (servers.data.raw.length > 0) {
        subOrDubSelectElement.value = "raw";
    }
    // Get selected language
    const subOrDub = subOrDubSelectElement.value;

    // Add server options
    if (Array.isArray(servers.data[subOrDub])) {
        servers.data[subOrDub].forEach((server) => {
            // Get server name
            let serverName = server.serverName;

            // Server display names
            const serverNameMapping = {
                "hd-1": "HD-1",
                megacloud: "MegaCloud",
                streamsb: "StreamSB",
                streamtape: "StreamTape",
                "hd-2": "HD-2",
                "hd-3": "HD-3",
                asianload: "AsianLoad",
                gogocdn: "GogoCDN",
                mixdrop: "MixDrop",
            };

            // Create option
            const option = document.createElement("option");
            option.value = serverName;

            // Use friendly name
            if (serverNameMapping[serverName]) {
                option.textContent = serverNameMapping[serverName];
            } else {
                option.textContent = serverName;
            }

            // Add to dropdown
            serverSelectElement.appendChild(option);
        });
    }

    // Set previous selection
    serverSelectElement.dataset.previousValue = previousValue;
    // Get first option
    const firstOptionValue = serverSelectElement.options[0]?.value;
    // Select preferred server
    if (!previousValue || !serverSelectElement.querySelector(`option[value="${previousValue}"]`)) {
        if (serverSelectElement.querySelector('option[value="hd-2"]')) {
            serverSelectElement.value = "hd-2";
        } else if (firstOptionValue && firstOptionValue !== "") {
            serverSelectElement.value = firstOptionValue;
        } else {
            serverSelectElement.value = "N/A";
        }
    } else {
        // Use previous selection
        serverSelectElement.value = previousValue;
    }

    // Create container
    const divElement = document.createElement("div");
    divElement.classList.add("server-dropdown");
    divElement.appendChild(serverSelectElement);

    // Add to player
    const targetElement = document.querySelector(".vjs-remaining-time");
    targetElement.parentNode.insertBefore(divElement, targetElement.nextSibling);

    // Handle selection
    serverSelectElement.addEventListener("change", function () {
        // Pause video
        player.pause();
        // Show loading
        document.getElementById("videoplayer").classList.add("vjs-waiting");

        // Get episode
        const episodeNumber = getEpisodeNumber();
        // Find episode
        const episodeElement = document.querySelector(`a.link.text-white[data-episode-number="${episodeNumber}"]`);
        // Reload episode
        if (episodeElement) {
            setTimeout(() => {
                episodeElement.click();
            }, 500);
        }
    });
}

// Function to get the available servers for the selected episode
/*async function getAvailableServers(episodeId) {
    // Fetch servers
    const servers = await fetchDataWithAlert(`https://aniwatch.tuncay.be/api/v2/hianime/episode/servers?animeEpisodeId=${episodeId}`);

    // For selected servers
    const selectedServers = [];

    // Server priority
    const serverIds = [4, 1, 2, 3, 5, 6, 7, 8];

    // Get language setting
    const subOrDubSelectElement = document.querySelector(".sub-or-dub-dropdown-select");
    // Get current language
    const subOrDub = subOrDubSelectElement.value;

    // Select servers by priority
    for (const serverId of serverIds) {
        // Check language
        if (subOrDub == "sub") {
            // Find in sub servers
            let subServer = servers.data.sub.find((server) => server.serverId == serverId);
            if (subServer) {
                selectedServers.push(subServer);
                continue;
            }
        } else if (subOrDub == "dub") {
            // Find in dub servers
            let dubServer = servers.data.dub.find((server) => server.serverId == serverId);
            if (dubServer) {
                selectedServers.push(dubServer);
                continue;
            }
        }
    }

    return selectedServers;
}*/
//#endregion

//#region Update EpisodeList
function updateEpisodeList() {
    // Check auth
    onAuthStateChanged(auth, (user) => {
        const isUserLoggedIn = !!user;
        const episodeNumber = isUserLoggedIn ? getEpisodeNumberFromLocalStorage() : getEpisodeNumber();

        // Get all episodes
        const allEpisodeElements = document.querySelectorAll(".card-item a[data-episode-number]");

        // Update each episode
        allEpisodeElements.forEach((element) => {
            const elementEpisodeNumber = parseInt(element.getAttribute("data-episode-number"));

            // Reset classes
            element.classList.remove("currently-watching", "watched");

            // Mark current episode
            if (elementEpisodeNumber == episodeNumber) {
                element.classList.add("currently-watching");
            }

            // Mark watched episodes
            if (isUserLoggedIn && elementEpisodeNumber < episodeNumber) {
                element.classList.add("watched");
            }

            // Mark fillers
            if (animeEpisodes.data.episodes[elementEpisodeNumber - 1].isFiller) {
                element.classList.add("filler");
            }
        });

        // Auto-scroll to current
        // const episodeElement = document.querySelector(`.card-item a[data-episode-number="${episodeNumber}"]`);
        // if (episodeElement && !isSafari()) {
        //     episodeElement.scrollIntoView({ behavior: "smooth", block: "center" });
        // }
    });

    // Get episode from history
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
    // Track update status
    let updateTriggered = false;

    // Track progress
    function handleTimeUpdate() {
        // Update near end of episode
        let currentPercentage = (player.currentTime() / player.duration()) * 100;

        // Update once at 90%
        if (!updateTriggered && currentPercentage >= 90 && currentPercentage <= 100) {
            updateTriggered = true; // Prevent multiple updates

            // Update AniList
            onAuthStateChanged(auth, async () => {
                // Check for token
                const token = localStorage.getItem("anilist-token");
                if (!token) return;

                // Update progress
                await updateAniListMediaEntry(token, getAnilistId(animeDataAniwatch), getEpisodeNumber(), getTotalEpisodes(animeDataAniwatch));
            });
        }
    }

    // Add listener
    player.on("timeupdate", handleTimeUpdate);

    // Cleanup function
    return () => {
        player.off("timeupdate", handleTimeUpdate);
    };
}
//#endregion

//#region Intro/Outro Skip Handler
function setupSkipButtons(player, intro, outro) {
    // Get player container
    const videoContainer = document.querySelector(".video-js");

    // Create intro button
    let skipIntroButton = document.querySelector(".skip-intro-button");
    if (!skipIntroButton) {
        skipIntroButton = document.createElement("button");
        skipIntroButton.textContent = "Skip Intro";
        skipIntroButton.classList.add("skip-intro-button");
        skipIntroButton.style.display = "none";
        videoContainer.appendChild(skipIntroButton);
    }

    // Create outro button
    let skipOutroButton = document.querySelector(".skip-outro-button");
    if (!skipOutroButton) {
        skipOutroButton = document.createElement("button");
        skipOutroButton.textContent = "Skip Outro";
        skipOutroButton.classList.add("skip-outro-button");
        skipOutroButton.style.display = "none";
        videoContainer.appendChild(skipOutroButton);
    }

    // Show buttons at right time
    function handleTimeUpdate() {
        // Get current position
        const currentTime = player.currentTime();

        // Check for intro
        if (intro.start > 0 && intro.end > 0) {
            // Show during intro
            if (currentTime >= intro.start && currentTime <= intro.end) {
                skipIntroButton.style.display = "block";
            } else {
                skipIntroButton.style.display = "none";
            }
        } else {
            // No intro data
            skipIntroButton.style.display = "none";
        }

        // Check for outro
        if (outro.start > 0 && outro.end > 0) {
            // Show during outro
            if (currentTime >= outro.start && currentTime <= outro.end) {
                skipOutroButton.style.display = "block";
            } else {
                skipOutroButton.style.display = "none";
            }
        } else {
            // No outro data
            skipOutroButton.style.display = "none";
        }
    }

    // Add listener
    player.on("timeupdate", handleTimeUpdate);

    // Skip intro handler
    skipIntroButton.addEventListener("click", () => {
        skipIntroButton.style.display = "none";
        player.currentTime(intro.end);
        player.play();
    });
    // Skip outro handler
    skipOutroButton.addEventListener("click", () => {
        skipOutroButton.style.display = "none";
        player.currentTime(outro.end);
        player.play();
    });

    // Cleanup function
    return () => {
        player.off("timeupdate", handleTimeUpdate);
        skipIntroButton.removeEventListener("click", () => {
            skipIntroButton.style.display = "none";
            player.currentTime(intro.end);
            player.play();
        });
        skipOutroButton.removeEventListener("click", () => {
            skipOutroButton.style.display = "none";
            player.currentTime(outro.end);
            player.play();
        });
        skipIntroButton.remove();
        skipOutroButton.remove();
    };
}
//#endregion

//#region Next Episode Handler
function setupNextEpisodeHandler(player) {
    // Get player container
    const videoContainer = document.querySelector(".video-js");

    // Create next button
    let nextEpisodeBtn = document.querySelector(".next-episode");
    if (!nextEpisodeBtn) {
        nextEpisodeBtn = document.createElement("button");
        nextEpisodeBtn.textContent = "Next Episode";
        nextEpisodeBtn.classList.add("next-episode");
        nextEpisodeBtn.style.display = "none";
        videoContainer.appendChild(nextEpisodeBtn);
    } else {
        // Hide button
        nextEpisodeBtn.style.display = "none";
    }

    // Show near end of episode
    function handleTimeUpdate() {
        // Check if last episode
        if (getTotalEpisodes(animeDataAniwatch) == getEpisodeNumber() || getTotalAvailableEpisodes(animeDataAniwatch) == getEpisodeNumber()) {
            nextEpisodeBtn.style.display = "none";
            return;
        }

        // Show near end
        let percentage = (player.currentTime() / player.duration()) * 100;
        nextEpisodeBtn.style.display = percentage >= 88 && percentage <= 100 ? "block" : "none";
    }

    // Add listeners
    player.on("timeupdate", handleTimeUpdate);
    player.on("ended", () => playNextEpisode(player, nextEpisodeBtn));

    // Click handler
    nextEpisodeBtn.addEventListener("click", () => playNextEpisode(player, nextEpisodeBtn));

    // Cleanup function
    return () => {
        player.off("timeupdate", handleTimeUpdate);
        player.off("ended", () => playNextEpisode(player, nextEpisodeBtn));
        nextEpisodeBtn.removeEventListener("click", () => playNextEpisode(player, nextEpisodeBtn));
        nextEpisodeBtn.remove();
    };
}

// Function to start playing the next episode
export function playNextEpisode(player, nextEpisodeBtn) {
    // Hide button
    nextEpisodeBtn.style.display = "none";
    // Pause video
    player.pause();
    // Show loading
    document.getElementById("videoplayer").classList.add("vjs-waiting");

    // Update UI
    updateEpisodeList();

    // Hide next button
    const nextEpisodeButton = document.querySelector(".next-episode");
    nextEpisodeButton.style.display = "none";

    // Calculate next episode
    const currentEpisodeNumber = parseInt(getEpisodeNumber());
    const nextEpisodeNumber = currentEpisodeNumber + 1;

    // Find episode link
    const episodeLink = document.querySelector(`a[data-episode-number="${nextEpisodeNumber}"]`);

    // Play next episode
    if (episodeLink) {
        episodeLink.click();
    }
}
//#endregion

//#region Event Listener Functions
// Function to handle window focus
// function handleFocusChange(player) {
//     // Pause on blur
//     if (!document.hasFocus()) {
//         player.pause();
//     }
// }
// Function to handle keyboard controls
function handleKeyboardControls(event, player) {
    switch (event.code) {
        case "Space":
            // Toggle play/pause
            if (player.paused()) player.play();
            else player.pause();
            event.preventDefault(); // Prevent scroll
            break;
        case "ArrowRight":
            // Forward 10s
            player.currentTime(player.currentTime() + 10);
            event.preventDefault(); // Prevent scroll
            break;
        case "ArrowLeft":
            // Back 10s
            player.currentTime(player.currentTime() - 10);
            event.preventDefault(); // Prevent scroll
            break;
        case "ArrowUp":
            // Volume up
            player.volume(player.volume() + 0.1);
            event.preventDefault(); // Prevent scroll
            break;
        case "ArrowDown":
            // Volume down
            player.volume(player.volume() - 0.1);
            event.preventDefault(); // Prevent scroll
            break;
        default:
            break;
    }
}
//#endregion

//#region Info Icon Tooltip
function setupInfoIconTooltip() {
    const infoIcon = document.querySelector(".anime-info-icon");
    if (!infoIcon) return;

    let tooltip = null;
    let hideTimeout = null;
    let isVisible = false;

    function showTooltip() {
        // Clear any pending hide timeout
        if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
        }

        // Don't create if already visible
        if (isVisible || tooltip) return;

        const description = infoIcon.getAttribute("data-description");
        if (!description) return;

        // Create and style tooltip
        tooltip = document.createElement("div");
        tooltip.className = "anime-tooltip";

        // Convert HTML to plain text
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = description.replace(/<br\s*\/?>/gi, "\n");
        tooltip.textContent = tempDiv.textContent || tempDiv.innerText || "";

        // Apply styles
        Object.assign(tooltip.style, {
            position: "absolute",
            backgroundColor: "#222",
            color: "white",
            padding: "16px 20px",
            borderRadius: "24px",
            border: "10px solid #222",
            fontSize: "14px",
            maxWidth: "400px",
            wordWrap: "break-word",
            whiteSpace: "pre-wrap",
            zIndex: "1000",
            boxShadow: "0 0 10px 1px #222",
            pointerEvents: "none",
            fontFamily: "ForoSans, sans-serif",
            lineHeight: "1.4",
            opacity: "0",
            transition: "opacity 0.2s ease",
        });

        document.body.appendChild(tooltip);

        // Position tooltip
        const rect = infoIcon.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();

        let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        let top = rect.top - tooltipRect.height - 20;

        // Keep tooltip on screen
        if (left < 10) left = 10;
        if (left + tooltipRect.width > window.innerWidth - 10) {
            left = window.innerWidth - tooltipRect.width - 10;
        }
        if (top < 10) top = rect.bottom + 20;

        tooltip.style.left = left + "px";
        tooltip.style.top = top + "px";

        // Show tooltip
        requestAnimationFrame(() => {
            if (tooltip) {
                tooltip.style.opacity = "1";
                isVisible = true;
            }
        });
    }

    function hideTooltip() {
        // Clear any pending hide timeout
        if (hideTimeout) {
            clearTimeout(hideTimeout);
        }

        hideTimeout = setTimeout(() => {
            if (tooltip) {
                tooltip.style.opacity = "0";
                setTimeout(() => {
                    if (tooltip && tooltip.parentNode) {
                        tooltip.remove();
                    }
                    tooltip = null;
                    isVisible = false;
                }, 300);
            }
            hideTimeout = null;
        }, 50); // Small delay to prevent flickering
    }

    infoIcon.addEventListener("mouseenter", showTooltip);
    infoIcon.addEventListener("mouseleave", hideTooltip);
}
//#endregion

//#region DOMContentLoaded
document.addEventListener("DOMContentLoaded", async function () {
    // Init Firebase
    const firebase = await getFirebase();
    auth = firebase.auth;

    // Get data
    animeDataAniwatch = await fetchAnimeDataFromAniwatch();
    animeEpisodes = await fetchEpisodesData();

    // Setup player
    const player = setupVideoPlayer();

    // Set title
    document.querySelector(".anime-title").textContent = animeDataAniwatch?.data.anime.info.name;

    // Create UI
    generateEpisodeList(player);
    updateEpisodeList();

    // Setup controls
    setupSubOrDubDropdown(player);

    // Show seasons
    setupSeasonsCard();

    // Show airing info
    animeDataConsumet = await fetchAnimeDataFromConsumet(animeDataAniwatch);
    await setupNextAiringEpisodeCard();

    // Update title
    const titleElement = document.querySelector(".anime-title");
    // Setup info icon tooltip
    if (titleElement && animeDataConsumet?.description) {
        const description = animeDataConsumet?.description;
        titleElement.innerHTML = `
            ${animeDataAniwatch?.data.anime.info.name}
            <img src="../img/info-icon.svg" class="anime-info-icon" alt="Info" data-description="${description.replace(/"/g, "&quot;")}" />
        `;

        setupInfoIconTooltip();
    }

    // Update layout
    window.dispatchEvent(new Event("resize"));
    // Listen for resize
    window.addEventListener("resize", function () {
        resizeTriggered();
    });

    // Window focus events
    //window.addEventListener("focus", function () {
    //    handleFocusChange(player);
    //});
    //window.addEventListener("blur", function () {
    //    handleFocusChange(player);
    //});
    // Keyboard controls
    document.addEventListener("keydown", function (event) {
        handleKeyboardControls(event, player);
    });

    // Page unload handling
    //window.addEventListener("beforeunload", () => {
    // Pause video
    //    player.pause();
    //});
    // Tab/app switching
    //window.addEventListener("pagehide", () => {
    // Pause video
    //    player.pause();
    //});
});
//#endregion
