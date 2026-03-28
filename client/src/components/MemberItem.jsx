import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import '../styles/member-item.css';

const MemberItem = ({ name, email, avatar, role, action }) => {
  return (
    <div className="member-item">
      <div className="member-avatar">{avatar}</div>
      <div className="member-info">
        <h4 className="member-name">{name}</h4>
        <p className="member-email">
          <FontAwesomeIcon icon={faEnvelope} /> {email}
        </p>
      </div>
      <div className="member-action">
        <button className="action-btn">{action}</button>
      </div>
    </div>
  );
};

export default MemberItem;
