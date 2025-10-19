'use client';

import { useState, useEffect } from 'react';

interface AdvicePanelProps {
  isVisible: boolean;
  options: string[];
  emotion?: string;
}

export default function AdvicePanel({ isVisible, options, emotion }: AdvicePanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [visibleOptions, setVisibleOptions] = useState<number>(0);

  // Animate options appearing one by one when they update
  useEffect(() => {
    if (options.length > 0) {
      setVisibleOptions(0);
      const timer = setTimeout(() => {
        setVisibleOptions(1);
      }, 100);

      const timer2 = setTimeout(() => {
        setVisibleOptions(2);
      }, 250);

      const timer3 = setTimeout(() => {
        setVisibleOptions(3);
      }, 400);

      const timer4 = setTimeout(() => {
        setVisibleOptions(4);
      }, 550);

      return () => {
        clearTimeout(timer);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
      };
    }
  }, [options]);

  if (!isVisible) return null;

  return (
    <div className={`advice-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="advice-header">
        <h3>💡 Live Response Options</h3>
        <button
          className="advice-toggle-button"
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

          <div className="response-options">
            {options.map((option, index) => (
              <div
                key={index}
                className={`response-option ${index < visibleOptions ? 'visible' : ''}`}
              >
                <span className="option-number">{index + 1}</span>
                <span className="option-text">{option}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
