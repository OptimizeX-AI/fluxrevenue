import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DashboardPage from './DashboardPage';

// Mock the global fetch function
global.fetch = vi.fn();

// Mock WebSocket
global.WebSocket = vi.fn(() => ({
  onopen: vi.fn(),
  onmessage: vi.fn(),
  onerror: vi.fn(),
  onclose: vi.fn(),
  close: vi.fn(),
}));


describe('DashboardPage', () => {
  it('displays loading state and then renders dashboard data', async () => {
    const mockOverview = {
      active_projects: 5,
      agent_status: { 'agent-1': 'active' },
      system_metrics: { 'cpu': '50%' },
      recent_activities: ['activity 1'],
    };

    // Mock a successful fetch response
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockOverview),
    });

    render(<DashboardPage />);

    // Initially, it should show a loading message
    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();

    // Wait for the component to update with the fetched data
    await waitFor(() => {
      expect(screen.getByText(/active projects: 5/i)).toBeInTheDocument();
    });

    // Check that other parts of the dashboard are also rendered
    expect(screen.getByText(/agent-1: active/i)).toBeInTheDocument();
    expect(screen.getByText(/"cpu": "50%"/)).toBeInTheDocument(); // Note: value is stringified
  });
});
