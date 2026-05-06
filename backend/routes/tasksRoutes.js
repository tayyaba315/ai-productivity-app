import express from "express";

const router = express.Router();

let nextTaskId = 3;
const tasksStore = [
  {
    id: 1,
    title: "Complete Math Assignment",
    description: "Finish chapter 4 exercises",
    due_date: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    progress: 50,
    completed: false,
    priority: "high",
  },
  {
    id: 2,
    title: "Prepare ML Presentation",
    description: "Draft slides for team sync",
    due_date: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
    progress: 20,
    completed: false,
    priority: "medium",
  },
];

const calculatePriority = (dueDateValue, progressValue) => {
  const dueDate = new Date(dueDateValue);
  if (Number.isNaN(dueDate.getTime())) return "low";
  const progress = Number(progressValue || 0);
  const daysLeft = (dueDate.getTime() - Date.now()) / (24 * 3600 * 1000);
  if (daysLeft <= 1 || progress < 30) return "high";
  if (daysLeft <= 3 || progress < 70) return "medium";
  return "low";
};

router.post("/", (req, res) => {
  const task = {
    id: nextTaskId++,
    title: String(req.body?.title || "Untitled"),
    description: String(req.body?.description || ""),
    due_date: String(req.body?.due_date || new Date().toISOString()),
    progress: Number(req.body?.progress || 0),
    completed: Boolean(req.body?.completed || false),
  };
  task.priority = calculatePriority(task.due_date, task.progress);
  tasksStore.push(task);
  return res.json(task);
});

router.get("/", (_req, res) => {
  return res.json(tasksStore);
});

router.patch("/:task_id", (req, res) => {
  const taskId = Number(req.params.task_id);
  const task = tasksStore.find((item) => item.id === taskId);
  if (!task) {
    return res.status(404).json({ detail: "Task not found" });
  }
  const patch = req.body || {};
  Object.keys(patch).forEach((key) => {
    task[key] = patch[key];
  });
  task.priority = calculatePriority(task.due_date, task.progress);
  return res.json(task);
});

router.delete("/:task_id", (req, res) => {
  const taskId = Number(req.params.task_id);
  const index = tasksStore.findIndex((item) => item.id === taskId);
  if (index === -1) {
    return res.status(404).json({ detail: "Task not found" });
  }
  tasksStore.splice(index, 1);
  return res.json({ message: "Task deleted" });
});

router.post("/:task_id/complete", (req, res) => {
  const taskId = Number(req.params.task_id);
  const task = tasksStore.find((item) => item.id === taskId);
  if (!task) {
    return res.status(404).json({ detail: "Task not found" });
  }
  task.completed = true;
  task.progress = 100;
  task.priority = calculatePriority(task.due_date, task.progress);
  return res.json(task);
});

export default router;
