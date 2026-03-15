const router = require('express').Router();
const {
    getChannels, createChannel, deleteChannel, joinChannel,
    getMessages, sendMessage, deleteMessage,
    getAnnouncements, createAnnouncement, deleteAnnouncement,
    getWorkspaces, createWorkspace, joinWorkspace,
} = require('../controllers/communication.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Channels
router.get('/channels', authenticate, getChannels);
router.post('/channels', authenticate, createChannel);
router.delete('/channels/:id', authenticate, authorize('admin', 'pm'), deleteChannel);
router.post('/channels/:id/join', authenticate, joinChannel);

// Messages
router.get('/messages', authenticate, getMessages);
router.post('/messages', authenticate, sendMessage);
router.delete('/messages/:id', authenticate, deleteMessage);

// Announcements
router.get('/announcements', authenticate, getAnnouncements);
router.post('/announcements', authenticate, authorize('admin', 'pm'), createAnnouncement);
router.delete('/announcements/:id', authenticate, authorize('admin', 'pm'), deleteAnnouncement);

// Workspaces
router.get('/workspaces', authenticate, getWorkspaces);
router.post('/workspaces', authenticate, createWorkspace);
router.post('/workspaces/:id/join', authenticate, joinWorkspace);

module.exports = router;
