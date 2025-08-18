import React, { useState, useEffect } from 'react';

function DashboardPage() {
  const [overview, setOverview] = useState(null);
  const [realtimeMetrics, setRealtimeMetrics] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch initial dashboard data
    const fetchOverview = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('No access token found. Please login.');
        return;
      }

      try {
        const response = await fetch('/api/dashboard/overview', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setOverview(data);
          setRealtimeMetrics(data.system_metrics); // Initialize with fetched metrics
        } else {
          if (response.status === 401) {
            localStorage.removeItem('accessToken');
            window.location.reload();
          } else {
            setError((await response.json()).detail || 'Failed to fetch data');
          }
        }
      } catch (err) {
        setError('An error occurred while fetching data.');
      }
    };

    fetchOverview();

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
  if (!overview) return <p>Loading dashboard...</p>;

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
    </div>
  );
}

export default DashboardPage;
