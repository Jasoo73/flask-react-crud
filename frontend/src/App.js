import React, { useState } from 'react';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(null);
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const res = await fetch('http://127.0.0.1:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setToken(data.access_token);
        setMessage('Login exitoso!');
      } else {
        setMessage(data.msg || 'Error en login');
      }
    } catch (error) {
      setMessage('Error al conectar con el servidor');
    }
  };

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        boxSizing: 'border-box',
      }}
    >
      <h2>Login React + Flask JWT</h2>

      {!token ? (
        <form
          onSubmit={handleLogin}
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: 300,
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ width: '100%', padding: 8, marginBottom: 10 }}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: 8, marginBottom: 10 }}
          />
          <button
            type="submit"
            style={{
              width: '50%',
              padding: 10,
              cursor: 'pointer',
              alignSelf: 'center',
            }}
          >
            Ingresar
          </button>
        </form>
      ) : (
        <div style={{ width: 300, textAlign: 'center' }}>
          <p><strong>Token JWT:</strong></p>
          <textarea
            readOnly
            rows={6}
            style={{ width: '100%' }}
            value={token}
          />
          <button
            onClick={() => {
              setToken(null);
              setUsername('');
              setPassword('');
              setMessage('');
            }}
            style={{ marginTop: 10, padding: 10, cursor: 'pointer' }}
          >
            Cerrar sesión
          </button>
        </div>
      )}

      {message && <p style={{ marginTop: 10, color: 'red' }}>{message}</p>}
    </div>
  );
}

export default App;
