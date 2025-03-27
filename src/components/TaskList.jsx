import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useDrop } from 'react-dnd';
import {
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  CircularProgress,
  Alert,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Paper,
  Snackbar,
} from '@mui/material';
import {
  deleteTask,
  toggleTask,
  updateTaskPriority,
  updateTaskStatus,
  loadTasks,
  fetchWeather,
  updateTaskWeather,
  setFilter,
  setSort,
  selectFilteredTasks,
} from '../store/slices/taskSlice';
import DraggableTask from './DraggableTask';

const TaskList = ({ status }) => {
  const dispatch = useDispatch();
  const { loading, error, filters, sortBy, sortOrder } = useSelector((state) => state.tasks);
  const tasks = useSelector(selectFilteredTasks);
  const [editingTask, setEditingTask] = useState(null);
  const [editText, setEditText] = useState('');
  const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'success' });

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'TASK',
    drop: (item) => {
      if (item.status !== status) {
        dispatch(updateTaskStatus({ id: item.id, status }));
        
        // Update completion status based on the section
        if (status === 'completed') {
          // Mark as completed when dropped in Completed section
          if (!item.completed) {
            dispatch(toggleTask(item.id));
          }
        } else {
          // Mark as incomplete when dropped in To Do or In Progress sections
          if (item.completed) {
            dispatch(toggleTask(item.id));
          }
        }
        
        setSnackbar({
          open: true,
          message: `Task moved to ${status}`,
          severity: 'success',
        });
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  // Load tasks on component mount
  useEffect(() => {
    dispatch(loadTasks());
  }, [dispatch]);

  // Memoized handlers for task actions
  const handleDelete = useCallback((id) => {
    dispatch(deleteTask(id));
    setSnackbar({
      open: true,
      message: 'Task deleted successfully!',
      severity: 'success'
    });
  }, [dispatch]);

  const handleToggle = useCallback((id) => {
    dispatch(toggleTask(id));
    setSnackbar({
      open: true,
      message: 'Task status updated!',
      severity: 'success'
    });
  }, [dispatch]);

  const handlePriorityChange = useCallback((id, currentPriority) => {
    const priorities = ['low', 'medium', 'high'];
    const currentIndex = priorities.indexOf(currentPriority);
    const nextPriority = priorities[(currentIndex + 1) % priorities.length];
    dispatch(updateTaskPriority({ id, priority: nextPriority }));
    setSnackbar({
      open: true,
      message: 'Task priority updated!',
      severity: 'success'
    });
  }, [dispatch]);

  const handleWeatherCheck = useCallback(async (id, location) => {
    try {
      const result = await dispatch(fetchWeather(location)).unwrap();
      dispatch(updateTaskWeather({ id, weather: result }));
      setSnackbar({
        open: true,
        message: 'Weather information updated!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to fetch weather:', error);
      dispatch(updateTaskWeather({ 
        id, 
        weather: { error: error.message || 'Failed to fetch weather data' }
      }));
      setSnackbar({
        open: true,
        message: 'Failed to fetch weather data',
        severity: 'error'
      });
    }
  }, [dispatch]);

  const handleFilterChange = useCallback((filter, value) => {
    dispatch(setFilter({ filter, value }));
  }, [dispatch]);

  const handleSortChange = useCallback((sortBy, sortOrder) => {
    dispatch(setSort({ sortBy, sortOrder }));
  }, [dispatch]);

  const handleEdit = useCallback((task) => {
    setEditingTask(task.id);
    setEditText(task.text);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (editText.trim()) {
      dispatch({
        type: 'tasks/updateTask',
        payload: { id: editingTask, text: editText.trim() },
      });
      setEditingTask(null);
      setEditText('');
      setSnackbar({
        open: true,
        message: 'Task updated successfully!',
        severity: 'success'
      });
    }
  }, [dispatch, editingTask, editText]);

  const handleCancelEdit = useCallback(() => {
    setEditingTask(null);
    setEditText('');
  }, []);

  const handleEditTextChange = useCallback((value) => {
    setEditText(value);
  }, []);

  // Memoized task statistics
  const taskStats = useMemo(() => ({
    total: tasks.length,
    completed: tasks.filter(task => task.completed).length,
    highPriority: tasks.filter(task => task.priority === 'high').length,
    outdoorTasks: tasks.filter(task => task.isOutdoor).length,
  }), [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        const matchesStatus = task.status === status;
        const matchesSearch = task.text.toLowerCase().includes(filters.search.toLowerCase());
        const matchesPriority = filters.priority === 'all' || task.priority === filters.priority;
        
        return matchesStatus && matchesSearch && matchesPriority;
      })
      .sort((a, b) => {
        const order = sortOrder === 'asc' ? 1 : -1;
        if (sortBy === 'priority') {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return (priorityOrder[a.priority] - priorityOrder[b.priority]) * order;
        }
        if (sortBy === 'createdAt') {
          return (new Date(a.createdAt) - new Date(b.createdAt)) * order;
        }
        return 0;
      });
  }, [tasks, status, filters, sortBy, sortOrder]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <div className="task-container">
      <div className="task-header">
        <Typography variant="h6" className="task-title">
          {status === 'active' ? 'All Tasks' : status === 'inProgress' ? 'In Progress' : 'Completed'}
        </Typography>
        <span className="task-count">
          {filteredTasks.length} tasks
        </span>
      </div>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Search Tasks"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            size="small"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Priority Filter</InputLabel>
            <Select
              value={filters.priority}
              label="Priority Filter"
              onChange={(e) => handleFilterChange('priority', e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Box
        ref={drop}
        sx={{
          minHeight: '200px',
          bgcolor: isOver ? 'action.hover' : 'transparent',
          borderRadius: 1,
          transition: 'background-color 0.2s',
        }}
      >
        <List className="task-list">
          {filteredTasks.map((task) => (
            <DraggableTask
              key={task.id}
              task={task}
              onDelete={handleDelete}
              onToggle={handleToggle}
              onWeatherCheck={handleWeatherCheck}
              onEdit={handleEdit}
              onPriorityChange={handlePriorityChange}
              editingTask={editingTask}
              editText={editText}
              onEditTextChange={handleEditTextChange}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={handleCancelEdit}
            />
          ))}
          {filteredTasks.length === 0 && (
            <ListItem>
              <ListItemText primary="No tasks found. Try adjusting your filters." />
            </ListItem>
          )}
        </List>
      </Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default TaskList; 