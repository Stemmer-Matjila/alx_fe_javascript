// Wait until the DOM is fully loaded before running any code
document.addEventListener('DOMContentLoaded', function () {

    // --- Select key DOM elements ---
    const addButton = document.getElementById('add-task-btn');  // "Add Task" button
    const taskInput = document.getElementById('task-input');    // Input field
    const taskList = document.getElementById('task-list');      // <ul> for tasks

    // --- Initialize the tasks array ---
    let tasks = [];

    // --- Load tasks from Local Storage ---
    function loadTasks() {
        const storedTasks = localStorage.getItem('tasks'); // Get saved tasks
        if (storedTasks) {
            tasks = JSON.parse(storedTasks); // Convert JSON back to array
            tasks.forEach(taskText => createTaskElement(taskText)); // Show each saved task
        }
    }

    // --- Save current tasks to Local Storage ---
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks)); // Convert to JSON string and save
    }

    // --- Create and display a task in the list ---
    function createTaskElement(taskText) {
        // Create <li> element for the task
        const listItem = document.createElement('li');
        listItem.textContent = taskText;

        // Create "Remove" button
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.classList.add('remove-btn'); //  Using classList.add()

        // When "Remove" is clicked → delete from DOM and Local Storage
        removeButton.addEventListener('click', function () {
            taskList.removeChild(listItem); // Remove from page

            // Remove from tasks array
            tasks = tasks.filter(task => task !== taskText);
            saveTasks(); // Update Local Storage
        });

        // Append button to list item, then list item to task list
        listItem.appendChild(removeButton);
        taskList.appendChild(listItem);
    }

    // --- Add a new task ---
    function addTask() {
        const taskText = taskInput.value.trim(); // Remove extra spaces

        if (taskText === '') {
            alert('Please enter a task.');
            return;
        }

        // Add to array and update Local Storage
        tasks.push(taskText);
        saveTasks();

        // Create task element in DOM
        createTaskElement(taskText);

        // Clear input field
        taskInput.value = '';
    }

    // --- Event Listeners ---

    // Add task when "Add Task" button is clicked
    addButton.addEventListener('click', addTask);

    // Add task when "Enter" key is pressed
    taskInput.addEventListener('keypress', function (event) {
        if (event.key === 'Enter') {
            addTask();
        }
    });

    // --- Load tasks as soon as the page opens ---
    loadTasks();
});
