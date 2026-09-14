const StatusBadge = ({ status, type = 'default' }) => {
  const getBadgeClass = () => {
    switch (status?.toLowerCase()) {
      // General
      case 'active':
      case 'verified':
      case 'available':
      case 'completed':
      case 'delivered':
      case 'paid':
        return 'badge-success';
      
      // Warning/Pending
      case 'pending':
      case 'in_transit':
        return 'badge-warning';

      // Danger/Inactive
      case 'blocked':
      case 'rejected':
      case 'inactive':
      case 'sold':
        return 'badge-danger';
        
      default:
        return 'badge-neutral';
    }
  };

  return (
    <span className={`badge ${getBadgeClass()}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
