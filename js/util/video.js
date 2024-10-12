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

    // Create the video player instance with the configuration
    const player = videojs("videoplayer", playerConfig);

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

//#region Function to load the highest quality
export function loadHighestQuality(player) {
    // Retrieve the highest available quality
    const validQualities = ["1080p", "720p", "480p", "360p", "240p", "144p"];

    // Find the highest available quality in the menu items
    const qualityItems = Array.from(document.querySelectorAll(".vjs-quality-selector .vjs-menu-item .vjs-menu-item-text"));
    const highestAvailableQuality = validQualities.find((quality) => qualityItems.some((item) => item.textContent.trim() === quality));

    // Click the highest available quality item if found
    if (highestAvailableQuality) {
        qualityItems
            .find((item) => item.textContent.trim() === highestAvailableQuality)
            .closest(".vjs-menu-item")
            ?.click();
        // Reload the video player
        player.load();

        // Select the quality menu item
        // qualityItems.forEach((item) => {
        //     // Check if the item's value matches the selected quality
        //     if (item.innerText === highestAvailableQuality) {
        //         // Add "vjs-selected" class to the selected quality item
        //         item.classList.add("vjs-selected");
        //     } else {
        //         // Remove "vjs-selected" class from other items
        //         item.classList.remove("vjs-selected");
        //     }
        // });
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
