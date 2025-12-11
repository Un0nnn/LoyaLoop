import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Avatar from '@mui/material/Avatar';
import MenuIcon from '@mui/icons-material/Menu';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import { getNavigationForRole } from "../roleAccess";
import { getHomeRouteForRole } from "../roleAccess";

const NavBarComp = () => {
    const { currentUser, logout, activeInterface, switchInterface } = useAuth();
    const navigate = useNavigate();
    const [anchorElNav, setAnchorElNav] = React.useState(null);
    const [anchorElUser, setAnchorElUser] = React.useState(null);

    // Get navigation items for the active interface (may be different from user's role)
    const pages = React.useMemo(() => {
        const roleToUse = activeInterface || currentUser?.role;
        const nav = getNavigationForRole(roleToUse) || [];
        const seen = new Set();
        return nav.filter(item => {
            const key = item.to || item.key || JSON.stringify(item);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }, [currentUser?.role, activeInterface]);

    // Determine allowed interfaces for the current user's role
    const getAllowedInterfaces = (role) => {
        switch (role) {
            case 'superuser': return ['superuser','manager','cashier','organizer','regular'];
            case 'manager': return ['manager','cashier','organizer','regular'];
            case 'organizer': return ['organizer','regular'];
            case 'cashier': return ['cashier','regular'];
            default: return ['regular'];
        }
    };

    const ifaceLabels = {
        regular: 'User',
        cashier: 'Cashier',
        organizer: 'Organizer',
        manager: 'Manager',
        superuser: 'Superuser',
    };

    const handleOpenNavMenu = (event) => {
        setAnchorElNav(event.currentTarget);
    };
    const handleCloseNavMenu = () => {
        setAnchorElNav(null);
    };

    const handleOpenUserMenu = (event) => {
        setAnchorElUser(event.currentTarget);
    };
    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };

    const handleLogout = () => {
        logout();
        handleCloseUserMenu();
        navigate('/login');
    };

    return (
        <AppBar position="static"
                sx={{
                    backgroundColor: 'transparent',
                    boxShadow: 'none',
                }}
        >
            <Toolbar>
                <Typography
                    variant="h6"
                    component={Link}
                    to="/"
                    sx={{ color: 'inherit', textDecoration: 'none', mr: 2 }}
                >
                </Typography>

                {/* Desktop links */}
                <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 1 }}>
                    {pages.map((p) => (
                        <Button
                            key={p.to}
                            component={Link}
                            to={p.to}
                            color="inherit"
                            sx={{ textTransform: 'none' }}
                        >
                            {p.label}
                        </Button>
                    ))}
                </Box>

                {/* Mobile menu icon */}
                <Box sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }}>
                    <IconButton
                        size="large"
                        aria-label="menu"
                        aria-controls="menu-appbar"
                        aria-haspopup="true"
                        onClick={handleOpenNavMenu}
                        color="inherit"
                    >
                        <MenuIcon />
                    </IconButton>
                    <Menu
                        id="menu-appbar"
                        anchorEl={anchorElNav}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                        keepMounted
                        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                        open={Boolean(anchorElNav)}
                        onClose={handleCloseNavMenu}
                    >
                        {pages.map((p) => (
                            <MenuItem
                                key={p.to}
                                component={Link}
                                to={p.to}
                                onClick={handleCloseNavMenu}
                            >
                                {p.label}
                            </MenuItem>
                        ))}
                    </Menu>
                </Box>

                {/* QR shortcut */}
                <Tooltip title="My QR" disableInteractive>
                    <IconButton component={Link} to="/qr?mode=user" color="inherit" sx={{ml:1, color : 'grey', top: 2}}>
                        <QrCode2Icon />
                    </IconButton>
                </Tooltip>

                {/* Profile / User menu */}
                <Box sx={{ ml: 1 }}>
                    {currentUser ? (
                        <>
                            <IconButton onClick={handleOpenUserMenu} color="inherit">
                                <Avatar alt={currentUser?.name || currentUser?.utorid || 'U'} src={currentUser?.avatar || ''} />
                            </IconButton>
                            <Menu
                                anchorEl={anchorElUser}
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                keepMounted
                                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                open={Boolean(anchorElUser)}
                                onClose={handleCloseUserMenu}
                            >
                                <MenuItem component={Link} to="/profile" onClick={handleCloseUserMenu}>View Profile</MenuItem>
                                <MenuItem component={Link} to="/profile" onClick={handleCloseUserMenu}>Edit Profile</MenuItem>
                                <Divider />
                                {/* Interface switcher */}
                                {currentUser && (
                                    <div style={{paddingLeft:12, paddingRight:12}}>
                                        <div style={{fontSize:12, color:'rgba(0,0,0,0.54)', paddingTop:8}}>Active: {ifaceLabels[activeInterface || currentUser.role] || (activeInterface || currentUser.role)}</div>
                                        {getAllowedInterfaces(currentUser.role).map(iface => (
                                            <MenuItem key={iface} onClick={() => {
                                                const ok = switchInterface(iface);
                                                handleCloseUserMenu();
                                                // if switch succeeded navigate to the interface home route
                                                if (ok) {
                                                    try {
                                                        const homeRoute = getHomeRouteForRole(iface);
                                                        navigate(homeRoute, { replace: true, state: { interfaceSwitch: Date.now() } });
                                                    } catch (e) {}
                                                }
                                            }} selected={iface === (activeInterface || currentUser.role)}>
                                                {ifaceLabels[iface] || iface}
                                            </MenuItem>
                                        ))}
                                    </div>
                                )}
                                <Divider />
                                <MenuItem onClick={handleLogout}>Logout</MenuItem>
                             </Menu>
                        </>
                    ) : (
                        <Button component={Link} to="/login" color="inherit" variant="outlined" sx={{borderColor:'rgba(255,255,255,0.2)', textTransform:'none'}}>Login</Button>

                    )}
                </Box>
             </Toolbar>
         </AppBar>
     );
 }

 export default NavBarComp;
