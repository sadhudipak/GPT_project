import express from "express";
import Thread from "../model/Thread.js";
import getOpenAIAPIResponse from "../utils/openai.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// All chat/thread routes require a logged-in user, and every query below
// is scoped to req.userId so one user can never read/modify another user's
// threads.
router.use(authMiddleware);

router.get("/thread", async (req, res) => {
    try {
        const threads = await Thread.find({ userId: req.userId }).sort({ updatedAt: -1 });
        // descending order of updatedAt...most recent data on top
        res.json(threads);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Failed to fetch threads" });
    }
});

router.get("/thread/:threadId", async (req, res) => {
    const { threadId } = req.params;
    try {
        const thread = await Thread.findOne({ threadId, userId: req.userId });

        if (!thread) {
            return res.status(404).json({ error: "Thread is not found" });
        }
        res.json(thread.messages);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Failed to Fetch Thread..." });
    }
});

router.delete("/thread/:threadId", async (req, res) => {
    const { threadId } = req.params;
    try {
        const deletedThread = await Thread.findOneAndDelete({ threadId, userId: req.userId });

        if (!deletedThread) {
            return res.status(404).json({ error: "Thread is not found" });
        }
        res.status(200).json({ success: "Thread deleted successfully.." });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Failed to Delete Thread..." });
    }
});

router.post("/chat", async (req, res) => {
    const { threadId, message } = req.body;

    if (!threadId || !message) {
        return res.status(400).json({ error: "missing required fields" });
    }

    try {
        let thread = await Thread.findOne({ threadId, userId: req.userId });

        if (!thread) {
            // create a new thread in DB, owned by the current user
            thread = new Thread({
                threadId,
                userId: req.userId,
                title: message,
                messages: [{ role: "user", content: message }]
            });
        } else {
            thread.messages.push({ role: "user", content: message });
        }

        const assistantReply = await getOpenAIAPIResponse(message);

        thread.messages.push({ role: "assistant", content: assistantReply });
        thread.updatedAt = new Date();

        await thread.save();
        res.json({ reply: assistantReply });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "something went wrong" });
    }
});

// Rename thread (for dropdown "Rename" option)
router.patch("/thread/:threadId", async (req, res) => {
    const { threadId } = req.params;
    const { title } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({ error: "Title is required" });
    }

    try {
        const updatedThread = await Thread.findOneAndUpdate(
            { threadId, userId: req.userId },
            { title: title.trim(), updatedAt: new Date() },
            { new: true } // return the updated document
        );

        if (!updatedThread) {
            return res.status(404).json({ error: "Thread is not found" });
        }

        res.status(200).json(updatedThread);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Failed to Rename Thread..." });
    }
});

export default router;
