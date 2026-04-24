import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faHouse, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import roomService from '../services/room.service.js';

const PageHeader = ({ title, actions }) => {
  const [currentRoom, setCurrentRoom] = useState(null);

  useEffect(() => {
    const fetchRoom = async () => {
      const roomId = localStorage.getItem('currentRoomId');
      if (roomId) {
        try {
          const room = await roomService.getRoomById(roomId);
          setCurrentRoom(room);
        } catch (e) {
          console.error(e);
        }
      } else {
        setCurrentRoom(null);
      }
    };
    
    fetchRoom();
    
    const handleRoomSelected = () => fetchRoom();
    window.addEventListener('room-selected', handleRoomSelected);
    return () => window.removeEventListener('room-selected', handleRoomSelected);
  }, []);

  return (
    <div className="shared-page-header">
      <div className="shared-page-header-left">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            className="shared-mobile-menu-btn"
            onClick={() => window.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'))}
            title="Mở menu"
          >
            <FontAwesomeIcon icon={faBars} />
          </button>
          <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="35" height="35" viewBox="0 0 35 35">
            <image id="Layer_1_copy" x="1" y="1" width="33" height="33" xlinkHref="/datalogo" />
          </svg>
          <h1>{title}</h1>
        </div>
        {currentRoom && (
          <p className="room-subtitle">
            <FontAwesomeIcon icon={faHouse} /> {currentRoom.name}
            {currentRoom.address && (
              <>
                {' '}
                • <FontAwesomeIcon icon={faMapMarkerAlt} /> {currentRoom.address}
              </>
            )}
          </p>
        )}
      </div>
      {actions && (
        <div className="shared-page-header-actions">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
