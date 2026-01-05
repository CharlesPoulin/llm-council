import './SynthesisDashboard.css';

/**
 * Dashboard component that extracts and visualizes key indicators
 * from the Juge's synthesis.
 */
export default function SynthesisDashboard({ synthesis }) {
  if (!synthesis || !synthesis.message) {
    return null;
  }

  const text = synthesis.message;

  // Extract sections using regex patterns
  const extractSection = (sectionName) => {
    const patterns = [
      new RegExp(`##\\s*${sectionName}[:\\s]*\\n([\\s\\S]*?)(?=##|$)`, 'i'),
      new RegExp(`\\*\\*${sectionName}[:\\s]*\\*\\*([\\s\\S]*?)(?=\\*\\*|##|$)`, 'i'),
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return null;
  };

  // Extract multi-criteria scores
  const extractScores = () => {
    const scorePattern = /(?:Feasibility|Risk|Financial|Regulatory|Strategic).*?[:)]?\s*(\d+(?:\.\d+)?)\s*[/\/]?\s*(\d+)/gi;
    const scores = [];
    let match;

    while ((match = scorePattern.exec(text)) !== null) {
      const criterion = match[0].split(/[:)]/)[0].trim();
      const score = parseFloat(match[1]);
      const maxScore = parseFloat(match[2]);
      scores.push({
        criterion,
        score,
        maxScore,
        percentage: (score / maxScore) * 100,
      });
    }

    return scores.length > 0 ? scores : null;
  };

  // Extract bullet points from a section
  const extractBulletPoints = (sectionText) => {
    if (!sectionText) return [];
    const lines = sectionText.split('\n');
    return lines
      .filter((line) => line.trim().match(/^[-*•]\s+/))
      .map((line) => line.trim().replace(/^[-*•]\s+/, ''));
  };

  const consensus = extractSection('Consensus|Points? of Consensus');
  const divergence = extractSection('Divergence|Disagreements?|Points? of Divergence');
  const risks = extractSection('Critical Risks?|Risques Critiques');
  const scenarios = extractSection('Alternative Scenarios?|Scénarios Alternatifs');
  const scores = extractScores();

  const consensusPoints = extractBulletPoints(consensus);
  const divergencePoints = extractBulletPoints(divergence);
  const riskPoints = extractBulletPoints(risks);
  const scenarioPoints = extractBulletPoints(scenarios);

  // Only show dashboard if we have extracted data
  const hasData =
    consensusPoints.length > 0 ||
    divergencePoints.length > 0 ||
    riskPoints.length > 0 ||
    scenarioPoints.length > 0 ||
    scores;

  if (!hasData) {
    return null;
  }

  return (
    <div className="synthesis-dashboard">
      <div className="dashboard-header">
        <h3>📊 Decision Analysis Dashboard</h3>
      </div>

      <div className="dashboard-grid">
        {/* Consensus & Divergence */}
        {(consensusPoints.length > 0 || divergencePoints.length > 0) && (
          <div className="dashboard-section consensus-divergence">
            <div className="section-header">Consensus & Divergence</div>
            <div className="two-column">
              {consensusPoints.length > 0 && (
                <div className="consensus-box">
                  <h4>✓ Points of Consensus</h4>
                  <ul>
                    {consensusPoints.slice(0, 3).map((point, idx) => (
                      <li key={idx}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
              {divergencePoints.length > 0 && (
                <div className="divergence-box">
                  <h4>⚡ Points of Divergence</h4>
                  <ul>
                    {divergencePoints.slice(0, 3).map((point, idx) => (
                      <li key={idx}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Critical Risks */}
        {riskPoints.length > 0 && (
          <div className="dashboard-section risks">
            <div className="section-header">⚠️ Critical Risks</div>
            <ul className="risk-list">
              {riskPoints.slice(0, 4).map((risk, idx) => (
                <li key={idx} className="risk-item">
                  <span className="risk-badge">R{idx + 1}</span>
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Alternative Scenarios */}
        {scenarioPoints.length > 0 && (
          <div className="dashboard-section scenarios">
            <div className="section-header">🔄 Alternative Scenarios</div>
            <div className="scenario-cards">
              {scenarioPoints.slice(0, 3).map((scenario, idx) => (
                <div key={idx} className="scenario-card">
                  <div className="scenario-number">Scenario {idx + 1}</div>
                  <div className="scenario-text">{scenario}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Multi-Criteria Scores */}
        {scores && scores.length > 0 && (
          <div className="dashboard-section scores">
            <div className="section-header">📈 Multi-Criteria Evaluation</div>
            <div className="score-bars">
              {scores.map((item, idx) => (
                <div key={idx} className="score-item">
                  <div className="score-label">
                    <span>{item.criterion}</span>
                    <span className="score-value">
                      {item.score}/{item.maxScore}
                    </span>
                  </div>
                  <div className="score-bar">
                    <div
                      className="score-fill"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: getScoreColor(item.percentage),
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getScoreColor(percentage) {
  if (percentage >= 80) return '#4caf50'; // Green
  if (percentage >= 60) return '#8bc34a'; // Light green
  if (percentage >= 40) return '#ff9800'; // Orange
  return '#f44336'; // Red
}
