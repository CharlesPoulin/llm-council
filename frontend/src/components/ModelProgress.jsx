import { useState, useEffect } from 'react';
import './ModelProgress.css';

export default function ModelProgress({ modelProgress }) {
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every 100ms for live timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 100);

    return () => clearInterval(interval);
  }, []);

  if (!modelProgress || Object.keys(modelProgress).length === 0) {
    return null;
  }

  const formatElapsedTime = (seconds) => {
    if (seconds < 1) {
      return `${Math.round(seconds * 1000)}ms`;
    }
    return `${seconds.toFixed(1)}s`;
  };

  const calculateLiveElapsed = (startTime) => {
    return (currentTime - startTime) / 1000; // Convert to seconds
  };

  return (
    <div className="model-progress-container">
      <div className="model-progress-header">Model Queries</div>
      <div className="model-progress-list">
        {Object.entries(modelProgress).map(([key, progress]) => {
          const isQuerying = progress.status === 'querying';
          const elapsedTime = isQuerying
            ? calculateLiveElapsed(progress.startTime)
            : progress.elapsedTime;

          return (
            <div
              key={key}
              className={`model-progress-item ${isQuerying ? 'querying' : 'complete'}`}
            >
              <div className="progress-header">
                <span className="progress-role">{progress.roleName}</span>
                {progress.round && <span className="progress-round">R{progress.round}</span>}
                {isQuerying && <div className="progress-spinner"></div>}
                {!isQuerying && <span className="progress-checkmark">✓</span>}
              </div>
              <div className="progress-details">
                <span className="progress-model">{progress.model}</span>
                <span className={`progress-time ${isQuerying ? 'live' : ''}`}>
                  {formatElapsedTime(elapsedTime)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
