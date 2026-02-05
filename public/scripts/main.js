// Delete project.
const deleteProjectButton = document.querySelector('.delete-project');

if (deleteProjectButton) {
    deleteProjectButton.addEventListener('click', function () {
        // open modal
        const deleteProjectModal = document.querySelector('.delete-project-modal');
        deleteProjectModal.style.display = 'block';

        // close modal
        const deleteProjectClose = document.querySelector('.delete-project-close');
        deleteProjectClose.addEventListener('click', function () {
            deleteProjectModal.style.display = 'none';
        });
    });
}

// Delete work.
const deleteWorkButton = document.querySelector('.delete-work');

if (deleteWorkButton) {
    deleteWorkButton.addEventListener('click', function () {
        // open modal
        const deleteWorkModal = document.querySelector('.delete-work-modal');
        deleteWorkModal.style.display = 'block';

        // close modal
        const deleteWorkClose = document.querySelector('.delete-work-close');
        deleteWorkClose.addEventListener('click', function () {
            deleteWorkModal.style.display = 'none';
        });
    });
}

// Edit comment.
const editCommentButtons = document.querySelectorAll('.edit-comment');

editCommentButtons.forEach(function (button) {
    button.addEventListener('click', function (e) {
        e.preventDefault();
        const commentItem = this.closest('.comment-item');
        const modal = commentItem.querySelector('.edit-comment-modal');
        if (modal) {
            modal.style.display = 'block';
        }
    });
});

const editCommentCloseButtons = document.querySelectorAll('.edit-comment-close');

editCommentCloseButtons.forEach(function (button) {
    button.addEventListener('click', function () {
        const commentItem = this.closest('.comment-item');
        const modal = commentItem.querySelector('.edit-comment-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    });
});

// Delete comment.
const deleteCommentButtons = document.querySelectorAll('.delete-comment');

deleteCommentButtons.forEach(function (button) {
    button.addEventListener('click', function (e) {
        e.preventDefault();
        const commentItem = this.closest('.comment-item');
        const modal = commentItem.querySelector('.delete-comment-modal');
        if (modal) {
            modal.style.display = 'block';
        }
    });
});

const deleteCommentCloseButtons = document.querySelectorAll('.delete-comment-close');

deleteCommentCloseButtons.forEach(function (button) {
    button.addEventListener('click', function () {
        const commentItem = this.closest('.comment-item');
        const modal = commentItem.querySelector('.delete-comment-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    });
});
