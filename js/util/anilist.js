// Function to update AniList media entry
export async function updateAniListMediaEntry(anilistId, episodeNumber, totalEpisodes) {
    // Variables
    const token =
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6Ijk2YzMwYTgxYjBjNzc4YmMwYjE1Zjc5NTJiY2VjZTJlMTFkNzk1ZDY0OGQxNzEyZjcyOGVlNTA3NDBhZTY5YWE2NTE4OGQ5YmZhZmMzNmNhIn0.eyJhdWQiOiIxNTIwNiIsImp0aSI6Ijk2YzMwYTgxYjBjNzc4YmMwYjE1Zjc5NTJiY2VjZTJlMTFkNzk1ZDY0OGQxNzEyZjcyOGVlNTA3NDBhZTY5YWE2NTE4OGQ5YmZhZmMzNmNhIiwiaWF0IjoxNzIwMTEzMjEzLCJuYmYiOjE3MjAxMTMyMTMsImV4cCI6MTc1MTY0OTIxMywic3ViIjoiNjEyMzk4NSIsInNjb3BlcyI6W119.uEioikQxUsu0uKgv877JXi88xMIdHKxvzLPER5GR_wqjQFeeqSHihgaNBUTcsfaKc2AXoQxdZtBYHOq3G286ri-6j97KpZdYC08dxWaV6S8lqTj4k9MAStoNZ7Ex5pWwVayVPhiPc6Or0X1SSp4tWZzgKjcPzsIsRvu2sIc8MHJkTtu2QqFTKptgIzKPKDkWN-aavN6hrhM7LCh9JI4DD63ltAcPazOZ1ImWQ89xsVPM3XYM8_MGGydyxdZCaP_IUOCiiIIDbhijsBNYaKPJ-HCotMqG4PTsjPT5FcIWiywZwoc8x7nS93oIoUWWj1etOUXYUOTH3lpsnMb_JZ6CHhiJrWiTz-Ykfh7MoyYhAz80Xk7lrHIKgq_BdpTcEa6Z4J0ICwjUVCY3yvj4xJrQn1OvTJM8xHHgie3NdhnvckaefGMCqnJd2hccQ9IPNwo8mH10ISDKp80s6Vu4-PuHk9D_XmWGxQ3FK4JhsVCrXzreDItp7HV47kTAU6Am1QSIUNJLbBcCYT8rfRowvSt0T6rD1r9L2FIOGIXe9XGpC52MrXmCH56S5BGAFg_vh1uIeOsOiOiUgPbgyEYyHViayAfHefm4ogpC4jzB06Qk8kp4iVIUG2v156jVmd5PxYfKQ8gXGH5201rtIx08Ye7YiUZobUPBwQCfIOGVrnJkb9Q";

    let animeStatus;
    // Set Anime Status
    if (episodeNumber >= parseInt(totalEpisodes)) {
        animeStatus = "COMPLETED";
    } else {
        animeStatus = "CURRENT";
    }

    // Mutation to add an anime to the user's anime list
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
                // variables: variables
            }),
        };

    // Make the HTTP API request
    fetch(url, options)
        .then((response) => response.json().then((json) => (response.ok ? json : Promise.reject(json))))
        .catch((error) => console.error(JSON.stringify(error)));
}
