import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "../MyContext.jsx";
import { useContext, useState, useEffect, useRef } from "react";
import { ScaleLoader } from "react-spinners";
import { apiFetch } from "../utils/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useNavigate } from "react-router-dom";

function ChatWindow() {
    const { prompt, setPrompt, reply, setReply, currThreadId, setPrevChats, setNewChat, selectedModel, setSelectedModel } = useContext(MyContext);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false); // profile dropdown
    const [isModelOpen, setIsModelOpen] = useState(false); // model dropdown
    const [models, setModels] = useState([]);
    const [recording, setRecording] = useState(false);
    const [transcribing, setTranscribing] = useState(false);
    const [voiceError, setVoiceError] = useState("");

    const profileRef = useRef(null);
    const modelRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const { logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const getReply = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        setNewChat(false);

        const options = {
            method: "POST",
            body: JSON.stringify({
                message: prompt,
                threadId: currThreadId
            })
        };

        try {
            const response = await apiFetch("/api/chat", options);
            const res = await response.json();
            if (!response.ok) throw new Error(res.error || "Failed to get a reply");
            setReply(res.reply);
        } catch (err) {
            console.log(err);
        }
        setLoading(false);
    }

    //Append new chat to prevChats
    useEffect(() => {
        if(prompt && reply) {
            setPrevChats(prevChats => (
                [...prevChats, {
                    role: "user",
                    content: prompt
                },{
                    role: "assistant",
                    content: reply
                }]
            ));
        }

        setPrompt("");
    }, [reply]);

    // fetch model/voice options once
    useEffect(() => {
        const loadOptions = async () => {
            try {
                const res = await apiFetch("/api/options");
                const data = await res.json();
                setModels(data.models || []);
            } catch (err) {
                console.log(err);
            }
        };
        loadOptions();
    }, []);

    // close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setIsOpen(false);
            }
            if (modelRef.current && !modelRef.current.contains(e.target)) {
                setIsModelOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleProfileClick = () => {
        setIsOpen(prev => !prev);
        setIsModelOpen(false);
    }

    const handleModelClick = () => {
        setIsModelOpen(prev => !prev);
        setIsOpen(false);
    }

    const handleLogout = async () => {
        setIsOpen(false);
        await logout();
        navigate("/login", { replace: true });
    }

    // ---- voice input ----
    const startRecording = async () => {
        setVoiceError("");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                stream.getTracks().forEach(track => track.stop());
                const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                await transcribeAudio(audioBlob);
            };

            mediaRecorder.start();
            mediaRecorderRef.current = mediaRecorder;
            setRecording(true);
        } catch (err) {
            console.log(err);
            setVoiceError("Microphone permission denied or unavailable");
        }
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setRecording(false);
    };

    const handleMicClick = () => {
        if (recording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const transcribeAudio = async (audioBlob) => {
        setTranscribing(true);
        try {
            const formData = new FormData();
            formData.append("audio", audioBlob, "recording.webm");

            const res = await apiFetch("/api/voice/voice/transcribe", {
                method: "POST",
                body: formData
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Transcription failed");

            // put transcribed text into the input box; user can edit before sending
            setPrompt(prev => (prev ? `${prev} ${data.text}` : data.text));
        } catch (err) {
            console.log(err);
            setVoiceError("Couldn't transcribe audio, please try again");
        } finally {
            setTranscribing(false);
        }
    };

    return (
        <div className="chatWindow">
            <div className="navbar">
                <div className="modelSelector" ref={modelRef} onClick={handleModelClick}>
                    <span>{selectedModel?.name || "GPT"} <i className="fa-solid fa-chevron-down"></i></span>
                    {
                        isModelOpen &&
                        <div className="dropDown modelDropDown">
                            {
                                models.map(model => (
                                    <div
                                        key={model.id}
                                        className={`dropDownItem ${selectedModel?.id === model.id ? "active" : ""}`}
                                        onClick={() => { setSelectedModel(model); setIsModelOpen(false); }}
                                    >
                                        {model.name}
                                    </div>
                                ))
                            }
                        </div>
                    }
                </div>

                <div style={{ display: "flex", alignItems: "center" }}>
                    <button className="themeToggle" onClick={toggleTheme} title="Toggle theme">
                        <i className={`fa-solid ${theme === "dark" ? "fa-sun" : "fa-moon"}`}></i>
                    </button>

                    <div className="userIconDiv" ref={profileRef}>
                        <span className="userIcon" onClick={handleProfileClick}><i className="fa-solid fa-user"></i></span>
                        {
                            isOpen &&
                            <div className="dropDown">
                                <div className="dropDownItem"><i className="fa-solid fa-gear"></i> Settings</div>
                                <div className="dropDownItem"><i className="fa-solid fa-cloud-arrow-up"></i> Upgrade plan</div>
                                <div className="dropDownItem danger" onClick={handleLogout}>
                                    <i className="fa-solid fa-arrow-right-from-bracket"></i> Log out
                                </div>
                            </div>
                        }
                    </div>
                </div>
            </div>

            <Chat></Chat>

             <ScaleLoader color="#fff" loading={loading}>
            </ScaleLoader>


            <div className="chatInput">
                <div className="inputBox">
                    <input placeholder={recording ? "Listening..." : transcribing ? "Transcribing..." : "Ask anything"}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter'? getReply() : ''}
                        disabled={transcribing}
                    >

                    </input>
                    <button
                        className={`micBtn ${recording ? "recording" : ""}`}
                        onClick={handleMicClick}
                        title={recording ? "Stop recording" : "Record voice message"}
                        disabled={transcribing}
                    >
                        <i className={`fa-solid ${recording ? "fa-stop" : "fa-microphone"}`}></i>
                    </button>
                    <div id="submit" onClick={getReply}><i className="fa-solid fa-paper-plane"></i></div>
                </div>
                {voiceError && <p className="voiceStatus">{voiceError}</p>}
                <p className="info">
                    GPT can make mistakes. Check important info. See Cookie Preferences.
                </p>
            </div>
        </div>
    )
}

export default ChatWindow;
