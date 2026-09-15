const EmptyState = ({ message = 'No data available.', icon = '📭' }) => {
  return (
    <div className="admin-empty-state">
      <div className="empty-state-icon" aria-hidden="true">{icon}</div>
      <p className="empty-state-message">{message}</p>
    </div>
  );
};

export default EmptyState;

