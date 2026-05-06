import express from "express";

const router = express.Router();

let nextMaterialId = 2;
let nextNoteId = 2;
const materialsStore = [{ id: 1, title: "sample.pdf", file_path: "uploads/sample.pdf" }];
const notesStore = [{ id: 1, title: "Revision Plan", content: "Focus on algorithms and DBMS this week." }];

router.post("/materials/upload", (req, res) => {
  const fileName = String(req.body?.filename || "uploaded-file");
  const row = {
    id: nextMaterialId++,
    title: fileName,
    file_path: `uploads/${Date.now()}_${fileName}`,
  };
  materialsStore.push(row);
  return res.json(row);
});

router.post("/notes", (req, res) => {
  const row = {
    id: nextNoteId++,
    title: String(req.body?.title || "Untitled"),
    content: String(req.body?.content || ""),
  };
  notesStore.push(row);
  return res.json(row);
});

router.get("/notes", (_req, res) => {
  return res.json(notesStore);
});

router.post("/ask", (req, res) => {
  const question = String(req.body?.question || "");
  const answer = question ? `AI assistant insight: ${question}` : "AI assistant insight: Please share your question.";
  return res.json({ answer });
});

router.post("/summarize", (req, res) => {
  const text = String(req.body?.question || "");
  return res.json({ answer: `Summary: ${text.slice(0, 180)}` });
});

router.post("/quiz", (req, res) => {
  const text = String(req.body?.question || "");
  return res.json({ answer: `Quiz based on: ${text}` });
});

export default router;
