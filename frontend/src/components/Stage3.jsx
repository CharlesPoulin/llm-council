import ReactMarkdown from 'react-markdown';
import './Stage3.css';

export default function Stage3({ finalResponse }) {
  if (!finalResponse) {
    return null;
  }

  return (
    <div className="stage stage3">
      <h3 className="stage-title">Synthèse Finale du Juge</h3>
      <p className="stage-description">
        Le Juge synthétise l'ensemble du débat en une recommandation équilibrée.
      </p>
      <div className="final-response">
        <div className="juge-header">
          <span className="role-name">
            {finalResponse.role_name || 'Juge/Synthétiseur'}
          </span>
          <span className="model-name">({finalResponse.model})</span>
        </div>
        <div className="final-text markdown-content">
          <ReactMarkdown>{finalResponse.response}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
