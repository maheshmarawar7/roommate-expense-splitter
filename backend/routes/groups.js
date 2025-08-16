const express = require('express');
const { body, validationResult } = require('express-validator');
const Group = require('../models/Group');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/groups
// @desc    Create a new group
// @access  Private
router.post('/', [
  auth,
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Group name must be between 2 and 100 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name } = req.body;

    // Create new group
    const group = new Group({
      name,
      createdBy: req.user._id,
      members: [{ user: req.user._id }]
    });

    console.log('Group before save:', group);

    await group.save();

    console.log('Group after save:', group);

    // Add group to user's groups
    await User.findByIdAndUpdate(req.user._id, {
      $push: { groups: group._id }
    });

    // Populate group details
    await group.populate('members.user', 'name email');
    await group.populate('createdBy', 'name');

    res.status(201).json({
      message: 'Group created successfully',
      group
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ message: 'Server error creating group' });
  }
});

// @route   POST /api/groups/join
// @desc    Join a group using invite code
// @access  Private
router.post('/join', [
  auth,
  body('inviteCode').isLength({ min: 4, max: 8 }).withMessage('Invalid invite code')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { inviteCode } = req.body;

    // Find group by invite code
    const group = await Group.findOne({ inviteCode: inviteCode.toUpperCase() });
    if (!group) {
      return res.status(404).json({ message: 'Invalid invite code' });
    }

    // Check if user is already a member
    const isMember = group.members.find(member => 
      member.user.toString() === req.user._id.toString()
    );
    if (isMember) {
      return res.status(400).json({ message: 'You are already a member of this group' });
    }

    // Add user to group
    await group.addMember(req.user._id);

    // Add group to user's groups
    await User.findByIdAndUpdate(req.user._id, {
      $push: { groups: group._id }
    });

    // Populate group details
    await group.populate('members.user', 'name email');
    await group.populate('createdBy', 'name');

    res.json({
      message: 'Successfully joined group',
      group
    });
  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({ message: 'Server error joining group' });
  }
});

// @route   GET /api/groups
// @desc    Get all groups for current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'groups',
      populate: [
        { path: 'members.user', select: 'name email' },
        { path: 'createdBy', select: 'name' }
      ]
    });

    res.json(user.groups);
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ message: 'Server error getting groups' });
  }
});

// @route   GET /api/groups/:id
// @desc    Get group by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members.user', 'name email')
      .populate('createdBy', 'name');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is a member
    const isMember = group.members.find(member => 
      member.user._id.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied. Not a member of this group.' });
    }

    res.json(group);
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ message: 'Server error getting group' });
  }
});

// @route   DELETE /api/groups/:id
// @desc    Leave a group
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is a member
    const isMember = group.members.find(member => 
      member.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied. Not a member of this group.' });
    }

    // Remove user from group
    await group.removeMember(req.user._id);

    // Remove group from user's groups
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { groups: group._id }
    });

    res.json({ message: 'Successfully left group' });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({ message: 'Server error leaving group' });
  }
});

module.exports = router; 