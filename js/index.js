//#region Import
import { fetchDataWithoutRedBackgroundColor, checkTitleOverflow } from "./util/main.js";
//#endregion

//#region Firebase
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
        const card = createCard("html/detail.html?id=" + item.id, item.name, item.poster, item.episodes?.sub);
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
        // Append the episode number element to the card
        cardDiv.appendChild(episodeNumberElement);
    }

    // Create the gradient overlay element
    const gradientElement = document.createElement("div");
    gradientElement.classList.add("card-gradient");
    // Append the gradient overlay element to the card
    cardDiv.appendChild(gradientElement);

    // Return the constructed card
    return cardLink;
}
//#endregion

//#region Recently Watched
// Function to format seconds into a readable time format (HH:MM:SS or MM:SS)
// function formatTime(seconds) {
//     if (!seconds || seconds <= 0) return null;

//     const hours = Math.floor(seconds / 3600);
//     const minutes = Math.floor((seconds % 3600) / 60);
//     const remainingSeconds = Math.floor(seconds % 60);

//     if (hours > 0) {
//         return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
//     } else {
//         return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
//     }
// }

// Function to try displaying the recently watched section
function tryDisplayRecentlyWatched() {
    const maxDuration = 5000; // 5 seconds
    const intervalDuration = 500; // 0.5 seconds
    const startTime = Date.now();

    const interval = setInterval(() => {
        // Get the recently watched data from local storage
        let recentlyWatchedData = JSON.parse(localStorage.getItem("recently-watched")) || [];

        // If there's data, display it and clear the interval
        if (recentlyWatchedData.length > 0) {
            displayRecentlyWatched(recentlyWatchedData);
            // Stop the interval once data is available
            clearInterval(interval);
        } else if (Date.now() - startTime > maxDuration) {
            // Stop the interval if maxDuration is reached
            clearInterval(interval);
        }
    }, intervalDuration);
}
// Function to display the recently watched section
function displayRecentlyWatched(recentlyWatchedData) {
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
    sectionTitle.classList.add("text-white", "main-title", "recently-watched-title");
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

        // // Create a time element
        // const timeElement = document.createElement("p");
        // timeElement.classList.add("card-time");
        // const currentTime = formatTime(item["episode-progress"]);
        // const totalTime = formatTime(item["episode-duration"]);

        // // Show time if there's progress
        // if (currentTime) {
        //     timeElement.textContent = `${currentTime} / ${totalTime || "0:00"}`;
        // } else {
        //     timeElement.style.display = "none";
        // }

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
        // cardDiv.appendChild(timeElement);
        watchedContainer.appendChild(cardLink);

        // Create the gradient overlay element
        const gradientElement = document.createElement("div");
        gradientElement.classList.add("card-gradient");
        // Append the gradient overlay element to the card
        cardDiv.appendChild(gradientElement);
    });

    // Insert title + cards container
    mainSection.insertBefore(watchedContainer, mainSection.firstChild);
    mainSection.insertBefore(sectionTitle, watchedContainer);

    // Animate
    setTimeout(() => {
        watchedContainer.classList.add("loaded");
        sectionTitle.classList.add("loaded");
    }, 10);
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

    // Add show class
    loadingElement.classList.add("show");

    // Recently watched section
    tryDisplayRecentlyWatched();

    // Fetch data from the API
    const animeData = await fetchDataWithoutRedBackgroundColor("https://aniwatch.tuncay.be/api/v2/hianime/home");

    // Generate cards for different sections
    // generateCards(animeData.data.spotlightAnimes, "Spotlight");
    generateCards(animeData.data.trendingAnimes, "Trending");
    // generateCards(animeData.data.latestEpisodeAnimes, "Latest Episodes");
    generateCards(animeData.data.topUpcomingAnimes, "Upcoming Anime");
    // generateCards(animeData.data.top10Animes.today, "Top 10");
    generateCards(animeData.data.topAiringAnimes, "Top Airing");
    generateCards(animeData.data.latestCompletedAnimes, "Latest Completed");

    // Check for title overflow
    checkTitleOverflow();

    // Remove loading element and show the main section
    loadingElement.remove();
    mainSection.classList.remove("show");

    // Call this function on window resize to update content
    window.addEventListener("resize", checkTitleOverflow);
});
//#endregion
