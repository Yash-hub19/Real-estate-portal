/* Handles the add/edit property form, including image selection preview. */

const propertyForm = document.getElementById("property-form");

if (propertyForm) {
    requireAuth("/login.html?redirect=/add-property.html");

    const params = new URLSearchParams(window.location.search);
    const editId = params.get("edit");
    const heading = document.getElementById("form-heading");
    const errorBox = document.getElementById("property-error");
    const fileInput = document.getElementById("images");
    const preview = document.getElementById("image-preview");

    if (editId) {
        heading.textContent = "Edit property";
        (async () => {
            try {
                const property = await apiRequest(`/properties/${editId}`);
                const user = Session.getUser();
                const ownerId = property.owner._id || property.owner;
                if (ownerId !== user.id && !Session.isAdmin()) {
                    alert("You are not authorized to edit this listing");
                    window.location.href = "/index.html";
                    return;
                }
                Object.entries({
                    title: property.title,
                    description: property.description,
                    price: property.price,
                    type: property.type,
                    status: property.status,
                    bedrooms: property.bedrooms,
                    bathrooms: property.bathrooms,
                    area: property.area,
                    location: property.location,
                    address: property.address
                }).forEach(([key, value]) => {
                    const field = propertyForm.elements.namedItem(key);
                    if (field) field.value = value ?? "";
                });

                if (property.images && property.images.length) {
                    preview.innerHTML = property.images
                        .map((src) => `<img src="${src}" alt="">`)
                        .join("");
                }
            } catch (error) {
                errorBox.textContent = error.message;
                errorBox.classList.add("show");
            }
        })();
    }

    if (fileInput) {
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
    }

    propertyForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        errorBox.classList.remove("show");

        const submitBtn = propertyForm.querySelector("button[type=submit]");
        submitBtn.disabled = true;
        submitBtn.textContent = editId ? "Saving..." : "Publishing...";

        const formData = new FormData(propertyForm);

        try {
            const property = await apiRequest(editId ? `/properties/${editId}` : "/properties", {
                method: editId ? "PUT" : "POST",
                body: formData,
                isForm: true
            });
            window.location.href = `/property-details.html?id=${property._id}`;
        } catch (error) {
            errorBox.textContent = error.message;
            errorBox.classList.add("show");
            submitBtn.disabled = false;
            submitBtn.textContent = editId ? "Save changes" : "Publish listing";
        }
    });
}
