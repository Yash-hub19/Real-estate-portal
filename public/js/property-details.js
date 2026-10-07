/* Loads and renders a single property, handles the owner contact form,
   favorite toggling, and owner-only edit/delete actions. */

function getIdFromUrl() {
    return new URLSearchParams(window.location.search).get("id");
}

const detailsRoot = document.getElementById("details-root");

if (detailsRoot) {
    (async () => {
        const id = getIdFromUrl();
        if (!id) {
            detailsRoot.innerHTML = `<div class="empty-state"><h3>Property not found</h3></div>`;
            return;
        }

        try {
            const property = await apiRequest(`/properties/${id}`);
            renderDetails(property);
        } catch (error) {
            detailsRoot.innerHTML = `<div class="empty-state"><h3>Couldn't load this property</h3><p>${escapeHtml(error.message)}</p></div>`;
        }
    })();
}

function renderDetails(property) {
    document.title = `${property.title} | Real Estate Portal`;

    const images = property.images && property.images.length ? property.images : [];
    const mainImg = images[0];
    const sideImgs = images.slice(1, 3);
    const user = Session.getUser();
    const isFav = user && (user.favorites || []).includes(property._id);
    const isOwner = user && property.owner && (property.owner._id === user.id || property.owner === user.id);
    const isAdmin = Session.isAdmin();

    detailsRoot.innerHTML = `
        <div class="details-gallery">
            <div class="card-media" style="aspect-ratio:auto;height:100%;">
                ${mainImg ? `<img src="${mainImg}" alt="${escapeHtml(property.title)}">` : `<div class="skeleton" style="height:100%"></div>`}
            </div>
            <div class="gallery-side">
                ${sideImgs.map((img) => `<div class="card-media" style="aspect-ratio:auto;"><img src="${img}" alt=""></div>`).join("") || `<div class="skeleton"></div><div class="skeleton"></div>`}
            </div>
        </div>

        <div class="details-layout">
            <div>
                <span class="card-tag ${property.status === "For Rent" ? "rent" : ""}" style="position:static;display:inline-block;margin-bottom:12px;">${property.status}</span>
                <h1 style="font-family:var(--font-display);font-size:2rem;margin:0 0 6px;">${escapeHtml(property.title)}</h1>
                <p class="text-muted" style="margin:0 0 12px;">${escapeHtml(property.location)}${property.address ? ` &middot; ${escapeHtml(property.address)}` : ""}</p>
                <div class="card-price" style="font-size:1.7rem;">${formatPrice(property.price, property.status)}</div>

                <div class="spec-strip">
                    <div><span>${property.bedrooms}</span><small>Bedrooms</small></div>
                    <div><span>${property.bathrooms}</span><small>Bathrooms</small></div>
                    <div><span>${property.area.toLocaleString()}</span><small>Sqft</small></div>
                    <div><span>${escapeHtml(property.type)}</span><small>Type</small></div>
                </div>

                <h3 style="font-family:var(--font-display);">About this property</h3>
                <p style="white-space:pre-line;">${escapeHtml(property.description)}</p>

                <div class="flex gap-8" style="margin-top:20px;">
                    <button id="fav-toggle" class="btn ${isFav ? "btn-dark" : "btn-ghost"}">${isFav ? "♥ Saved" : "♡ Save to favorites"}</button>
                    ${isOwner || isAdmin ? `
                        <a href="/add-property.html?edit=${property._id}" class="btn btn-ghost">Edit listing</a>
                        <button id="delete-btn" class="btn btn-danger">Delete</button>
                    ` : ""}
                </div>
            </div>

            <aside class="owner-card">
                <h3>${property.owner ? escapeHtml(property.owner.name) : "Owner"}</h3>
                <p class="text-muted" style="margin-top:0;">Listed by the property owner</p>

                ${isOwner ? `<p class="text-muted">This is your listing.</p>` : `
                <form id="contact-form">
                    <div class="form-row">
                        <label for="msg-subject">Subject</label>
                        <input id="msg-subject" name="subject" placeholder="Inquiry about ${escapeHtml(property.title)}">
                    </div>
                    <div class="form-row">
                        <label for="msg-body">Message</label>
                        <textarea id="msg-body" name="message" rows="4" required placeholder="I'd like to schedule a viewing..."></textarea>
                    </div>
                    <div class="form-error" id="contact-error"></div>
                    <div class="form-success" id="contact-success">Message sent to the owner.</div>
                    <button type="submit" class="btn btn-primary btn-block">Contact owner</button>
                </form>`}
            </aside>
        </div>
    `;

    const favBtn = document.getElementById("fav-toggle");
    favBtn.addEventListener("click", async () => {
        if (!Session.isLoggedIn()) {
            window.location.href = `/login.html?redirect=/property-details.html?id=${property._id}`;
            return;
        }
        const active = favBtn.textContent.includes("Saved");
        try {
            if (active) {
                await apiRequest(`/favorites/${property._id}`, { method: "DELETE" });
                favBtn.textContent = "♡ Save to favorites";
                favBtn.className = "btn btn-ghost";
            } else {
                await apiRequest(`/favorites/${property._id}`, { method: "POST" });
                favBtn.textContent = "♥ Saved";
                favBtn.className = "btn btn-dark";
            }
        } catch (error) {
            alert(error.message);
        }
    });

    const deleteBtn = document.getElementById("delete-btn");
    if (deleteBtn) {
        deleteBtn.addEventListener("click", async () => {
            if (!confirm("Delete this listing? This cannot be undone.")) return;
            try {
                await apiRequest(`/properties/${property._id}`, { method: "DELETE" });
                window.location.href = "/properties.html";
            } catch (error) {
                alert(error.message);
            }
        });
    }

    const contactForm = document.getElementById("contact-form");
    if (contactForm) {
        contactForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const errorBox = document.getElementById("contact-error");
            const successBox = document.getElementById("contact-success");
            errorBox.classList.remove("show");
            successBox.classList.remove("show");

            if (!Session.isLoggedIn()) {
                window.location.href = `/login.html?redirect=/property-details.html?id=${property._id}`;
                return;
            }

            const formData = new FormData(contactForm);
            try {
                await apiRequest("/messages", {
                    method: "POST",
                    body: {
                        propertyId: property._id,
                        subject: formData.get("subject"),
                        message: formData.get("message")
                    }
                });
                successBox.classList.add("show");
                contactForm.reset();
            } catch (error) {
                errorBox.textContent = error.message;
                errorBox.classList.add("show");
            }
        });
    }
}
