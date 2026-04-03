const Match = require('../models/Match');
const LostItem = require('../models/LostItem');
const FoundItem = require('../models/FoundItem');
const Notification = require('../models/Notification');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Tokenise a string into a Set of lowercase words.
 */
const tokenise = (str) =>
    new Set((str || '').toLowerCase().split(/\s+/).filter(Boolean));

/**
 * Jaccard similarity between two strings.
 * Returns a number 0–1.
 */
const jaccard = (a, b) => {
    const setA = tokenise(a);
    const setB = tokenise(b);
    if (setA.size === 0 && setB.size === 0) return 0;
    const intersection = new Set([...setA].filter((t) => setB.has(t)));
    const union = new Set([...setA, ...setB]);
    return intersection.size / union.size;
};

/**
 * Compute match score (0–4) and list of matched attributes.
 */
const computeMatch = (lost, found) => {
    let score = 0;
    const matchedOn = [];

    // 1. Category (exact)
    if (lost.category && found.category && lost.category === found.category) {
        score++;
        matchedOn.push('Category');
    }

    // 2. Title keyword overlap
    if (jaccard(lost.title, found.title) >= 0.2) {
        score++;
        matchedOn.push('Title');
    }

    // 3. Date within 30 days
    if (lost.dateLost && found.dateFound) {
        const diffMs = Math.abs(
            new Date(lost.dateLost).getTime() - new Date(found.dateFound).getTime()
        );
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (diffDays <= 30) {
            score++;
            matchedOn.push('Date');
        }
    }

    // 4. Location keyword overlap
    if (jaccard(lost.lastSeenLocation, found.foundLocation) >= 0.15) {
        score++;
        matchedOn.push('Location');
    }

    return { score, matchedOn };
};

// ─── Controller functions ─────────────────────────────────────────────────────

/**
 * @desc  Scan all active lost + found items and create/update Match records
 * @route POST /api/matches/run
 * @access Admin
 */
exports.runMatching = async (req, res) => {
    try {
        const lostItems = await LostItem.find({ 
            isArchived: false, 
            status: { $nin: ['Found', 'Returned', 'Archived'] },
            activeClaim: null 
        });
        const foundItems = await FoundItem.find({ 
            isArchived: false, 
            status: { $nin: ['Returned', 'Archived'] },
            activeClaim: null 
        });

        let created = 0;
        let updated = 0;

        for (const lost of lostItems) {
            for (const found of foundItems) {
                // Don't match an item to its own poster
                if (String(lost.postedBy) === String(found.postedBy)) continue;

                const { score, matchedOn } = computeMatch(lost, found);
                if (score < 3) continue;

                // Upsert — if already confirmed/dismissed, skip
                const existing = await Match.findOne({
                    lostItem: lost._id,
                    foundItem: found._id,
                });

                if (existing) {
                    if (existing.status === 'pending') {
                        existing.score = score;
                        existing.matchedOn = matchedOn;
                        await existing.save();
                        updated++;
                    }
                    // confirmed/dismissed → leave alone
                } else {
                    await Match.create({
                        lostItem: lost._id,
                        foundItem: found._id,
                        score,
                        matchedOn,
                    });
                    created++;
                }
            }
        }

        res.status(200).json({
            success: true,
            message: `Matching complete. ${created} new match(es) found, ${updated} updated.`,
            created,
            updated,
        });
    } catch (error) {
        console.error('runMatching error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc  Get pending matches for admin review
 * @route GET /api/matches
 * @access Admin
 */
exports.getMatches = async (req, res) => {
    try {
        const status = req.query.status || 'pending';
        const matches = await Match.find({ status })
            .populate({
                path: 'lostItem',
                populate: { path: 'postedBy', select: 'fullName studentId' },
            })
            .populate({
                path: 'foundItem',
                populate: { path: 'postedBy', select: 'fullName studentId' },
            })
            .sort({ score: -1, createdAt: -1 });

        res.status(200).json({ success: true, data: matches });
    } catch (error) {
        console.error('getMatches error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc  Get match counts by status
 * @route GET /api/matches/stats
 * @access Admin
 */
exports.getMatchStats = async (req, res) => {
    try {
        const [pending, confirmed, dismissed] = await Promise.all([
            Match.countDocuments({ status: 'pending' }),
            Match.countDocuments({ status: 'confirmed' }),
            Match.countDocuments({ status: 'dismissed' }),
        ]);
        res.status(200).json({ success: true, data: { pending, confirmed, dismissed } });
    } catch (error) {
        console.error('getMatchStats error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc  Confirm a match and notify both users
 * @route POST /api/matches/:id/confirm
 * @access Admin
 */
exports.confirmMatch = async (req, res) => {
    try {
        const match = await Match.findById(req.params.id)
            .populate('lostItem')
            .populate('foundItem');

        if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
        if (match.status !== 'pending')
            return res.status(400).json({ success: false, message: `Match is already ${match.status}` });

        match.status = 'confirmed';
        await match.save();

        const io = req.app.get('io');

        // Notify lost item owner → link to found post
        const notifLost = await Notification.create({
            recipient: match.lostItem.postedBy,
            type: 'match',
            title: '🎯 Potential Match Found!',
            message: `A found item may match your lost post "${match.lostItem.title}". Tap to view the found post.`,
            relatedId: match._id,
            itemType: 'found',
            itemId: match.foundItem._id,
            link: `/found?highlight=${match.foundItem._id}`,
        });
        io.to(String(match.lostItem.postedBy)).emit('new_notification', notifLost);

        // Notify found item poster → link to lost post
        const notifFound = await Notification.create({
            recipient: match.foundItem.postedBy,
            type: 'match',
            title: '🎯 Potential Match Found!',
            message: `Someone may have lost the item you found: "${match.foundItem.title}". Tap to view their lost post.`,
            relatedId: match._id,
            itemType: 'lost',
            itemId: match.lostItem._id,
            link: `/lost?highlight=${match.lostItem._id}`,
        });
        io.to(String(match.foundItem.postedBy)).emit('new_notification', notifFound);

        res.status(200).json({ success: true, message: 'Match confirmed and both users notified.' });
    } catch (error) {
        console.error('confirmMatch error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc  Dismiss a match
 * @route POST /api/matches/:id/dismiss
 * @access Admin
 */
exports.dismissMatch = async (req, res) => {
    try {
        const match = await Match.findByIdAndUpdate(
            req.params.id,
            { status: 'dismissed' },
            { new: true }
        );
        if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
        res.status(200).json({ success: true, message: 'Match dismissed.' });
    } catch (error) {
        console.error('dismissMatch error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
