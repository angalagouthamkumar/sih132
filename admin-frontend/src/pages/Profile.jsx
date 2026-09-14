import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
      <div>
        <h2 className="text-2xl font-heading font-bold text-primary-900">Admin Profile</h2>
        <p className="text-text-secondary">Your account information.</p>
      </div>

      <div className="card max-w-lg">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center text-4xl text-primary-900 font-bold border-2 border-primary-400">
            {user?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div>
            <h3 className="text-2xl font-bold font-heading text-primary-900">{user?.name}</h3>
            <span className="inline-block px-3 py-1 bg-primary-600 text-surface text-xs font-semibold rounded-full uppercase tracking-wide mt-2">
              System Administrator
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="pb-4 border-b border-border">
            <span className="text-sm text-text-secondary block mb-1">Email Address</span>
            <span className="text-lg font-medium">{user?.email}</span>
          </div>
          
          <div className="pb-4 border-b border-border">
            <span className="text-sm text-text-secondary block mb-1">Phone Number</span>
            <span className="text-lg font-medium">{user?.phone}</span>
          </div>
          
          <div>
            <span className="text-sm text-text-secondary block mb-1">Account Role</span>
            <span className="text-lg font-medium capitalize">{user?.role}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
