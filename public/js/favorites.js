/* Loads and renders the current user's saved properties. */

const favoritesGrid = document.getElementById("favorites-grid");

if (favoritesGrid) {
    (async () => {
        if (!requireAuth("/login.html?redirect=/favorites.html")) return;

        favoritesGrid.innerHTML = `<div class="skeleton" style="height:320px"></div>`.repeat(3);

        try {
            const favorites = await apiRequest("/favorites");
            if (!favorites.length) {
                favoritesGrid.innerHTML = `
                    <div class="empty-state">
                        <h3>No favorites yet</h3>
                        <p>Save properties you like and they'll show up here.</p>
                        <a href="/properties.html" class="btn btn-primary" style="margin-top:12px;">Browse properties</a>
                    </div>`;
                return;
            }
            favoritesGrid.innerHTML = favorites.map(propertyCardHtml).join("");
            attachFavoriteHandlers(favoritesGrid);

            favoritesGrid.addEventListener("click", (e) => {
                const btn = e.target.closest("[data-fav]");
                if (btn) {
                    setTimeout(() => {
                        if (!btn.classList.contains("active")) {
                            btn.closest(".property-card").remove();
                        }
                    }, 150);
                }
            });
        } catch (error) {
            favoritesGrid.innerHTML = `<div class="empty-state"><h3>Couldn't load favorites</h3><p>${escapeHtml(error.message)}</p></div>`;
        }
    })();
}
