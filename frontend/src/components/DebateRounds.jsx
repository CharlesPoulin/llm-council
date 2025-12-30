import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import './DebateRounds.css';

export default function DebateRounds({ debateHistory }) {
  const [activeRound, setActiveRound] = useState(1);

  if (!debateHistory || debateHistory.length === 0) {
    return null;
  }

  // Group debate history by rounds
  const rounds = {};
  debateHistory.forEach(turn => {
    if (!rounds[turn.round]) {
      rounds[turn.round] = [];
    }
    rounds[turn.round].push(turn);
  });

  const roundNumbers = Object.keys(rounds).map(Number).sort((a, b) => a - b);
  const currentRoundTurns = rounds[activeRound] || [];

  return (
    <div className="stage debate-rounds">
      <h3 className="stage-title">Débat Multi-Tours</h3>
      <p className="stage-description">
        Les 4 rôles débattent en tours séquentiels, chacun répondant aux arguments des autres.
      </p>

      {/* Round selector tabs */}
      <div className="round-tabs">
        {roundNumbers.map(roundNum => (
          <button
            key={roundNum}
            className={`round-tab ${activeRound === roundNum ? 'active' : ''}`}
            onClick={() => setActiveRound(roundNum)}
          >
            Tour {roundNum}
          </button>
        ))}
      </div>

      {/* Display turns for selected round */}
      <div className="round-content">
        <h4 className="round-header">Tour {activeRound}</h4>
        {currentRoundTurns.map((turn, index) => (
          <div key={index} className="debate-turn">
            <div className="turn-header">
              <span className="role-name">{turn.role_name}</span>
              <span className="model-name">({turn.model})</span>
            </div>
            <div className="turn-message markdown-content">
              <ReactMarkdown>{turn.message}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
