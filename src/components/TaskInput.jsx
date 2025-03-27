import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Typography,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import { addTask, fetchWeather, updateTaskWeather } from '../store/slices/taskSlice';
import axios from 'axios';

const WEATHER_API_KEY = 'ebc5590ab99d1c0acb54ba47dc712ccd';
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';

const TaskInput = () => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.tasks);
  const [taskData, setTaskData] = useState({
    text: '',
    priority: 'medium',
    isOutdoor: false,
    location: '',
  });
  const [cityOptions, setCityOptions] = useState([]);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleLocationInputChange = useCallback(async (value) => {
    if (value.length >= 2) {
      try {
        const response = await axios.get(
          `https://api.openweathermap.org/geo/1.0/direct?q=${value}&limit=5&appid=${WEATHER_API_KEY}`
        );
        setCityOptions(response.data);
      } catch (error) {
        console.error('Error fetching city suggestions:', error);
        setCityOptions([]);
      }
    } else {
      setCityOptions([]);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!taskData.text.trim()) return;

    try {
      const newTask = {
        ...taskData,
        id: Date.now(),
        createdAt: new Date().toISOString(),
        completed: false,
        status: 'active',
      };

      dispatch(addTask(newTask));

      // If it's an outdoor task, fetch weather data immediately
      if (newTask.isOutdoor && newTask.location) {
        try {
          const result = await dispatch(fetchWeather(newTask.location)).unwrap();
          dispatch(updateTaskWeather({ id: newTask.id, weather: result }));
          setSnackbar({
            open: true,
            message: 'Task added with weather information!',
            severity: 'success'
          });
        } catch (weatherError) {
          console.error('Failed to fetch weather:', weatherError);
          setSnackbar({
            open: true,
            message: 'Task added but failed to fetch weather data',
            severity: 'warning'
          });
        }
      } else {
        setSnackbar({
          open: true,
          message: 'Task added successfully!',
          severity: 'success'
        });
      }

      setTaskData({ text: '', priority: 'medium', isOutdoor: false, location: '' });
      setShowLocationInput(false);
      setCityOptions([]);
      inputRef.current?.focus();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to add task',
        severity: 'error'
      });
    }
  };

  const handleInputChange = useCallback((e) => {
    const { name, value, checked } = e.target;
    setTaskData(prev => ({
      ...prev,
      [name]: name === 'isOutdoor' ? checked : value
    }));

    if (name === 'isOutdoor') {
      setShowLocationInput(checked);
      if (!checked) {
        setTaskData(prev => ({ ...prev, location: '' }));
      }
    }
  }, []);

  const handleLocationSelect = useCallback((city) => {
    setTaskData(prev => ({ ...prev, location: city.name }));
    setCityOptions([]);
  }, []);

  return (
    <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            inputRef={inputRef}
            fullWidth
            label="Add a new task"
            value={taskData.text}
            onChange={handleInputChange}
            name="text"
            size="small"
            required
          />

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={taskData.priority}
                label="Priority"
                onChange={handleInputChange}
                name="priority"
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Checkbox
                  checked={taskData.isOutdoor}
                  onChange={handleInputChange}
                  name="isOutdoor"
                  color="primary"
                />
              }
              label="Outdoor Task"
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading || !taskData.text.trim()}
              sx={{ minWidth: 120 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Add Task'}
            </Button>
          </Box>

          {showLocationInput && (
            <Box sx={{ position: 'relative' }}>
              <TextField
                fullWidth
                label="Location"
                value={taskData.location}
                onChange={(e) => {
                  handleInputChange(e);
                  handleLocationInputChange(e.target.value);
                }}
                name="location"
                size="small"
                required
              />
              {cityOptions.length > 0 && (
                <Paper
                  elevation={3}
                  sx={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    maxHeight: 200,
                    overflow: 'auto',
                  }}
                >
                  {cityOptions.map((city) => (
                    <Box
                      key={`${city.name}-${city.country}`}
                      sx={{
                        p: 1,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                      onClick={() => handleLocationSelect(city)}
                    >
                      <Typography variant="body2">
                        {city.name}, {city.country}
                      </Typography>
                    </Box>
                  ))}
                </Paper>
              )}
            </Box>
          )}
        </Box>
      </form>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

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
    </Paper>
  );
};

export default TaskInput; 