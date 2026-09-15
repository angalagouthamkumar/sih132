import { ChartColumn as UiChartColumn, Users as UiUsers, ShoppingCart as UiShoppingCart, Sprout as UiSprout, Handshake as UiHandshake, Package as UiPackage, TrendingUp as UiTrendingUp, ClipboardList as UiClipboardList, Truck as UiTruck } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export const navItems = [
  { path: '/dashboard',        label: 'Dashboard',         icon: <UiChartColumn size={18} /> },
  { path: '/farmers',          label: 'Farmers',           icon: <UiUsers size={18} /> },
  { path: '/buyers',           label: 'Buyers',            icon: <UiShoppingCart size={18} /> },
  { path: '/crops',            label: 'Crops',             icon: <UiSprout size={18} /> },
  { path: '/offers',           label: 'Offers',            icon: <UiHandshake size={18} /> },
  { path: '/orders',           label: 'Orders',            icon: <UiPackage size={18} /> },
  { path: '/market-data',      label: 'Market Data',       icon: <UiTrendingUp size={18} /> },
  { path: '/requirements',     label: 'Requirements',      icon: <UiClipboardList size={18} /> },
  { path: '/transport-config', label: 'Transport Config',  icon: <UiTruck size={18} /> },
];

const AdminSidebar = () => {
  return (
    <aside className="admin-sidebar-panel">
      <div className="sidebar-logo"><div className="brand-group"><div className="brand-logo">S</div><div><div className="brand-title">SIH26132</div><div className="brand-subtitle">Admin Portal</div></div></div></div>

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
    </aside>
  );
};

export default AdminSidebar;
