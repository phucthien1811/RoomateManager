import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '../styles/stat-card.css';

const StatCard = ({ title, value, change, icon: iconProp, color }) => {
  const isPositive = change && change.startsWith('+');
  
  return (
    <div className={`stat-card stat-card-${color}`}>
      <div className="stat-content">
        <div className="stat-title">{title}</div>
        <div className="stat-value">{value}</div>
        {change && (
          <div className={`stat-change ${isPositive ? 'positive' : 'negative'}`}>
            {change}
          </div>
        )}
      </div>
      {iconProp && (
        <div className="stat-icon">
          <FontAwesomeIcon icon={iconProp} />
        </div>
      )}
    </div>
  );
};

export default StatCard;
