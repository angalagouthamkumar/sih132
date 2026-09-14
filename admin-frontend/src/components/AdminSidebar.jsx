import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/dashboard',        label: 'Dashboard',         icon: '📊' },
  { path: '/farmers',          label: 'Farmers',           icon: '🧑‍🌾' },
  { path: '/buyers',           label: 'Buyers',            icon: '🛒' },
  { path: '/crops',            label: 'Crops',             icon: '🌾' },
  { path: '/offers',           label: 'Offers',            icon: '🤝' },
  { path: '/orders',           label: 'Orders',            icon: '📦' },
  { path: '/market-data',      label: 'Market Data',       icon: '📈' },
  { path: '/requirements',     label: 'Requirements',      icon: '📋' },
  { path: '/transport-config', label: 'Transport Config',  icon: '🚚' },
];

const AdminSidebar = () => {
  return (
    <div className="admin-sidebar-panel">
      <div className="sidebar-logo">Admin Portal</div>

      <nav className="sidebar-nav">
        <ul>
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-nav-link${isActive ? ' active' : ''}`
                }
              >
                <span className="sidebar-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        &copy; {new Date().getFullYear()} SIH26132
      </div>
    </div>
  );
};

export default AdminSidebar;
