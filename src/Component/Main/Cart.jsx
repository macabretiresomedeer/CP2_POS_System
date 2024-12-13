import React, { useState } from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PaymentsIcon from '@mui/icons-material/Payments';
import PropTypes from 'prop-types';

const Cart = ({
                  items,
                  onRemove,
                  onIncreaseQuantity,
                  onDecreaseQuantity,
                  onCheckout,
                  onApplyDiscount
              }) => {
    const [paymentMethod, setPaymentMethod] = useState('card');

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = items.reduce((sum, item) => {
        const itemDiscount = item.discount || 0;
        return sum + ((item.price * item.quantity) * (itemDiscount / 100));
    }, 0);
    const discountedSubtotal = subtotal - discount;
    const sst = discountedSubtotal * 0.06; // 6% SST
    const totalPrice = discountedSubtotal + sst;

    const handlePaymentMethodChange = (event, newPaymentMethod) => {
        if (newPaymentMethod !== null) {
            setPaymentMethod(newPaymentMethod);
        }
    };

    const handleCheckoutWithPayment = () => {
        onCheckout(paymentMethod);
    };

    // Payment method selector component
    const PaymentMethodSelector = () => (
        <Box sx={{ width: '100%', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.primary' }}>
                Payment Method
            </Typography>
            <ToggleButtonGroup
                value={paymentMethod}
                exclusive
                onChange={handlePaymentMethodChange}
                aria-label="payment method"
                fullWidth
                sx={{
                    '& .MuiToggleButton-root': {
                        flex: 1,
                        py: 1.5,
                        color: 'text.secondary',
                        borderColor: 'divider',
                        '&.Mui-selected': {
                            backgroundColor: 'primary.main',
                            color: 'white',
                            '&:hover': {
                                backgroundColor: 'primary.dark',
                            },
                        },
                        '&:hover': {
                            backgroundColor: 'primary.light',
                            color: 'white',
                        },
                    },
                }}
            >
                <ToggleButton value="card" aria-label="card payment">
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                        <CreditCardIcon />
                        <Typography variant="caption">Card</Typography>
                    </Box>
                </ToggleButton>
                <ToggleButton value="cash" aria-label="cash payment">
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                        <PaymentsIcon />
                        <Typography variant="caption">Cash</Typography>
                    </Box>
                </ToggleButton>
                <ToggleButton value="ewallet" aria-label="e-wallet payment">
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                        <AccountBalanceWalletIcon />
                        <Typography variant="caption">E-Wallet</Typography>
                    </Box>
                </ToggleButton>
            </ToggleButtonGroup>
        </Box>
    );

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography
                variant="h6"
                sx={{
                    mb: 2,
                    color: 'primary.main',
                    fontWeight: 600,
                    letterSpacing: 0.5
                }}
            >
                Shopping Cart
            </Typography>

            {/* Cart items list */}
            <List sx={{
                flexGrow: 1,
                overflow: 'auto',
                '& .MuiListItem-root': {
                    borderRadius: 2,
                    mb: 1,
                    backgroundColor: 'background.default',
                    '&:hover': {
                        backgroundColor: 'primary.light',
                        '& .MuiTypography-root': {
                            color: 'background.paper'
                        },
                        '& .MuiIconButton-root': {
                            color: 'background.paper'
                        }
                    }
                }
            }}>
                {/* ... (previous cart items list code remains the same) ... */}
                {items.map((item) => (
                    <Box key={item.id}>
                        <ListItem sx={{ px: 2, py: 1.5 }}>
                            <ListItemText
                                primary={
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            fontWeight: 500,
                                            color: 'text.primary',
                                            letterSpacing: 0.15
                                        }}
                                    >
                                        {item.name}
                                        {item.discount > 0 && (
                                            <Typography
                                                component="span"
                                                sx={{
                                                    ml: 1,
                                                    color: 'secondary.main',
                                                    fontSize: '0.8rem'
                                                }}
                                            >
                                                (-{item.discount}%)
                                            </Typography>
                                        )}
                                    </Typography>
                                }
                                secondary={
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: 'text.secondary',
                                            letterSpacing: 0.1
                                        }}
                                    >
                                        ${(item.price * item.quantity).toFixed(2)}
                                    </Typography>
                                }
                            />
                            <ListItemSecondaryAction sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5
                            }}>
                                <IconButton
                                    edge="end"
                                    size="small"
                                    onClick={() => onDecreaseQuantity(item.id)}
                                    sx={{
                                        color: 'primary.main',
                                        '&:hover': {
                                            backgroundColor: 'primary.main',
                                            color: 'background.paper'
                                        }
                                    }}
                                >
                                    <RemoveIcon fontSize="small" />
                                </IconButton>
                                <Typography
                                    component="span"
                                    sx={{
                                        mx: 1,
                                        minWidth: '24px',
                                        textAlign: 'center',
                                        color: 'text.primary'
                                    }}
                                >
                                    {item.quantity}
                                </Typography>
                                <IconButton
                                    edge="end"
                                    size="small"
                                    onClick={() => onIncreaseQuantity(item.id)}
                                    sx={{
                                        color: 'primary.main',
                                        '&:hover': {
                                            backgroundColor: 'primary.main',
                                            color: 'background.paper'
                                        }
                                    }}
                                >
                                    <AddIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                    edge="end"
                                    onClick={() => onRemove(item.id)}
                                    size="small"
                                    sx={{
                                        ml: 1,
                                        color: 'secondary.main',
                                        '&:hover': {
                                            backgroundColor: 'secondary.main',
                                            color: 'background.paper'
                                        }
                                    }}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </ListItemSecondaryAction>
                        </ListItem>
                    </Box>
                ))}
            </List>

            {/* Checkout section */}
            <Box sx={{
                mt: 'auto',
                pt: 2,
                borderTop: 1,
                borderColor: 'divider',
                backgroundColor: 'background.paper'
            }}>
                {/* Discount code input */}
                <Box sx={{ mb: 2 }}>
                    <TextField
                        size="small"
                        label="Discount Code"
                        placeholder="Enter discount code"
                        onChange={(e) => onApplyDiscount(e.target.value)}
                        fullWidth
                        sx={{ mb: 2 }}
                    />
                </Box>

                {/* Price breakdown */}
                <Box sx={{ mb: 2 }}>
                    <Typography sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <span>Subtotal:</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </Typography>
                    {discount > 0 && (
                        <Typography sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, color: 'secondary.main' }}>
                            <span>Discount:</span>
                            <span>-${discount.toFixed(2)}</span>
                        </Typography>
                    )}
                    <Typography sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <span>SST (6%):</span>
                        <span>${sst.toFixed(2)}</span>
                    </Typography>
                </Box>

                {/* Payment method selector */}
                <PaymentMethodSelector />

                {/* Total and checkout button */}
                <Typography
                    variant="h6"
                    sx={{
                        color: 'primary.main',
                        fontWeight: 600,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2
                    }}
                >
                    <span>Total</span>
                    <span>${totalPrice.toFixed(2)}</span>
                </Typography>

                <Button
                    variant="contained"
                    fullWidth
                    onClick={handleCheckoutWithPayment}
                    disabled={items.length === 0}
                    sx={{
                        bgcolor: 'primary.main',
                        '&:hover': {
                            bgcolor: 'primary.dark',
                        },
                        py: 1.5
                    }}
                >
                    Checkout
                </Button>
            </Box>
        </Box>
    );
};

Cart.propTypes = {
    items: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
            name: PropTypes.string.isRequired,
            price: PropTypes.number.isRequired,
            quantity: PropTypes.number.isRequired,
            discount: PropTypes.number,
        })
    ).isRequired,
    onRemove: PropTypes.func.isRequired,
    onIncreaseQuantity: PropTypes.func.isRequired,
    onDecreaseQuantity: PropTypes.func.isRequired,
    onCheckout: PropTypes.func.isRequired,
    onApplyDiscount: PropTypes.func.isRequired,
};

Cart.defaultProps = {
    items: [],
};

export default Cart;