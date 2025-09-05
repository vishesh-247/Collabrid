# ⚡ Collabrid - Real-time Collaborative Code Editor

    -Made by Vishesh Jain
    -SRM Institute of Science and Technology, Kattankulathur

> A powerful and modern real-time collaborative code editor with chat, authentication, and code execution support.

---

## ✨ Features

### 🚀 Core Functionality

- **Real-time Code Collaboration** – Multiple users can edit simultaneously
- **Language Support** – 16+ programming languages (Python, Java, JavaScript, C++, etc.)
- **Code Compilation** – Execute code directly within the editor via **JDoodle API**
- **Room-based System** – Create private rooms and share room IDs for collaboration

### 💬 Communication Features

- **Real-time Chat** – Communicate seamlessly within rooms
- **Join/Leave Notifications** – Get alerts when users enter/exit
- **User Presence** – View all active participants in real-time

### 🔐 Security & Authentication

- **JWT Authentication** – Secure login with JSON Web Tokens
- **Room Privacy** – Unique room IDs for private sessions
- **Password Hashing** – Encrypted credentials with **BCrypt**
- **Socket Authentication** – Secure WebSocket connections with token validation

### 🎨 User Experience

- **Modern UI** – Dark theme with gradient backgrounds
- **Responsive Design** – Works on both desktop & mobile
- **Syntax Highlighting** – Enhanced code readability
- **Auto-saving** – Real-time code sync across users
- **Export Capabilities** – Copy/share room IDs instantly

---

## 🛠️ Technology Stack

### Frontend

- React 18
- React Router
- Socket.IO Client
- Bootstrap 5
- React Hot Toast
- Font Awesome
- React Avatar
- UUID

### Backend

- Node.js
- Express.js
- Socket.IO
- MongoDB
- Mongoose
- JWT
- BCrypt.js
- Axios
- CORS

### External Services

- JDoodle API – Code compilation/execution
- MongoDB Atlas – Cloud-hosted DB (optional)

---

## 📦 Installation & Setup

### Prerequisites

- Node.js (**v16+**)
- MongoDB (**local** or Atlas)
- npm or yarn

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/collabrid.git
cd collabrid

2️⃣ Backend Setup
cd server
npm install

Update .env with your values:
PORT=5000
MONGODB_URI=mongodb://localhost:27017/collabrid
JWT_SECRET=your-super-secret-jwt-key


3️⃣ Frontend Setup
cd client
npm install

Update .env with your values:
REACT_APP_BACKEND_URL=http://localhost:5000


🚀 Usage

🔑 Authentication
-Register/login to access editor
-JWT tokens are securely stored

🏠 Creating a Room
-Click New Room → get unique Room ID
-Share Room ID with team


📝 Collaborating
-Join room with shared ID
-Code syncs in real-time
-Use chat for communication
-Choose language from dropdown

⚙️ Code Execution
-Write code → Click Run Code
-Output appears in bottom panel
-Supports 16+ languages

👥 Room Management
-Copy/share Room IDs
-Leave anytime
-Code auto-saves in real-time


collabrid/
├── client/                 # React frontend
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── Home.js
│   │   │   ├── EditorPage.js
│   │   │   ├── Editor.js
│   │   │   ├── Client.js
│   │   │   ├── Chat.js
│   │   │   └── Auth.js
│   │   ├── Actions.js      # Socket action constants
│   │   ├── Socket.js       # Socket setup
│   │   └── App.js
│   └── .env
    └── package.json
├── server/                 # Node.js backend
│   ├── models/
│   │   └── User.js
│   ├── db/                 # Database connection
│   ├── Actions.js          # Socket actions
│   ├── index.js            # Server entry
│   └── .env
|   └── package.json
|
└── README.md


💡 Acknowledgements

JDoodle
 for compilation API

Socket.IO
 for real-time collaboration

MongoDB
 for database
```

🚀 Happy Coding with Collabrid!
