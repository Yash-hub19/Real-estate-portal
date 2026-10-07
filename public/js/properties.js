/* Renders property cards on the home page and the full listings page,
   handles search/filter form submission and favorite toggling. */

function propertyCardHtml(property) {
    const img = property.images && property.images[0] ? property.images[0] : null;
    const isFav = Session.getUser() && (Session.getUser().favorites || []).includes(property._id);
    const tagClass = property.status === "For Rent" ? "rent" : "";

    return `
    <article class="property-card" data-id="${property._id}">
        <a href="/property-details.html?id=${property._id}" class="card-media">
            ${img ? `<img src="${img}" alt="${escapeHtml(property.title)}" loading="lazy">` : ""}
            <span class="card-tag ${tagClass}">${property.status}</span>
        </a>
        <button class="fav-btn ${isFav ? "active" : ""}" data-fav="${property._id}" title="Save to favorites" aria-label="Save to favorites">&hearts;</button>
        <div class="card-body">
            <div class="card-price">${formatPrice(property.price, property.status)}</div>
            <a href="/property-details.html?id=${property._id}" class="card-title">${escapeHtml(property.title)}</a>
            <div class="card-location">${escapeHtml(property.location)}</div>
            <div class="card-specs">
                <span>${property.bedrooms} bd</span>
                <span>${property.bathrooms} ba</span>
                <span>${property.area.toLocaleString()} sqft</span>
                <span>${escapeHtml(property.type)}</span>
            </div>
        </div>
    </article>`;
}

function attachFavoriteHandlers(container) {
    container.querySelectorAll("[data-fav]").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (!Session.isLoggedIn()) {
                window.location.href = "/login.html";
                return;
            }

            const propertyId = btn.getAttribute("data-fav");
            const isActive = btn.classList.contains("active");

            try {
                if (isActive) {
                    await apiRequest(`/favorites/${propertyId}`, { method: "DELETE" });
                    btn.classList.remove("active");
                } else {
                    await apiRequest(`/favorites/${propertyId}`, { method: "POST" });
                    btn.classList.add("active");
                }

                const user = Session.getUser();
                if (user) {
                    const set = new Set(user.favorites || []);
                    if (isActive) set.delete(propertyId);
                    else set.add(propertyId);
                    user.favorites = Array.from(set);
                    Session.save(Session.getToken(), user);
                }
            } catch (error) {
                alert(error.message);
            }
        });
    });
}

/* ---------- Home page: featured properties ---------- */
const featuredGrid = document.getElementById("featured-grid");
if (featuredGrid) {
    (async () => {
        featuredGrid.innerHTML = `<div class="skeleton" style="height:320px"></div>`.repeat(3);
        try {
            const data = await apiRequest("/properties?limit=6&sort=newest");
            if (!data.properties.length) {
                featuredGrid.innerHTML = `
                    <div class="empty-state">
                        <h3>No listings yet</h3>
                        <p>Be the first to list a property on the portal.</p>
                    </div>`;
            } else {
                featuredGrid.innerHTML = data.properties.map(propertyCardHtml).join("");
                attachFavoriteHandlers(featuredGrid);
            }
        } catch (error) {
            featuredGrid.innerHTML = `<div class="empty-state"><h3>Couldn't load listings</h3><p>${escapeHtml(error.message)}</p></div>`;
        }
    })();
}

const homeSearchForm = document.getElementById("home-search-form");
if (homeSearchForm) {
    homeSearchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const params = new URLSearchParams(new FormData(homeSearchForm));
        const query = params.toString();
        window.location.href = `/properties.html${query ? `?${query}` : ""}`;
    });
}

/* ---------- Listings page ---------- */
const listingsGrid = document.getElementById("listings-grid");
if (listingsGrid) {
    const filterForm = document.getElementById("filter-form");
    const resultsMeta = document.getElementById("results-meta");
    const pagination = document.getElementById("pagination");

    function currentParams() {
        return new URLSearchParams(window.location.search);
    }

    function populateFormFromUrl() {
        const params = currentParams();
        for (const [key, value] of params.entries()) {
            const field = filterForm.elements.namedItem(key);
            if (field) field.value = value;
        }
    }

    async function loadListings(page = 1) {
        const params = currentParams();
        params.set("page", page);
        params.set("limit", 9);

        listingsGrid.innerHTML = `<div class="skeleton" style="height:320px"></div>`.repeat(6);
        resultsMeta.textContent = "";

        try {
            const data = await apiRequest(`/properties?${params.toString()}`);

            if (!data.properties.length) {
                listingsGrid.innerHTML = `
                    <div class="empty-state">
                        <h3>No properties match your search</h3>
                        <p>Try widening your price range or clearing a filter.</p>
                    </div>`;
                pagination.innerHTML = "";
            } else {
                listingsGrid.innerHTML = data.properties.map(propertyCardHtml).join("");
                attachFavoriteHandlers(listingsGrid);
                renderPagination(data.page, data.pages);
            }

            resultsMeta.textContent = `${data.total} propert${data.total === 1 ? "y" : "ies"} found`;
        } catch (error) {
            listingsGrid.innerHTML = `<div class="empty-state"><h3>Something went wrong</h3><p>${escapeHtml(error.message)}</p></div>`;
        }
    }

    function renderPagination(page, pages) {
        if (pages <= 1) {
            pagination.innerHTML = "";
            return;
        }
        let html = "";
        for (let i = 1; i <= pages; i++) {
            html += `<button class="${i === page ? "active" : ""}" data-page="${i}">${i}</button>`;
        }
        pagination.innerHTML = html;
        pagination.querySelectorAll("button").forEach((btn) => {
            btn.addEventListener("click", () => loadListings(Number(btn.getAttribute("data-page"))));
        });
    }

    filterForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const params = new URLSearchParams(new FormData(filterForm));
        [...params.keys()].forEach((key) => {
            if (!params.get(key)) params.delete(key);
        });
        window.history.replaceState(null, "", `/properties.html?${params.toString()}`);
        loadListings(1);
    });

    populateFormFromUrl();
    loadListings(1);
}
