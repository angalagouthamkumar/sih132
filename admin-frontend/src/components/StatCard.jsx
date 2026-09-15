const StatCard = ({ title, value, icon, description, trend }) => {
  return (
    <div className="admin-stat-card">
      <div className="stat-card-header">
        <div>
          <p className="stat-card-title">{title}</p>
          <h3 className="stat-card-value">{value}</h3>
        </div>
        <div className="stat-card-icon" aria-hidden="true">
          {icon}
        </div>
      </div>
      
      <div className="stat-card-footer">
        {trend !== undefined && trend !== null && (
          <span className={trend > 0 ? 'stat-trend-up' : 'stat-trend-down'}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
        <span className="stat-desc">{description}</span>
      </div>
    </div>
  );
};

export default StatCard;

