/* Handles the login and register forms. */

function showError(el, message) {
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
}

function hideError(el) {
    if (!el) return;
    el.classList.remove("show");
}

const loginForm = document.getElementById("login-form");
if (loginForm) {
    const errorBox = document.getElementById("login-error");

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        hideError(errorBox);

        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;
        const submitBtn = loginForm.querySelector("button[type=submit]");

        submitBtn.disabled = true;
        submitBtn.textContent = "Logging in...";

        try {
            const data = await apiRequest("/auth/login", {
                method: "POST",
                body: { email, password }
            });
            Session.save(data.token, data.user);
            const params = new URLSearchParams(window.location.search);
            window.location.href = params.get("redirect") || "/index.html";
        } catch (error) {
            showError(errorBox, error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Log in";
        }
    });
}

const registerForm = document.getElementById("register-form");
if (registerForm) {
    const errorBox = document.getElementById("register-error");

    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        hideError(errorBox);

        const name = document.getElementById("reg-name").value.trim();
        const email = document.getElementById("reg-email").value.trim();
        const phone = document.getElementById("reg-phone").value.trim();
        const password = document.getElementById("reg-password").value;
        const confirm = document.getElementById("reg-confirm").value;
        const submitBtn = registerForm.querySelector("button[type=submit]");

        if (password !== confirm) {
            showError(errorBox, "Passwords do not match");
            return;
        }

        if (password.length < 6) {
            showError(errorBox, "Password must be at least 6 characters");
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = "Creating account...";

        try {
            const data = await apiRequest("/auth/register", {
                method: "POST",
                body: { name, email, phone, password }
            });
            Session.save(data.token, data.user);
            window.location.href = "/index.html";
        } catch (error) {
            showError(errorBox, error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Create account";
        }
    });
}
