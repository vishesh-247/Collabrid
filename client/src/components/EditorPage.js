import React, { useEffect, useRef, useState } from "react";
import Client from "./Client";
import Editor from "./Editor";
import Chat from "./Chat";
import { initSocket } from "../Socket";
import { ACTIONS } from "../Actions";
import {
  useNavigate,
  useLocation,
  Navigate,
  useParams,
} from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";

// List of supported languages with display names
const LANGUAGES = [
  { value: "python3", label: "Python 3" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "nodejs", label: "JavaScript (Node.js)" },
  { value: "c", label: "C" },
  { value: "ruby", label: "Ruby" },
  { value: "go", label: "Go" },
  { value: "scala", label: "Scala" },
  { value: "bash", label: "Bash/Shell" },
  { value: "sql", label: "SQL" },
  { value: "pascal", label: "Pascal" },
  { value: "csharp", label: "C#" },
  { value: "php", label: "PHP" },
  { value: "swift", label: "Swift" },
  { value: "rust", label: "Rust" },
  { value: "r", label: "R" },
];

function EditorPage({ user, onLogout }) {
  const [clients, setClients] = useState([]);
  const [output, setOutput] = useState("");
  const [isCompileWindowOpen, setIsCompileWindowOpen] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("python3");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const codeRef = useRef(null);

  const Location = useLocation();
  const navigate = useNavigate();
  const { roomId } = useParams();

  const socketRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem("token");
        socketRef.current = await initSocket(token);

        const handleErrors = (err) => {
          console.log("Error", err);
          toast.error("Socket connection failed, Try again later");
          navigate("/");
        };

        socketRef.current.on("connect_error", handleErrors);
        socketRef.current.on("connect_failed", handleErrors);

        socketRef.current.emit(ACTIONS.JOIN, {
          roomId,
          username: user.username,
        });

        socketRef.current.on(
          ACTIONS.JOINED,
          ({ clients, username, socketId }) => {
            if (username !== user.username) {
              toast.success(`${username} joined the room.`);
            }
            setClients(clients);
            socketRef.current.emit(ACTIONS.SYNC_CODE, {
              code: codeRef.current,
              socketId,
            });
          }
        );

        socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
          toast.success(`${username} left the room`);
          setClients((prev) =>
            prev.filter((client) => client.socketId !== socketId)
          );
        });
      } catch (error) {
        console.error("Socket initialization error:", error);
        toast.error("Failed to connect to the room");
        navigate("/");
      }
    };

    init();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.off(ACTIONS.JOINED);
        socketRef.current.off(ACTIONS.DISCONNECTED);
        socketRef.current.off("chat-message");
        socketRef.current.off("user-typing");
      }
    };
  }, [roomId, navigate, user.username]);

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID copied to clipboard!");
    } catch (error) {
      console.log(error);
      toast.error("Unable to copy the room ID");
    }
  };

  const leaveRoom = async () => {
    navigate("/");
  };

  const handleLogout = () => {
    onLogout();
    toast.success("Logged out successfully");
  };

  const runCode = async () => {
    setIsCompiling(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post("http://localhost:5000/compile", {
        code: codeRef.current,
        language: selectedLanguage,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setOutput(response.data.output || JSON.stringify(response.data));
    } catch (error) {
      console.error("Error compiling code:", error);
      if (error.response?.status === 401) {
        handleLogout();
        toast.error('Session expired. Please login again.');
      } else {
        setOutput(error.response?.data?.error || "An error occurred while compiling your code");
      }
    } finally {
      setIsCompiling(false);
    }
  };

  const toggleCompileWindow = () => {
    setIsCompileWindowOpen(!isCompileWindowOpen);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <div 
      className="container-fluid vh-100 d-flex flex-column p-0"
      style={{
        background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        overflow: "hidden"
      }}
    >
      {/* Enhanced background elements */}
      <div className="position-absolute w-100 h-100" style={{
        background: "radial-gradient(circle at 20% 30%, rgba(79, 84, 205, 0.15) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(120, 119, 198, 0.1) 0%, transparent 40%)",
        zIndex: 0
      }}></div>
      
      <div className="row flex-grow-1 m-0 position-relative">
        {/* Client panel */}
        <div 
          className={`p-4 text-light d-flex flex-column ${isSidebarCollapsed ? 'col-md-1' : 'col-md-3'}`}
          style={{
            background: "rgba(0, 0, 0, 0.25)",
            backdropFilter: "blur(15px)",
            borderRight: "1px solid rgba(255, 255, 255, 0.1)",
            transition: "all 0.3s ease",
            zIndex: 10
          }}
        >
          {/* Collapse button */}
          <button 
            className="btn btn-sm btn-link text-light p-0 mb-4 align-self-start"
            onClick={toggleSidebar}
            style={{width: "30px"}}
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <i className={`fas fa-${isSidebarCollapsed ? 'chevron-right' : 'chevron-left'} fs-5`}></i>
          </button>

          {!isSidebarCollapsed && (
            <>
              {/* App title */}
              <div className="text-center mb-5">
                <h2 
                  className="fw-bold mb-2"
                  style={{
                    background: "linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 50%, #45b7d1 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    fontSize: "1.8rem"
                  }}
                >
                  Collabrid
                </h2>
                <p className="text-light opacity-75 small">Real-time Collaboration</p>
                <p className="text-light opacity-60 small">Welcome, {user.username}</p>
              </div>

              <hr className="my-4" style={{borderColor: "rgba(255,255,255,0.15)"}} />

              {/* Client list container */}
              <div className="d-flex flex-column flex-grow-1 overflow-auto mb-4">
                <h6 className="mb-3 text-uppercase opacity-75 small fw-bold d-flex align-items-center">
                  <i className="fas fa-users me-2"></i>
                  Collaborators ({clients.length})
                </h6>
                <div className="mb-4">
                  {clients.map((client) => (
                    <Client 
                      key={client.socketId} 
                      username={client.username} 
                      isSidebarCollapsed={isSidebarCollapsed}
                    />
                  ))}
                </div>
              </div>

              <hr className="my-4" style={{borderColor: "rgba(255,255,255,0.15)"}} />

              {/* Room ID */}
              <div className="mb-4">
                <h6 className="text-uppercase opacity-75 small fw-bold mb-3">Room ID</h6>
                <div 
                  className="p-3 rounded d-flex justify-content-between align-items-center"
                  style={{
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.1)"
                  }}
                >
                  <code className="text-truncate me-2">{roomId}</code>
                  <button 
                    className="btn btn-sm p-1"
                    onClick={copyRoomId}
                    title="Copy Room ID"
                    style={{
                      background: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px",
                      width: "32px",
                      height: "32px"
                    }}
                  >
                    <i className="fas fa-copy"></i>
                  </button>
                </div>
                <small className="text-light opacity-60 mt-2 d-block">
                  Share this ID to invite others
                </small>
              </div>

              {/* Buttons */}
              <div className="mt-auto">
                <button 
                  className="btn w-100 mb-3 py-2"
                  onClick={copyRoomId}
                  style={{
                    background: "linear-gradient(135deg, rgba(78, 205, 196, 0.9), rgba(69, 183, 209, 0.9))",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "0.95rem",
                    fontWeight: "500"
                  }}
                >
                  <i className="fas fa-copy me-2"></i>
                  Copy Room ID
                </button>
                <button 
                  className="btn w-100 py-2"
                  onClick={leaveRoom}
                  style={{
                    background: "linear-gradient(135deg, rgba(255, 107, 107, 0.9), rgba(255, 142, 142, 0.9))",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "0.95rem",
                    fontWeight: "500"
                  }}
                >
                  <i className="fas fa-sign-out-alt me-2"></i>
                  Leave Room
                </button>
              </div>
            </>
          )}

          {isSidebarCollapsed && (
            <div className="d-flex flex-column align-items-center justify-content-between h-100">
              <div className="text-center">
                <div className="mb-4">
                  <i className="fas fa-users fs-5"></i>
                  <small className="d-block text-center mt-1 fw-bold">{clients.length}</small>
                </div>
                
                <button 
                  className="btn p-2 mb-3"
                  onClick={copyRoomId}
                  title="Copy Room ID"
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    width: "40px",
                    height: "40px"
                  }}
                >
                  <i className="fas fa-copy"></i>
                </button>
              </div>
              
              <button 
                className="btn p-2"
                onClick={leaveRoom}
                title="Leave Room"
                style={{
                  background: "rgba(255, 107, 107, 0.2)",
                  borderRadius: "8px",
                  width: "40px",
                  height: "40px"
                }}
              >
                <i className="fas fa-sign-out-alt"></i>
              </button>
            </div>
          )}
        </div>

        {/* Editor panel */}
        <div className="col-md-9 text-light d-flex flex-column p-0 position-relative">
          {/* Language selector and controls */}
          <div 
            className="p-3 d-flex justify-content-between align-items-center"
            style={{
              background: "rgba(0, 0, 0, 0.2)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              zIndex: 5
            }}
          >
            <div className="d-flex align-items-center">
              <i className="fas fa-code me-2 opacity-75"></i>
              <select
                className="form-select form-select-sm"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "white",
                  width: "auto",
                  borderRadius: "8px",
                  padding: "0.5rem 1rem",
                  fontSize: "0.9rem",
                  fontWeight: "500"
                }}
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="d-flex align-items-center gap-2">
              <button
                className="btn btn-sm px-3 py-2 me-2"
                onClick={toggleCompileWindow}
                style={{
                  background: isCompileWindowOpen 
                    ? "rgba(255,255,255,0.15)" 
                    : "linear-gradient(135deg, rgba(78, 205, 196, 0.9), rgba(69, 183, 209, 0.9))",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  fontWeight: "500"
                }}
              >
                <i className={`fas fa-${isCompileWindowOpen ? 'times' : 'play'} me-2`}></i>
                {isCompileWindowOpen ? "Close Output" : "Run Code"}
              </button>

              <button
                className="btn btn-sm px-3 py-2"
                onClick={toggleChat}
                style={{
                  background: isChatOpen 
                    ? "rgba(255,255,255,0.15)" 
                    : "linear-gradient(135deg, rgba(120, 119, 198, 0.9), rgba(96, 92, 168, 0.9))",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  fontWeight: "500"
                }}
              >
                <i className={`fas fa-${isChatOpen ? 'times' : 'comments'} me-2`}></i>
                {isChatOpen ? "Close Chat" : "Open Chat"}
              </button>
            </div>
          </div>

          <Editor
            socketRef={socketRef}
            roomId={roomId}
            onCodeChange={(code) => {
              codeRef.current = code;
            }}
          />
        </div>
      </div>

      {/* Compiler section */}
      <div
        className={`text-light p-0 ${isCompileWindowOpen ? "d-block" : "d-none"}`}
        style={{
          position: "fixed",
          bottom: 0,
          left: isSidebarCollapsed ? "8%" : "25%",
          right: 0,
          height: isCompileWindowOpen ? "35vh" : "0",
          transition: "all 0.3s ease-in-out",
          overflow: "hidden",
          zIndex: 1040,
          background: "rgba(0, 0, 0, 0.85)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 -5px 20px rgba(0, 0, 0, 0.2)"
        }}
      >
        <div 
          className="p-3 d-flex justify-content-between align-items-center"
          style={{
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            background: "rgba(0,0,0,0.3)"
          }}
        >
          <h6 className="m-0 d-flex align-items-center">
            <i className="fas fa-terminal me-2"></i>
            Output - {LANGUAGES.find(lang => lang.value === selectedLanguage)?.label}
          </h6>
          <div className="d-flex">
            <button
              className="btn btn-sm me-2 px-3"
              onClick={runCode}
              disabled={isCompiling}
              style={{
                background: isCompiling 
                  ? "rgba(255,255,255,0.1)" 
                  : "linear-gradient(135deg, rgba(78, 205, 196, 0.9), rgba(69, 183, 209, 0.9))",
                border: "none",
                borderRadius: "6px",
                fontSize: "0.85rem"
              }}
            >
              {isCompiling ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Compiling...
                </>
              ) : (
                <>
                  <i className="fas fa-play me-2"></i>
                  Run Code
                </>
              )}
            </button>
            <button 
              className="btn btn-sm px-3"
              onClick={toggleCompileWindow}
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "none",
                borderRadius: "6px",
                fontSize: "0.85rem"
              }}
            >
              <i className="fas fa-times me-2"></i>
              Close
            </button>
          </div>
        </div>
        <pre 
          className="p-4 m-0 h-100"
          style={{
            overflow: "auto",
            background: "rgba(0,0,0,0.2)",
            color: "#fff",
            fontSize: "14px",
            fontFamily: "'Fira Code', 'Monaco', 'Cascadia Code', monospace",
            lineHeight: "1.5"
          }}
        >
          {output || "// Output will appear here after running your code\n// Select your language and click 'Run Code'"}
        </pre>
      </div>

      {/* Chat Component */}
      <Chat
        socketRef={socketRef}
        roomId={roomId}
        username={user.username}
        isChatOpen={isChatOpen}
        onToggleChat={toggleChat}
      />

      {/* Add Font Awesome for icons */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      
      {/* Add Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Fira+Code:wght@300;400;500&display=swap" rel="stylesheet" />
      
      <style>
        {`
          ::-webkit-scrollbar {
            width: 10px;
            height: 10px;
          }
          
          ::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 5px;
          }
          
          ::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.15);
            border-radius: 5px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.25);
          }
          
          .form-select:focus {
            background: rgba(255, 255, 255, 0.15) !important;
            color: white !important;
            border-color: rgba(255,255,255,0.3) !important;
            box-shadow: 0 0 0 0.2rem rgba(255, 255, 255, 0.1) !important;
          }
          
          pre {
            white-space: pre-wrap;
            word-break: break-word;
          }
        `}
      </style>
    </div>
  );
}

export default EditorPage;