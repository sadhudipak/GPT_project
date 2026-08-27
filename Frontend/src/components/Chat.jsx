import "./Chat.css";
import React, { useContext, useState, useEffect } from "react";
import { MyContext } from "../MyContext";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { apiFetch } from "../utils/api.js";

function SpeakerButton({ text, currentAudioRef }) {
    const [status, setStatus] = useState("idle"); // idle | loading | playing

    const stopCurrent = () => {
        if (currentAudioRef.current) {
            currentAudioRef.current.audio.pause();
            currentAudioRef.current.setStatus("idle");
            currentAudioRef.current = null;
        }
    };

    const handleClick = async () => {
        // if this message is already playing, clicking again pauses it
        if (status === "playing" && currentAudioRef.current?.audio) {
            currentAudioRef.current.audio.pause();
            setStatus("idle");
            currentAudioRef.current = null;
            return;
        }

        stopCurrent();
        setStatus("loading");

        try {
            const res = await apiFetch("/api/voice/voice/speak", {
                method: "POST",
                body: JSON.stringify({ text })
            });

            if (!res.ok) throw new Error("Failed to generate speech");

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);

            audio.onended = () => {
                setStatus("idle");
                currentAudioRef.current = null;
                URL.revokeObjectURL(url);
            };

            currentAudioRef.current = { audio, setStatus };
            setStatus("playing");
            audio.play();
        } catch (err) {
            console.log(err);
            setStatus("idle");
        }
    };

    return (
        <button className={`speakerBtn ${status === "playing" ? "playing" : ""}`} onClick={handleClick} title="Listen">
            {status === "loading" ? (
                <i className="fa-solid fa-spinner fa-spin"></i>
            ) : status === "playing" ? (
                <i className="fa-solid fa-pause"></i>
            ) : (
                <i className="fa-solid fa-volume-high"></i>
            )}
        </button>
    );
}

function Chat() {
    const { newChat, prevChats, reply, currentAudioRef } = useContext(MyContext);
    const [latestReply, setLatestReply] = useState(null);

    useEffect(() => {
        if(reply === null) {
            setLatestReply(null); //prevchat load
            return;
        }

        if(!prevChats?.length) return;

        const content = reply.split(" "); //individual words

        let idx = 0;
        const interval = setInterval(() => {
            setLatestReply(content.slice(0, idx+1).join(" "));

            idx++;
            if(idx >= content.length) clearInterval(interval);
        }, 40);

        return () => clearInterval(interval);

    }, [prevChats, reply])

    return (
        <>
            {newChat && <h1>Start a New Chat!</h1>}
            <div className="chats">
                {
                    prevChats?.slice(0, -1).map((chat, idx) => 
                        <div className={chat.role === "user"? "userDiv" : "gptDiv"} key={idx}>
                            {
                                chat.role === "user"? 
                                <p className="userMessage">{chat.content}</p> : 
                                <>
                                    <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{chat.content}</ReactMarkdown>
                                    <SpeakerButton text={chat.content} currentAudioRef={currentAudioRef} />
                                </>
                            }
                        </div>
                    )
                }

                {
                    prevChats.length > 0  && (
                        <>
                            {
                                latestReply === null ? (
                                    <div className="gptDiv" key={"non-typing"} >
                                    <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{prevChats[prevChats.length-1].content}</ReactMarkdown>
                                    <SpeakerButton text={prevChats[prevChats.length-1].content} currentAudioRef={currentAudioRef} />
                                </div>
                                ) : (
                                    <div className="gptDiv" key={"typing"} >
                                     <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{latestReply}</ReactMarkdown>
                                </div>
                                )

                            }
                        </>
                    )
                }

            </div>
        </>
    )
}

export default Chat;
