# 🏠 **Local Development Setup**

## 🚀 **Quick Start**

### **Step 1: Install Dependencies**
```bash
npm run install-all
```

### **Step 2: Set Up Database**
1. Install MongoDB locally or use MongoDB Compass
2. Create database: `roommate-expense-splitter`
3. Update `backend/config.env` with your MongoDB connection

### **Step 3: Run the Application**
```bash
npm run dev
```

This will start:
- **Backend:** http://localhost:5000
- **Frontend:** http://localhost:3000

---

## 📁 **Project Structure**

```
roommate-expense-splitter/
├── 📁 backend/                    # Backend API
│   ├── 📁 models/                 # Database models
│   ├── 📁 routes/                 # API routes
│   ├── 📁 middleware/             # Custom middleware
│   ├── server.js                  # Express server
│   ├── config.env                 # Environment config
│   ├── package.json               # Backend dependencies
│   └── package-lock.json          # Dependency lock
│
├── 📁 frontend/                   # React frontend
│   ├── 📁 public/                 # Static files
│   ├── 📁 src/                    # Source code
│   │   ├── 📁 components/         # React components
│   │   ├── 📁 context/            # React context
│   │   ├── App.js                 # Main app
│   │   ├── index.js               # Entry point
│   │   └── index.css              # Global styles
│   ├── tailwind.config.js         # Tailwind config
│   ├── package.json               # Frontend dependencies
│   └── package-lock.json          # Dependency lock
│
├── 📄 .gitignore                  # Git ignore rules
├── 📄 README.md                   # Project documentation
├── 📄 package.json                # Root configuration
└── 📄 package-lock.json           # Root dependencies
```

---

## 🛠️ **Available Scripts**

### **Development:**
- `npm run dev` - Start both frontend and backend
- `npm run server` - Start only backend
- `npm run client` - Start only frontend

### **Installation:**
- `npm run install-all` - Install all dependencies

### **Build:**
- `npm run build` - Build frontend for production

---

## 🗄️ **Database Setup**

### **Option 1: Local MongoDB**
1. Install MongoDB locally
2. Start MongoDB service
3. Update `backend/config.env`:
```env
MONGODB_URI=mongodb://localhost:27017/roommate-expense-splitter
```

### **Option 2: MongoDB Compass**
1. Install MongoDB Compass
2. Connect to local MongoDB
3. Create database: `roommate-expense-splitter`

---

## 🎯 **Features**

- ✅ User registration/login
- ✅ Group creation/joining
- ✅ Expense tracking
- ✅ Balance calculations
- ✅ Real-time updates
- ✅ Mobile responsive

---

## 🚀 **Ready to Use!**

Your Roommate Expense Splitter is now ready for local development!

**Total Files: 22 essential files**
**Status: Local development ready! 🎯** 