import { useState } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import PropTypes from 'prop-types';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

const SortingControls = ({ items, onFilterChange, fullWidth }) => {
    const [selectedBrand, setSelectedBrand] = useState('all');
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const brands = ['all', ...new Set(items.map(item => item.brand))];

    const handleBrandSelect = (brand) => {
        setSelectedBrand(brand);
        onFilterChange(brand);
    };

    return (
        <Box sx={{
            width: fullWidth ? '100%' : 'auto'
        }}>
            <Typography
                variant="h6"
                sx={{
                    mb: 2,
                    color: 'text.primary',
                    fontSize: '1.1rem',
                    px: fullWidth ? 2 : 0
                }}
            >
                Brands
            </Typography>

            <Stack
                direction={fullWidth ? 'row' : 'column'}
                spacing={1.5}
                sx={{
                    flexWrap: 'nowrap',
                    overflow: fullWidth ? 'auto' : 'visible',
                    pb: fullWidth ? 2 : 0,
                    px: fullWidth ? 2 : 0,
                    mx: fullWidth ? -2 : 0,
                    width: fullWidth ? 'calc(100% + 32px)' : '100%',
                    '&::-webkit-scrollbar': {
                        height: '6px',
                    },
                    '&::-webkit-scrollbar-track': {
                        backgroundColor: 'rgba(0,0,0,0.05)',
                        borderRadius: '3px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'rgba(0,0,0,0.15)',
                        borderRadius: '3px',
                    },
                }}
            >
                {brands.map((brand) => (
                    <Button
                        key={brand}
                        onClick={() => handleBrandSelect(brand)}
                        variant={selectedBrand === brand ? "contained" : "text"}
                        sx={{
                            justifyContent: 'space-between',
                            px: 2,
                            py: 1.5,
                            backgroundColor: selectedBrand === brand ? 'primary.main' : 'transparent',
                            color: selectedBrand === brand ? 'white' : 'text.primary',
                            '&:hover': {
                                backgroundColor: selectedBrand === brand ? 'primary.dark' : 'rgba(0, 0, 0, 0.04)',
                            },
                            minWidth: fullWidth ? 'auto' : '100%',
                            width: fullWidth ? 'auto' : '100%',
                            flexShrink: 0,
                            whiteSpace: 'nowrap'
                        }}
                    >
                        <Typography sx={{
                            fontWeight: selectedBrand === brand ? 500 : 400,
                            textTransform: 'capitalize',
                        }}>
                            {brand === 'all' ? 'All Brands' : brand}
                        </Typography>
                        <Chip
                            label={brand === 'all'
                                ? items.length
                                : items.filter(item => item.brand === brand).length
                            }
                            size="small"
                            sx={{
                                ml: 1,
                                backgroundColor: selectedBrand === brand
                                    ? 'rgba(255, 255, 255, 0.2)'
                                    : 'rgba(0, 0, 0, 0.08)',
                                color: selectedBrand === brand
                                    ? 'white'
                                    : 'text.secondary',
                                height: '20px',
                                '& .MuiChip-label': {
                                    px: 1,
                                    fontSize: '0.75rem',
                                }
                            }}
                        />
                    </Button>
                ))}
            </Stack>
        </Box>
    );
};

SortingControls.propTypes = {
    items: PropTypes.arrayOf(
        PropTypes.shape({
            brand: PropTypes.string.isRequired,
        })
    ).isRequired,
    onFilterChange: PropTypes.func.isRequired,
    fullWidth: PropTypes.bool,
};

SortingControls.defaultProps = {
    fullWidth: false
};

export default SortingControls;