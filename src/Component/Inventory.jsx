import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    TextField,
    Typography,
    Chip,
    InputAdornment,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    IconButton,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import WarningIcon from '@mui/icons-material/Warning';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

const API_BASE_URL = 'http://localhost:5000';

const Inventory = () => {
    const [inventory, setInventory] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [orderBy, setOrderBy] = useState('name');
    const [order, setOrder] = useState('asc');
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [editQuantity, setEditQuantity] = useState('');
    const [editReason, setEditReason] = useState('adjustment');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [newProduct, setNewProduct] = useState({
        name: '',
        sku: '',
        category: '',
        stock: '',
        price: '',
        reorderPoint: '',
        brand: ''
    });

    // Load inventory data from API
    useEffect(() => {
        fetch(`${API_BASE_URL}/api/inventory`)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                const validData = data.map(item => ({
                    ...item,
                    price: Number(item.price)
                }));
                setInventory(validData);
            })
            .catch(error => {
                console.error('Error fetching inventory:', error);
                // Add user-friendly error handling
                alert('Failed to load inventory. Please check if the server is running.');
            });
    }, [refreshTrigger]);

    // Handle sorting
    const handleSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);

        const sortedInventory = [...inventory].sort((a, b) => {
            if (property === 'stock' || property === 'price') {
                return isAsc ? b[property] - a[property] : a[property] - b[property];
            }
            return isAsc
                ? b[property].toString().localeCompare(a[property].toString())
                : a[property].toString().localeCompare(b[property].toString());
        });

        setInventory(sortedInventory);
    };

    // Create new product
    const handleCreateProduct = () => {
        // Convert string values to numbers where needed
        const productData = {
            name: newProduct.name,
            sku: newProduct.sku,
            category: newProduct.category,
            stock: parseInt(newProduct.stock, 10),
            price: parseFloat(newProduct.price),
            reorderPoint: parseInt(newProduct.reorderPoint, 10),
            brand: newProduct.brand || ''
        };

        // Validate numeric fields
        if (isNaN(productData.stock) || isNaN(productData.price) || isNaN(productData.reorderPoint)) {
            alert('Please enter valid numbers for stock, price, and reorder point');
            return;
        }

        fetch(`${API_BASE_URL}/api/inventory`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(productData)
        })
            .then(res => {
                if (!res.ok) {
                    return res.json().then(err => Promise.reject(err));
                }
                return res.json();
            })
            .then(() => {
                setCreateDialogOpen(false);
                setNewProduct({
                    name: '',
                    sku: '',
                    category: '',
                    stock: '',
                    price: '',
                    reorderPoint: '',
                    brand: ''
                });
                setRefreshTrigger(prev => prev + 1);
            })
            .catch(error => {
                console.error('Error creating product:', error);
                alert(error.error || 'Failed to create product. Please try again.');
            });
    };

    // Delete product
    const handleDeleteProduct = (id) => {
        if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
            fetch(`${API_BASE_URL}/api/inventory/${id}`, {
                method: 'DELETE',
            })
                .then(res => {
                    if (!res.ok) {
                        return res.json().then(err => Promise.reject(err));
                    }
                    return res.json();
                })
                .then(data => {
                    setRefreshTrigger(prev => prev + 1);
                })
                .catch(error => {
                    console.error('Error deleting product:', error);
                    alert(error.message || 'Failed to delete product');
                });
        }
    };

    // Open edit dialog
    const handleEditClick = (item) => {
        setSelectedItem(item);
        setEditQuantity(item.stock.toString());
        setEditDialogOpen(true);
    };

    // Handle stock update
    const handleStockUpdate = () => {
        const newQuantity = parseInt(editQuantity);
        if (isNaN(newQuantity) || newQuantity < 0) {
            alert('Please enter a valid quantity');
            return;
        }

        fetch(`${API_BASE_URL}/api/inventory/${selectedItem.id}/stock`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                newQuantity,
                reason: editReason
            })
        })
            .then(res => {
                if (!res.ok) {
                    return res.json().then(err => Promise.reject(err));
                }
                return res.json();
            })
            .then(updatedItem => {
                setEditDialogOpen(false);
                setSelectedItem(null);
                setEditQuantity('');
                setEditReason('adjustment');
                setRefreshTrigger(prev => prev + 1);
            })
            .catch(error => {
                console.error('Error updating stock:', error);
                alert(error.message || 'Failed to update stock level');
            });
    };

    // Filter inventory based on search query
    const filteredInventory = inventory.filter(item =>
        Object.values(item).some(value =>
            value.toString().toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    // Get stock level status
    const getStockStatus = (stock, reorderPoint) => {
        if (stock === 0) {
            return { label: 'Out of Stock', color: 'error' };
        } else if (stock <= reorderPoint * 0.5) {
            return { label: 'Critical Low', color: 'error' };
        } else if (stock <= reorderPoint) {
            return { label: 'Low Stock', color: 'warning' };
        }
        return { label: 'In Stock', color: 'success' };
    };

    // Calculate total inventory value
    const totalValue = inventory.reduce((sum, item) => sum + (item.stock * item.price), 0);

    return (
        <Box sx={{ p: 3, maxWidth: '100%', width: '100%' }}>
            {/* Header Section */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ mb: 1, color: 'primary.main', fontWeight: 600 }}>
                    Inventory Management
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Total Inventory Value: ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
            </Box>

            {/* Search Bar and Add Product Button */}
            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Search inventory by name, SKU, or category..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setCreateDialogOpen(true)}
                        sx={{ whiteSpace: 'nowrap' }}
                    >
                        Add New Product
                    </Button>
                </Box>
            </Box>

            {/* Inventory Table */}
            <TableContainer component={Paper} sx={{
                boxShadow: 2,
                borderRadius: 2,
                overflow: 'hidden',
                '& ::-webkit-scrollbar': {
                    width: '8px',
                    height: '8px',
                },
                '& ::-webkit-scrollbar-track': {
                    backgroundColor: 'transparent',
                },
                '& ::-webkit-scrollbar-thumb': {
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    borderRadius: '4px',
                    '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    },
                },
            }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: 'primary.main' }}>
                            <TableCell sx={{ color: 'white' }}>
                                <TableSortLabel
                                    active={orderBy === 'name'}
                                    direction={orderBy === 'name' ? order : 'asc'}
                                    onClick={() => handleSort('name')}
                                    sx={{
                                        color: 'white !important',
                                        '& .MuiTableSortLabel-icon': {
                                            color: 'white !important',
                                        },
                                    }}
                                >
                                    Product Name
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ color: 'white' }}>SKU</TableCell>
                            <TableCell sx={{ color: 'white' }}>Category</TableCell>
                            <TableCell sx={{ color: 'white' }}>
                                <TableSortLabel
                                    active={orderBy === 'stock'}
                                    direction={orderBy === 'stock' ? order : 'asc'}
                                    onClick={() => handleSort('stock')}
                                    sx={{
                                        color: 'white !important',
                                        '& .MuiTableSortLabel-icon': {
                                            color: 'white !important',
                                        },
                                    }}
                                >
                                    Stock Level
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ color: 'white' }}>Status</TableCell>
                            <TableCell sx={{ color: 'white' }}>
                                <TableSortLabel
                                    active={orderBy === 'price'}
                                    direction={orderBy === 'price' ? order : 'asc'}
                                    onClick={() => handleSort('price')}
                                    sx={{
                                        color: 'white !important',
                                        '& .MuiTableSortLabel-icon': {
                                            color: 'white !important',
                                        },
                                    }}
                                >
                                    Unit Price
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ color: 'white' }}>Total Value</TableCell>
                            <TableCell sx={{ color: 'white' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredInventory.map((item) => {
                            const stockStatus = getStockStatus(item.stock, item.reorder_point);
                            return (
                                <TableRow key={item.id} hover>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell>{item.sku}</TableCell>
                                    <TableCell>{item.category}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {item.stock}
                                            {item.stock <= item.reorder_point && (
                                                <WarningIcon color="warning" sx={{ fontSize: 20 }} />
                                            )}
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEditClick(item)}
                                                sx={{ ml: 1 }}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={stockStatus.label}
                                            color={stockStatus.color}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>${item.price.toFixed(2)}</TableCell>
                                    <TableCell>${(item.stock * item.price).toFixed(2)}</TableCell>
                                    <TableCell>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDeleteProduct(item.id)}
                                            color="error"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Edit Stock Dialog */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
                <DialogTitle>
                    Update Stock Level
                </DialogTitle>
                <DialogContent sx={{ width: 400, pt: 2 }}>
                    {selectedItem && (
                        <>
                            <Typography variant="subtitle1" sx={{ mb: 2 }}>
                                {selectedItem.name} (SKU: {selectedItem.sku})
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    label="New Quantity"
                                    type="number"
                                    value={editQuantity}
                                    onChange={(e) => setEditQuantity(e.target.value)}
                                    fullWidth
                                    InputProps={{
                                        inputProps: { min: 0 }
                                    }}
                                />
                                <FormControl fullWidth>
                                    <InputLabel>Reason for Change</InputLabel>
                                    <Select
                                        value={editReason}
                                        label="Reason for Change"
                                        onChange={(e) => setEditReason(e.target.value)}
                                    >
                                        <MenuItem value="adjustment">Stock Adjustment</MenuItem>
                                        <MenuItem value="recount">Inventory Recount</MenuItem>
                                        <MenuItem value="damaged">Damaged/Lost Items</MenuItem>
                                        <MenuItem value="received">New Stock Received</MenuItem>
                                        <MenuItem value="returned">Customer Return</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleStockUpdate}
                        disabled={!editQuantity || isNaN(parseInt(editQuantity)) || parseInt(editQuantity) < 0}
                    >
                        Update Stock
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Create Product Dialog */}
            <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogContent sx={{ width: 400, pt: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Product Name"
                            value={newProduct.name}
                            onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                            fullWidth
                            required
                        />
                        <TextField
                            label="SKU"
                            value={newProduct.sku}
                            onChange={(e) => setNewProduct(prev => ({ ...prev, sku: e.target.value }))}
                            fullWidth
                            required
                            helperText="Must be unique"
                        />
                        <TextField
                            label="Brand"
                            value={newProduct.brand}
                            onChange={(e) => setNewProduct(prev => ({ ...prev, brand: e.target.value }))}
                            fullWidth
                            required
                        />
                        <TextField
                            label="Category"
                            value={newProduct.category}
                            onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                            fullWidth
                            required
                        />
                        <TextField
                            label="Initial Stock"
                            type="number"
                            value={newProduct.stock}
                            onChange={(e) => setNewProduct(prev => ({ ...prev, stock: e.target.value }))}
                            fullWidth
                            required
                            InputProps={{ inputProps: { min: 0 } }}
                        />
                        <TextField
                            label="Unit Price"
                            type="number"
                            value={newProduct.price}
                            onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                            fullWidth
                            required
                            InputProps={{
                                inputProps: { min: 0, step: "0.01" },
                                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                        />
                        <TextField
                            label="Reorder Point"
                            type="number"
                            value={newProduct.reorderPoint}
                            onChange={(e) => setNewProduct(prev => ({ ...prev, reorderPoint: e.target.value }))}
                            fullWidth
                            required
                            InputProps={{ inputProps: { min: 0 } }}
                            helperText="Stock level at which to reorder"
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => {
                        setCreateDialogOpen(false);
                        setNewProduct({
                            name: '',
                            sku: '',
                            category: '',
                            stock: '',
                            price: '',
                            reorderPoint: '',
                            brand: ''
                        });
                    }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleCreateProduct}
                        disabled={!newProduct.name || !newProduct.sku || !newProduct.category ||
                            !newProduct.stock || !newProduct.price || !newProduct.reorderPoint || !newProduct.brand}
                    >
                        Create Product
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Inventory;