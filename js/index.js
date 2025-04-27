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

    // Generate "Schedule" section
    // await generateSchedule();

    // // Fetch data from the API
    // const animeData = await fetchDataWithoutRedBackgroundColor("https://aniwatch.tuncay.be/api/v2/hianime/home");

    // // Generate cards for different sections
    // // generateCards(animeData.data.spotlightAnimes, "Spotlight");
    // generateCards(animeData.data.trendingAnimes, "Trending");
    // // generateCards(animeData.data.latestEpisodeAnimes, "Latest Episodes");
    // generateCards(animeData.data.topUpcomingAnimes, "Upcoming Anime");
    // // generateCards(animeData.data.top10Animes.today, "Top 10");
    // generateCards(animeData.data.topAiringAnimes, "Top Airing");
    // generateCards(animeData.data.latestCompletedAnimes, "Latest Completed");

    generateCards(hardcodedData, "Spotlight");

    // Check for title overflow
    checkTitleOverflow();

    // Remove loading element and show the main section
    loadingElement.remove();
    mainSection.classList.remove("show");

    // Call this function on window resize to update content
    window.addEventListener("resize", checkTitleOverflow);
});
//#endregion

//#region Hardcoded Data
const hardcodedData = [
    {
        spotlightAnimes: [
            {
                rank: 1,
                id: "one-piece-100",
                name: "One Piece",
                description:
                    'Gold Roger was known as the "Pirate King," the strongest and most infamous being to have sailed the Grand Line. The capture and execution of Roger by the World Government brought a change throughout the world. His last words before his death revealed the existence of the greatest treasure in the world, One Piece. It was this revelation that brought about the Grand Age of Pirates, men who dreamed of finding One Piece—which promises an unlimited amount of riches and fame—and quite possibly the pinnacle of glory and the title of the Pirate King.\n\nEnter Monkey Luffy, a 17-year-old boy who defies your standard definition of a pirate. Rather than the popular persona of a wicked, hardened, toothless pirate ransacking villages for fun, Luffy\'s reason for being a pirate is one of pure wonder: the thought of an exciting adventure that leads him to intriguing people and ultimately, the promised treasure. Following in the footsteps of his childhood hero, Luffy and his crew travel across the Grand Line, experiencing crazy adventures, unveiling dark mysteries and battling strong enemies, all in order to reach the most coveted of all fortunes—One Piece.',
                poster: "https://cdn.noitatnemucod.net/thumbnail/1366x768/100/db8603d2f4fa78e1c42f6cf829030a18.jpg",
                jname: "One Piece",
                episodes: {
                    sub: 1127,
                    dub: 1122,
                },
                type: "TV",
                otherInfo: ["TV", "24m", "Oct 20, 1999", "HD"],
            },
            {
                rank: 2,
                id: "the-unaware-atelier-master-19569",
                name: "The Unaware Atelier Master",
                description:
                    'One day, Kurt, a kind-hearted boy, is suddenly kicked out of the Hero\'s Party for being "useless." He finds that his aptitude for weapons, magic, and all other combat-related skills is the lowest rand, so he takes odd-jobs repairing the castle walls and digging for minerals, where his exceptional abilities are immediately revealed. He proves to be skillful in cooking, building, mining, crafting magical tools—in fact, his aptitude for every skill unrelated to combat had an SSS-ranking! Kurt, however, seems completely unaware to his talent and ends up saving people, the town, and even the country through his unaware actions!?',
                poster: "https://cdn.noitatnemucod.net/thumbnail/1366x768/100/349d1bbdd4d7fa786e8f6aceb84697ef.jpg",
                jname: "Kanchigai no Atelier Meister: Eiyuu Party no Moto Zatsuyougakari ga, Jitsu wa Sentou Igai ga SSS Rank Datta to Iu Yoku Aru Hanashi",
                episodes: {
                    sub: 5,
                    dub: 4,
                },
                type: "TV",
                otherInfo: ["TV", "24m", "Apr 6, 2025", "HD"],
            },
            {
                rank: 3,
                id: "to-be-hero-x-19591",
                name: "To Be Hero X",
                description:
                    "This is a world where heroes are created by people's trust, and the hero who has received the most trust is known as - X. In this world, people's trust can be calculated by data, and these values will be reflected on everyone's wrist. As long as enough trust points are obtained, ordinary people can also have superpowers and become superheroes that save the world. However, the ever-changing trust value makes the hero's path full of unknowns...",
                poster: "https://cdn.noitatnemucod.net/thumbnail/1366x768/100/f17dced259ed695da54399f81bf2ba8c.jpg",
                jname: "Tu Bian Yingxiong X",
                episodes: {
                    sub: 4,
                    dub: 4,
                },
                type: "TV",
                otherInfo: ["TV", "24m", "Apr 6, 2025", "HD"],
            },
            {
                rank: 4,
                id: "fire-force-season-3-19540",
                name: "Fire Force Season 3",
                description: "Third season of .",
                poster: "https://cdn.noitatnemucod.net/thumbnail/1366x768/100/e5dee087051734a86d59c748b6bf201a.jpg",
                jname: "Enen no Shouboutai: San no Shou",
                episodes: {
                    sub: 4,
                    dub: 2,
                },
                type: "TV",
                otherInfo: ["TV", "24m", "Apr 5, 2025", "HD"],
            },
            {
                rank: 5,
                id: "the-super-cube-19624",
                name: "The Super Cube",
                description:
                    'In an accident, an ordinary boy, Wang Xiaoxiu, obtains a space system called "Superpower Cube" from a high-latitude cosmic civilization and gains extraordinary powers. When the school belle, Shen Yao, Wang Xiaoxiu’s longtime crush, confesses her love to him, the delinquent Sun Jun, who also has a crush on her, is provoked.  Wang Xiaoxiu resolves the crisis with his wit and extraordinary powers, but it also brings more disasters as a result. Shen Yao is taken to the world of extraordinary beings by a mysterious person, and Wang Xiaoxiu embarks on a journey to rescue her. Fighting in the bizarre universe, he finds the meaning of fairness and justice on the path to becoming a peerless powerhouse.',
                poster: "https://cdn.noitatnemucod.net/thumbnail/1366x768/100/71a1f086c03a5f0157834c17860e1235.jpg",
                jname: "Chao Neng Lifang: Chaofan Pian",
                episodes: {
                    sub: 8,
                    dub: 7,
                },
                type: "ONA",
                otherInfo: ["ONA", "15m", "Mar 21, 2025", "HD"],
            },
            {
                rank: 6,
                id: "wind-breaker-season-2-19542",
                name: "Wind Breaker Season 2",
                description:
                    "The second season of WIND BREAKER.\n\nWelcome back to Furin High School, an institution infamous for its population of brawny brutes who solve every conflict with a show of strength. Some of the students even formed a group, Bofurin, which protects the town. Haruka Sakura, a first-year student who moved in from out of town, is only interested in one thing: fighting his way to the top!",
                poster: "https://cdn.noitatnemucod.net/thumbnail/1366x768/100/593d93c12628d998366d5cf716e5ad52.jpg",
                jname: "Wind Breaker Season 2",
                episodes: {
                    sub: 4,
                    dub: 2,
                },
                type: "TV",
                otherInfo: ["TV", "24m", "Apr 4, 2025", "HD"],
            },
            {
                rank: 7,
                id: "my-hero-academia-vigilantes-19544",
                name: "My Hero Academia: Vigilantes",
                description:
                    "Living in a superhuman society, it is hard to feel special. Even more so when the spotlight only shines on professional heroes, those legally authorized to use their special powers known as Quirks in public for the greater good.  Kouichi Haimawari grew up aspiring to be a hero, but with a mediocre Quirk like \"sliding\" that ties him to the ground, he soon came to the conclusion that he could only ever admire them from below. Despite this, Kouichi finds contentment in using his Quirk to carry out day-to-day good deeds, such as returning lost items and helping the elderly cross the street.  However, Kouichi's tame life takes a swing into the turbulent when he is rescued from a back alley brawl by Vigilante, or illegal hero, Knuckleduster. Seeing hero potential in Kouichi, Knuckleduster enlists his help in tracking down the source of a dangerous drug known as Trigger that boosts the user's Quirk at the expense of their rationality.  Set in a time before the events of the original story, Vigilante: Boku no Hero Academia Illegals follows Kouichi as he chooses to don the reputation of a villain and become a Vigilante, operating in the shadow of the law to prevent crimes from taking to the surface.",
                poster: "https://cdn.noitatnemucod.net/thumbnail/1366x768/100/f8a7ec496a49b09a088d4e24f0249f32.jpg",
                jname: "Vigilante: Boku no Hero Academia Illegals",
                episodes: {
                    sub: 3,
                    dub: 3,
                },
                type: "TV",
                otherInfo: ["TV", "24m", "Apr 7, 2025", "HD"],
            },
            {
                rank: 8,
                id: "solo-leveling-season-2-arise-from-the-shadow-19413",
                name: "Solo Leveling Season 2: Arise from the Shadow",
                description:
                    "Sung Jin-Woo, dubbed the weakest hunter of all mankind, grows stronger by the day with the supernatural powers he has gained. However, keeping his skills hidden becomes more difficult as dungeon-related incidents pile up around him.\n\nWhen Jin-Woo and a few other low-ranked hunters are the only survivors of a dungeon that turns out to be a bigger challenge than initially expected, he draws attention once again, and hunter guilds take an increased interest in him. Meanwhile, a strange hunter who has been lost for ten years returns with a dire warning about an upcoming catastrophic event. As the calamity looms closer, Jin-Woo must continue leveling up to make sure nothing stops him from reaching his ultimate goal—saving the life of his mother.",
                poster: "https://cdn.noitatnemucod.net/thumbnail/1366x768/100/599af186ad72e94caab6223b23fc22c6.jpg",
                jname: "Ore dake Level Up na Ken Season 2: Arise from the Shadow",
                episodes: {
                    sub: 13,
                    dub: 13,
                },
                type: "TV",
                otherInfo: ["TV", "24m", "Jan 5, 2025", "HD"],
            },
        ],
    },
];
