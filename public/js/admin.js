/* Admin dashboard: stats, user management, property oversight, and
   direct property creation (with image upload) from the dashboard. */

const dashRoot = document.getElementById("admin-root");

if (dashRoot) {
    (async () => {
        if (!requireAdmin()) return;
        await loadAdminData();
        setupAddPropertyPanel();
    })();
}

async function loadAdminData() {
    try {
        const [dashboard, users, properties] = await Promise.all([
            apiRequest("/admin/dashboard"),
            apiRequest("/admin/users"),
            apiRequest("/admin/properties")
        ]);
        renderDashboard(dashboard, users, properties);
    } catch (error) {
        dashRoot.innerHTML = `<div class="empty-state"><h3>Couldn't load admin data</h3><p>${escapeHtml(error.message)}</p></div>`;
    }
}

function setupAddPropertyPanel() {
    const toggleBtn = document.getElementById("admin-add-toggle");
    const slot = document.getElementById("admin-add-property-slot");
    const template = document.getElementById("admin-property-form-template");
    if (!toggleBtn || !slot || !template) return;

    toggleBtn.addEventListener("click", () => {
        if (slot.children.length) {
            slot.innerHTML = "";
            toggleBtn.textContent = "+ Add new property";
            return;
        }

        slot.appendChild(template.content.cloneNode(true));
        toggleBtn.textContent = "Hide form";
        wireAddPropertyForm(slot, toggleBtn);
        slot.querySelector("#ap-title").focus();
    });
}

function wireAddPropertyForm(slot, toggleBtn) {
    const form = slot.querySelector("#admin-property-form");
    const errorBox = slot.querySelector("#admin-property-error");
    const successBox = slot.querySelector("#admin-property-success");
    const fileInput = slot.querySelector("#ap-images");
    const preview = slot.querySelector("#ap-image-preview");
    const cancelBtn = slot.querySelector("#admin-add-cancel");

    cancelBtn.addEventListener("click", () => {
        slot.innerHTML = "";
        toggleBtn.textContent = "+ Add new property";
    });

    fileInput.addEventListener("change", () => {
        preview.innerHTML = "";
        [...fileInput.files].forEach((file) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement("img");
                img.src = e.target.result;
                preview.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        errorBox.classList.remove("show");
        successBox.classList.remove("show");

        const submitBtn = form.querySelector("button[type=submit]");
        submitBtn.disabled = true;
        submitBtn.textContent = "Publishing...";

        try {
            await apiRequest("/properties", {
                method: "POST",
                body: new FormData(form),
                isForm: true
            });

            successBox.classList.add("show");
            form.reset();
            preview.innerHTML = "";
            await loadAdminData();

            setTimeout(() => {
                slot.innerHTML = "";
                toggleBtn.textContent = "+ Add new property";
            }, 900);
        } catch (error) {
            errorBox.textContent = error.message;
            errorBox.classList.add("show");
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Publish listing";
        }
    });
}

function renderDashboard(dashboard, users, properties) {
    const { stats } = dashboard;

    dashRoot.innerHTML = `
        <div class="dash-stats">
            <div class="stat-card"><div class="stat-num">${stats.userCount}</div><div class="stat-label">Users</div></div>
            <div class="stat-card"><div class="stat-num">${stats.propertyCount}</div><div class="stat-label">Properties</div></div>
            <div class="stat-card"><div class="stat-num">${stats.forSale}</div><div class="stat-label">For sale</div></div>
            <div class="stat-card"><div class="stat-num">${stats.forRent}</div><div class="stat-label">For rent</div></div>
        </div>

        <div class="section-head"><h2 style="font-size:1.4rem;">Users</h2></div>
        <table class="data-table" style="margin-bottom:40px;">
            <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th></th></tr>
            </thead>
            <tbody id="users-tbody">
                ${users.map(userRow).join("")}
            </tbody>
        </table>

        <div class="section-head"><h2 style="font-size:1.4rem;">Properties</h2></div>
        <table class="data-table">
            <thead>
                <tr><th>Title</th><th>Owner</th><th>Status</th><th>Price</th><th></th></tr>
            </thead>
            <tbody id="properties-tbody">
                ${properties.map(propertyRow).join("")}
            </tbody>
        </table>
    `;

    document.querySelectorAll("[data-delete-user]").forEach((btn) => {
        btn.addEventListener("click", async () => {
            if (!confirm("Delete this user account?")) return;
            try {
                await apiRequest(`/admin/users/${btn.getAttribute("data-delete-user")}`, { method: "DELETE" });
                btn.closest("tr").remove();
            } catch (error) {
                alert(error.message);
            }
        });
    });

    document.querySelectorAll("[data-delete-property]").forEach((btn) => {
        btn.addEventListener("click", async () => {
            if (!confirm("Delete this property listing?")) return;
            try {
                await apiRequest(`/properties/${btn.getAttribute("data-delete-property")}`, { method: "DELETE" });
                btn.closest("tr").remove();
            } catch (error) {
                alert(error.message);
            }
        });
    });
}

function userRow(user) {
    return `
        <tr>
            <td>${escapeHtml(user.name)}</td>
            <td>${escapeHtml(user.email)}</td>
            <td><span class="role-badge ${user.role === "admin" ? "admin" : ""}">${user.role}</span></td>
            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
            <td><button class="btn btn-danger btn-sm" data-delete-user="${user._id}">Delete</button></td>
        </tr>`;
}

function propertyRow(property) {
    return `
        <tr>
            <td><a href="/property-details.html?id=${property._id}">${escapeHtml(property.title)}</a></td>
            <td>${property.owner ? escapeHtml(property.owner.name) : "-"}</td>
            <td>${property.status}</td>
            <td>${formatPrice(property.price, property.status)}</td>
            <td><button class="btn btn-danger btn-sm" data-delete-property="${property._id}">Delete</button></td>
        </tr>`;
}
