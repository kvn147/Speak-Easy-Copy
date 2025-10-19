import { useState } from 'react'
import './AdvicePanel.css'

interface AdvicePanelProps {
  isVisible: boolean
  advice: string
  emotion?: string
}

function AdvicePanel({ isVisible, advice, emotion }: AdvicePanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (!isVisible) return null

  return (
    <div className={`advice-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="advice-header">
        <h3>💡 Live Conversation Coach</h3>
        <button
          className="toggle-button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? 'Collapse panel' : 'Expand panel'}
        >
          {isExpanded ? '▼' : '▲'}
        </button>
      </div>

      {isExpanded && (
        <div className="advice-content">
          {emotion && (
            <div className="emotion-badge">
              Current mood: {emotion}
            </div>
          )}
          <p className="advice-text">
            {advice}
          </p>
        </div>
      )}
    </div>
  )
}

export default AdvicePanel
