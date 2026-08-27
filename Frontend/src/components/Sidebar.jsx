import "./Sidebar.css";
import { useContext, useEffect, useState, useRef } from "react";
import { MyContext } from "../MyContext.jsx";
import { v1 as uuidv1 } from "uuid";
import { apiFetch } from "../utils/api.js";
import { useAuth } from "../context/AuthContext.jsx";

function Sidebar() {
  const {
    allThreads,
    setAllThreads,
    currThreadId,
    setNewChat,
    setPrompt,
    setReply,
    setCurrThreadId,
    setPrevChats,
  } = useContext(MyContext);

  const { user } = useAuth();

  const [openMenuId, setOpenMenuId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  const menuRef = useRef(null);

  const getAllThreads = async () => {
    try {
      const response = await apiFetch("/api/thread");
      const res = await response.json();

      if (!response.ok) {
        throw new Error(res.error || "Failed to fetch threads");
      }

      const filteredData = res
        .map((thread) => ({
          threadId: thread.threadId,
          title: thread.title,
          updatedAt: thread.updatedAt,
        }))
        .sort(
          (a, b) =>
            new Date(b.updatedAt) -
            new Date(a.updatedAt)
        );

      setAllThreads(filteredData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    getAllThreads();
  }, [currThreadId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const createNewChat = () => {
    setOpenMenuId(null);
    setRenamingId(null);
    setPrompt("");
    setReply(null);
    setNewChat(true);
    setCurrThreadId(uuidv1());
    setPrevChats([]);
  };

  const changeThread = async (threadId) => {
    setOpenMenuId(null);
    setRenamingId(null);
    setCurrThreadId(threadId);

    try {
      const response = await apiFetch(
        `/api/thread/${threadId}`
      );

      const res = await response.json();

      if (!response.ok) {
        throw new Error(
          res.error || "Failed to load thread"
        );
      }

      setPrevChats(res);
      setNewChat(false);
      setReply(null);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteThread = async (threadId) => {
    setOpenMenuId(null);

    try {
      const response = await apiFetch(
        `/api/thread/${threadId}`,
        {
          method: "DELETE",
        }
      );

      const res = await response.json();

      if (!response.ok) {
        throw new Error(
          res.error || "Failed to delete thread"
        );
      }

      setAllThreads((prev) =>
        prev.filter(
          (thread) =>
            thread.threadId !== threadId
        )
      );

      if (threadId === currThreadId) {
        createNewChat();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startRename = (thread) => {
    setOpenMenuId(null);
    setRenamingId(thread.threadId);
    setRenameValue(thread.title || "");
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameValue("");
  };

  const submitRename = async (threadId) => {
    const title = renameValue.trim();

    if (!title) {
      cancelRename();
      return;
    }

    try {
      const response = await apiFetch(
        `/api/thread/${threadId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ title }),
        }
      );

      const res = await response.json();

      if (!response.ok) {
        throw new Error(
          res.error || "Failed to rename thread"
        );
      }

      setAllThreads((prev) =>
        prev.map((thread) =>
          thread.threadId === threadId
            ? { ...thread, title }
            : thread
        )
      );

      cancelRename();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <section className="sidebar">
      <button
        className="newChatButton"
        onClick={createNewChat}
        type="button"
      >
        <img
          src="/src/assets/blacklogo.png"
          alt="GPT logo"
          className="logo"
        />

        <span>
          <i className="fa-solid fa-pen-to-square"></i>
        </span>
      </button>

      <ul className="history">
        {allThreads?.map((thread) => (
          <li
            key={thread.threadId}
            className={
              thread.threadId === currThreadId
                ? "highlighted"
                : ""
            }
            onClick={() => {
              if (
                renamingId !== thread.threadId
              ) {
                changeThread(
                  thread.threadId
                );
              }
            }}
          >
            {renamingId === thread.threadId ? (
              <div
                className="renameContainer"
                onClick={(e) =>
                  e.stopPropagation()
                }
              >
                <input
                  className="renameInput"
                  autoFocus
                  value={renameValue}
                  onChange={(e) =>
                    setRenameValue(
                      e.target.value
                    )
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      submitRename(
                        thread.threadId
                      );
                    }

                    if (e.key === "Escape") {
                      e.preventDefault();
                      cancelRename();
                    }
                  }}
                  onBlur={() =>
                    submitRename(
                      thread.threadId
                    )
                  }
                />
              </div>
            ) : (
              <span className="threadTitle">
                {thread.title || "New Chat"}
              </span>
            )}

            <button
              type="button"
              className="threadMenuButton"
              onClick={(e) => {
                e.stopPropagation();

                setOpenMenuId((prev) =>
                  prev === thread.threadId
                    ? null
                    : thread.threadId
                );
              }}
            >
              <i className="fa-solid fa-ellipsis-vertical"></i>
            </button>

            {openMenuId === thread.threadId && (
              <div
                className="threadOptions"
                ref={menuRef}
                onClick={(e) =>
                  e.stopPropagation()
                }
              >
                <button
                  type="button"
                  className="threadOptionItem"
                  onClick={() =>
                    startRename(thread)
                  }
                >
                  <i className="fa-solid fa-pen"></i>
                  <span>Rename</span>
                </button>

                <button
                  type="button"
                  className="threadOptionItem danger"
                  onClick={() =>
                    deleteThread(
                      thread.threadId
                    )
                  }
                >
                  <i className="fa-solid fa-trash"></i>
                  <span>Delete</span>
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="sign">
        {user && <p>{user.name}</p>}
      </div>
    </section>
  );
}

export default Sidebar;