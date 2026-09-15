import { Inbox as UiInbox } from 'lucide-react';
const EmptyState = ({ message = 'No data available.', icon = <UiInbox size={28} /> }) => {
  return (
    <div className="admin-empty-state">
      <div className="empty-state-icon" aria-hidden="true">{icon}</div>
      <p className="empty-state-message">{message}</p>
    </div>
  );
};

export default EmptyState;

