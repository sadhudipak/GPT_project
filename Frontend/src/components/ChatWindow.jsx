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
  const {
    prompt,
    setPrompt,
    reply,
    setReply,
    currThreadId,
    setPrevChats,
    setNewChat,
    selectedModel,
    setSelectedModel,
  } = useContext(MyContext);

  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [models, setModels] = useState([]);
  const [recording, setRecording] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const [voiceLanguage, setVoiceLanguage] = useState("en-IN");
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const recognitionRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const profileRef = useRef(null);
  const modelRef = useRef(null);
  const languageRef = useRef(null);
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  const speechSupported = Boolean(SpeechRecognition);

  const VOICE_LANGUAGES = [
    {
      code: "en-IN",
      name: "English",
      region: "India",
      flag: "🇮🇳",
    },

    {
      code: "gu-IN",
      name: "Gujarati",
      region: "India",
      flag: "🇮🇳",
    },

    {
      code: "hi-IN",
      name: "Hindi",
      region: "India",
      flag: "🇮🇳",
    },

    {
      code: "en-US",
      name: "English",
      region: "United States",
      flag: "🇺🇸",
    },

    {
      code: "en-GB",
      name: "English",
      region: "United Kingdom",
      flag: "🇬🇧",
    },
  ];
  const selectedVoiceLanguage =
    VOICE_LANGUAGES.find((language) => language.code === voiceLanguage) ||
    VOICE_LANGUAGES[0];

  const getReply = async () => {
    const message = prompt.trim();
    // Empty message check
    if (!message) return;
    // Prevent multiple requests
    if (loading) return;
    setLoading(true);
    setNewChat(false);

    const options = {
      method: "POST",
      body: JSON.stringify({
        message: message,
        threadId: currThreadId,
      }),
    };

    try {
      const response = await apiFetch("/api/chat", options);
      const res = await response.json();
      if (!response.ok) {
        throw new Error(res.error || "Failed to get a reply");
      }
      setPrevChats((prevChats) => [
        ...prevChats,
        {
          role: "user",
          content: message,
        },
        {
          role: "assistant",
          content: res.reply,
        },
      ]);
      // Set reply for Chat component
      setReply(res.reply);
      // Clear input ONLY after
      // successful response
      setPrompt("");
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const res = await apiFetch("/api/options");
        const data = await res.json();
        setModels(data.models || []);
      } catch (err) {
        console.error("Failed to load options:", err);
      }
    };
    loadOptions();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      // Profile dropdown
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsOpen(false);
      }
      // Model dropdown
      if (modelRef.current && !modelRef.current.contains(e.target)) {
        setIsModelOpen(false);
      }
      // Language dropdown
      if (languageRef.current && !languageRef.current.contains(e.target)) {
        setIsLanguageOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    };
  }, []);

  const handleProfileClick = () => {
    setIsOpen((prev) => !prev);
    setIsModelOpen(false);
    setIsLanguageOpen(false);
  };

  const handleModelClick = () => {
    setIsModelOpen((prev) => !prev);
    setIsOpen(false);
    setIsLanguageOpen(false);
  };
  const handleLogout = async () => {
    setIsOpen(false);
    try {
      await logout();
      navigate("/login", {
        replace: true,
      });
    } catch (err) {
      console.error("Logout error:", err);
    }
  };
  const stopRecordingTimer = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };
  const formatRecordingTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${remainingSeconds}`;
  };

  const handleLanguageChange = (languageCode) => {
    // Stop current recording
    // before changing language
    if (recording) {
      stopRecording();
    }
    setVoiceLanguage(languageCode);
    setVoiceError("");
    setIsLanguageOpen(false);
  };

  const startRecording = () => {
    setVoiceError("");
    // Browser support check
    if (!speechSupported) {
      setVoiceError(
        "Voice input is not supported in this browser. Please use Google Chrome or Microsoft Edge.",
      );
      return;
    }
    // Don't start twice
    if (recording) {
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      // Continuous listening
      recognition.continuous = true;
      // Show partial results
      recognition.interimResults = true;
      // Selected language
      recognition.lang = voiceLanguage;
      recognition.onstart = () => {
        setRecording(true);
        setVoiceError("");
        setRecordingTime(0);
        // Start timer
        recordingTimerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      };

      recognition.onresult = (event) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
        }
        // Add final text
        // to input box
        if (finalTranscript.trim()) {
          setPrompt((prev) => {
            const text = finalTranscript.trim();
            if (!prev.trim()) {
              return text;
            }
            return `${prev} ${text}`;
          });
        }
      };
      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setRecording(false);
        stopRecordingTimer();
        if (event.error === "not-allowed") {
          setVoiceError(
            "Microphone permission was denied. Please allow microphone access.",
          );
        } else if (event.error === "no-speech") {
          setVoiceError("No speech was detected. Please try again.");
        } else if (event.error === "audio-capture") {
          setVoiceError(
            "Microphone could not be accessed. Please check your microphone.",
          );
        } else if (event.error === "network") {
          setVoiceError("Speech recognition requires a network connection.");
        } else {
          setVoiceError(`Voice recognition failed: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setRecording(false);
        stopRecordingTimer();
        recognitionRef.current = null;
      };
      // Save recognition instance
      recognitionRef.current = recognition;
      // Start recognition
      recognition.start();
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      setRecording(false);
      stopRecordingTimer();
      setVoiceError("Unable to start voice recognition. Please try again.");
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error("Stop recognition error:", error);
      }
      recognitionRef.current = null;
    }
    stopRecordingTimer();
    setRecording(false);
  };

  const handleMicClick = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="chatWindow">
      <div className="navbar">
        {/* MODEL SELECTOR */}
        <div
          className="modelSelector"
          ref={modelRef}
          onClick={handleModelClick}
        >
          <span>
            {selectedModel?.name || "GPT"}{" "}
            <i className="fa-solid fa-chevron-down"></i>
          </span>

          {isModelOpen && (
            <div className="dropDown modelDropDown">
              {models.map((model) => (
                <div
                  key={model.id}
                  className={`dropDownItem ${
                    selectedModel?.id === model.id ? "active" : ""
                  }`}
                  onClick={() => {
                    setSelectedModel(model);

                    setIsModelOpen(false);
                  }}
                >
                  {model.name}
                </div>
              ))}
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <button
            className="themeToggle"
            onClick={toggleTheme}
            title="Toggle theme"
            type="button"
          >
            <i
              className={`fa-solid ${theme === "dark" ? "fa-sun" : "fa-moon"}`}
            ></i>
          </button>

          <div className="userIconDiv" ref={profileRef}>
            <span className="userIcon" onClick={handleProfileClick}>
              <i className="fa-solid fa-user"></i>
            </span>
            {isOpen && (
              <div className="dropDown">
                <div className="dropDownItem">
                  <i className="fa-solid fa-gear"></i> Settings
                </div>

                <div className="dropDownItem">
                  <i className="fa-solid fa-cloud-arrow-up"></i> Upgrade plan
                </div>

                <div className="dropDownItem danger" onClick={handleLogout}>
                  <i className="fa-solid fa-arrow-right-from-bracket"></i> Log
                  out
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Chat />
      
      <ScaleLoader
        color={theme === "dark" ? "#ffffff" : "#171717"}
        loading={loading}
      />
      <div className="chatInput">
        <div className="voiceControls">
          <div className="languageSelector" ref={languageRef}>
            <button
              type="button"
              className="languageButton"
              onClick={() => setIsLanguageOpen((prev) => !prev)}
            >
              <span className="languageButtonLeft">
                <i className="fa-solid fa-language"></i>
                <span>{selectedVoiceLanguage.name}</span>
                <small>({selectedVoiceLanguage.region})</small>
              </span>
              <i
                className={`fa-solid ${
                  isLanguageOpen ? "fa-chevron-up" : "fa-chevron-down"
                }`}
              ></i>
            </button>
            {/* LANGUAGE DROPDOWN */}
            {isLanguageOpen && (
              <div className="languageDropdown">
                <div className="languageDropdownHeader">Voice language</div>
                {VOICE_LANGUAGES.map((language) => (
                  <button
                    type="button"
                    key={language.code}
                    className={`languageOption ${
                      voiceLanguage === language.code ? "selected" : ""
                    }`}
                    onClick={() => {
                      handleLanguageChange(language.code);
                    }}
                  >
                    <span className="languageFlag">{language.flag}</span>
                    <span className="languageInfo">
                      <strong>{language.name}</strong>
                      <small>{language.region}</small>
                    </span>
                    {voiceLanguage === language.code && (
                      <i className="fa-solid fa-check"></i>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {recording && (
          <div className="recordingStatus">
            <span className="recordingIndicator">
              <span></span>
            </span>
            <span className="recordingText">
              Listening in {selectedVoiceLanguage.name}
            </span>
            <span className="recordingTimer">
              {formatRecordingTime(recordingTime)}
            </span>
            <button type="button" onClick={stopRecording}>
              Stop
            </button>
          </div>
        )}
        <div className="inputBox">
          <input
            type="text"
            placeholder={recording ? "Listening..." : "Ask anything"}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                getReply();
              }
            }}
            disabled={loading}
          />
          <button
            type="button"
            className={`micBtn ${recording ? "recording" : ""}`}
            onClick={handleMicClick}
            disabled={loading}
            title={
              recording
                ? "Stop listening"
                : `Voice input - ${selectedVoiceLanguage.name}`
            }
          >
            <i
              className={`fa-solid ${recording ? "fa-stop" : "fa-microphone"}`}
            ></i>
          </button>
          <button
            type="button"
            id="submit"
            onClick={getReply}
            disabled={loading || !prompt.trim()}
            title="Send message"
          >
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
        {voiceError && (
          <div className="voiceStatus">
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>{voiceError}</span>
            <button type="button" onClick={() => setVoiceError("")}>
              ×
            </button>
          </div>
        )}
       <p className="info">
          GPT can make mistakes. Check important info. See Cookie Preferences.
        </p>
      </div>
    </div>
  );
}
export default ChatWindow;
