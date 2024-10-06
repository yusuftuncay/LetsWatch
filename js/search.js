//#region Import
import { fetchDataWithoutRedBackgroundColor, checkTitleOverflow } from "./util/main.js";
//#endregion

//#region Create Card
// Function to create card elements
const createCard = (link, title, imageSrc) => {
    // Create link element
    const cardLink = document.createElement("a");
    cardLink.href = link;
    cardLink.classList.add("card-link");

    // Create card div
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card");

    // Create image element
    const img = document.createElement("img");
    img.src = imageSrc;

    // Create card title element
    const cardTitle = document.createElement("h3");
    cardTitle.classList.add("card-title");
    cardTitle.textContent = title;

    // Append elements to the card div
    cardLink.appendChild(cardDiv);
    cardDiv.appendChild(img);
    cardDiv.appendChild(cardTitle);

    return cardLink;
};
//#endregion

//#region Generate Cards
// Function to generate cards based on data from the provided URL
async function generateCards(url) {
    //#region Show loading element
    // Show main container initially
    const mainSection = document.querySelector("main");
    mainSection.classList.add("show");
    mainSection.style.display = "grid";

    // Show loading element
    const loadingDiv = document.createElement("h1");
    loadingDiv.classList.add("text-white", "loading");
    loadingDiv.textContent = "Loading ...";
    document.querySelector("body").appendChild(loadingDiv);

    // Add a class
    loadingDiv.classList.add("show");
    //#endregion

    // Clear main container & clear total result h1
    const mainContainer = document.querySelector(".main-container");
    mainContainer.innerHTML = "";
    document.querySelector("main h1").textContent = "";

    // Show main container with animation
    mainContainer.classList.add("show");
    document.querySelector(".top-main-container").classList.add("show");

    // Hide buttons
    document.querySelector(".button-main-container").style.display = "none";

    // Fetch data
    const animeData = await fetchDataWithoutRedBackgroundColor(url);

    // Flag for hasNextPage
    hasNextPage(animeData.data.hasNextPage);

    // Loop through the results array and create a card for each item
    animeData.data.animes.forEach((item) => {
        const card = createCard("../html/detail.html?id=" + item.id, item.name, item.poster);
        mainContainer.appendChild(card);
    });

    // Set total results count
    const h1Element = document.querySelector("main h1");
    if (animeData.data.animes.length == 1) {
        h1Element.textContent = animeData.data.animes.length + " Result";
    } else {
        h1Element.textContent = animeData.data.animes.length + " Results";
    }

    // Show the .button-main-container
    document.querySelector(".button-main-container").style.display = animeData.data.animes.length > 0 ? "flex" : "none";

    // Check for title overflow
    checkTitleOverflow();

    // Remove animation class after a short delay
    setTimeout(() => {
        mainContainer.classList.remove("show");
        document.querySelector(".top-main-container").classList.remove("show");
    }, 200);

    //#region Hide loading element
    loadingDiv.remove();
    mainSection.classList.remove("show");
    //#endregion
}
//#endregion

//#region Page Navigation
// Variable to store the current page number
let currentPageNumber = 1;
// Variable to store the search query
let searchQuery = "";

// Function to update the page number and make a new request
async function updatePageAndFetchData(increment) {
    try {
        // Update the current page number
        currentPageNumber += increment ? 1 : -1;

        // Ensure the current page number is not less than 1
        if (currentPageNumber < 1) currentPageNumber = 1;

        // Generate new cards with the updated page number
        await generateCards(`https://aniwatch.tuncay.be/api/v2/hianime/search?q=${searchQuery}&page=${currentPageNumber}&sort=most-watched`);
    } catch (error) {
        console.error(error.message);
    }
}

// Function to enable/disable next and previous buttons based on the flag
const hasNextPage = (hasNextPage) => {
    const nextButton = document.querySelector(".next");
    const previousButton = document.querySelector(".previous");

    nextButton.classList.toggle("disabled", !hasNextPage);
    previousButton.classList.toggle("disabled", currentPageNumber <= 1);
};
//#endregion

// Add event listener for the "next" button
document.querySelector(".next").addEventListener("click", async () => {
    await updatePageAndFetchData(true);
});

// Add event listener for the "back" button
document.querySelector(".previous").addEventListener("click", async () => {
    await updatePageAndFetchData(false);
});

// Event listener when the page is loaded
document.addEventListener("DOMContentLoaded", async () => {
    // Get the value of the "query" parameter from the URL
    searchQuery = new URLSearchParams(window.location.search).get("query");

    // Generate cards based on the provided query
    await generateCards(`https://aniwatch.tuncay.be/api/v2/hianime/search?q=${searchQuery}&page=${currentPageNumber}&sort=most-watched`);
});

// Call this function on window resize to update content
window.addEventListener("resize", checkTitleOverflow);
