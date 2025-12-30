import AgentMessage from './AgentMessage';
import './Stage3.css';

export default function Stage3({ finalResponse }) {
  if (!finalResponse) {
    return null;
  }

  return (
    <div className="stage3-wrapper">
      <div className="stage3-divider">
        <span>Synthèse Finale</span>
      </div>
      <AgentMessage
        roleName={finalResponse.role_name || 'Juge'}
        model={finalResponse.model}
        message={finalResponse.response}
        roundNumber={null}
      />
    </div>
  );
}
