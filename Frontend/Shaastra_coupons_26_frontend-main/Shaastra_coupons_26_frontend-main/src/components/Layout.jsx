// src/components/Layout.js
import React, { useContext, useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  IconButton, 
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Divider
} from '@mui/material';
import { Outlet, Link as RouterLink, useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { ColorModeContext } from '../App';
import { useAuth } from '../context/AuthContext';
import {
  Menu as MenuIcon,
  Dashboard,
  History,
  Person,
  Logout,
  Receipt,
  Settings
} from '@mui/icons-material';
// RIGHT ✅
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Brightness4Icon from '@mui/icons-material/Brightness4';


const drawerWidth = 280;

const Layout = () => {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleProfileMenuClose();
  };

  const navigationItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Transaction History', icon: <History />, path: '/history' },
    { text: 'Profile', icon: <Person />, path: '/profile' },
    ...(user && user.department === 'Finance' && user.role === 'Core' ? [{ text: 'Vendor Management', icon: <Receipt />, path: '/vendor-management' }]: [])
  ];

  const drawer = (
    // src/components/Layout.jsx
    // ✅ FIX: Dynamic logo based on theme (black/white PNGs)

    // In the drawer logo section, replace the Box component with:

    <Box sx={{ 
      p: 4, 
      textAlign: 'center', 
      borderBottom: 1, 
      borderColor: 'divider', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      {/* ✅ THEME-AWARE LOGO SWITCHING */}
      <Box
        component="img"
        src={theme.palette.mode === 'light' 
          ? "/Shaastra_2026_logo_black.png"  // ← Your black PNG for light mode
          : "/Shaastra_2026_logo_white.png"  // ← Your white PNG for dark mode
        }
        alt="Shaastra Logo"
        sx={{ 
          height: { xs: 72, sm: 56, md: 44 }, 
          mb: 1,
          transition: 'opacity 0.3s ease',
          '&:hover': {
            opacity: 0.8
          }
        }}
      />
      <Typography variant="h6" sx={{ 
        fontWeight: 700, 
        color: 'primary.main', 
        fontSize: { xs: '1.05rem', sm: '0.95rem' } 
      }}>
        Shaastra Wallet
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ 
        fontSize: { xs: '0.85rem', sm: '0.8rem' } 
      }}>
        Virtual Food Coupons
      </Typography>
    </Box>


  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color={theme.palette.mode === 'light' ? 'primary' : 'inherit'}
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ position: 'relative', width: '100%',textAlign: 'center' }}>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                color: theme.palette.mode === 'light' ? theme.palette.text.primary : 'inherit',
                fontWeight: 500,
                fontFamily: "'Poppins', sans-serif",
                fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.5rem' }
              }}
            >
              {navigationItems.find(item => item.path === location.pathname)?.text || 'Shaastra Wallet'}
            </Typography>
          </Box>
          {/* --- ADD THEME TOGGLE BUTTON HERE --- */}
          <IconButton 
            sx={{ ml: 1 }} 
            onClick={colorMode.toggleColorMode} 
            color={theme.palette.mode === 'light' ? 'primary' : 'inherit'}
            aria-label="toggle theme"
          >
            {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
          {/* --- END ADDITION --- */}
          {/* notifications removed (unused) */}

          {/* Profile Menu */}
          {isAuthenticated && (
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-controls={open ? 'account-menu' : undefined}
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {user?.name?.charAt(0)?.toUpperCase()}
              </Avatar>
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleProfileMenuClose} component={RouterLink} to="/profile">
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        {/* <MenuItem onClick={handleProfileMenuClose}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem> */}
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="mailbox folders"
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          PaperProps={{
            sx: {
              // push the temporary drawer content below the fixed AppBar on small screens
              top: { xs: '64px', sm: '64px' },
            }
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          backgroundColor: 'background.default',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;