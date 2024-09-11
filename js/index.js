//#region Import
import { fetchDataWithoutRedBackgroundColor, checkTitleOverflow } from "./util/main.js";
//#endregion

//#region Firebase
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getFirebase } from "./firebase/init.js";
//#endregion

//#region Generate Cards
function generateCards(data, sectionTitleText) {
    // Select the main section
    const mainSection = document.querySelector("main");

    // Create a container for the cards
    const cardContainer = document.createElement("div");
    cardContainer.classList.add("main-container");
    cardContainer.classList.add(sectionTitleText.replace(/\s+/g, "-").toLowerCase());

    // Create a title for the section
    const sectionTitle = document.createElement("h1");
    sectionTitle.classList.add("text-white", "main-title");
    sectionTitle.textContent = sectionTitleText;

    // Object to store existing cards
    const existingCards = {};

    // Loop through each item in the response data
    data.forEach((item) => {
        // Check if the item's name is already in existingCards
        if (existingCards[item.name]) return;

        // Create a card for the current item
        const card = createCard("html/detail.html?id=" + item.id, item.name, item.poster, item.episodes.sub);
        // Append the card to the card container
        cardContainer.appendChild(card);
    });

    // Append the section title and card container to the main section
    mainSection.appendChild(sectionTitle);
    mainSection.appendChild(cardContainer);
}
// Function to create card elements
function createCard(link, title, image, totalEpisodes) {
    // Create a link element
    const cardLink = document.createElement("a");
    cardLink.classList.add("card-link");
    cardLink.href = link;

    // Create a div element
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card");

    // Create an image element
    const imgElement = document.createElement("img");
    imgElement.src = image;

    // Create a title element
    const cardTitle = document.createElement("h3");
    cardTitle.classList.add("card-title");
    cardTitle.textContent = title;

    // Append elements to construct the card
    cardLink.appendChild(cardDiv);
    cardDiv.appendChild(imgElement);
    cardDiv.appendChild(cardTitle);

    // Create an episode number element
    if (totalEpisodes) {
        const episodeNumberElement = document.createElement("p");
        episodeNumberElement.classList.add("card-episode-number");
        episodeNumberElement.textContent = `EP ${totalEpisodes}`;
        cardDiv.appendChild(episodeNumberElement);
    }

    // Return the constructed card
    return cardLink;
}
/*// Function to generate the schedule section
async function generateSchedule() {
    // Select the main section
    const mainSection = document.querySelector("main");

    // Create "Aired" container
    const airedScheduleContainer = document.createElement("div");
    airedScheduleContainer.classList.add("main-container", "schedule");
    // Create "Airing" container
    const airingScheduleContainer = document.createElement("div");
    airingScheduleContainer.classList.add("main-container", "schedule");

    // Create a title
    const sectionTitle = document.createElement("h1");
    sectionTitle.classList.add("text-white", "main-title");
    sectionTitle.textContent = "Schedule";

    try {
        // Calculate the dates in the local time zone
        const currentDate = new Date();
        const yesterdayDate = new Date(new Date().setDate(currentDate.getDate() - 1));
        const tomorrowDate = new Date(new Date().setDate(currentDate.getDate() + 1));
        const dayAfterTomorrowDate = new Date(new Date().setDate(currentDate.getDate() + 2));

        // Format dates as needed for API requests
        const formattedYesterdayDate = yesterdayDate.toISOString().split("T")[0];
        const formattedCurrentDate = currentDate.toISOString().split("T")[0];
        const formattedTomorrowDate = tomorrowDate.toISOString().split("T")[0];
        const formattedDayAfterTomorrowDate = dayAfterTomorrowDate.toISOString().split("T")[0];

        // Fetch data for yesterday, today, tomorrow, and day after tomorrow
        const [yesterdayScheduleData, todayScheduleData, tomorrowScheduleData, dayAfterTomorrowScheduleData] = await Promise.all([
            fetchDataWithoutRedBackgroundColor(`https://aniwatch.tuncay.be/anime/schedule?date=${formattedYesterdayDate}`),
            fetchDataWithoutRedBackgroundColor(`https://aniwatch.tuncay.be/anime/schedule?date=${formattedCurrentDate}`),
            fetchDataWithoutRedBackgroundColor(`https://aniwatch.tuncay.be/anime/schedule?date=${formattedTomorrowDate}`),
            fetchDataWithoutRedBackgroundColor(`https://aniwatch.tuncay.be/anime/schedule?date=${formattedDayAfterTomorrowDate}`),
        ]);

        // Initialize empty arrays for aired and airing schedules
        const combinedAiredScheduleData = [];
        const combinedAiringScheduleData = [];
        // Combine and classify data from yesterdayScheduleData and todayScheduleData
        const allScheduleData = [
            ...yesterdayScheduleData.scheduledAnimes,
            ...todayScheduleData.scheduledAnimes,
            ...tomorrowScheduleData.scheduledAnimes,
            ...dayAfterTomorrowScheduleData.scheduledAnimes,
        ];
        allScheduleData.forEach((item) => {
            if (item.secondsUntilAiring > 0) {
                combinedAiredScheduleData.push(item);
            } else {
                combinedAiringScheduleData.push(item);
            }
        });
        // Sort most recent to largest
        combinedAiredScheduleData.sort((a, b) => b.secondsUntilAiring - a.secondsUntilAiring);
        combinedAiringScheduleData.sort((a, b) => a.secondsUntilAiring - b.secondsUntilAiring);

        // Loop through each item in the combined first schedule data
        combinedAiredScheduleData.forEach((item) => {
            // Create a card for the current schedule item
            const card = createScheduleCard(`html/detail.html?id=${item.id}`, item.name, item.secondsUntilAiring, item.episode);
            // Append the card to the schedule container
            airedScheduleContainer.appendChild(card);
        });
        // Loop through each item in the combined second schedule data
        combinedAiringScheduleData.forEach((item) => {
            // Create a card for the current schedule item
            const card = createScheduleCard(`html/detail.html?id=${item.id}`, item.name, item.secondsUntilAiring, item.episode);
            // Append the card to the schedule container
            airingScheduleContainer.appendChild(card);
        });

        // Append the section title and schedule container to the main section
        mainSection.appendChild(sectionTitle);
        mainSection.appendChild(airedScheduleContainer);
        mainSection.appendChild(airingScheduleContainer);
    } catch (error) {
        console.error(error.message);
    }
}
// Function to create card elements
function createScheduleCard(link, title, seconds, episodeNumber) {
    // Create a link element
    const cardLink = document.createElement("a");
    cardLink.href = link;
    cardLink.classList.add("card-link");

    // Create a div element
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card");

    // Create a div element for the timer and timestamp
    const timerTimestampDiv = document.createElement("div");
    timerTimestampDiv.classList.add("timestamp-div");

    // Create a title element
    const cardTitle = document.createElement("h3");
    cardTitle.classList.add("card-title");
    cardTitle.textContent = title;

    // Create hr element
    const hrElement = document.createElement("hr");

    // Create a timer element
    const timerElement = document.createElement("p");
    timerElement.classList.add("card-episode-number");
    timerElement.classList.remove("red", "green");

    // Calculate the time
    // If the show has already aired
    if (seconds >= 0) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        let timerText = "Aired ";
        if (hours >= 24) {
            const days = Math.floor(hours / 24);
            const remainingHours = hours % 24;
            if (days > 0) timerText += `${days}d `;
            if (remainingHours > 0) timerText += `${remainingHours}h `;
            if (minutes > 0) timerText += `${minutes}m `;
        } else {
            if (hours > 0) timerText += `${hours}h `;
            if (minutes > 0) timerText += `${minutes}m `;
        }

        // Add "ago" to the timer text
        timerText += "ago";
        // Remove any trailing spaces
        timerElement.textContent = timerText.trim();
        timerElement.classList.add("green");
    }
    // If the show is yet to air
    else {
        const airedSeconds = Math.abs(seconds);
        const hours = Math.floor(airedSeconds / 3600);
        const minutes = Math.floor((airedSeconds % 3600) / 60);

        let timerText = "Airing in ";
        if (hours >= 24) {
            const days = Math.floor(hours / 24);
            const remainingHours = hours % 24;
            if (days > 0) timerText += `${days}d `;
            if (remainingHours > 0) timerText += `${remainingHours}h `;
            if (minutes > 0) timerText += `${minutes}m`;
        } else {
            if (hours > 0) timerText += `${hours}h `;
            if (minutes > 0) timerText += `${minutes}m`;
        }

        // Remove any trailing spaces
        timerElement.textContent = timerText.trim();
        timerElement.classList.add("red");
    }

    // Create episode number element
    const episodeNumberElement = document.createElement("p");
    episodeNumberElement.classList.add("card-episode-number");
    episodeNumberElement.innerHTML = `EP ${episodeNumber}`;

    // Append elements to construct the card
    cardLink.appendChild(cardDiv);
    cardDiv.appendChild(cardTitle);
    cardDiv.appendChild(hrElement);
    cardDiv.appendChild(timerTimestampDiv);
    timerTimestampDiv.appendChild(timerElement);
    timerTimestampDiv.appendChild(episodeNumberElement);

    // Return the constructed card
    return cardLink;
}*/
//#endregion

