import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Building2, 
  Wrench, 
  Users, 
  Menu 
} from 'lucide-react';

const MobileNav = ({ onMenuClick }) => {
  const location = useLocation();
  
  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/properties', icon: Building2, label: 'Properties' },
    { path: '/maintenance', icon: Wrench, label: 'Maintenance' },
    { path: '/tenants', icon: Users, label: 'Tenants' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border lg:hidden safe-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground'
              }`}
              data-testid={`mobile-nav-${item.label.toLowerCase()}`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-muted-foreground"
          data-testid="mobile-nav-menu"
        >
          <Menu className="w-5 h-5" />
          <span className="text-xs font-medium">More</span>
        </button>
      </div>
    </nav>
  );
};

export default MobileNav;
