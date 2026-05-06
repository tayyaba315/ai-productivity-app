import express from "express";

const router = express.Router();

let nextLocationId = 2;
const locationsStore = [
  {
    id: 1,
    name: "Library Quiet Zone",
    productivity_hint: "Best for deep work between 9 AM - 12 PM",
  },
];

router.post("/", (req, res) => {
  const row = {
    id: nextLocationId++,
    name: String(req.body?.name || "Unknown"),
    productivity_hint: String(req.body?.productivity_hint || ""),
  };
  locationsStore.push(row);
  return res.json(row);
});

router.get("/suggestions", (_req, res) => {
  return res.json({
    suggestions: locationsStore.map((item) => `${item.name}: ${item.productivity_hint || "Good focus zone"}`),
  });
});

export default router;