//#region Recently Watched
function displayRecentlyWatched() {
    // Retrieve the recently watched data from local storage
    let recentlyWatchedData = JSON.parse(localStorage.getItem("recently-watched")) || [];

    // Return if there are no recently watched items
    if (recentlyWatchedData.length == 0) return;

    // Create a container
    const mainSection = document.querySelector("main");
    const watchedContainer = document.createElement("div");
    watchedContainer.classList.add("recently-watched");

    // Clear if the recently watched section already exists
    const existingContainer = mainSection.querySelector(".recently-watched");
    if (existingContainer) {
        existingContainer.remove();
    }

    // Clear if the recently watched title already exists
    document.querySelectorAll("main h1").forEach((h1) => {
        if (h1.textContent.trim() == "Recently Watched") {
            h1.remove();
        }
    });

    // Create a title
    const sectionTitle = document.createElement("h1");
    sectionTitle.classList.add("text-white", "main-title");
    sectionTitle.textContent = "Recently Watched";

    // Loop through each recently watched item
    recentlyWatchedData.forEach((item) => {
        // Create a link element
        const cardLink = document.createElement("a");
        cardLink.href = "html/detail.html?id=" + item["anime-id"];
        cardLink.classList.add("card-link");

        // Set flag to retrieve on the next page
        cardLink.addEventListener("click", () => {
            localStorage.setItem("play-recently-watched", JSON.stringify(item));
        });

        // Create a div element
        const cardDiv = document.createElement("div");
        cardDiv.classList.add("card");

        // Create a delete button
        const deleteButton = document.createElement("a");
        deleteButton.textContent = "Delete";
        deleteButton.dataset.animeId = item["anime-id"];

        // Add event listener to delete button
        deleteButton.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();

            // Remove item from local storage
            recentlyWatchedData = recentlyWatchedData.filter((i) => i["anime-id"] !== event.target.dataset.animeId);
            localStorage.setItem("recently-watched", JSON.stringify(recentlyWatchedData));

            // Remove card from the UI
            cardLink.remove();
            if (watchedContainer.querySelectorAll(".card-link").length == 0) {
                mainSection.removeChild(sectionTitle);
                mainSection.removeChild(watchedContainer);
            }
        });

        // Create an image element
        const imgElement = document.createElement("img");
        imgElement.src = item["episode-image"];

        // Calculate progress percentage
        const progressPercentage = (item["episode-progress"] / item["episode-duration"]) * 100;
        // Create a progress bar element
        const progressBarContainer = document.createElement("div");
        progressBarContainer.classList.add("progress-bar-container");
        const progressBar = document.createElement("div");
        progressBar.classList.add("progress-bar");
        progressBar.style.width = progressPercentage + "%";
        progressBarContainer.appendChild(progressBar);

        // Create an episode number element
        const cardTitle = document.createElement("h3");
        cardTitle.classList.add("card-episode-number");
        const total = item["episode-total"];
        cardTitle.textContent = `EP ${item["episode-number"]}` + (Number.isInteger(total) && total !== 0 ? ` / ${total}` : "");

        // Create a title element
        const animeTitleElement = document.createElement("h3");
        animeTitleElement.classList.add("card-anime-title");
        animeTitleElement.textContent = item["anime-title"];

        // Append elements to construct the card
        cardLink.appendChild(cardDiv);
        cardDiv.appendChild(deleteButton);
        cardDiv.appendChild(imgElement);
        cardDiv.appendChild(progressBarContainer);
        cardDiv.appendChild(animeTitleElement);
        cardDiv.appendChild(cardTitle);
        watchedContainer.appendChild(cardLink);
    });

    // Insert the recently watched section before other content in the main section
    mainSection.insertBefore(watchedContainer, mainSection.firstChild);
    mainSection.insertBefore(sectionTitle, mainSection.firstChild);
}
//#endregion

