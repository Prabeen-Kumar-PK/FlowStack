const board = {
  todo: document.querySelector("#todo"),
  progress: document.querySelector("#progress"),
  done: document.querySelector("#done"),
};

const heatGrid = document.querySelector("#heat-grid");
const heatmapCard = document.querySelector(".heatmap-card");
const heatmapDetailModal = document.querySelector("#heatmap-detail-modal");
const detailTaskGrid = document.querySelector("#detail-task-grid");
const detailSummary = document.querySelector("#detail-summary");
const detailAnimalImg = document.querySelector("#detail-animal-img");
const detailAnimalText = document.querySelector("#detail-animal-text");
const detailCloseButton = document.querySelector(".close-detail");
const factImage = document.querySelector("#fact-image");
const factCount = document.querySelector("#fact-count");
const factTitle = document.querySelector("#fact-title");
const factDescription = document.querySelector("#fact-description");
const pendingSummary = document.querySelector("#pending-summary");
const pendingList = document.querySelector("#pending-list");
const modal = document.querySelector(".modal.add-new-task");
const toggleModalButton = document.querySelector("#toggle-modal");
const modalBackground = modal.querySelector(".bg");
const addTaskButton = document.querySelector("#add-new-task");
const taskTitleInput = document.querySelector("#task-title-input");
const taskDescriptionInput = document.querySelector("#task-description-input");

let dragTask = null;
let currentFactIndex = 0;
let factTimer = null;

const MAX_HEATMAP_SQUARES = 21;
const FACT_ROTATION_MS = 10000;

const animalCards = [
  {
    name: "Panda",
    detail: "Gentle and calm, pandas spend most of the day eating bamboo.",
    image: "https://loremflickr.com/120/120/panda?lock=1",
  },
  {
    name: "Koala",
    detail: "Sleepy and slow, koalas rest in eucalyptus trees for up to 20 hours.",
    image: "https://loremflickr.com/120/120/koala?lock=2",
  },
  {
    name: "Tiger",
    detail: "A strong hunter with striking stripes and excellent night vision.",
    image: "https://loremflickr.com/120/120/tiger?lock=3",
  },
  {
    name: "Elephant",
    detail: "Smart and social, elephants use their trunks for touch, smell, and drinking.",
    image: "https://loremflickr.com/120/120/elephant?lock=4",
  },
  {
    name: "Penguin",
    detail: "Penguins are agile swimmers and live in cold, coastal environments.",
    image: "https://loremflickr.com/120/120/penguin?lock=5",
  },
];

const facts = [
  {
    title: "Earth is mostly water",
    description: "Around 71% of Earth’s surface is covered by water, but only 2.5% of that is fresh water.",
    image: "https://loremflickr.com/640/480/world?lock=11",
  },
  {
    title: "Highest mountain",
    description: "Mount Everest is the world’s tallest mountain above sea level at 8,848 meters.",
    image: "https://loremflickr.com/640/480/mountain?lock=12",
  },
  {
    title: "Deepest ocean trench",
    description: "The Mariana Trench is the deepest part of the world’s oceans at about 11 kilometers deep.",
    image: "https://loremflickr.com/640/480/ocean?lock=13",
  },
  {
    title: "Largest desert",
    description: "The Sahara is the largest hot desert and covers much of North Africa.",
    image: "https://loremflickr.com/640/480/desert?lock=14",
  },
  {
    title: "Biggest rainforest",
    description: "The Amazon rainforest spans nine countries and produces roughly 20% of the world’s oxygen.",
    image: "https://loremflickr.com/640/480/forest?lock=15",
  },
  {
    title: "Largest country",
    description: "Russia is the largest country by area, covering more than 17 million square kilometers.",
    image: "https://loremflickr.com/640/480/country?lock=16",
  },
  {
    title: "Most populous nation",
    description: "China has the largest population of any country, with over 1.4 billion people.",
    image: "https://loremflickr.com/640/480/city?lock=17",
  },
  {
    title: "Coldest continent",
    description: "Antarctica is the coldest continent and is almost entirely covered by ice.",
    image: "https://loremflickr.com/640/480/ice?lock=18",
  },
  {
    title: "Longest river",
    description: "The Nile River is one of the world’s longest rivers, flowing through northeastern Africa.",
    image: "https://loremflickr.com/640/480/river?lock=19",
  },
  {
    title: "Largest ocean",
    description: "The Pacific Ocean is the largest and deepest ocean on Earth.",
    image: "https://loremflickr.com/640/480/sea?lock=20",
  },
  {
    title: "24 time zones",
    description: "The Earth is divided into 24 standard time zones, one for each hour of the day.",
    image: "https://loremflickr.com/640/480/clock?lock=21",
  },
  {
    title: "United Nations",
    description: "There are 193 member states in the United Nations.",
    image: "https://loremflickr.com/640/480/flags?lock=22",
  },
  {
    title: "Rich biodiversity",
    description: "Earth contains millions of species, with many still undiscovered.",
    image: "https://loremflickr.com/640/480/biodiversity?lock=23",
  },
  {
    title: "Longest coastline",
    description: "Canada has the longest coastline of any country in the world.",
    image: "https://loremflickr.com/640/480/coast?lock=24",
  },
  {
    title: "Ancient city",
    description: "Jericho is one of the world’s oldest continuously inhabited cities.",
    image: "https://loremflickr.com/640/480/cityscape?lock=25",
  },
];

