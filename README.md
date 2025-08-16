# Roommate Expense Splitter

A full-stack web application built with the MERN stack (MongoDB, Express.js, React, Node.js) that helps roommates split expenses fairly. The app features JWT authentication, group management, expense tracking, and automatic balance calculations.

## Features

- **User Authentication**: Secure JWT-based login/registration system
- **Group Management**: Create and join roommate groups with unique invite codes
- **Expense Tracking**: Add expenses with categories and automatic equal splitting
- **Balance Sheet**: Real-time calculation of who owes what to whom
- **Settlement Suggestions**: Smart recommendations for settling debts
- **Responsive Design**: Modern UI built with Tailwind CSS
- **Real-time Updates**: Instant balance updates when expenses are added/removed

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **dayjs** - Date handling

### Frontend
- **React** - UI library
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **Lucide React** - Icon library
- **dayjs** - Date formatting

## Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v14 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **npm** or **yarn**

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd roommate-expense-splitter
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   
   # Return to root
   cd ..
   ```

3. **Environment Setup**
   
   Create a `.env` file in the backend directory:
   ```bash
   cd backend
   cp config.env .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/roommate-expense-splitter
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   NODE_ENV=development
   ```

4. **Database Setup**
   
   Make sure MongoDB is running on your system:
   ```bash
   # Start MongoDB (if running locally)
   mongod
   
   # Or use MongoDB Atlas connection string in your .env file
   ```

## Running the Application

### Development Mode

1. **Start both backend and frontend simultaneously**
   ```bash
   npm run dev
   ```

2. **Or run them separately**
   ```bash
   # Terminal 1 - Backend
   npm run server
   
   # Terminal 2 - Frontend
   npm run client
   ```

### Production Mode

1. **Build the frontend**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Groups
- `POST /api/groups` - Create a new group
- `POST /api/groups/join` - Join group with invite code
- `GET /api/groups` - Get user's groups
- `GET /api/groups/:id` - Get specific group details
- `DELETE /api/groups/:id` - Leave a group

### Expenses
- `POST /api/expenses` - Add a new expense
- `GET /api/expenses/group/:groupId` - Get group expenses
- `GET /api/expenses/balances/:groupId` - Get balance sheet
- `DELETE /api/expenses/:id` - Delete an expense

## Usage Guide

### Getting Started

1. **Register/Login**: Create an account or sign in to an existing one
2. **Create a Group**: Start a new roommate group with a custom name
3. **Share Invite Code**: Share the generated invite code with your roommates
4. **Join Groups**: Use invite codes to join existing groups
5. **Add Expenses**: Record shared expenses with amounts, descriptions, and categories
6. **Track Balances**: View real-time balance sheets and settlement suggestions

### Adding Expenses

1. Navigate to your group
2. Click "Add Expense"
3. Fill in the expense details:
   - Amount
   - Description
   - Category (Food, Rent, Utilities, etc.)
   - Date
4. Submit to automatically split the expense equally among all members

### Understanding Balances

- **Positive Balance**: You are owed money by the group
- **Negative Balance**: You owe money to the group
- **Settlement Suggestions**: Optimal payment paths to settle all debts

## Project Structure

```
roommate-expense-splitter/
├── backend/                 # Backend server
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── server.js           # Main server file
│   └── package.json        # Backend dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── context/        # React context
│   │   ├── App.js          # Main app component
│   │   └── index.js        # Entry point
│   ├── public/             # Static files
│   └── package.json        # Frontend dependencies
├── package.json            # Root package.json
└── README.md               # This file
```

## Customization

### Adding New Categories

To add new expense categories, update the enum in `backend/models/Expense.js`:

```javascript
category: {
  type: String,
  required: [true, 'Category is required'],
  enum: ['Food', 'Rent', 'Utilities', 'Transport', 'Entertainment', 'Shopping', 'Other', 'YourNewCategory'],
  default: 'Other'
}
```

### Styling Changes

The app uses Tailwind CSS. Modify `frontend/tailwind.config.js` to customize colors, fonts, and other design tokens.

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Server-side validation for all inputs
- **CORS Protection**: Cross-origin request handling
- **Environment Variables**: Secure configuration management

## Performance Optimizations

- **Database Indexing**: Optimized MongoDB queries
- **Lazy Loading**: Components load only when needed
- **Efficient State Management**: Minimal re-renders with React hooks
- **Optimized API Calls**: Reduced unnecessary database queries

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env` file
   - Verify network access for remote databases

2. **Port Already in Use**
   - Change PORT in `.env` file
   - Kill processes using the port: `lsof -ti:5000 | xargs kill -9`

3. **Frontend Build Errors**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check Node.js version compatibility

4. **JWT Token Issues**
   - Clear browser localStorage
   - Check JWT_SECRET in backend `.env`

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` in your backend `.env` file.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section above
- Review the API documentation

## Future Enhancements

- [ ] PDF export functionality
- [ ] Monthly expense reports
- [ ] Split expenses unequally
- [ ] Push notifications
- [ ] Mobile app
- [ ] Multi-currency support
- [ ] Expense photos/receipts
- [ ] Recurring expenses
- [ ] Expense approval workflow
- [ ] Integration with payment platforms 