const API_BASE_URL = "https://api.github.com";

let currentPage = 1;
let perPage = 10;
let totalRepositories = 0;
let totalBtns = 1;
let isProfileFetched = false;

function fetchWithToken(url) {
    return fetch(url, {
        // headers: {
        //     Authorization: `Bearer ${PERSONAL_ACCESS_TOKEN}`,
        // },
    })
}

function fetchUserProfile(username) {
    const profileUrl = `${API_BASE_URL}/users/${username}`;
    const userSearch = document.getElementById("userSearch");

    fetchWithToken(profileUrl)
        .then(response => {
            if (!response.ok) {
                alert(`GitHub API error: ${response.status} ${response.statusText}`);
                throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(userProfile => {
            userSearch.classList.add("d-none");
            isProfileFetched = true;
            const name = userProfile.name;
            const profilePhoto = userProfile.avatar_url;
            const bio = userProfile.bio || "No bio available.";
            const location = userProfile.location || "No location provided.";
            const twitterLink = userProfile.twitter_username || "No twitter account.";
            totalRepositories = userProfile.public_repos;
            document.getElementById("fullname").textContent = name;
            document.getElementById("profilePhoto").src = profilePhoto;
            document.getElementById("bio").textContent = bio;
            document.getElementById("location").textContent = location;

            const twitterSpan = document.getElementById("twitter-link");
            const gitLink = document.getElementById("github-link");
            twitterSpan.innerHTML = "";
            const socialMediaLink = document.createElement("a");
            socialMediaLink.classList.add("link-dark", "link-underline-opacity-0");
            socialMediaLink.href = userProfile.twitter_username ? "https://twitter.com/" + userProfile.twitter_username : "";
            socialMediaLink.textContent = twitterLink;
            twitterSpan.appendChild(socialMediaLink);
            gitLink.textContent = "https://github.com/" + username;
            gitLink.href = gitLink.textContent;

        })
        .catch(error => {
            console.error("Error fetching user profile", error);
        });
}

function fetchRepositories() {
    const username = document.getElementById("username").value.trim();
    perPage = parseInt(document.getElementById("perPage").value);

    if (!username) {
        alert("Please enter a GitHub username");
        return;
    }

    showLoader(true);
    if (!isProfileFetched) fetchUserProfile(username)

    const repositoriesUrl = `${API_BASE_URL}/users/${username}/repos?page=${currentPage}&per_page=${perPage}`;
    fetchWithToken(repositoriesUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(repositoriesData => {
            const repositoriesWithTopicsPromises = repositoriesData.map(repo => {
                const topicsUrl = `${API_BASE_URL}/repos/${username}/${repo.name}/topics`;
                return fetchWithToken(topicsUrl)
                    .then(response => response.json())
                    .then(topicsData => {
                        repo.topics = topicsData.names;
                        return repo;
                    });
            });

            Promise.all(repositoriesWithTopicsPromises)
                .then(repositoriesWithTopics => {
                    displayRepositories(repositoriesWithTopics);
                    showLoader(false);
                    updatePagination();
                })
                .catch(error => {
                    console.error("Error fetching repositories or topics", error);
                    showLoader(false);
                });
        })
        .catch(error => {
            console.error("Error fetching repositories", error);
            showLoader(false);
        });
}


function displayRepositories(repositories) {
    const repositoriesContainer = document.getElementById("repositories");
    const prevBtn = document.getElementById("noOfPages");
    repositoriesContainer.innerHTML = "";

    repositories.forEach(repo => {

        const col = document.createElement("div");
        col.classList.add("col-md-6");

        const repoCard = document.createElement("div");
        repoCard.classList.add("card", "mb-2", "border", "border-black", "rounded-0");

        const cardBody = document.createElement("div");
        cardBody.classList.add("card-body");

        const repoName = document.createElement("h5");
        repoName.classList.add("card-title");
        repoName.textContent = repo.name;

        const repoDescription = document.createElement("p");
        repoDescription.classList.add("card-text");
        repoDescription.textContent = repo.description || "No description available.";

        cardBody.appendChild(repoName);
        cardBody.appendChild(repoDescription);

        repo.topics.map((val) => {
            const topicBtn = document.createElement("a");
            topicBtn.classList.add("btn", "btn-primary", "me-2", "mb-2");
            topicBtn.textContent = val;
            cardBody.appendChild(topicBtn);
        });
        col.appendChild(repoCard)
        repoCard.appendChild(cardBody);

        repositoriesContainer.appendChild(col);

    });

    prevBtn.innerHTML = "";

    totalBtns = Math.ceil(totalRepositories / perPage);
    for (let i = 1; i <= totalBtns; i++) {
        const pageNumberBtn = document.createElement("a");
        if (currentPage == i)
            pageNumberBtn.classList.add("btn", "btn-primary");
        pageNumberBtn.classList.add("btn", "btn-outline-primary", "text-black");
        pageNumberBtn.textContent = i;
        pageNumberBtn.onclick = () => changePage(i);
        prevBtn.append(pageNumberBtn);
    }
}


function showLoader(show) {
    const loader = document.getElementById("loader");
    if (show) {
        loader.classList.remove("d-none");
    } else {
        const profile = document.getElementById("profile");
        profile.classList.remove("d-none");
        loader.classList.add("d-none");
    }
}

function changePage(change) {
    currentPage = change;
    fetchRepositories();
    updatePagination();
}

function nextPage() {
    currentPage++;
    changePage(currentPage);
}

function prevPage() {
    currentPage--;
    changePage(currentPage);
}

function updatePagination() {
    const prevPage = document.getElementById("prevPage");
    const nextPage = document.getElementById("nextPage");
    const firstPage = document.getElementById("firstPage");
    const lastPage = document.getElementById("lastPage");

    if (currentPage === 1) {
        prevPage.classList.add("disabled");
        firstPage.classList.add("disabled");
    } else {
        prevPage.classList.remove("disabled");
        firstPage.classList.remove("disabled");
    }

    if (currentPage * perPage > totalRepositories) {
        nextPage.classList.add("disabled");
        lastPage.classList.add("disabled");
    } else {
        nextPage.classList.remove("disabled");
        lastPage.classList.remove("disabled");
    }
}