const LOCAL_STORAGE_KEY = "kanban-board-tasks";

function createElement(tag, className, content = "") {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.innerHTML = content;
  return element;
}

function saveBoardState() {
  const boardState = Object.entries(board).reduce((state, [status, column]) => {
    state[status] = Array.from(column.querySelectorAll(".task")).map((task) => ({
      title: task.querySelector("h2")?.textContent || "",
      description: task.querySelector("p")?.textContent || "",
    }));
    return state;
  }, {});

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(boardState));
}

function loadBoardState() {
  const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!savedState) return;

  try {
    const parsedState = JSON.parse(savedState);
    Object.entries(parsedState).forEach(([status, tasks]) => {
      if (!board[status] || !Array.isArray(tasks)) return;
      tasks.forEach(({ title, description }) => {
        const task = createTaskElement(title, description);
        board[status].appendChild(task);
      });
    });
  } catch (error) {
    console.warn("Failed to load saved Kanban board state:", error);
  }
}

function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function setTaskStatistics(task) {
  if (!task) return;
  task.dataset.status = getTaskStatus(task);
}

function updateTaskStatistics(task, newStatus) {
  if (!task) return;
  task.dataset.status = newStatus;
}

function getBoardTasks() {
  return {
    todo: Array.from(board.todo.querySelectorAll(".task")),
    progress: Array.from(board.progress.querySelectorAll(".task")),
    done: Array.from(board.done.querySelectorAll(".task")),
  };
}

function getTaskStatus(task) {
  if (task.closest("#done")) return "done";
  if (task.closest("#progress")) return "progress";
  return "todo";
}

function updateCounters() {
  const tasks = getBoardTasks();
  document.querySelector("#todo-heading-count").textContent = tasks.todo.length;
  document.querySelector("#progress-heading-count").textContent = tasks.progress.length;
  document.querySelector("#done-heading-count").textContent = tasks.done.length;
}

function updatePendingTasks() {
  const tasks = getBoardTasks();
  const pendingTasks = [...tasks.todo, ...tasks.progress];
  pendingSummary.textContent = `${pendingTasks.length} ${pendingTasks.length === 1 ? "task" : "tasks"} not completed`;

  if (pendingTasks.length === 0) {
    pendingList.innerHTML = '<li class="empty">No unfinished tasks. Great job!</li>';
    return;
  }

  pendingList.innerHTML = pendingTasks
    .map((task) => `<li>${task.querySelector("h2")?.textContent || "Unnamed task"}</li>`)
    .join("");
}

function renderHeatmap() {
  const tasks = getBoardTasks();
  const activity = [
    ...Array(tasks.todo.length).fill("todo"),
    ...Array(tasks.progress.length).fill("progress"),
    ...Array(tasks.done.length).fill("done"),
  ];

  heatGrid.innerHTML = "";

  for (let index = 0; index < MAX_HEATMAP_SQUARES; index += 1) {
    const square = createElement("div", "heat-square");
    if (index < activity.length) {
      square.classList.add(activity[index], "active");
    }
    heatGrid.appendChild(square);
  }
}

