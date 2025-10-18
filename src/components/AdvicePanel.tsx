import { useState } from 'react'
import './AdvicePanel.css'

interface AdvicePanelProps {
  isVisible: boolean
}

function AdvicePanel({ isVisible }: AdvicePanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (!isVisible) return null

  return (
    <div className={`advice-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="advice-header">
        <h3>Live Suggestions</h3>
        <button
          className="toggle-button"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '▼' : '▲'}
        </button>
      </div>

      {isExpanded && (
        <div className="advice-content">
          <p>
            Hi this is just some text to test out the component working, I will just keep
            filling it up with text and text. This panel will eventually display real-time
            suggestions based on emotion detection and conversation analysis. For now,
            this is placeholder content to demonstrate the layout and positioning of the
            advice panel at the bottom of the screen. You can collapse and expand this
            panel using the button above.
          </p>
        </div>
      )}
    </div>
  )
}

export default AdvicePanel