//#region DOMContentLoaded
document.addEventListener("DOMContentLoaded", async () => {
    // Fetch Firebase
    const firebase = await getFirebase();
    auth = firebase.auth;

    // Display the main section
    const mainSection = document.querySelector("main");
    mainSection.style.display = "grid";

    // Create a loading element
    const loadingElement = document.createElement("h1");
    loadingElement.classList.add("text-white", "loading");
    loadingElement.textContent = "Loading ...";
    document.querySelector("body").appendChild(loadingElement);

    // Add a class
    loadingElement.classList.add("show");

    // Generate "Schedule" section
    // await generateSchedule();

    // Fetch data from the API
    const animeData = await fetchDataWithoutRedBackgroundColor("https://aniwatch.tuncay.be/anime/home");

    // Generate cards for different sections
    // generateCards(animeData.spotlightAnimes, "Spotlight");
    // generateCards(animeData.trendingAnimes, "Trending");
    generateCards(animeData.latestEpisodeAnimes, "Recent Episodes");
    generateCards(animeData.topUpcomingAnimes, "Upcoming Anime");
    // generateCards(animeData.top10Animes.today, "Top 10");
    // generateCards(animeData.topAiringAnimes, "Top Airing");

    // Display the recently watched section
    onAuthStateChanged(auth, (user) => {
        if (!user) return;
        displayRecentlyWatched();
    });

    // Check for title overflow
    checkTitleOverflow();

    // Remove loading element and show the main section
    loadingElement.remove();
    mainSection.classList.remove("show");

    // Call this function on window resize to update content
    window.addEventListener("resize", checkTitleOverflow);
});
//#endregion
