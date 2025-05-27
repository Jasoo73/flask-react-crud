import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container, Typography, TextField, Button, List, ListItem, ListItemText,
  Box, Alert, AppBar, Toolbar, IconButton, ThemeProvider, createTheme
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';

const apiUrl = 'http://127.0.0.1:5000/api';

// Tema creativo con colores vibrantes
const theme = createTheme({
  palette: {
    primary: { main: '#FF6F61' },      // Coral vibrante
    secondary: { main: '#6B5B95' },    // Morado suave
    background: { paper: '#FFF2E6' }    // Fondo pastel claro
  }
});

function LoginRegister({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    try {
      const url = isRegister ? `${apiUrl}/register` : `${apiUrl}/login`;
      const payload = isRegister ? { username, password, email } : { username, password };
      const res = await axios.post(url, payload);
      if (!isRegister) {
        onLogin(res.data.access_token, username);
      } else {
        alert('Registro exitoso, ahora inicia sesión');
        setIsRegister(false);
        setUsername(''); setPassword(''); setEmail('');
      }
    } catch (err) {
      setError(err.response?.data?.msg || err.message || 'Error en la operación');
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="sm" sx={{ mt: 5, p: 4, borderRadius: 2, boxShadow: 3, bgcolor: 'background.paper' }}>
        <Typography variant="h4" align="center" gutterBottom sx={{ color: 'primary.main' }}>
          {isRegister ? 'Únete a CritiCorner' : 'Bienvenido a CritiCorner'}
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          label="Usuario"
          fullWidth margin="normal"
          value={username} onChange={(e) => setUsername(e.target.value)} sx={{ bgcolor: '#FFF' }}
        />
        <TextField
          label="Contraseña" type="password"
          fullWidth margin="normal"
          value={password} onChange={(e) => setPassword(e.target.value)} sx={{ bgcolor: '#FFF' }}
        />
        {isRegister && (
          <TextField
            label="Email" type="email"
            fullWidth margin="normal"
            value={email} onChange={(e) => setEmail(e.target.value)} sx={{ bgcolor: '#FFF' }}
          />
        )}
        <Button variant="contained" color="primary" fullWidth sx={{ mt: 3 }} onClick={submit}>
          {isRegister ? 'Registrar' : 'Ingresar'}
        </Button>
        <Typography
          variant="body2" align="center"
          sx={{ mt: 2, cursor: 'pointer', color: 'secondary.main' }}
          onClick={() => { setIsRegister(!isRegister); setError(''); }}
        >
          {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
        </Typography>
      </Container>
    </ThemeProvider>
  );
}

function Movies({ token, onLogout }) {
  const [movies, setMovies] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newYear, setNewYear] = useState('');
  const [newMetascore, setNewMetascore] = useState('');
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [newScore, setNewScore] = useState(5);
  const [error, setError] = useState('');

  useEffect(() => { fetchMovies(); }, []);

  const fetchMovies = async () => {
    setError('');
    try {
      const res = await axios.get(`${apiUrl}/movies`);
      setMovies(res.data);
    } catch {
      setError('Error al cargar películas');
    }
  };

  const createMovie = async () => {
    setError('');
    if (!newTitle || !newYear || !newMetascore) {
      setError('Debe ingresar título, año y metascore'); return;
    }
    if (isNaN(newMetascore)) { setError('Metascore debe ser un número'); return; }
    try {
      await axios.post(`${apiUrl}/movies`,
        { title: newTitle, year: parseInt(newYear), metascore: parseInt(newMetascore) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewTitle(''); setNewYear(''); setNewMetascore(''); fetchMovies();
    } catch (err) {
      setError(err.response?.data?.msg || 'Error creando película');
    }
  };

  const fetchReviews = async (movieId) => {
    setError('');
    try {
      const res = await axios.get(`${apiUrl}/reviews/movie/${movieId}`);
      setReviews(res.data); setSelectedMovie(movieId);
    } catch {
      setError('Error al cargar reseñas');
    }
  };

  const createReview = async () => {
    setError(''); if (!newComment) { setError('Ingresa un comentario'); return; }
    try {
      await axios.post(`${apiUrl}/reviews`,
        { movie_id: selectedMovie, comment: newComment, puntuacion: newScore },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewComment(''); setNewScore(5); fetchReviews(selectedMovie);
    } catch (err) {
      setError(err.response?.data?.msg || 'Error creando reseña');
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="md" sx={{ mt: 5, bgcolor: 'background.paper', p: 3, borderRadius: 2 }}>
        <AppBar position="static" sx={{ mb: 4, bgcolor: 'secondary.main' }}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1, color: '#FFF' }}>
              Bienvenido a CritiCorner
            </Typography>
            <IconButton color="inherit" onClick={onLogout}><LogoutIcon/></IconButton>
          </Toolbar>
        </AppBar>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Typography variant="h5" gutterBottom sx={{ color: 'primary.main' }}>
          Lista de Películas
        </Typography>

        <List sx={{ mb: 4 }}>
          {movies.map((movie) => (
            <ListItem key={movie.id} sx={{ bgcolor: '#FAF3DD', mb: 1, borderRadius: 1 }}
              secondaryAction={<Button variant="outlined" onClick={() => fetchReviews(movie.id)}>Ver reseñas</Button>}
            >
              <ListItemText
                primary={`${movie.title} (${movie.year})`}
                secondary={`Metascore: ${movie.metascore} - Userscore: ${movie.userscore ?? '-'} `}
              />
            </ListItem>
          ))}
        </List>

        <Typography variant="h6" gutterBottom sx={{ color: 'secondary.main' }}>
          Crear nueva película
        </Typography>

        <Box component="form" noValidate autoComplete="off"
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 400 }}>
          <TextField label="Título" value={newTitle} onChange={(e)=>setNewTitle(e.target.value)} required/>
          <TextField label="Año" type="number" value={newYear} onChange={(e)=>setNewYear(e.target.value)} required/>
          <TextField label="Metascore" type="number" value={newMetascore} onChange={(e)=>setNewMetascore(e.target.value)} required/>
          <Button variant="contained" onClick={createMovie} sx={{ bgcolor: 'primary.main' }}>Crear película</Button>
        </Box>

        {selectedMovie && (
          <>
            <Typography variant="h5" sx={{ mt: 5, mb: 2, color: 'primary.main' }}>
              Reseñas de {movies.find((m)=>m.id===selectedMovie)?.title}
            </Typography>
            <List sx={{ mb: 4 }}>
              {reviews.map((r)=>(
                <ListItem key={r.id} sx={{ bgcolor: '#EBF5EE', mb: 1, borderRadius: 1 }}>
                  <ListItemText primary={`${r.user}: ${r.comment}`} secondary={`Puntuación: ${r.puntuacion}`}/>
                </ListItem>
              ))}
            </List>

            <Box component="form" noValidate autoComplete="off"
              sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 400 }}>
              <TextField label="Comentario" multiline rows={3} value={newComment} onChange={(e)=>setNewComment(e.target.value)} required/>
              <TextField label="Puntuación (1-10)" type="number" value={newScore} onChange={(e)=>setNewScore(e.target.value)} inputProps={{min:1,max:10}} required/>
              <Button variant="contained" onClick={createReview} sx={{ bgcolor: 'secondary.main' }}>Enviar reseña</Button>
            </Box>
          </>
        )}
      </Container>
    </ThemeProvider>
  );
}

export default function App() {
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');

  const onLogin = (token, username) => { setToken(token); setUsername(username); };
  const onLogout = () => { setToken(''); setUsername(''); };

  return token ? <Movies token={token} onLogout={onLogout} username={username}/> : <LoginRegister onLogin={onLogin}/>;
}
