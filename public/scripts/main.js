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
