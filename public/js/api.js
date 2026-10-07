/* Shared fetch wrapper + auth/session helpers used by every page. */

const API_BASE = "/api";

const Session = {
    getToken() {
        return localStorage.getItem("rep_token");
    },
    getUser() {
        try {
            return JSON.parse(localStorage.getItem("rep_user") || "null");
        } catch {
            return null;
        }
    },
    save(token, user) {
        localStorage.setItem("rep_token", token);
        localStorage.setItem("rep_user", JSON.stringify(user));
    },
    clear() {
        localStorage.removeItem("rep_token");
        localStorage.removeItem("rep_user");
    },
    isLoggedIn() {
        return Boolean(this.getToken());
    },
    isAdmin() {
        const user = this.getUser();
        return Boolean(user && user.role === "admin");
    }
};

async function apiRequest(path, { method = "GET", body, isForm = false } = {}) {
    const headers = {};
    const token = Session.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (!isForm && body) headers["Content-Type"] = "application/json";

    const response = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: isForm ? body : body ? JSON.stringify(body) : undefined
    });

    let data = null;
    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {
        const message = (data && data.message) || `Request failed (${response.status})`;
        if (response.status === 401) {
            Session.clear();
        }
        throw new Error(message);
    }

    return data;
}

/* Renders the header nav slot based on login state. Call on every page. */
function renderNav() {
    const slot = document.getElementById("nav-user-slot");
    if (!slot) return;

    const user = Session.getUser();

    if (!user) {
        slot.innerHTML = `
            <a href="/login.html">Log in</a>
            <a href="/register.html" class="nav-cta">Get started</a>
        `;
        return;
    }

    slot.innerHTML = `
        <span class="user-chip">Hi, ${escapeHtml(user.name.split(" ")[0])}</span>
        ${user.role === "admin" ? '<a href="/admin.html">Admin</a>' : ""}
        <a href="/favorites.html">Favorites</a>
        <a href="/add-property.html" class="nav-cta">List property</a>
        <button class="link-btn" id="logout-btn">Log out</button>
    `;

    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            Session.clear();
            window.location.href = "/index.html";
        });
    }
}

function setupNavToggle() {
    const toggle = document.getElementById("nav-toggle");
    const nav = document.getElementById("main-nav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", () => nav.classList.toggle("open"));
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatPrice(value, status) {
    const num = Number(value) || 0;
    const formatted = num.toLocaleString("en-IN");
    return status === "For Rent" ? `₹${formatted}/mo` : `₹${formatted}`;
}

function requireAuth(redirectTo = "/login.html") {
    if (!Session.isLoggedIn()) {
        window.location.href = redirectTo;
        return false;
    }
    return true;
}

function requireAdmin(redirectTo = "/index.html") {
    if (!requireAuth()) return false;
    if (!Session.isAdmin()) {
        window.location.href = redirectTo;
        return false;
    }
    return true;
}

document.addEventListener("DOMContentLoaded", () => {
    renderNav();
    setupNavToggle();
});
