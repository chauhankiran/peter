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

// Project manage: completed modal.
const projectStatusSelect = document.getElementById("projectStatus");
if (projectStatusSelect) {
    let previous = projectStatusSelect.getAttribute("data-current") || "active";

    projectStatusSelect.addEventListener("change", function () {
        const selected = this.value;

        if (selected !== "completed") {
            previous = selected;
            this.setAttribute("data-current", selected);
            return;
        }

        const modal = document.querySelector(".complete-project-modal");
        const closeBtn = document.querySelector(".complete-project-close");
        if (!modal || !closeBtn) return;

        modal.style.display = "block";

        closeBtn.addEventListener(
            "click",
            function () {
                modal.style.display = "none";
                projectStatusSelect.value = previous;
            },
            { once: true },
        );
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

// Comment modals (edit and delete)
const commentsContainer = document.querySelector("[data-work-id]");
if (commentsContainer) {
    const workId = commentsContainer.getAttribute("data-work-id");

    // Edit comment modal
    document.querySelectorAll(".edit-comment").forEach(function (btn) {
        btn.addEventListener("click", function (e) {
            e.preventDefault();
            const commentId = this.getAttribute("data-comment-id");
            const commentBody = this.getAttribute("data-comment-body");
            const modal = document.querySelector(".edit-comment-modal");
            const form = document.getElementById("edit-comment-form");
            const textarea = document.getElementById("editCommentBody");

            form.action =
                "/work/" + workId + "/comments/" + commentId + "?_method=PUT";
            textarea.value = commentBody;
            modal.style.display = "block";
        });
    });

    const editCloseBtn = document.querySelector(".edit-comment-close");
    if (editCloseBtn) {
        editCloseBtn.addEventListener("click", function () {
            document.querySelector(".edit-comment-modal").style.display =
                "none";
        });
    }

    // Delete comment modal
    document.querySelectorAll(".delete-comment").forEach(function (btn) {
        btn.addEventListener("click", function (e) {
            e.preventDefault();
            const commentId = this.getAttribute("data-comment-id");
            const modal = document.querySelector(".delete-comment-modal");
            const form = document.getElementById("delete-comment-form");

            form.action =
                "/work/" +
                workId +
                "/comments/" +
                commentId +
                "?_method=DELETE";
            modal.style.display = "block";
        });
    });

    const deleteCloseBtn = document.querySelector(".delete-comment-close");
    if (deleteCloseBtn) {
        deleteCloseBtn.addEventListener("click", function () {
            document.querySelector(".delete-comment-modal").style.display =
                "none";
        });
    }
}

// Work: update assignees by project selection (HTML partial).
const projectSelect = document.getElementById("projectId");
if (projectSelect && !projectSelect.disabled) {
    const partialUrl = projectSelect.getAttribute("data-partial-url");
    const partialTarget = projectSelect.getAttribute("data-partial-target");
    const statusPartialUrl = projectSelect.getAttribute("data-status-partial-url");
    const statusPartialTarget = projectSelect.getAttribute(
        "data-status-partial-target",
    );
    const priorityPartialUrl = projectSelect.getAttribute(
        "data-priority-partial-url",
    );
    const priorityPartialTarget = projectSelect.getAttribute(
        "data-priority-partial-target",
    );
    const milestonePartialUrl = projectSelect.getAttribute(
        "data-milestone-partial-url",
    );
    const milestonePartialTarget = projectSelect.getAttribute(
        "data-milestone-partial-target",
    );

    if (partialUrl && partialTarget) {
        projectSelect.addEventListener("change", async function () {
            const projectId = this.value;

            const assigneeTarget = document.querySelector(partialTarget);
            if (assigneeTarget) {
                const url = new URL(partialUrl, window.location.origin);
                if (projectId) {
                    url.searchParams.set("projectId", projectId);
                }

                const currentAssignee = document.getElementById("assigneeId");
                if (currentAssignee && currentAssignee.value) {
                    url.searchParams.set("assigneeId", currentAssignee.value);
                }

                const res = await fetch(url.toString(), {
                    headers: { "X-Requested-With": "XMLHttpRequest" },
                });
                assigneeTarget.innerHTML = await res.text();
            }

            if (statusPartialUrl && statusPartialTarget) {
                const statusTarget = document.querySelector(statusPartialTarget);
                if (!statusTarget) return;

                const url = new URL(statusPartialUrl, window.location.origin);
                if (projectId) {
                    url.searchParams.set("projectId", projectId);
                }

                const currentStatus = document.getElementById("statusId");
                if (currentStatus && currentStatus.value) {
                    url.searchParams.set("statusId", currentStatus.value);
                }

                const res = await fetch(url.toString(), {
                    headers: { "X-Requested-With": "XMLHttpRequest" },
                });
                statusTarget.innerHTML = await res.text();
            }

            if (priorityPartialUrl && priorityPartialTarget) {
                const priorityTarget = document.querySelector(
                    priorityPartialTarget,
                );
                if (!priorityTarget) return;

                const url = new URL(priorityPartialUrl, window.location.origin);
                if (projectId) {
                    url.searchParams.set("projectId", projectId);
                }

                const currentPriority = document.getElementById("priorityId");
                if (currentPriority && currentPriority.value) {
                    url.searchParams.set("priorityId", currentPriority.value);
                }

                const res = await fetch(url.toString(), {
                    headers: { "X-Requested-With": "XMLHttpRequest" },
                });
                priorityTarget.innerHTML = await res.text();
            }

            if (milestonePartialUrl && milestonePartialTarget) {
                const milestoneTarget = document.querySelector(
                    milestonePartialTarget,
                );
                if (!milestoneTarget) return;

                const url = new URL(milestonePartialUrl, window.location.origin);
                if (projectId) {
                    url.searchParams.set("projectId", projectId);
                }

                const currentMilestone = document.getElementById("milestoneId");
                if (currentMilestone && currentMilestone.value) {
                    url.searchParams.set("milestoneId", currentMilestone.value);
                }

                const res = await fetch(url.toString(), {
                    headers: { "X-Requested-With": "XMLHttpRequest" },
                });
                milestoneTarget.innerHTML = await res.text();
            }
        });
    }
}
