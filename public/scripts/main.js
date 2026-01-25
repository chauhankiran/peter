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
