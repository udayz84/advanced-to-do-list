import React from 'react';
import { useDrag } from 'react-dnd';
import {
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Box,
  Typography,
  Chip,
  Paper,
  Grid,
  Tooltip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Cloud as CloudIcon,
  Thermostat as ThermostatIcon,
  WaterDrop as WaterDropIcon,
  Air as AirIcon,
} from '@mui/icons-material';

const DraggableTask = ({
  task,
  onDelete,
  onToggle,
  onWeatherCheck,
  onEdit,
  onPriorityChange,
  editingTask,
  editText,
  onEditTextChange,
  onSaveEdit,
  onCancelEdit,
}) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'TASK',
    item: { id: task.id, status: task.status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <ListItem
      ref={drag}
      sx={{
        bgcolor: 'background.paper',
        mb: 1,
        borderRadius: 1,
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
    >
      <ListItemText
        primary={
          editingTask === task.id ? (
            <TextField
              fullWidth
              value={editText}
              onChange={(e) => onEditTextChange(e.target.value)}
              size="small"
              autoFocus
            />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                sx={{
                  color: task.completed ? 'text.secondary' : 'text.primary',
                  opacity: task.completed ? 0.7 : 1,
                }}
              >
                {task.text}
              </Typography>
              <Chip
                label={task.priority}
                size="small"
                color={
                  task.priority === 'high'
                    ? 'error'
                    : task.priority === 'medium'
                    ? 'warning'
                    : 'success'
                }
              />
            </Box>
          )
        }
        secondary={
          task.isOutdoor && task.weather && (
            <Box sx={{ mt: 1 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 1,
                  bgcolor: 'rgba(25, 118, 210, 0.08)',
                  borderRadius: 1,
                  border: '1px solid rgba(25, 118, 210, 0.12)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <CloudIcon color="primary" />
                  <Typography variant="body2" color="primary">
                    {task.weather.weather[0].description}
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <ThermostatIcon fontSize="small" color="primary" />
                      <Typography variant="body2">
                        {Math.round(task.weather.main.temp)}°C
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <WaterDropIcon fontSize="small" color="primary" />
                      <Typography variant="body2">
                        {task.weather.main.humidity}%
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AirIcon fontSize="small" color="primary" />
                      <Typography variant="body2">
                        {task.weather.wind.speed} m/s
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          )
        }
      />
      <ListItemSecondaryAction>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {editingTask === task.id ? (
            <>
              <IconButton
                edge="end"
                onClick={onSaveEdit}
                color="primary"
                size="small"
              >
                ✓
              </IconButton>
              <IconButton
                edge="end"
                onClick={onCancelEdit}
                color="error"
                size="small"
              >
                ✕
              </IconButton>
            </>
          ) : (
            <>
              {task.isOutdoor && (
                <Tooltip title="Update Weather">
                  <IconButton
                    edge="end"
                    onClick={() => onWeatherCheck(task.id, task.location)}
                    color="info"
                    size="small"
                  >
                    <CloudIcon />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Edit Task">
                <IconButton
                  edge="end"
                  onClick={() => onEdit(task)}
                  color="primary"
                  size="small"
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete Task">
                <IconButton
                  edge="end"
                  onClick={() => onDelete(task.id)}
                  color="error"
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </ListItemSecondaryAction>
    </ListItem>
  );
};

export default DraggableTask; 