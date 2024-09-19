//#region Import
import { playNextEpisode } from "../detail.js";
//#endregion

//#region VideoPlayer Setup
export function setupVideoPlayer() {
    // Set up the video player with configuration
    const playerConfig = {
        controlBar: {
            volumePanel: { inline: false },
        },
    };

    // Add the HLS Quality Selector plugin if not Safari
    if (!isSafari()) {
        playerConfig.plugins = {
            hlsQualitySelector: { displayCurrentQuality: true },
        };
    }

    const player = videojs("videoplayer", playerConfig);

    // Add event listeners for video end events
    player.on("ended", () => playNextEpisode(player));

    // Return the player instance
    return player;
}
//#endregion

//#region Set Volume
export function setVolume(player) {
    // Return if Safari
    if (isSafari()) return;

    // Unmute
    player.muted(false);

    // Load the previously saved volume or set a default
    const savedVolume = localStorage.getItem("volume");
    if (savedVolume !== null) {
        player.volume(savedVolume); // Load saved volume
    } else {
        player.volume(0.5); // Default volume
    }

    // Update and save the volume whenever it changes
    player.on("volumechange", function () {
        if (player.muted()) {
            localStorage.setItem("volume", "0"); // Save as 0 when muted
        } else {
            localStorage.setItem("volume", player.volume().toFixed(2)); // Save volume to 2 decimal places
        }
    });
}
//#endregion

//#region Quality Helpers
// Function to add event listeners to quality items
export function addEventListenerToQualityItem() {
    // Get all quality items
    const qualities = document.querySelectorAll(".vjs-quality-selector .vjs-menu-item");

    // Add event listener to each quality item
    qualities.forEach((item) => {
        // Remove any existing listeners
        item.removeEventListener("click", handleQualityChange);
        item.removeEventListener("touchend", handleQualityChange);

        // Add new listeners for both click and touchend
        item.addEventListener("click", handleQualityChange);
        item.addEventListener("touchend", handleQualityChange);
    });
}
// Function to handle quality change
function handleQualityChange(event) {
    // Prevent the default touch behavior
    event.preventDefault();

    // Get the selected quality
    const selectedQuality = event.currentTarget.querySelector(".vjs-menu-item-text").textContent.trim();

    // Set the selected quality
    localStorage.setItem("quality", selectedQuality);
}

// Function to load the preferred quality from local storage
export function loadPreferredQuality() {
    // Retrieve the preferred quality from local storage
    const validQualities = ["1080p", "720p", "480p", "360p", "Auto"];
    const storedQuality = localStorage.getItem("quality");
    const preferredQuality = validQualities.includes(storedQuality) ? storedQuality : "1080p";

    // Search for the preferred quality directly in the menu items
    const preferredItem = Array.from(document.querySelectorAll(".vjs-menu-item .vjs-menu-item-text")).find((item) => item.textContent.trim() == preferredQuality);

    // Click the preferred quality item if found
    if (preferredItem) {
        preferredItem.closest(".vjs-menu-item").click();
    }
}
//#endregion

//#region Check if Safari
export function isSafari() {
    var userAgent = navigator.userAgent;
    var isChrome = userAgent.indexOf("Chrome") > -1;
    var isSafari = userAgent.indexOf("Safari") > -1;

    // Chrome's user agent includes both 'Chrome' and 'Safari', so we need to check for Chrome to exclude it.
    if (isChrome && isSafari) return false;
    else if (isSafari) return true;
    else return false;
}
//#endregion
