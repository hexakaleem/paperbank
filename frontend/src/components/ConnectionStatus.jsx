import { useBackendConnection } from '../hooks/useBackendConnection';
import './ConnectionStatus.css';

export default function ConnectionStatus() {
  const { connected, error } = useBackendConnection();

  // Don't show anything while checking
  if (connected === null) {
    return null;
  }

  return (
    <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
      <div className="status-content">
        <span className="status-indicator"></span>
        <span className="status-text">
          {connected ? '✓ Backend Connected' : '✗ Backend Disconnected'}
        </span>
        {error && <span className="status-error">{error}</span>}
      </div>
    </div>
  );
}
