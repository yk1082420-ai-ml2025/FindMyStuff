const ContactRequest = require('../models/ContactRequest');
const Chat = require('../models/Chat');
const User = require('../models/User');

// @desc    Request to share contact details
// @route   POST /api/contact-requests
// @access  Private
exports.requestContact = async (req, res) => {
    try {
        const { chatId, type = 'both' } = req.body;
        const requesterId = req.user.id;

        // Validate chat exists and user is participant
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        if (!chat.participants.includes(requesterId)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        // Get target user (the other participant)
        const targetId = chat.participants.find(
            p => p.toString() !== requesterId
        );

        if (!targetId) {
            return res.status(400).json({
                success: false,
                message: 'Target user not found'
            });
        }

        // Check if there's already a pending request
        const existingRequest = await ContactRequest.findOne({
            chatId,
            requesterId,
            status: 'pending'
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: 'You already have a pending request for this chat'
            });
        }

        // Check if both users already shared contacts
        const completedRequest = await ContactRequest.findOne({
            chatId,
            status: 'accepted',
            requesterPhoneShared: true,
            targetPhoneShared: true
        });

        if (completedRequest) {
            return res.status(400).json({
                success: false,
                message: 'Contacts already shared in this chat'
            });
        }

        // Create contact request
        const contactRequest = await ContactRequest.create({
            chatId,
            requesterId,
            targetId,
            type,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });

        // Create system message in chat
        const Message = require('../models/Message');
        await Message.create({
            chatId,
            senderId: requesterId,
            content: `👤 ${req.user.fullName} has requested to share contact information with you.`,
            type: 'SYSTEM',
            metadata: {
                requestId: contactRequest._id,
                type: 'contact_request'
            }
        });

        res.status(201).json({
            success: true,
            data: contactRequest,
            message: 'Contact request sent successfully'
        });

    } catch (error) {
        console.error('Request contact error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending contact request',
            error: error.message
        });
    }
};

// @desc    Respond to contact request (accept/reject)
// @route   PUT /api/contact-requests/:id/respond
// @access  Private
exports.respondToRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, sharePhone = true, shareEmail = true } = req.body;
        const userId = req.user.id;

        const contactRequest = await ContactRequest.findById(id)
            .populate('requesterId', 'fullName email phone isPhoneVerified')
            .populate('targetId', 'fullName email phone isPhoneVerified');

        if (!contactRequest) {
            return res.status(404).json({
                success: false,
                message: 'Contact request not found'
            });
        }

        // Check if user is the target
        if (contactRequest.targetId._id.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Only the recipient can respond to this request'
            });
        }

        // Check if request expired
        if (new Date() > contactRequest.expiresAt) {
            contactRequest.status = 'expired';
            await contactRequest.save();
            return res.status(400).json({
                success: false,
                message: 'This request has expired'
            });
        }

        if (action === 'accept') {
            // Share requested information
            if (sharePhone) {
                contactRequest.targetPhoneShared = true;
                // If requester already shared, both shared
                if (contactRequest.requesterPhoneShared) {
                    // Both shared - can now show numbers
                }
            }
            
            if (shareEmail) {
                contactRequest.targetEmailShared = true;
            }
            
            contactRequest.status = 'accepted';
            contactRequest.respondedAt = new Date();

            await contactRequest.save();

            // Get requester user details
            const requester = await User.findById(contactRequest.requesterId._id)
                .select('fullName email phone isPhoneVerified');

            // Create system message with shared contacts
            const Message = require('../models/Message');
            
            let sharedInfo = '';
            if (sharePhone && shareEmail) {
                sharedInfo = 'phone number and email address';
            } else if (sharePhone) {
                sharedInfo = 'phone number';
            } else if (shareEmail) {
                sharedInfo = 'email address';
            }
            
            await Message.create({
                chatId: contactRequest.chatId,
                senderId: userId,
                content: `✅ ${contactRequest.targetId.fullName} has accepted the contact request and shared their ${sharedInfo}.`,
                type: 'SYSTEM',
                metadata: {
                    requestId: contactRequest._id,
                    type: 'contact_accepted',
                    sharedData: {
                        requester: {
                            phone: contactRequest.requesterPhoneShared ? requester.phone : null,
                            email: contactRequest.requesterEmailShared ? requester.email : null
                        },
                        target: {
                            phone: sharePhone ? contactRequest.targetId.phone : null,
                            email: shareEmail ? contactRequest.targetId.email : null
                        }
                    }
                }
            });

            res.status(200).json({
                success: true,
                message: 'Contact request accepted',
                data: {
                    status: 'accepted',
                    sharedPhone: sharePhone,
                    sharedEmail: shareEmail,
                    contacts: {
                        requester: {
                            phone: contactRequest.requesterPhoneShared ? requester.phone : null,
                            email: contactRequest.requesterEmailShared ? requester.email : null
                        },
                        target: {
                            phone: sharePhone ? contactRequest.targetId.phone : null,
                            email: shareEmail ? contactRequest.targetId.email : null
                        }
                    }
                }
            });

        } else if (action === 'reject') {
            contactRequest.status = 'rejected';
            contactRequest.respondedAt = new Date();
            await contactRequest.save();

            const Message = require('../models/Message');
            await Message.create({
                chatId: contactRequest.chatId,
                senderId: userId,
                content: `❌ ${contactRequest.targetId.fullName} declined the contact request.`,
                type: 'SYSTEM',
                metadata: {
                    requestId: contactRequest._id,
                    type: 'contact_rejected'
                }
            });

            res.status(200).json({
                success: true,
                message: 'Contact request rejected',
                data: { status: 'rejected' }
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid action. Use "accept" or "reject"'
            });
        }

    } catch (error) {
        console.error('Respond to request error:', error);
        res.status(500).json({
            success: false,
            message: 'Error responding to contact request',
            error: error.message
        });
    }
};