function openHeatmapDetail() {
  const tasks = getBoardTasks();
  const allTasks = [...tasks.todo, ...tasks.progress, ...tasks.done];

  detailSummary.textContent = `Total tasks: ${allTasks.length} • To do: ${tasks.todo.length} • In progress: ${tasks.progress.length} • Done: ${tasks.done.length}`;
  detailTaskGrid.innerHTML = "";

  allTasks.forEach((task) => {
    const square = createElement("div", `detail-square ${getTaskStatus(task)}`);
    square.title = task.querySelector("h2")?.textContent || "Unnamed task";
    detailTaskGrid.appendChild(square);
  });

  const animal = animalCards[randomInteger(0, animalCards.length - 1)];
  detailAnimalImg.src = animal.image;
  detailAnimalImg.alt = animal.name;
  detailAnimalText.textContent = `${animal.name}: ${animal.detail}`;
  heatmapDetailModal.classList.add("active");
}

function closeHeatmapDetail() {
  heatmapDetailModal.classList.remove("active");
}



function initializeTask(task) {
  task.setAttribute("draggable", "true");
  task.addEventListener("dragstart", () => {
    dragTask = task;
  });

  const deleteButton = task.querySelector("button");
  if (deleteButton) {
    deleteButton.addEventListener("click", () => {
      task.remove();
      refreshUI();
    });
  }

  setTaskStatistics(task);
}

function attachColumnEvents(column) {
  column.addEventListener("dragover", (event) => event.preventDefault());

  column.addEventListener("dragenter", (event) => {
    event.preventDefault();
    column.classList.add("hover-over");
  });

  column.addEventListener("dragleave", () => {
    column.classList.remove("hover-over");
  });

  column.addEventListener("drop", () => {
    if (!dragTask) return;
    const sourceColumn = dragTask.parentElement;
    column.appendChild(dragTask);
    updateTaskStatistics(dragTask, column.id);
    column.classList.remove("hover-over");
    refreshUI();
  });
}

function createTaskElement(title, description) {
  return createElement("div", "task", `
    <h2>${title}</h2>
    <p>${description}</p>
    <button>Delete</button>
  `);
}

function appendTaskToColumn(column, title, description) {
  const task = createTaskElement(title, description);
  initializeTask(task);
  column.appendChild(task);
}

function showFact(index) {
  const fact = facts[index];
  if (!fact) return;

  factImage.style.backgroundImage = `url('${fact.image}')`;
  factCount.textContent = `Fact ${index + 1} of ${facts.length}`;
  factTitle.textContent = fact.title;
  factDescription.textContent = fact.description;
}

function nextFact() {
  currentFactIndex = (currentFactIndex + 1) % facts.length;
  showFact(currentFactIndex);
}

function beginFactRotation() {
  showFact(currentFactIndex);
  if (factTimer) clearInterval(factTimer);
  factTimer = setInterval(nextFact, FACT_ROTATION_MS);
}

function refreshUI() {
  updateCounters();
  updatePendingTasks();
  renderHeatmap();
  showFact(currentFactIndex);
  saveBoardState();
}

function openTaskModal() {
  modal.classList.add("active");
}

function closeTaskModal() {
  modal.classList.remove("active");
}

function addTaskFromForm() {
  const title = taskTitleInput.value.trim();
  const description = taskDescriptionInput.value.trim();

  if (!title) return;

  appendTaskToColumn(board.todo, title, description);
  taskTitleInput.value = "";
  taskDescriptionInput.value = "";
  closeTaskModal();
  refreshUI();
}

function initializeBoard() {
  loadBoardState();
  document.querySelectorAll(".task").forEach(initializeTask);
  Object.values(board).forEach(attachColumnEvents);

  heatmapCard.addEventListener("click", openHeatmapDetail);
  detailCloseButton.addEventListener("click", closeHeatmapDetail);
  heatmapDetailModal.querySelector(".bg").addEventListener("click", closeHeatmapDetail);

  toggleModalButton.addEventListener("click", openTaskModal);
  modalBackground.addEventListener("click", closeTaskModal);
  addTaskButton.addEventListener("click", addTaskFromForm);

  beginFactRotation();
  refreshUI();
}

initializeBoard();
