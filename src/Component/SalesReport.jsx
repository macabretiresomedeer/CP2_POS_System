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
    Typography,
    Button,
    TextField,
    InputAdornment,
    Stack,
    Chip,
    Card,
    CardContent,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

const SalesReport = () => {
    const [sales, setSales] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [filteredSales, setFilteredSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch sales data for the selected date
    useEffect(() => {
        const fetchSalesData = async () => {
            try {
                setLoading(true);
                const response = await fetch(`http://localhost:5000/api/sales/${selectedDate.format('YYYY-MM-DD')}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch sales data');
                }
                const data = await response.json();
                setSales(data);
                setError(null);
            } catch (err) {
                console.error('Error fetching sales:', err);
                setError('Failed to load sales data');
            } finally {
                setLoading(false);
            }
        };

        fetchSalesData();
    }, [selectedDate]);

    // Filter sales based on search query
    useEffect(() => {
        const filtered = sales.filter(sale =>
            sale.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sale.payment_method?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sale.items?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredSales(filtered);
    }, [sales, searchQuery]);

    // Calculate daily statistics
    const calculateDailyStats = (salesData) => {
        if (!salesData || salesData.length === 0) {
            return {
                totalSales: 0,
                totalTransactions: 0,
                totalItems: 0,
                averageTransactionValue: 0
            };
        }

        const totalSales = salesData.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
        const totalTransactions = salesData.length;
        const totalItems = salesData.reduce((sum, sale) => {
            const itemsCount = sale.items?.split(',')
                .reduce((count, item) => {
                    const quantity = parseInt(item.split('x')[0]) || 0;
                    return count + quantity;
                }, 0) || 0;
            return sum + itemsCount;
        }, 0);
        const averageTransactionValue = totalSales / totalTransactions || 0;

        return {
            totalSales,
            totalTransactions,
            totalItems,
            averageTransactionValue
        };
    };

    const stats = calculateDailyStats(filteredSales);

    // Export to Excel function
    const exportToExcel = () => {
        const exportData = filteredSales.map(sale => ({
            'Transaction ID': sale.transaction_id,
            'Date & Time': dayjs(sale.created_at).format('YYYY-MM-DD HH:mm:ss'),
            'Customer': sale.customer_name,
            'Items': sale.items,
            'Total Amount': `$${Number(sale.total_amount).toFixed(2)}`,
            'Payment Method': sale.payment_method
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sales Report');
        XLSX.writeFile(wb, `sales_report_${selectedDate.format('YYYY-MM-DD')}.xlsx`);
    };

    return (
        <Box sx={{ p: 3, maxWidth: '100%', width: '100%' }}>
            {/* Header Section */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 600 }}>
                    Sales Report
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<FileDownloadIcon />}
                    onClick={exportToExcel}
                    disabled={filteredSales.length === 0}
                >
                    Export to Excel
                </Button>
            </Stack>

            {/* Stats Cards */}
            <Box sx={{ mb: 4 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Stack spacing={2}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography color="text.secondary" variant="h6">
                                            Total Sales
                                        </Typography>
                                        <AttachMoneyIcon color="primary" />
                                    </Stack>
                                    <Typography variant="h4">
                                        ${stats.totalSales.toFixed(2)}
                                    </Typography>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Stack spacing={2}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography color="text.secondary" variant="h6">
                                            Transactions
                                        </Typography>
                                        <ShoppingCartIcon color="primary" />
                                    </Stack>
                                    <Typography variant="h4">
                                        {stats.totalTransactions}
                                    </Typography>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Stack spacing={2}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography color="text.secondary" variant="h6">
                                            Items Sold
                                        </Typography>
                                        <ShoppingCartIcon color="primary" />
                                    </Stack>
                                    <Typography variant="h4">
                                        {stats.totalItems}
                                    </Typography>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Stack spacing={2}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography color="text.secondary" variant="h6">
                                            Avg. Transaction
                                        </Typography>
                                        <TrendingUpIcon color="primary" />
                                    </Stack>
                                    <Typography variant="h4">
                                        ${stats.averageTransactionValue.toFixed(2)}
                                    </Typography>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>

            {/* Filters */}
            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                        label="Select Date"
                        value={selectedDate}
                        onChange={(newValue) => setSelectedDate(newValue)}
                        sx={{ width: 200 }}
                    />
                </LocalizationProvider>

                <TextField
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ flexGrow: 1 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />
            </Stack>

            {/* Sales Table */}
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
                            <TableCell sx={{ color: 'white' }}>Time</TableCell>
                            <TableCell sx={{ color: 'white' }}>Transaction ID</TableCell>
                            <TableCell sx={{ color: 'white' }}>Customer</TableCell>
                            <TableCell sx={{ color: 'white' }}>Items</TableCell>
                            <TableCell sx={{ color: 'white' }}>Payment Method</TableCell>
                            <TableCell sx={{ color: 'white' }}>Total</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">Loading sales data...</TableCell>
                            </TableRow>
                        ) : error ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ color: 'error.main' }}>{error}</TableCell>
                            </TableRow>
                        ) : filteredSales.length > 0 ? (
                            filteredSales.map((sale) => (
                                <TableRow key={sale.id} hover>
                                    <TableCell>{dayjs(sale.created_at).format('HH:mm:ss')}</TableCell>
                                    <TableCell>{sale.transaction_id}</TableCell>
                                    <TableCell>{sale.customer_name}</TableCell>
                                    <TableCell>
                                        {sale.items?.split(',').map((item, index) => (
                                            <Typography key={index} variant="body2">
                                                {item.trim()}
                                            </Typography>
                                        ))}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={sale.payment_method}
                                            color={sale.payment_method.toLowerCase() === 'cash' ? 'success' : 'primary'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>${Number(sale.total_amount).toFixed(2)}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    <Typography variant="h6" sx={{ py: 3, color: 'text.secondary' }}>
                                        No sales found for {selectedDate.format('YYYY-MM-DD')}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default SalesReport;