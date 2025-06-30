// src/components/Analyzer/SiteSelector.tsx
import React from 'react';
import './SiteSelector.css';

interface Site {
  id: string;
  domain: string;
  name: string;
  status: 'active' | 'inactive';
}

interface SiteSelectorProps {
   sites: any[];
  selectedSite?: string;
  onSiteChange: (siteId: string) => void;
  onSiteSelect?: (site: any) => void; // Adicionar se necessário
}

const SiteSelector: React.FC<SiteSelectorProps> = ({
  sites,
  selectedSite,
  onSiteChange
}) => {
  if (!sites || sites.length === 0) {
    return (
      <div className="site-selector-empty">
        <div className="empty-sites">
          <div className="empty-icon">🌐</div>
          <h3>Nenhum site cadastrado</h3>
          <p>Cadastre seu primeiro site para começar a usar o Analyzer</p>
          <button className="btn-primary">
            ➕ Cadastrar Site
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="site-selector">
      <h2>🌐 Selecionar Site</h2>
      <div className="sites-grid">
        {sites.map((site) => (
          <div
            key={site.id}
            className={`site-card ${selectedSite === site.id ? 'selected' : ''} ${site.status === 'inactive' ? 'inactive' : ''}`}
            onClick={() => onSiteChange(site.id)}
          >
            <div className="site-info">
              <h3>{site.name || site.domain}</h3>
              <p>{site.domain}</p>
            </div>
            <div className="site-status">
              <span className={`status-badge ${site.status}`}>
                {site.status === 'active' ? '✅ Ativo' : '⏸️ Inativo'}
              </span>
            </div>
            {selectedSite === site.id && (
              <div className="selected-indicator">
                <span>✓</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SiteSelector;