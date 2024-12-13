import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from "./Component/NavBar.jsx";
import HomeCards from "./Component/Main/HomeCards.jsx";
import Inventory from "./Component/Inventory.jsx";
import Footer from "./Component/footer.jsx";
import SalesReport from "./Component/SalesReport.jsx";
import Box from '@mui/material/Box';
import './global.css';
import MemberRegistration from "./Component/MemberRegistration.jsx";

const App = () => {
    return (
        <Router>
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <NavBar />
                <Box sx={{
                    flex: 1,
                    display: 'flex',
                    overflow: 'hidden',
                    position: 'relative'
                }}>
                    <Routes>
                        <Route path="/" element={<HomeCards />} />
                        <Route path="/main" element={<HomeCards />} />
                        <Route path="/inventory" element={<Inventory />} />
                        <Route path="/sales" element={<SalesReport />} />
                        <Route path="/registration" element={<MemberRegistration />} />
                        <Route path="*" element={<HomeCards />} />
                    </Routes>
                </Box>
                <Box
                    component="footer"
                    sx={{
                        py: 1.5,
                        textAlign: 'center',
                        background: '#070707',
                        position: 'relative',
                        zIndex: 1
                    }}
                >
                    <Footer />
                </Box>
            </Box>
        </Router>
    );
};

export default App;