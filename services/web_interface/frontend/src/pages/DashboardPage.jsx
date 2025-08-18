import React, { useState, useEffect } from 'react';
import { ChatInterface } from '../components/ChatBot/ChatInterface';
import './DashboardPage.css'; // For the chat toggle button

function DashboardPage() {
  const [overview, setOverview] = useState(null);
  const [realtimeMetrics, setRealtimeMetrics] = useState({});
  const [error, setError] = useState('');
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('No access token found. Please login.');
      return;
    }

    const authHeader = { 'Authorization': `Bearer ${token}` };

    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard/overview', { headers: authHeader });
        if (!response.ok) throw new Error('Failed to fetch dashboard data');
        const data = await response.json();
        setOverview(data);
        setRealtimeMetrics(data.system_metrics);
      } catch (err) {
        setError(err.message);
      }
    };

    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/users/me', { headers: authHeader });
        if (!response.ok) throw new Error('Failed to fetch user data');
        const data = await response.json();
        setCurrentUser(data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchDashboardData();
    fetchCurrentUser();

    // Establish WebSocket connection
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/api/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'METRICS_UPDATE') {
        setRealtimeMetrics(prevMetrics => ({ ...prevMetrics, ...data.payload }));
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      setError('WebSocket connection error.');
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    // Cleanup on component unmount
    return () => {
      ws.close();
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    window.location.reload();
  };

  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!overview || !currentUser) return <p>Loading dashboard...</p>;

  return (
    <div>
      <h2>Dashboard</h2>
      <button onClick={handleLogout}>Logout</button>

      <h3>System Overview</h3>
      <p>Active Projects: {overview.active_projects}</p>

      <h4>Agent Status</h4>
      <ul>
        {Object.entries(overview.agent_status).map(([agent, status]) => (
          <li key={agent}>{agent}: {status}</li>
        ))}
      </ul>

      <h4>System Metrics (Real-time)</h4>
      <ul>
        {Object.entries(realtimeMetrics).map(([metric, value]) => (
          <li key={metric}><strong>{metric}:</strong> {JSON.stringify(value)}</li>
        ))}
      </ul>

      <h4>Recent Activities</h4>
      <ul>
        {overview.recent_activities.map((activity, index) => (
          <li key={index}>{activity}</li>
        ))}
      </ul>

      <button className="chat-toggle-button" onClick={() => setIsChatVisible(!isChatVisible)}>
        💬
      </button>

      {currentUser && (
        <ChatInterface
          userId={currentUser.user_id}
          isVisible={isChatVisible}
        />
      )}
    </div>
  );
}

export default DashboardPage;
