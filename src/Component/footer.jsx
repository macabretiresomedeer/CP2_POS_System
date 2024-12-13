import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const Footer = () => {
    return (
        <Box sx={{ color: 'white' }}>
            <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                © 2024 Your Store Name. All rights reserved.
            </Typography>
        </Box>
    );
};

export default Footer;