import React from 'react';

const Radar: React.FC = () => {
  return (
    <div className="display radar-display">
      <div className="header">
        <div className="title">Radar</div>
      </div>
      <div className="content">
        <div className="radar-container">
          <p>Radar imagery will be displayed here</p>
        </div>
      </div>
    </div>
  );
};

export default Radar;