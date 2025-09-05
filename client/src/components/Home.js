import React, { useState } from "react";
import { v4 as uuid } from "uuid";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

function Home({ user, onLogout }) {
  const [roomId, setRoomId] = useState("");
  const [isHovered, setIsHovered] = useState(false);

  const navigate = useNavigate();

  const generateRoomId = (e) => {
    e.preventDefault();
    const Id = uuid();
    setRoomId(Id);
    toast.success("Room ID generated successfully!");
  };

  const joinRoom = () => {
    if (!roomId) {
      toast.error("Room ID is required");
      return;
    }

    // redirect
    navigate(`/editor/${roomId}`, {
      state: {
        username: user.username,
      },
    });
    toast.success("Welcome to the room!");
  };

  // when enter then also join
  const handleInputEnter = (e) => {
    if (e.code === "Enter") {
      joinRoom();
    }
  };

  const handleLogout = () => {
    onLogout();
    toast.success("Logged out successfully");
  };

  return (
    <div 
      className="container-fluid min-vh-100 d-flex align-items-center justify-content-center py-5"
      style={{
        background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        overflow: "hidden",
        position: "relative"
      }}
    >
      {/* Enhanced background elements */}
      <div className="position-absolute w-100 h-100" style={{
        background: "radial-gradient(circle at 20% 30%, rgba(79, 84, 205, 0.2) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(120, 119, 198, 0.15) 0%, transparent 40%)",
        zIndex: 0
      }}></div>
      
      {/* Logout button */}
      <button 
        onClick={handleLogout}
        className="btn position-absolute top-0 end-0 m-3"
        style={{
          background: "rgba(255, 107, 107, 0.2)",
          border: "1px solid rgba(255, 107, 107, 0.3)",
          color: "white",
          borderRadius: "8px",
          zIndex: 20
        }}
      >
        <i className="fas fa-sign-out-alt me-2"></i>
        Logout
      </button>
      
      <div className="row justify-content-center align-items-center w-100">
        <div className="col-12 col-xl-5 col-lg-6 col-md-8">
          <div 
            className="card shadow-lg border-0 rounded-4 p-4 p-md-5"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              zIndex: 10,
              position: "relative"
            }}
          >
            <div className="card-body text-center text-white px-3 px-md-4">
              {/* User welcome */}
              <div className="mb-3">
                <p className="text-light opacity-75">
                  Welcome, <span className="text-warning fw-bold">{user.username}</span>
                </p>
              </div>
              
              {/* Premium App Title */}
              <div className="mb-5">
                <h1 
                  className="display-3 fw-bold mb-3"
                  style={{
                    background: "linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 50%, #45b7d1 100%)",
                    backgroundSize: "200% 200%",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    animation: "gradientShift 4s ease infinite",
                    letterSpacing: "-0.5px",
                    lineHeight: "1.1"
                  }}
                >
                  Collabrid
                </h1>
                
                <p className="fs-5 mb-0 text-light opacity-80" style={{ letterSpacing: "0.5px" }}>
                  Real-time Collaborative Code Editor
                </p>
              </div>
              
              {/* Form Container */}
              <div className="mb-5">
                {/* Room ID Input */}
                <div className="form-group mb-4">
                  <label className="form-label text-start w-100 mb-3 fs-6 text-uppercase opacity-75" style={{ letterSpacing: "1px" }}>
                    <i className="fas fa-door-open me-2"></i>
                    Room ID
                  </label>
                  <div className="input-group input-group-lg">
                    <input
                      type="text"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      className="form-control form-control-lg py-3"
                      placeholder="Enter your Room ID"
                      onKeyUp={handleInputEnter}
                      style={{
                        background: "rgba(255, 255, 255, 0.08)",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        color: "white",
                        fontSize: "1.1rem",
                        borderRadius: "12px",
                        paddingLeft: "20px"
                      }}
                    />
                    <button
                      onClick={generateRoomId}
                      className="btn ms-3 px-4"
                      style={{
                        background: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        borderRadius: "12px",
                        color: "white",
                        fontSize: "1.1rem"
                      }}
                      title="Generate new Room ID"
                    >
                      <i className="fas fa-wand-magic-sparkles me-2"></i>
                      New
                    </button>
                  </div>
                </div>
                
                {/* Join Button */}
                <button
                  onClick={joinRoom}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  className="btn btn-lg w-100 py-3 fw-bold mb-4"
                  style={{
                    background: isHovered 
                      ? "linear-gradient(135deg, #4ecdc4, #45b7d1)" 
                      : "linear-gradient(135deg, #ff6b6b, #ff8e8e)",
                    border: "none",
                    borderRadius: "14px",
                    transition: "all 0.3s ease",
                    transform: isHovered ? "translateY(-3px) scale(1.02)" : "none",
                    boxShadow: isHovered 
                      ? "0 15px 30px rgba(0, 0, 0, 0.25)" 
                      : "0 10px 20px rgba(0, 0, 0, 0.2)",
                    fontSize: "1.2rem",
                    letterSpacing: "0.5px"
                  }}
                >
                  JOIN COLLABORATION ROOM
                  <i className="fas fa-arrow-right ms-3"></i>
                </button>
              </div>
              
              {/* Footer */}
              <div className="mt-5 pt-4 border-top border-secondary">
                <p className="text-light opacity-75 mb-2 fs-6">
                  Start coding together in real-time
                </p>
                <p className="text-light opacity-60 small">
                  Share the Room ID with others to collaborate
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced floating elements */}
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="position-absolute rounded-circle" style={{
          width: `${20 + i * 15}px`,
          height: `${20 + i * 15}px`,
          background: `rgba(255, 255, 255, ${0.02 + i * 0.01})`,
          animation: `float ${6 + i * 2}s ease-in-out infinite`,
          top: `${10 + i * 15}%`,
          left: i % 2 === 0 ? `${5 + i * 5}%` : "auto",
          right: i % 2 !== 0 ? `${3 + i * 4}%` : "auto",
          filter: "blur(1px)"
        }}></div>
      ))}
      
      <style>
        {`
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          
          @keyframes float {
            0% { transform: translateY(0) rotate(0deg) scale(1); }
            33% { transform: translateY(-20px) rotate(5deg) scale(1.05); }
            66% { transform: translateY(10px) rotate(-5deg) scale(0.95); }
            100% { transform: translateY(0) rotate(0deg) scale(1); }
          }
          
          input::placeholder {
            color: rgba(255, 255, 255, 0.5) !important;
            font-weight: 300;
          }
          
          .form-control:focus {
            background: rgba(255, 255, 255, 0.12) !important;
            color: white !important;
            border-color: rgba(255, 255, 255, 0.3) !important;
            boxShadow: 0 0 0 0.3rem rgba(255, 255, 255, 0.1) !important;
          }
          
          .form-control {
            transition: all 0.3s ease;
          }
          
          .form-control:focus {
            transform: translateY(-2px);
          }
        `}
      </style>
      
      {/* Add Font Awesome for icons */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      
      {/* Add Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
    </div>
  );
}

export default Home;