const nameInput = document.getElementById("name");
const keyInput = document.getElementById("key");

if (nameInput && keyInput) {
    nameInput.addEventListener("input", function () {
        const value = this.value.trim();

        if (!value) {
            keyInput.value = "";
            return;
        }

        const words = value.split(/\s+/);
        if (words.length === 1) {
            keyInput.value = words[0].substring(0, 3).toUpperCase();
        } else {
            keyInput.value = words
                .map((w) => w.charAt(0))
                .join("")
                .toUpperCase();
        }
    });
}

// Delete project.
const deleteProjectButton = document.querySelector(".delete-project");
if (deleteProjectButton) {
    deleteProjectButton.addEventListener("click", function () {
        // open modal
        const deleteProjectModal = document.querySelector(
            ".delete-project-modal",
        );
        deleteProjectModal.style.display = "block";

        // close modal
        const deleteProjectClose = document.querySelector(
            ".delete-project-close",
        );
        deleteProjectClose.addEventListener("click", function () {
            deleteProjectModal.style.display = "none";
        });
    });
}
