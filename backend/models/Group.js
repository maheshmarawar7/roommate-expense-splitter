const mongoose = require('mongoose');
const crypto = require('crypto');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
    maxlength: [100, 'Group name cannot exceed 100 characters']
  },
  inviteCode: {
    type: String,
    unique: true,
    required: false, // Changed from true to false
    default: function() {
      return crypto.randomBytes(4).toString('hex').toUpperCase();
    }
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate unique invite code before saving
groupSchema.pre('save', function(next) {
  try {
    // Always generate inviteCode if it doesn't exist
    if (!this.inviteCode) {
      this.inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      console.log('Generated inviteCode:', this.inviteCode);
    }
    next();
  } catch (error) {
    console.error('Error generating inviteCode:', error);
    // Fallback: generate a simple random code
    this.inviteCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    next();
  }
});

// Method to add member to group
groupSchema.methods.addMember = function(userId) {
  if (!this.members.find(member => member.user.toString() === userId.toString())) {
    this.members.push({ user: userId });
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove member from group
groupSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(member => member.user.toString() !== userId.toString());
  return this.save();
};

module.exports = mongoose.model('Group', groupSchema); 