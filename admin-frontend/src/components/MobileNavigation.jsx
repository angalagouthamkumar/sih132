import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/dashboard',        label: 'Dash',    icon: '📊' },
  { path: '/farmers',          label: 'Farmers', icon: '🧑‍🌾' },
  { path: '/crops',            label: 'Crops',   icon: '🌾' },
  { path: '/market-data',      label: 'Market',  icon: '📈' },
  { path: '/requirements',     label: 'Reqs',    icon: '📋' },
];

const MobileNavigation = () => {
  return (
    <div className="mobile-bottom-nav">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `mobile-nav-link${isActive ? ' active' : ''}`
          }
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </div>
  );
};

export default MobileNavigation;
