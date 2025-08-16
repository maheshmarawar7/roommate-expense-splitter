#!/bin/bash

echo "🚀 Roommate Expense Splitter - Deployment Script"
echo "================================================"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit for deployment"
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found!"
    echo "📝 Creating .env template..."
    cat > .env << EOF
# MongoDB Atlas Connection String
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/roommate-expense-splitter?retryWrites=true&w=majority

# JWT Secret Key
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Environment
NODE_ENV=production
EOF
    echo "✅ .env template created"
    echo "⚠️  Please update .env with your actual MongoDB Atlas connection string!"
else
    echo "✅ .env file exists"
fi

echo ""
echo "📋 Next Steps:"
echo "=============="
echo "1. 🗄️  Set up MongoDB Atlas (see DEPLOYMENT_GUIDE.md)"
echo "2. 🔧 Update .env with your MongoDB connection string"
echo "3. 📤 Push to GitHub:"
echo "   git remote add origin https://github.com/yourusername/roommate-expense-splitter.git"
echo "   git push -u origin main"
echo "4. 🚀 Deploy on Vercel (see DEPLOYMENT_GUIDE.md)"
echo ""
echo "📖 Read DEPLOYMENT_GUIDE.md for detailed instructions"
echo "🎉 Good luck with your deployment!" 