// @desc    Get pending contact requests for user
// @route   GET /api/contact-requests/pending
// @access  Private
exports.getPendingRequests = async (req, res) => {
    try {
        const userId = req.user.id;

        const requests = await ContactRequest.find({
            targetId: userId,
            status: 'pending',
            expiresAt: { $gt: new Date() }
        })
        .populate('requesterId', 'fullName profilePhoto isPhoneVerified')
        .populate('chatId', 'itemId')
        .populate({
            path: 'chatId',
            populate: {
                path: 'itemId',
                select: 'title images'
            }
        })
        .sort('-createdAt');

        const formattedRequests = requests.map(req => ({
            _id: req._id,
            requester: {
                id: req.requesterId._id,
                fullName: req.requesterId.fullName,
                profilePhoto: req.requesterId.profilePhoto,
                isPhoneVerified: req.requesterId.isPhoneVerified
            },
            chat: {
                id: req.chatId._id,
                item: req.chatId.itemId
            },
            type: req.type,
            expiresAt: req.expiresAt,
            createdAt: req.createdAt
        }));

        res.status(200).json({
            success: true,
            count: formattedRequests.length,
            data: formattedRequests
        });

    } catch (error) {
        console.error('Get pending requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching pending requests',
            error: error.message
        });
    }
};

// @desc    Get shared contacts for a chat
// @route   GET /api/contact-requests/chat/:chatId
// @access  Private
exports.getSharedContacts = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.id;

        // Find accepted contact request
        const contactRequest = await ContactRequest.findOne({
            chatId,
            status: 'accepted'
        })
        .populate('requesterId', 'fullName email phone isPhoneVerified')
        .populate('targetId', 'fullName email phone isPhoneVerified');

        if (!contactRequest) {
            return res.status(404).json({
                success: false,
                message: 'No shared contacts found for this chat'
            });
        }

        // Determine which contacts are visible to current user
        const isRequester = contactRequest.requesterId._id.toString() === userId;
        const isTarget = contactRequest.targetId._id.toString() === userId;

        if (!isRequester && !isTarget) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        let contacts = {};

        if (isRequester) {
            // Requester sees target's shared info
            contacts.otherUser = {
                fullName: contactRequest.targetId.fullName,
                phone: contactRequest.targetPhoneShared ? contactRequest.targetId.phone : null,
                email: contactRequest.targetEmailShared ? contactRequest.targetId.email : null,
                isPhoneVerified: contactRequest.targetId.isPhoneVerified
            };
        } else if (isTarget) {
            // Target sees requester's shared info
            contacts.otherUser = {
                fullName: contactRequest.requesterId.fullName,
                phone: contactRequest.requesterPhoneShared ? contactRequest.requesterId.phone : null,
                email: contactRequest.requesterEmailShared ? contactRequest.requesterId.email : null,
                isPhoneVerified: contactRequest.requesterId.isPhoneVerified
            };
        }

        res.status(200).json({
            success: true,
            data: contacts
        });

    } catch (error) {
        console.error('Get shared contacts error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching shared contacts',
            error: error.message
        });
    }
};