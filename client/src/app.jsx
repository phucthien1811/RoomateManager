import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import './app.css';

function App() {
  const [activeMenu, setActiveMenu] = useState('dashboard');

  return (
    <div className="app">
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      <Dashboard />
    </div>
  );
}

export default App;
