import ReactMarkdown from 'react-markdown';
import './AgentMessage.css';

// Pastel color palette for different agents (Claude UX style)
const ROLE_COLORS = {
  'Avocat': '#FFE5E5',      // Soft pink
  'Scientifique': '#E5F3FF', // Soft blue
  'Philosophe': '#F0E5FF',   // Soft purple
  'Critique': '#FFF5E5',     // Soft orange
  'Juge': '#E5FFE5',         // Soft green (for synthesis)
};

// Fallback colors for any unexpected roles
const FALLBACK_COLORS = [
  '#FFE5E5', '#E5F3FF', '#F0E5FF', '#FFF5E5', '#E5FFE5', '#FFE5F5', '#E5FFFF'
];

function getAgentColor(roleName) {
  if (ROLE_COLORS[roleName]) {
    return ROLE_COLORS[roleName];
  }
  // Use a hash function to consistently assign fallback colors
  const hash = roleName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
}

export default function AgentMessage({ roleName, model, message, roundNumber }) {
  const backgroundColor = getAgentColor(roleName);

  return (
    <div className="agent-message-wrapper">
      <div className="agent-message-bubble" style={{ backgroundColor }}>
        <div className="agent-header">
          <span className="agent-role">{roleName}</span>
          {roundNumber && <span className="agent-round">Tour {roundNumber}</span>}
        </div>
        <div className="agent-model">{model}</div>
        <div className="agent-content markdown-content">
          <ReactMarkdown>{message}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
