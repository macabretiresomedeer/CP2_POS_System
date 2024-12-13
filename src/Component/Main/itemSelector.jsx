import { useState } from 'react';
import Grid from '@mui/material/Grid2';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import IconButton from '@mui/material/IconButton';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import CircularProgress from '@mui/material/CircularProgress';
import PropTypes from 'prop-types';

const ItemSelector = ({ items, onAddToCart, onImageUpload }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [uploadingStates, setUploadingStates] = useState({});
    const [uploadErrors, setUploadErrors] = useState({});

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.price.toString().includes(searchQuery.toLowerCase())
    );

    const handleImageUpload = async (event, itemId) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            setUploadErrors(prev => ({
                ...prev,
                [itemId]: 'Please upload a valid image file (JPEG, PNG, or GIF)'
            }));
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setUploadErrors(prev => ({
                ...prev,
                [itemId]: 'File size must be less than 5MB'
            }));
            return;
        }

        // Set uploading state
        setUploadingStates(prev => ({ ...prev, [itemId]: true }));
        setUploadErrors(prev => ({ ...prev, [itemId]: null }));

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch(`http://localhost:5000/api/inventory/${itemId}/image`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to upload image');
            }

            // Clear error and uploading state
            setUploadErrors(prev => ({ ...prev, [itemId]: null }));

            // Refresh the item's image by triggering the parent callback
            if (onImageUpload) {
                onImageUpload(itemId);
            }

            // Force a cache-busting reload of the image
            const timestamp = new Date().getTime();
            const imageElement = document.querySelector(`#item-image-${itemId}`);
            if (imageElement) {
                imageElement.src = `http://localhost:5000/api/inventory/${itemId}/image?t=${timestamp}`;
            }

        } catch (error) {
            console.error('Error uploading image:', error);
            setUploadErrors(prev => ({
                ...prev,
                [itemId]: error.message || 'Failed to upload image'
            }));
        } finally {
            setUploadingStates(prev => ({ ...prev, [itemId]: false }));
        }
    };

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden'
        }}>
            <Box sx={{
                mb: 4,
                flexShrink: 0,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 2
            }}>
                <Typography
                    variant="h6"
                    sx={{
                        color: 'primary.main',
                        fontWeight: 600,
                        letterSpacing: 0.5,
                        flexShrink: 0
                    }}
                >
                    Available Products
                </Typography>

                <TextField
                    placeholder="Search by name, brand, or price..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    variant="outlined"
                    size="small"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                        sx: {
                            borderRadius: 2,
                            backgroundColor: 'background.paper',
                            '&:hover': {
                                backgroundColor: 'background.paper',
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'divider',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'primary.main',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'primary.main',
                            }
                        }
                    }}
                    sx={{
                        flexGrow: 1,
                        maxWidth: '400px'
                    }}
                />
            </Box>

            <Box sx={{
                flexGrow: 1,
                overflow: 'auto',
                minHeight: 0,
                '&::-webkit-scrollbar': {
                    width: '6px',
                    backgroundColor: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    borderRadius: '3px',
                    '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    }
                },
                '&::-webkit-scrollbar-track': {
                    backgroundColor: 'transparent',
                },
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(0, 0, 0, 0.1) transparent',
            }}>
                <Grid
                    container
                    spacing={2}
                    sx={{
                        '& .MuiCard-root': {
                            height: '400px',
                            width: '200px',
                            display: 'flex',
                            flexDirection: 'column',
                            transition: 'transform 0.2s ease-in-out',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                            }
                        }
                    }}
                >
                    {filteredItems.length > 0 ? (
                        filteredItems.map((item) => (
                            <Grid xs={12} sm={6} md={4} key={item.id}>
                                <Card
                                    elevation={0}
                                    sx={{
                                        borderRadius: 3,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        overflow: 'hidden',
                                        width: '100%',
                                    }}
                                >
                                    <Box sx={{ position: 'relative' }}>
                                        <CardMedia
                                            id={`item-image-${item.id}`}
                                            component="img"
                                            image={`${item.image}?t=${new Date().getTime()}`}
                                            alt={item.name}
                                            sx={{
                                                height: "200px",
                                                width: "200px",
                                                objectFit: 'cover',
                                                backgroundColor: 'background.default',
                                                padding: '5px',
                                                marginBottom: '10px'
                                            }}
                                        />
                                        <input
                                            accept="image/*"
                                            type="file"
                                            id={`image-upload-${item.id}`}
                                            style={{ display: 'none' }}
                                            onChange={(e) => handleImageUpload(e, item.id)}
                                        />
                                        <label htmlFor={`image-upload-${item.id}`}>
                                            <IconButton
                                                component="span"
                                                disabled={uploadingStates[item.id]}
                                                sx={{
                                                    position: 'absolute',
                                                    bottom: 8,
                                                    right: 8,
                                                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                    }
                                                }}
                                            >
                                                {uploadingStates[item.id] ? (
                                                    <CircularProgress size={24} />
                                                ) : (
                                                    <PhotoCamera />
                                                )}
                                            </IconButton>
                                        </label>
                                        {uploadErrors[item.id] && (
                                            <Typography
                                                variant="caption"
                                                color="error"
                                                sx={{
                                                    position: 'absolute',
                                                    bottom: 8,
                                                    left: 8,
                                                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                                    padding: '4px 8px',
                                                    borderRadius: 1
                                                }}
                                            >
                                                {uploadErrors[item.id]}
                                            </Typography>
                                        )}
                                    </Box>
                                    <CardContent sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        p: 2,
                                        width: '100%'
                                    }}>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{
                                                letterSpacing: 0.1,
                                                textTransform: 'uppercase',
                                                fontSize: '0.75rem',
                                                mb: 0.5
                                            }}
                                        >
                                            {item.brand}
                                        </Typography>

                                        <Typography
                                            variant="h6"
                                            component="h2"
                                            sx={{
                                                fontWeight: 600,
                                                fontSize: '1rem',
                                                lineHeight: 1.2,
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                                mb: 0.5
                                            }}
                                        >
                                            {item.name}
                                        </Typography>

                                        <Box sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 1,
                                            mt: 1
                                        }}>
                                            <Typography
                                                variant="h6"
                                                color="primary"
                                                sx={{
                                                    fontWeight: 600,
                                                    fontSize: '1.4rem'
                                                }}
                                            >
                                                ${item.price.toFixed(2)}
                                            </Typography>

                                            <Button
                                                variant="contained"
                                                fullWidth
                                                onClick={() => onAddToCart(item)}
                                                sx={{
                                                    bgcolor: 'primary.main',
                                                    '&:hover': {
                                                        bgcolor: 'primary.dark',
                                                    },
                                                    py: 1,
                                                    marginTop: '10%',
                                                }}
                                            >
                                                Add to Cart
                                            </Button>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))
                    ) : (
                        <Box sx={{
                            width: '100%',
                            textAlign: 'center',
                            py: 8
                        }}>
                            <Typography
                                variant="h6"
                                color="text.secondary"
                                sx={{ fontWeight: 500 }}
                            >
                                No products found matching your search.
                            </Typography>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 1 }}
                            >
                                Try adjusting your search terms or browse all products.
                            </Typography>
                        </Box>
                    )}
                </Grid>
            </Box>
        </Box>
    );
};

ItemSelector.propTypes = {
    items: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
            brand: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
            price: PropTypes.number.isRequired,
            image: PropTypes.string.isRequired,
        })
    ).isRequired,
    onAddToCart: PropTypes.func.isRequired,
    onImageUpload: PropTypes.func,
};

export default ItemSelector;