import React from 'react';

const StatCard = ({ title, value, icon, color }) => {
  return (
    <div className="stat-card" style={{ borderTop: `4px solid ${color}` }}>
      <div className="stat-card-icon" style={{ color }}>
        {icon}
      </div>
      <div className="stat-card-content">
        <h3 className="stat-card-title">{title}</h3>
        <p className="stat-card-value">{value}</p>
      </div>
      <style jsx>{`
        .stat-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          padding: 20px;
          display: flex;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .stat-card-icon {
          font-size: 2.5rem;
          margin-right: 15px;
        }
        
        .stat-card-content {
          flex: 1;
        }
        
        .stat-card-title {
          color: #666;
          font-size: 0.9rem;
          margin: 0 0 5px;
          text-transform: uppercase;
        }
        
        .stat-card-value {
          color: #333;
          font-size: 1.8rem;
          font-weight: bold;
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default StatCard; 