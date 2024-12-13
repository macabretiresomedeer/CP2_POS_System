import React, { useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import PersonIcon from '@mui/icons-material/Person';
import LoyaltyIcon from '@mui/icons-material/Loyalty';
import PropTypes from 'prop-types';
import CircularProgress from '@mui/material/CircularProgress';

const MembershipDetails = ({ onMembershipUpdate }) => {
    const [memberId, setMemberId] = useState('');
    const [memberDetails, setMemberDetails] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState(null);

    const handleSearch = async () => {
        setIsSearching(true);
        setError(null);

        try {
            const response = await fetch(`http://localhost:5000/api/members/${memberId}`);

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Member not found');
                }
                throw new Error('Failed to fetch member data');
            }

            const member = await response.json();
            setMemberDetails(member);
            onMembershipUpdate({
                memberId,
                ...member,
                pointsToEarn: member.points_multiplier
            });
        } catch (err) {
            setError(err.message);
            setMemberDetails(null);
            onMembershipUpdate(null);
        } finally {
            setIsSearching(false);
        }
    };

    const getTierColor = (tier) => {
        const colors = {
            'Silver': '#C0C0C0',
            'Gold': '#FFD700',
            'Platinum': '#E5E4E2'
        };
        return colors[tier] || '#C0C0C0';
    };

    const handleClear = () => {
        setMemberId('');
        setMemberDetails(null);
        setError(null);
        onMembershipUpdate(null);
    };

    return (
        <Box>
            <Typography
                variant="h6"
                sx={{
                    mb: 2,
                    color: 'primary.main',
                    fontWeight: 600,
                    letterSpacing: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                }}
            >
                <PersonIcon /> Membership Details
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                    size="small"
                    placeholder="Enter Member ID"
                    value={memberId}
                    onChange={(e) => setMemberId(e.target.value)}
                    sx={{ flexGrow: 1 }}
                    error={!!error}
                    helperText={error}
                />
                <Button
                    variant="contained"
                    onClick={handleSearch}
                    disabled={!memberId || isSearching}
                >
                    {isSearching ? <CircularProgress size={24} /> : 'Search'}
                </Button>
                {memberDetails && (
                    <Button
                        variant="outlined"
                        onClick={handleClear}
                        color="secondary"
                    >
                        Clear
                    </Button>
                )}
            </Box>

            {memberDetails && (
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    p: 2,
                    bgcolor: 'background.default',
                    borderRadius: 1
                }}>
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {memberDetails.name}
                        </Typography>
                        <Chip
                            label={memberDetails.tier}
                            size="small"
                            sx={{
                                backgroundColor: getTierColor(memberDetails.tier),
                                color: 'text.primary',
                                fontWeight: 500
                            }}
                        />
                    </Box>

                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                    }}>
                        <LoyaltyIcon sx={{ color: 'primary.main' }} />
                        <Typography variant="body2">
                            Current Points: {memberDetails.points}
                        </Typography>
                        <Chip
                            size="small"
                            color="primary"
                            label={`${memberDetails.points_multiplier}x Points Multiplier`}
                        />
                    </Box>
                </Box>
            )}
        </Box>
    );
};

MembershipDetails.propTypes = {
    onMembershipUpdate: PropTypes.func.isRequired,
};

export default MembershipDetails;