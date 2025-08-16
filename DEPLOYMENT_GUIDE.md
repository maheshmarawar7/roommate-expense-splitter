# 🚀 **Deploy to Vercel - Free Hosting Guide**

## 📋 **Prerequisites**

1. **GitHub Account** - Free
2. **Vercel Account** - Free (sign up at vercel.com)
3. **MongoDB Atlas** - Free cloud database

---

## 🗄️ **Step 1: Set Up MongoDB Atlas (Free Database)**

### 1.1 Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Click "Try Free" and create account
3. Choose "Free" tier (M0)

### 1.2 Create Database Cluster
1. Click "Build a Database"
2. Choose "FREE" tier
3. Select cloud provider (AWS/Google Cloud/Azure)
4. Choose region closest to you
5. Click "Create"

### 1.3 Set Up Database Access
1. Go to "Database Access" → "Add New Database User"
2. Username: `roommate-app`
3. Password: Create a strong password
4. Role: "Read and write to any database"
5. Click "Add User"

### 1.4 Set Up Network Access
1. Go to "Network Access" → "Add IP Address"
2. Click "Allow Access from Anywhere" (0.0.0.0/0)
3. Click "Confirm"

### 1.5 Get Connection String
1. Go to "Database" → "Connect"
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database password
5. Replace `<dbname>` with `roommate-expense-splitter`

**Example:**
```
mongodb+srv://roommate-app:yourpassword@cluster0.xxxxx.mongodb.net/roommate-expense-splitter?retryWrites=true&w=majority
```

---

## 🔧 **Step 2: Prepare Your Project**

### 2.1 Update Environment Variables
Create a `.env` file in the root directory:

```env
MONGODB_URI=mongodb+srv://roommate-app:yourpassword@cluster0.xxxxx.mongodb.net/roommate-expense-splitter?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=production
```

### 2.2 Update Frontend API URL
In `frontend/src/context/AuthContext.js`, update the API base URL:

```javascript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-project-name.vercel.app/api'
  : 'http://localhost:5000/api';
```

---

## 📤 **Step 3: Deploy to Vercel**

### 3.1 Push to GitHub
1. Create a new repository on GitHub
2. Push your code:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/roommate-expense-splitter.git
git push -u origin main
```

### 3.2 Deploy on Vercel
1. Go to [Vercel](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset:** Other
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `frontend/build`
   - **Install Command:** `npm run install-all`

### 3.3 Set Environment Variables in Vercel
1. Go to your project settings
2. Click "Environment Variables"
3. Add these variables:
   - `MONGODB_URI` = Your MongoDB Atlas connection string
   - `JWT_SECRET` = Your secret key
   - `NODE_ENV` = production

### 3.4 Deploy
1. Click "Deploy"
2. Wait for build to complete
3. Your app will be live at: `https://your-project-name.vercel.app`

---

## 🔄 **Step 4: Update Frontend API URL**

After deployment, update the API URL in your frontend:

1. Go to your Vercel project dashboard
2. Copy your deployment URL
3. Update `frontend/src/context/AuthContext.js`:

```javascript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-actual-project-name.vercel.app/api'
  : 'http://localhost:5000/api';
```

4. Commit and push changes
5. Vercel will auto-deploy the updates

---

## 🎯 **Step 5: Test Your Deployment**

### 5.1 Test API Endpoints
Visit: `https://your-project.vercel.app/api/health`
Should return: `{"status":"OK","message":"Server is running"}`

### 5.2 Test Frontend
Visit: `https://your-project.vercel.app`
Should show your React app

### 5.3 Test Full Functionality
1. Register a new user
2. Create a group
3. Add expenses
4. Check if everything works

---

## 🛠️ **Troubleshooting**

### Common Issues:

1. **Build Fails**
   - Check if all dependencies are in package.json
   - Ensure build script exists in frontend/package.json

2. **API Not Working**
   - Verify MongoDB Atlas connection string
   - Check environment variables in Vercel
   - Ensure CORS is properly configured

3. **Frontend Can't Connect to Backend**
   - Update API_BASE_URL with correct Vercel URL
   - Check if backend routes are working

4. **Database Connection Issues**
   - Verify MongoDB Atlas network access
   - Check database user credentials
   - Ensure connection string is correct

---

## 💰 **Free Tier Limits**

### Vercel Free Tier:
- ✅ 100GB bandwidth/month
- ✅ 100GB storage
- ✅ 100GB function execution time
- ✅ Custom domains
- ✅ Automatic deployments

### MongoDB Atlas Free Tier:
- ✅ 512MB storage
- ✅ Shared clusters
- ✅ 500 connections
- ✅ Perfect for small apps

---

## 🎉 **Success!**

Your Roommate Expense Splitter is now live at:
`https://your-project-name.vercel.app`

### Features Available:
- ✅ User registration/login
- ✅ Group creation/joining
- ✅ Expense tracking
- ✅ Balance calculations
- ✅ Real-time updates
- ✅ Mobile responsive

### Next Steps:
1. Share your app with roommates
2. Add custom domain (optional)
3. Monitor usage in Vercel dashboard
4. Set up automatic backups

---

## 📞 **Need Help?**

- **Vercel Docs:** https://vercel.com/docs
- **MongoDB Atlas Docs:** https://docs.atlas.mongodb.com
- **GitHub Issues:** Create issue in your repo

**Your app is now live and ready to use! 🚀** 