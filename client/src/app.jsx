import { useState, useEffect } from 'react';
import axios from 'axios';
import './app.css';

function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    axios.get('/api/hello')
      .then((res) => setMessage(res.data.message))
      .catch(() => setMessage('Cannot connect to server'));
  }, []);

  return (
    <div className="app">
      <h1>Roommate Manager</h1>
      <p>Server says: {message || 'Loading...'}</p>
    </div>
  );
}

export default App;
