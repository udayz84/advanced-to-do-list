import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const WEATHER_API_KEY = 'ebc5590ab99d1c0acb54ba47dc712ccd';
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';
const GEOCODING_API_URL = 'https://api.openweathermap.org/geo/1.0/direct';

// Storage keys
const STORAGE_KEYS = {
  TASKS: 'todo_tasks',
  FILTERS: 'todo_filters',
  SORT: 'todo_sort',
  UI_PREFERENCES: 'todo_ui_preferences',
  WEATHER_CACHE: 'todo_weather_cache',
};

// Helper functions for storage
const storage = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from localStorage: ${error}`);
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage: ${error}`);
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from localStorage: ${error}`);
    }
  },
};

// Session storage helper
const sessionStorage = {
  get: (key) => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from sessionStorage: ${error}`);
      return null;
    }
  },
  set: (key, value) => {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to sessionStorage: ${error}`);
    }
  },
};

// Load initial state from localStorage
const loadState = () => {
  try {
    const serializedState = localStorage.getItem('tasks');
    if (serializedState === null) {
      return undefined;
    }
    const state = JSON.parse(serializedState);
    // Ensure all required fields exist
    return {
      ...initialState,
      ...state,
      tasks: state.tasks || [],
      filters: state.filters || initialState.filters,
      sortBy: state.sortBy || initialState.sortBy,
      sortOrder: state.sortOrder || initialState.sortOrder,
      ui: state.ui || initialState.ui,
    };
  } catch (err) {
    console.error('Error loading state:', err);
    return undefined;
  }
};

// Save state to localStorage
const saveState = (state) => {
  try {
    // Only save necessary data
    const stateToSave = {
      tasks: state.tasks,
      filters: state.filters,
      sortBy: state.sortBy,
      sortOrder: state.sortOrder,
      ui: state.ui,
    };
    localStorage.setItem('tasks', JSON.stringify(stateToSave));
  } catch (err) {
    console.error('Error saving state:', err);
  }
};

// Async thunks
export const fetchWeather = createAsyncThunk(
  'tasks/fetchWeather',
  async (city) => {
    try {
      const response = await axios.get(WEATHER_API_URL, {
        params: {
          q: city,
          appid: WEATHER_API_KEY,
          units: 'metric',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch weather data');
    }
  }
);

export const fetchCitySuggestions = createAsyncThunk(
  'tasks/fetchCitySuggestions',
  async (query, { rejectWithValue }) => {
    try {
      // Check session storage for recent suggestions
      const cachedSuggestions = sessionStorage.get(`city_suggestions_${query}`);
      if (cachedSuggestions) {
        return cachedSuggestions;
      }

      const response = await axios.get(GEOCODING_API_URL, {
        params: {
          q: query,
          limit: 5,
          appid: WEATHER_API_KEY,
        },
      });

      // Cache suggestions in session storage
      sessionStorage.set(`city_suggestions_${query}`, response.data);

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch city suggestions');
    }
  }
);

const initialState = {
  tasks: [],
  loading: false,
  error: null,
  weatherData: {},
  filters: {
    search: '',
    priority: 'all',
    status: 'all',
  },
  sortBy: 'createdAt',
  sortOrder: 'desc',
  citySuggestions: [],
  ui: {
    isMobile: false,
    isTablet: false,
  },
};

const taskSlice = createSlice({
  name: 'tasks',
  initialState: loadState() || initialState,
  reducers: {
    addTask: (state, action) => {
      const newTask = {
        ...action.payload,
        id: Date.now(),
        createdAt: new Date().toISOString(),
        completed: false,
        status: 'active',
        weather: null,
      };
      state.tasks.push(newTask);
      saveState(state);
    },
    deleteTask: (state, action) => {
      state.tasks = state.tasks.filter((task) => task.id !== action.payload);
      saveState(state);
    },
    toggleTask: (state, action) => {
      const task = state.tasks.find((task) => task.id === action.payload);
      if (task) {
        task.completed = !task.completed;
        saveState(state);
      }
    },
    updateTask: (state, action) => {
      const { id, text } = action.payload;
      const task = state.tasks.find((task) => task.id === id);
      if (task) {
        task.text = text;
        saveState(state);
      }
    },
    updateTaskPriority: (state, action) => {
      const { id, priority } = action.payload;
      const task = state.tasks.find((task) => task.id === id);
      if (task) {
        task.priority = priority;
        saveState(state);
      }
    },
    updateTaskStatus: (state, action) => {
      const { id, status } = action.payload;
      const task = state.tasks.find((task) => task.id === id);
      if (task) {
        task.status = status;
        saveState(state);
      }
    },
    updateTaskWeather: (state, action) => {
      const { id, weather } = action.payload;
      const task = state.tasks.find((task) => task.id === id);
      if (task) {
        task.weather = weather;
        saveState(state);
      }
    },
    setFilter: (state, action) => {
      const { filter, value } = action.payload;
      state.filters[filter] = value;
      saveState(state);
    },
    setSort: (state, action) => {
      const { sortBy, sortOrder } = action.payload;
      state.sortBy = sortBy;
      state.sortOrder = sortOrder;
      saveState(state);
    },
    updateUIBreakpoint: (state, action) => {
      state.ui = action.payload;
      saveState(state);
    },
    loadTasks: (state) => {
      const savedState = loadState();
      if (savedState) {
        Object.assign(state, savedState);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWeather.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWeather.fulfilled, (state, action) => {
        state.loading = false;
        state.weatherData = action.payload;
      })
      .addCase(fetchWeather.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchCitySuggestions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCitySuggestions.fulfilled, (state, action) => {
        state.loading = false;
        state.citySuggestions = action.payload;
      })
      .addCase(fetchCitySuggestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  addTask,
  deleteTask,
  toggleTask,
  updateTask,
  updateTaskPriority,
  updateTaskStatus,
  updateTaskWeather,
  setFilter,
  setSort,
  updateUIBreakpoint,
  loadTasks,
} = taskSlice.actions;

export const selectFilteredTasks = (state) => {
  const { tasks, filters, sortBy, sortOrder } = state.tasks;
  return tasks
    .filter((task) => {
      const matchesSearch = task.text.toLowerCase().includes(filters.search.toLowerCase());
      const matchesPriority = filters.priority === 'all' || task.priority === filters.priority;
      const matchesStatus = filters.status === 'all' || task.status === filters.status;
      return matchesSearch && matchesPriority && matchesStatus;
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
};

export default taskSlice.reducer; 