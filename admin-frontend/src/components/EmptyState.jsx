const EmptyState = ({ message = 'No data available.', icon = '📭' }) => {
  return (
    <div className="flex flex-col justify-center items-center h-64 bg-surface border border-border rounded-lg text-center p-6">
      <div className="text-5xl mb-4 opacity-70">{icon}</div>
      <p className="text-text-secondary text-lg">{message}</p>
    </div>
  );
};

export default EmptyState;
