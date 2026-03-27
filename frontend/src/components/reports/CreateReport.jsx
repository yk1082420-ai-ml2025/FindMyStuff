// frontend/src/components/reports/CreateReport.jsx
import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Switch,
    Alert,
    Box,
    CircularProgress,
    IconButton
} from '@mui/material';
import { Close, CloudUpload } from '@mui/icons-material';
import { REPORT_TARGET_TYPES, REPORT_REASONS, REPORT_REASON_LABELS } from '../../utils/reportConstants';
import reportService from '../../services/reportService';

const CreateReport = ({ open, onClose, targetType, targetId, targetTitle }) => {
    const [formData, setFormData] = useState({
        reason: REPORT_REASONS.SPAM,
        description: '',
        screenshotUrls: []
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [uploading, setUploading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        setUploading(true);
        
        // For demo - in production, upload to cloud storage
        const urls = files.map(file => URL.createObjectURL(file));
        setFormData(prev => ({
            ...prev,
            screenshotUrls: [...prev.screenshotUrls, ...urls]
        }));
        setUploading(false);
    };

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            screenshotUrls: prev.screenshotUrls.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const reportData = {
                targetType: targetType,  // 'post', 'comment', or 'user'
                targetId: targetId,       // ID of the reported item
                reason: formData.reason,
                description: formData.description,
                screenshotUrls: formData.screenshotUrls
            };
            
            await reportService.createReport(reportData);
            setSuccess('Report submitted successfully!');
            setTimeout(() => {
                onClose();
                window.location.reload();
            }, 2000);
        } catch (err) {
            setError(err.message || 'Failed to submit report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                Report {targetTitle ? `: ${targetTitle}` : 'Content'}
            </DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    {success && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            {success}
                        </Alert>
                    )}
                    
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Reason for Report</InputLabel>
                        <Select
                            name="reason"
                            value={formData.reason}
                            onChange={handleChange}
                            label="Reason for Report"
                            required
                        >
                            {Object.entries(REPORT_REASONS).map(([, value]) => (
                                <MenuItem key={value} value={value}>
                                    {REPORT_REASON_LABELS[value]}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    
                    <TextField
                        fullWidth
                        label="Additional Details (Optional)"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        multiline
                        rows={4}
                        margin="normal"
                        placeholder="Please provide any additional information that might help us review this report..."
                    />
                    
                    {/* Screenshot Upload */}
                    <Box sx={{ mt: 2 }}>
                        <Button
                            variant="outlined"
                            component="label"
                            startIcon={<CloudUpload />}
                            disabled={uploading}
                        >
                            Upload Screenshots
                            <input
                                type="file"
                                hidden
                                multiple
                                accept="image/*"
                                onChange={handleImageUpload}
                            />
                        </Button>
                        
                        {formData.screenshotUrls.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                                {formData.screenshotUrls.map((url, index) => (
                                    <Box key={index} sx={{ position: 'relative' }}>
                                        <img
                                            src={url}
                                            alt={`Screenshot ${index + 1}`}
                                            style={{
                                                width: '100px',
                                                height: '100px',
                                                objectFit: 'cover',
                                                borderRadius: '8px'
                                            }}
                                        />
                                        <IconButton
                                            size="small"
                                            sx={{
                                                position: 'absolute',
                                                top: -8,
                                                right: -8,
                                                bgcolor: 'white'
                                            }}
                                            onClick={() => removeImage(index)}
                                        >
                                            <Close fontSize="small" />
                                        </IconButton>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                
                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button 
                        type="submit" 
                        variant="contained" 
                        color="error"
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Submit Report'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default CreateReport;