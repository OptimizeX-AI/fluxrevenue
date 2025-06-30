import React from 'react'
import './TrialBanner.css'

interface TrialBannerProps {
  daysLeft: number
}

const TrialBanner: React.FC<TrialBannerProps> = ({ daysLeft }) => {
  const urgencyLevel = daysLeft <= 3 ? 'critical' : daysLeft <= 7 ? 'warning' : 'info'

  return (
    <div className={`trial-banner trial-banner--${urgencyLevel}`}>
      <div className="trial-banner__content">
        <div className="trial-banner__icon">
          {urgencyLevel === 'critical' ? '⚠️' : '⏰'}
        </div>
        <div className="trial-banner__text">
          <h3>
            {daysLeft === 1 
              ? 'Último dia do seu trial!' 
              : `${daysLeft} dias restantes no seu trial`
            }
          </h3>
          <p>
            {urgencyLevel === 'critical'
              ? 'Atualize agora para não perder acesso às suas otimizações'
              : 'Atualize para Pro e desbloqueie todo o potencial do Flux Revenue'
            }
          </p>
        </div>
        <button className="trial-banner__cta">
          Atualizar para Pro
        </button>
      </div>
    </div>
  )
}

export default TrialBanner