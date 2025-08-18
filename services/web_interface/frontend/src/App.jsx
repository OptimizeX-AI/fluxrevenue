import React from 'react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import './App.css';

function App() {
  const token = localStorage.getItem('accessToken');

  return (
    <div className="App">
      <header className="App-header">
        <h1>FluxRevenue Dashboard</h1>
      </header>
      <main>
        {token ? <DashboardPage /> : <LoginPage />}
      </main>
    </div>
  );
}

export default App;
