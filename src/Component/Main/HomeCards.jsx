import { useState, useEffect } from 'react';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import SortingControls from "./SortingControl.jsx";
import ItemSelector from "./itemSelector.jsx";
import Cart from "./Cart.jsx";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import MembershipDetails from './membershipDetail.jsx';

const theme = createTheme({
    palette: {
        primary: {
            main: '#2C3E50',
            light: '#34495E',
            dark: '#1A252F',
        },
        secondary: {
            main: '#E74C3C',
            light: '#EC7063',
            dark: '#C0392B',
        },
        background: {
            default: '#F5F6FA',
            paper: '#FFFFFF',
        },
        text: {
            primary: '#2C3E50',
            secondary: '#7F8C8D',
        }
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h6: {
            fontWeight: 600,
            letterSpacing: 0.5,
        },
        body1: {
            letterSpacing: 0.15,
        },
        body2: {
            letterSpacing: 0.1,
        }
    },
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                }
            }
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: 8,
                }
            }
        }
    }
});

const HomeCards = () => {
    const [cart, setCart] = useState([]);
    const [selectedBrand, setSelectedBrand] = useState('all');
    const [membershipDetails, setMembershipDetails] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/inventory');
            if (!response.ok) {
                throw new Error('Failed to fetch inventory');
            }
            const data = await response.json();
            const transformedData = data.map(item => ({
                ...item,
                image: item.image_data ?
                    `http://localhost:5000/api/inventory/${item.id}/image` :
                    'https://via.placeholder.com/150',
                price: Number(item.price)
            }));
            setInventory(transformedData);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleBrandFilter = (brand) => {
        setSelectedBrand(brand);
    };

    const filteredItems = selectedBrand === 'all'
        ? inventory
        : inventory.filter(item => item.brand === selectedBrand);

    const handleAddToCart = (item) => {
        const inventoryItem = inventory.find(invItem => invItem.id === item.id);

        if (inventoryItem && inventoryItem.stock > 0) {
            setCart(prevCart => {
                const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
                if (existingItem) {
                    if (existingItem.quantity < inventoryItem.stock) {
                        return prevCart.map(cartItem =>
                            cartItem.id === item.id
                                ? { ...cartItem, quantity: cartItem.quantity + 1 }
                                : cartItem
                        );
                    }
                    return prevCart;
                }
                return [...prevCart, { ...item, quantity: 1 }];
            });
        } else {
            alert('This item is out of stock!');
        }
    };

    const handleRemoveFromCart = (itemId) => {
        setCart(prevCart => prevCart.filter(item => item.id !== itemId));
    };

    const handleIncreaseQuantity = (itemId) => {
        const inventoryItem = inventory.find(item => item.id === itemId);
        setCart(prevCart =>
            prevCart.map(item => {
                if (item.id === itemId && item.quantity < inventoryItem.stock) {
                    return { ...item, quantity: item.quantity + 1 };
                }
                return item;
            })
        );
    };

    const handleDecreaseQuantity = (itemId) => {
        setCart(prevCart =>
            prevCart.map(item =>
                item.id === itemId
                    ? { ...item, quantity: Math.max(0, item.quantity - 1) }
                    : item
            ).filter(item => item.quantity > 0)
        );
    };

    const handleMembershipUpdate = (details) => {
        setMembershipDetails(details);
    };

    const updateInventory = async (items) => {
        try {
            // Update each item's stock in the inventory
            for (const item of items) {
                const response = await fetch(`http://localhost:5000/api/inventory/${item.id}/stock`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        newQuantity: item.remainingStock,
                        reason: 'Checkout purchase'
                    })
                });

                if (!response.ok) {
                    throw new Error(`Failed to update stock for item ${item.id}`);
                }
            }
            // Refresh inventory after updates
            await fetchInventory();
        } catch (error) {
            console.error('Error updating inventory:', error);
            throw error;
        }
    };

    const handleCheckout = async (paymentMethod) => {
        if (cart.length === 0) return;

        try {
            // Prepare items with their new stock levels
            const itemsToUpdate = cart.map(cartItem => {
                const inventoryItem = inventory.find(item => item.id === cartItem.id);
                return {
                    id: cartItem.id,
                    remainingStock: inventoryItem.stock - cartItem.quantity
                };
            });

            // Update inventory in the database
            await updateInventory(itemsToUpdate);

            // Prepare transaction data
            const transaction = {
                transactionId: `TRX-${Date.now()}`,
                timestamp: new Date().toISOString(),
                customerName: membershipDetails ? membershipDetails.name : 'Guest',
                memberId: membershipDetails?.memberId,
                paymentMethod: paymentMethod,
                items: cart.map(item => ({
                    id: item.id,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    discount: item.discount || 0
                })),
                subtotal: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                discount: cart.reduce((sum, item) => {
                    const itemDiscount = item.discount || 0;
                    return sum + ((item.price * item.quantity) * (itemDiscount / 100));
                }, 0),
                sst: (cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 0.06),
                totalAmount: cart.reduce((sum, item) => {
                    const itemTotal = item.price * item.quantity;
                    const itemDiscount = itemTotal * ((item.discount || 0) / 100);
                    return sum + (itemTotal - itemDiscount);
                }, 0) * 1.06
            };

            // Add points calculation if member
            if (membershipDetails) {
                const pointsEarned = Math.floor(transaction.subtotal * membershipDetails.pointsToEarn);
                transaction.memberDetails = {
                    memberId: membershipDetails.memberId,
                    pointsEarned: pointsEarned,
                    newTotalPoints: membershipDetails.points + pointsEarned
                };
            }

            // Save sale to database
            const response = await fetch('http://localhost:5000/api/sales', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(transaction)
            });

            if (!response.ok) {
                throw new Error('Failed to record sale');
            }

            // Create receipt message
            let checkoutMessage = `Transaction ID: ${transaction.transactionId}\n`;
            checkoutMessage += `Date: ${new Date(transaction.timestamp).toLocaleString()}\n`;
            checkoutMessage += `Customer: ${transaction.customerName}\n`;
            checkoutMessage += `Payment Method: ${transaction.paymentMethod}\n\n`;
            checkoutMessage += `Items purchased:\n`;

            transaction.items.forEach(item => {
                checkoutMessage += `- ${item.name} x${item.quantity} at $${item.price} each\n`;
            });

            checkoutMessage += `\nSubtotal: $${transaction.subtotal.toFixed(2)}`;
            if (transaction.discount > 0) {
                checkoutMessage += `\nDiscount: -$${transaction.discount.toFixed(2)}`;
            }
            checkoutMessage += `\nSST (6%): $${transaction.sst.toFixed(2)}`;
            checkoutMessage += `\nTotal Amount: $${transaction.totalAmount.toFixed(2)}`;

            if (transaction.memberDetails) {
                checkoutMessage += `\n\nPoints Earned: ${transaction.memberDetails.pointsEarned}`;
                checkoutMessage += `\nNew Total Points: ${transaction.memberDetails.newTotalPoints}`;
            }

            // Show receipt and clear cart
            alert(checkoutMessage);
            setCart([]);

        } catch (error) {
            console.error('Checkout error:', error);
            alert('Error processing checkout: ' + error.message);
        }
    };

    const handleApplyDiscount = (code) => {
        const discountCodes = {
            'SAVE10': 10,
            'SAVE20': 20,
            'SAVE30': 30,
            'FREE': 100,
        };

        const discount = discountCodes[code.toUpperCase()];
        if (discount) {
            setCart(prevCart =>
                prevCart.map(item => ({
                    ...item,
                    discount: discount
                }))
            );
            alert(`Discount of ${discount}% applied!`);
        }
    };

    if (loading) {
        return <Box sx={{ p: 3 }}>Loading inventory...</Box>;
    }

    if (error) {
        return <Box sx={{ p: 3, color: 'error.main' }}>Error: {error}</Box>;
    }

    return (
        <ThemeProvider theme={theme}>
            <Box sx={{
                width: '100%',
                height: '100%',
                backgroundColor: 'background.default',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <Grid
                    container
                    spacing={2}
                    sx={{
                        height: '100%',
                        p: 2
                    }}
                >
                    <Grid xs={12} sm={3} md={2}>
                        <Paper
                            elevation={0}
                            sx={{
                                height: '100%',
                                p: 2,
                                backgroundColor: 'background.paper',
                                overflow: 'auto'
                            }}
                        >
                            <SortingControls
                                items={inventory}
                                onFilterChange={handleBrandFilter}
                            />
                        </Paper>
                    </Grid>

                    <Grid xs={12} sm={6} md={7}>
                        <Paper
                            elevation={0}
                            sx={{
                                maxWidth: '67vw',
                                minWidth: '67vw',
                                height: '85vh',
                                p: 2,
                                backgroundColor: 'background.paper',
                                overflow: 'auto'
                            }}
                        >
                            <ItemSelector
                                items={filteredItems}
                                onAddToCart={handleAddToCart}
                            />
                        </Paper>
                    </Grid>

                    <Grid sm={4} md={3}>
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            height: '100%'
                        }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    backgroundColor: 'background.paper',
                                    width: '19vw'
                                }}
                            >
                                <MembershipDetails onMembershipUpdate={handleMembershipUpdate} />
                            </Paper>

                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    backgroundColor: 'background.paper',
                                    flexGrow: 1,
                                    overflow: 'auto',
                                    minWidth: '19vw',
                                    height: '60vh'
                                }}
                            >
                                <Cart
                                    items={cart}
                                    onRemove={handleRemoveFromCart}
                                    onIncreaseQuantity={handleIncreaseQuantity}
                                    onDecreaseQuantity={handleDecreaseQuantity}
                                    onCheckout={handleCheckout}
                                    onApplyDiscount={handleApplyDiscount}
                                    membershipDetails={membershipDetails}
                                />
                            </Paper>
                        </Box>
                    </Grid>
                </Grid>
            </Box>
        </ThemeProvider>
    );
};

export default HomeCards;