const StatCard = ({ title, value, icon, description, trend }) => {
  return (
    <div className="card flex flex-col justify-between hover:shadow-md transition-shadow duration-300">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-1">
            {title}
          </p>
          <h3 className="text-3xl font-bold font-heading text-primary-900 kpi-value">
            {value}
          </h3>
        </div>
        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-2xl">
          {icon}
        </div>
      </div>
      
      <div className="flex items-center gap-2 text-sm">
        {trend && (
          <span className={`font-semibold ${trend > 0 ? 'text-success' : 'text-danger'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
        <span className="text-text-secondary">{description}</span>
      </div>
    </div>
  );
};

export default StatCard;
