@echo off
echo 🚀 Roommate Expense Splitter - Deployment Script
echo ================================================

REM Check if git is initialized
if not exist ".git" (
    echo 📁 Initializing Git repository...
    git init
    git add .
    git commit -m "Initial commit for deployment"
    echo ✅ Git repository initialized
) else (
    echo ✅ Git repository already exists
)

REM Check if .env file exists
if not exist ".env" (
    echo ⚠️  .env file not found!
    echo 📝 Creating .env template...
    (
        echo # MongoDB Atlas Connection String
        echo MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/roommate-expense-splitter?retryWrites=true^&w=majority
        echo.
        echo # JWT Secret Key
        echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
        echo.
        echo # Environment
        echo NODE_ENV=production
    ) > .env
    echo ✅ .env template created
    echo ⚠️  Please update .env with your actual MongoDB Atlas connection string!
) else (
    echo ✅ .env file exists
)

echo.
echo 📋 Next Steps:
echo ==============
echo 1. 🗄️  Set up MongoDB Atlas (see DEPLOYMENT_GUIDE.md)
echo 2. 🔧 Update .env with your MongoDB connection string
echo 3. 📤 Push to GitHub:
echo    git remote add origin https://github.com/yourusername/roommate-expense-splitter.git
echo    git push -u origin main
echo 4. 🚀 Deploy on Vercel (see DEPLOYMENT_GUIDE.md)
echo.
echo 📖 Read DEPLOYMENT_GUIDE.md for detailed instructions
echo 🎉 Good luck with your deployment!
pause 