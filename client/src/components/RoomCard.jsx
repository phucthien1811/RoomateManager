import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import '../styles/room-card.css';

const RoomCard = ({ name, location, members, cost, status, icon: iconProp, color }) => {
  return (
    <div className={`room-card room-card-${color}`}>
      <div className="room-header">
        <div className="room-icon">
          {iconProp && <FontAwesomeIcon icon={iconProp} />}
        </div>
        <div className="room-status">{status}</div>
      </div>
      
      <div className="room-body">
        <h3 className="room-name">{name}</h3>
        <p className="room-location">
          <FontAwesomeIcon icon={faMapMarkerAlt} /> {location}
        </p>
        
        <div className="room-info">
          <div className="room-stat">
            <span className="room-stat-label">Thành viên</span>
            <span className="room-stat-value">{members}</span>
          </div>
          <div className="room-stat">
            <span className="room-stat-label">Chi tiêu</span>
            <span className="room-stat-value">{cost}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomCard;
