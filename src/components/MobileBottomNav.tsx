'use client';

import { Home, Landmark, GraduationCap, BookOpen, User } from 'lucide-react';
import { AppView } from '@/components/Sidebar';
import { UserProfile } from '@/types';

interface MobileBottomNavProps {
  activeView: AppView;
  onSelectView: (view: AppView) => void;
  onOpenAuth: () => void;
  user: UserProfile | null;
  isHidden?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeView,
  onSelectView,
  onOpenAuth,
  user,
  isHidden = false,
}) => {
  const navItems = [
    {
      id: 'home' as AppView,
      label: 'Home',
      icon: Home,
    },
    {
      id: 'gov-exams' as AppView,
      label: 'Govt',
      icon: Landmark,
    },
    {
      id: 'beu-engineering' as AppView,
      label: 'B.Tech',
      icon: GraduationCap,
    },
    {
      id: 'library' as AppView,
      label: 'Library',
      icon: BookOpen,
    },
    {
      id: 'profile' as AppView,
      label: user ? 'Profile' : 'Login',
      icon: User,
    },
  ];

  const handleItemClick = (id: AppView) => {
    if (id === 'profile' && !user) {
      onOpenAuth();
      return;
    }
    onSelectView(id);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <nav
      className={`mobile-bottom-nav ${isHidden ? 'is-hidden' : ''}`}
      aria-label="Mobile Navigation"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.id;

        return (
          <button
            key={item.id}
            onClick={() => handleItemClick(item.id)}
            className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            {isActive && <div className="mobile-nav-indicator" />}
            <div className="mobile-nav-icon-wrap">
              <Icon width={20} height={20} strokeWidth={isActive ? 2.3 : 1.8} />
            </div>
            <span className="mobile-nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
