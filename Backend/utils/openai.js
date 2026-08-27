import "dotenv/config";
import OpenAI from "openai";
import fs from "fs";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const getOpenAIAPIResponse = async (message) => {
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-5.4-mini",
            messages: [{
                role: "user",
                content: message,
            }]
        })
    };
    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", options);
        const data = await response.json();

        if (!response.ok || !data?.choices?.[0]?.message?.content) {
            console.log("OpenAI chat completion error:", data);
            throw new Error(data?.error?.message || "OpenAI chat completion failed");
        }

        return data.choices[0].message.content; // reply
    } catch (err) {
        console.log(err);
        // Re-throw so callers (chat.js) can return a proper 500 instead of
        // silently saving "undefined" as the assistant's reply.
        throw err;
    }
}
const getTranscription = async (filePath) => {
    try {
        const transcription = await client.audio.transcriptions.create({
            file: fs.createReadStream(filePath),
            model: "whisper-1",
        });
        return transcription.text;
    } catch (err) {
        console.log("OpenAI transcription error:", err);
        throw err;
    }
};

// Text-to-Speech
// text: string to convert to spoken audio
// returns: a Buffer containing mp3 audio data
const getSpeechBuffer = async (text) => {
    try {
        const mp3Response = await client.audio.speech.create({
            model: "tts-1",
            voice: "alloy", // options: alloy, echo, fable, onyx, nova, shimmer
            input: text,
        });
        const buffer = Buffer.from(await mp3Response.arrayBuffer());
        return buffer;
    } catch (err) {
        console.log("OpenAI TTS error:", err);
        throw err;
    }
};

export default getOpenAIAPIResponse;
export { getTranscription, getSpeechBuffer };
