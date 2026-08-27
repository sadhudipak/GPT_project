import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    models: [
      {
        id: "gpt-5",
        name: "GPT-5",
      },
      {
        id: "gpt-5-mini",
        name: "GPT-5 Mini",
      },
    ],

    voices: [
      {
        id: "alloy",
        name: "Alloy",
      },
      {
        id: "ash",
        name: "Ash",
      },
      {
        id: "coral",
        name: "Coral",
      },
      {
        id: "nova",
        name: "Nova",
      },
    ],
  });
});

export default router;
