// frontend/src/utils/reportConstants.js
export const REPORT_TARGET_TYPES = {
    POST: 'post',
    COMMENT: 'comment', 
    USER: 'user'
};

export const REPORT_REASONS = {
    SPAM: 'spam',
    HARASSMENT: 'harassment',
    HATE_SPEECH: 'hate_speech',
    FALSE_CLAIM: 'false_claim',
    MISINFORMATION: 'misinformation',
    INAPPROPRIATE_CONTENT: 'inappropriate_content',
    OTHER: 'other'
};

export const REPORT_STATUS = {
    PENDING: 'pending',
    REVIEWING: 'reviewing',
    RESOLVED: 'resolved',
    DISMISSED: 'dismissed'
};

export const REPORT_STATUS_COLORS = {
    [REPORT_STATUS.PENDING]: 'warning',
    [REPORT_STATUS.REVIEWING]: 'info',
    [REPORT_STATUS.RESOLVED]: 'success',
    [REPORT_STATUS.DISMISSED]: 'error'
};

export const REPORT_REASON_LABELS = {
    [REPORT_REASONS.SPAM]: 'Spam',
    [REPORT_REASONS.HARASSMENT]: 'Harassment',
    [REPORT_REASONS.HATE_SPEECH]: 'Hate Speech',
    [REPORT_REASONS.FALSE_CLAIM]: 'False Claim',
    [REPORT_REASONS.MISINFORMATION]: 'Misinformation',
    [REPORT_REASONS.INAPPROPRIATE_CONTENT]: 'Inappropriate Content',
    [REPORT_REASONS.OTHER]: 'Other'
};