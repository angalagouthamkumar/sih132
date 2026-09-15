import { ChartColumn as UiChartColumn, Users as UiUsers, Sprout as UiSprout, TrendingUp as UiTrendingUp, ClipboardList as UiClipboardList } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/dashboard',        label: 'Dash',    icon: <UiChartColumn size={18} /> },
  { path: '/farmers',          label: 'Farmers', icon: <UiUsers size={18} /> },
  { path: '/crops',            label: 'Crops',   icon: <UiSprout size={18} /> },
  { path: '/market-data',      label: 'Market',  icon: <UiTrendingUp size={18} /> },
  { path: '/requirements',     label: 'Reqs',    icon: <UiClipboardList size={18} /> },
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
