import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  CssBaseline,
  ThemeProvider,
  Box,
  useMediaQuery,
  Grid,
  Paper,
  Typography,
  Button,
  AppBar,
  Toolbar,
  IconButton,
} from '@mui/material';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { loginSuccess, logout } from './store/slices/authSlice';
import { loadTasks } from './store/slices/taskSlice';
import Login from './components/Login';
import TaskInput from './components/TaskInput';
import TaskList from './components/TaskList';
import { updateUIBreakpoint } from './store/slices/taskSlice';
import theme from './styles/theme';
import './styles/global.css';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  useEffect(() => {
    // Load authentication state
    const isAuth = localStorage.getItem('isAuthenticated') === 'true';
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (isAuth && user) {
      dispatch(loginSuccess(user));
    }

    // Load tasks
    dispatch(loadTasks());

    // Update UI breakpoint
    dispatch(updateUIBreakpoint({
      isMobile: window.innerWidth < 768,
      isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
    }));

    // Handle window resize
    const handleResize = () => {
      dispatch(updateUIBreakpoint({
        isMobile: window.innerWidth < 768,
        isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
  };

  if (!isAuthenticated) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Login />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DndProvider backend={HTML5Backend}>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <AppBar position="static" color="primary" elevation={0}>
            <Toolbar>
              <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
                Task Manager
              </Typography>
              <Typography variant="body2" sx={{ mr: 2 }}>
                Welcome, {user?.name || 'User'}
              </Typography>
              <Button
                variant="outlined"
                color="inherit"
                onClick={handleLogout}
                sx={{ ml: 2 }}
              >
                Logout
              </Button>
            </Toolbar>
          </AppBar>
          <Container maxWidth={false} sx={{ py: { xs: 2, sm: 3, md: 4 }, flexGrow: 1 }}>
            <Box className="task-input-container">
              <TaskInput />
            </Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Paper className="task-column">
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                    To Do
                  </Typography>
                  <TaskList status="active" />
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper className="task-column">
                  <Typography variant="h6" gutterBottom sx={{ color: 'warning.main' }}>
                    In Progress
                  </Typography>
                  <TaskList status="inProgress" />
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper className="task-column">
                  <Typography variant="h6" gutterBottom sx={{ color: 'success.main' }}>
                    Completed
                  </Typography>
                  <TaskList status="completed" />
                </Paper>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </DndProvider>
    </ThemeProvider>
  );
}

export default App;
