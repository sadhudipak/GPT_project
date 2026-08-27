import "./Sidebar.css";
import { useContext, useEffect, useState, useRef } from "react";
import { MyContext } from "../MyContext.jsx";
import { v1 as uuidv1 } from "uuid";
import { apiFetch } from "../utils/api.js";
import { useAuth } from "../context/AuthContext.jsx";

function Sidebar() {
    const { allThreads, setAllThreads, currThreadId, setNewChat, setPrompt, setReply, setCurrThreadId, setPrevChats } = useContext(MyContext);
    const { user } = useAuth();

    const [openMenuId, setOpenMenuId] = useState(null);
    const [renamingId, setRenamingId] = useState(null);
    const [renameValue, setRenameValue] = useState("");
    const menuRef = useRef(null);

    const getAllThreads = async () => {
        try {
            const response = await apiFetch("/api/thread");
            const res = await response.json();

            const filteredData = res
                .map(thread => ({
                    threadId: thread.threadId,
                    title: thread.title,
                    updatedAt: thread.updatedAt
                }))
                .sort((a, b) => {
                    return new Date(b.updatedAt) - new Date(a.updatedAt);
                });

            setAllThreads(filteredData);

        } catch (err) {
            console.log(err);
        }
    }
    useEffect(() => {
        getAllThreads();
    }, [currThreadId])

    // close the per-thread options menu when clicking elsewhere
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const createNewChat = () => {
        setNewChat(true);
        setPrompt("");
        setReply(null);
        setCurrThreadId(uuidv1());
        setPrevChats([]);
    }

    const changeThread = async (newThreadId) => {
        setCurrThreadId(newThreadId);

        try {
            const response = await apiFetch(`/api/thread/${newThreadId}`);
            const res = await response.json();
            console.log(res);
            setPrevChats(res);
            setNewChat(false);
            setReply(null);
        } catch (err) {
            console.log(err);
        }
    }

    const deleteThread = async (threadId) => {
        setOpenMenuId(null);
        try {
            const response = await apiFetch(`/api/thread/${threadId}`, { method: "DELETE" });
            const res = await response.json();
            console.log(res);

            //updated threads re-render
            setAllThreads(prev => prev.filter(thread => thread.threadId !== threadId));

            if (threadId === currThreadId) {
                createNewChat();
            }

        } catch (err) {
            console.log(err);
        }
    }

    const startRename = (thread) => {
        setOpenMenuId(null);
        setRenamingId(thread.threadId);
        setRenameValue(thread.title);
    }

    const submitRename = async (threadId) => {
        const title = renameValue.trim();
        setRenamingId(null);

        if (!title) return;

        try {
            const response = await apiFetch(`/api/thread/${threadId}`, {
                method: "PATCH",
                body: JSON.stringify({ title })
            });
            const res = await response.json();
            if (!response.ok) throw new Error(res.error);

            setAllThreads(prev => prev.map(t => t.threadId === threadId ? { ...t, title } : t));
        } catch (err) {
            console.log(err);
        }
    }

    return (
        <section className="sidebar">
            <button onClick={createNewChat}>
                <img src="/src/assets/blacklogo.png" alt="gpt logo" className="logo"></img>
                <span><i className="fa-solid fa-pen-to-square"></i></span>
            </button>


            <ul className="history">
                {
                    allThreads?.map((thread, idx) => (
                        <li key={idx}
                            onClick={(e) => renamingId !== thread.threadId && changeThread(thread.threadId)}
                            className={thread.threadId === currThreadId ? "highlighted" : " "}
                        >
                            {
                                renamingId === thread.threadId ? (
                                    <span className="threadTitle" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            autoFocus
                                            value={renameValue}
                                            onChange={(e) => setRenameValue(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") submitRename(thread.threadId);
                                                if (e.key === "Escape") setRenamingId(null);
                                            }}
                                            onBlur={() => submitRename(thread.threadId)}
                                        />
                                    </span>
                                ) : (
                                    <span className="threadTitle">{thread.title}</span>
                                )
                            }

                            <i className="fa-solid fa-ellipsis-vertical"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(openMenuId === thread.threadId ? null : thread.threadId);
                                }}
                            ></i>

                            {
                                openMenuId === thread.threadId &&
                                <div className="threadOptions" ref={menuRef} onClick={(e) => e.stopPropagation()}>
                                    <div className="threadOptionItem" onClick={() => startRename(thread)}>
                                        <i className="fa-solid fa-pen"></i> Rename
                                    </div>
                                    <div className="threadOptionItem danger" onClick={() => deleteThread(thread.threadId)}>
                                        <i className="fa-solid fa-trash"></i> Delete
                                    </div>
                                </div>
                            }
                        </li>
                    ))
                }
            </ul>

            <div className="sign">
                {user && <p style={{ marginBottom: "0.3rem" }}>{user.name}</p>}
            </div>
        </section>
    )
}

export default Sidebar;
