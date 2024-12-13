import React, { useState, useEffect } from 'react';
import ClearIcon from '@mui/icons-material/Clear';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Stack,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LoyaltyIcon from '@mui/icons-material/Loyalty';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';

const MemberRegistration = () => {
    const [members, setMembers] = useState([]);
    const [tiers, setTiers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingMember, setEditingMember] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        tier: ''
    });
    const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const tiersResponse = await fetch('http://localhost:5000/api/tiers');
                if (!tiersResponse.ok) {
                    throw new Error('Failed to fetch tiers');
                }
                const tiersData = await tiersResponse.json();
                setTiers(tiersData);

                if (tiersData.length > 0 && !formData.tier) {
                    setFormData(prev => ({
                        ...prev,
                        tier: tiersData[0].tier_name
                    }));
                }

                const membersResponse = await fetch('http://localhost:5000/api/members');
                if (!membersResponse.ok) {
                    throw new Error('Failed to fetch members');
                }
                const membersData = await membersResponse.json();
                setMembers(Array.isArray(membersData) ? membersData : []);

            } catch (error) {
                console.error('Error fetching data:', error);
                showAlert('Failed to load data', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (editingMember) {
            setEditingMember(prev => ({
                ...prev,
                [name]: value
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const showAlert = (message, severity) => {
        setAlert({ show: true, message, severity });
        setTimeout(() => setAlert({ show: false, message: '', severity: 'success' }), 5000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const requiredFields = ['name', 'email', 'phone', 'tier'];
            const missingFields = requiredFields.filter(field => !formData[field]);

            if (missingFields.length > 0) {
                throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
            }

            const requestData = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                tier: formData.tier
            };

            const response = await fetch('http://localhost:5000/api/members', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.details || data.error || 'Failed to register member');
            }

            const membersResponse = await fetch('http://localhost:5000/api/members');
            if (membersResponse.ok) {
                const membersData = await membersResponse.json();
                setMembers(Array.isArray(membersData) ? membersData : []);
            }

            showAlert('Member successfully registered!', 'success');
            setFormData({
                name: '',
                email: '',
                phone: '',
                tier: tiers.length > 0 ? tiers[0].tier_name : ''
            });
        } catch (error) {
            console.error('Error registering member:', error);
            showAlert(error.message, 'error');
        }
    };

    const handleSearch = async () => {
        setLoading(true);
        try {
            let endpoint = searchQuery.trim()
                ? `http://localhost:5000/api/members/search?query=${encodeURIComponent(searchQuery.trim())}`
                : 'http://localhost:5000/api/members';

            const response = await fetch(endpoint);

            if (!response.ok) {
                throw new Error('Search failed');
            }

            const data = await response.json();
            setMembers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Search error:', error);
            showAlert('Failed to search members', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Use this effect to automatically search when query is cleared
    useEffect(() => {
        if (searchQuery === '') {
            handleSearch();
        }
    }, [searchQuery]);

    const handleEditClick = (member) => {
        setEditingMember(member);
    };

    const handleEditClose = () => {
        setEditingMember(null);
    };

    const handleEditSave = async () => {
        if (!editingMember) return;

        try {
            // Validate required fields
            const requiredFields = ['name', 'email', 'phone', 'tier'];
            const missingFields = requiredFields.filter(field => !editingMember[field]);

            if (missingFields.length > 0) {
                throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
            }

            // Add loading state for the edit operation
            setLoading(true);

            const response = await fetch(`http://localhost:5000/api/members/${editingMember.member_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: editingMember.name,
                    email: editingMember.email,
                    phone: editingMember.phone,
                    tier: editingMember.tier
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update member');
            }

            // Fetch updated member data
            const updatedMember = await response.json();

            // Update the members list with the new data
            setMembers(prevMembers =>
                prevMembers.map(member =>
                    member.member_id === updatedMember.member_id ? updatedMember : member
                )
            );

            showAlert('Member updated successfully!', 'success');
            setEditingMember(null);

            // Refresh the full member list to ensure consistency
            const membersResponse = await fetch('http://localhost:5000/api/members');
            if (membersResponse.ok) {
                const membersData = await membersResponse.json();
                setMembers(Array.isArray(membersData) ? membersData : []);
            }

        } catch (error) {
            console.error('Update error:', error);
            showAlert(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSearchKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditingMember(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const getTierColor = (tier) => {
        switch (tier.toLowerCase()) {
            case 'platinum':
                return 'secondary';
            case 'gold':
                return 'primary';
            default:
                return 'default';
        }
    };

    return (
        <Box sx={{ p: 3, maxWidth: '100%', width: '100%' }}>
            <Typography variant="h4" sx={{ mb: 4, color: 'primary.main', fontWeight: 600 }}>
                Membership Management
            </Typography>

            {alert.show && (
                <Alert severity={alert.severity} sx={{ mb: 2 }}>
                    {alert.message}
                </Alert>
            )}

            <Paper elevation={0} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonAddIcon /> New Member Registration
                </Typography>

                <form onSubmit={handleSubmit}>
                    <Stack spacing={3}>
                        <TextField
                            name="name"
                            label="Full Name"
                            value={formData.name}
                            onChange={handleInputChange}
                            fullWidth
                            required
                        />
                        <TextField
                            name="email"
                            label="Email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            fullWidth
                            required
                        />
                        <TextField
                            name="phone"
                            label="Phone Number"
                            value={formData.phone}
                            onChange={handleInputChange}
                            fullWidth
                            required
                        />
                        <FormControl fullWidth required>
                            <InputLabel>Membership Tier</InputLabel>
                            <Select
                                name="tier"
                                value={formData.tier}
                                onChange={handleInputChange}
                                label="Membership Tier"
                            >
                                {tiers.map((tier) => (
                                    <MenuItem key={tier.tier_name} value={tier.tier_name}>
                                        {tier.tier_name} ({tier.points_multiplier}x Points)
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            startIcon={<PersonAddIcon />}
                            disabled={loading}
                        >
                            Register Member
                        </Button>
                    </Stack>
                </form>
            </Paper>

            <Paper elevation={0} sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LoyaltyIcon /> Current Members
                </Typography>

                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                    <TextField
                        fullWidth
                        label="Search Members"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by ID, name, email, or phone"
                    />
                    <Button
                        variant="contained"
                        startIcon={<SearchIcon />}
                        onClick={handleSearch}
                    >
                        Search
                    </Button>
                </Stack>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: 'primary.main' }}>
                                <TableCell sx={{ color: 'white' }}>Member ID</TableCell>
                                <TableCell sx={{ color: 'white' }}>Name</TableCell>
                                <TableCell sx={{ color: 'white' }}>Email</TableCell>
                                <TableCell sx={{ color: 'white' }}>Phone</TableCell>
                                <TableCell sx={{ color: 'white' }}>Tier</TableCell>
                                <TableCell sx={{ color: 'white' }}>Points</TableCell>
                                <TableCell sx={{ color: 'white' }}>Points Multiplier</TableCell>
                                <TableCell sx={{ color: 'white' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center">
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : members.length > 0 ? (
                                members.map((member) => (
                                    <TableRow key={member.member_id} hover>
                                        <TableCell>{member.member_id}</TableCell>
                                        <TableCell>{member.name}</TableCell>
                                        <TableCell>{member.email}</TableCell>
                                        <TableCell>{member.phone}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={member.tier}
                                                color={getTierColor(member.tier)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>{member.points}</TableCell>
                                        <TableCell>{member.points_multiplier}x</TableCell>
                                        <TableCell>
                                            <IconButton
                                                onClick={() => handleEditClick(member)}
                                                color="primary"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} align="center">
                                        No members found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Dialog
                open={!!editingMember}
                onClose={() => {
                    if (!loading) handleEditClose();
                }}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Edit Member Information</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 2 }}>
                        <TextField
                            name="name"
                            label="Full Name"
                            value={editingMember?.name || ''}
                            onChange={handleEditInputChange}
                            fullWidth
                            required
                            error={editingMember?.name === ''}
                            helperText={editingMember?.name === '' ? 'Name is required' : ''}
                            disabled={loading}
                        />
                        <TextField
                            name="email"
                            label="Email"
                            type="email"
                            value={editingMember?.email || ''}
                            onChange={handleEditInputChange}
                            fullWidth
                            required
                            error={editingMember?.email === ''}
                            helperText={editingMember?.email === '' ? 'Email is required' : ''}
                            disabled={loading}
                        />
                        <TextField
                            name="phone"
                            label="Phone Number"
                            value={editingMember?.phone || ''}
                            onChange={handleEditInputChange}
                            fullWidth
                            required
                            error={editingMember?.phone === ''}
                            helperText={editingMember?.phone === '' ? 'Phone is required' : ''}
                            disabled={loading}
                        />
                        <FormControl fullWidth required error={!editingMember?.tier} disabled={loading}>
                            <InputLabel>Membership Tier</InputLabel>
                            <Select
                                name="tier"
                                value={editingMember?.tier || ''}
                                onChange={handleEditInputChange}
                                label="Membership Tier"
                            >
                                {tiers.map((tier) => (
                                    <MenuItem key={tier.tier_name} value={tier.tier_name}>
                                        {tier.tier_name} ({tier.points_multiplier}x Points)
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={handleEditClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleEditSave}
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MemberRegistration;