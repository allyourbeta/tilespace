import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';

interface UserMenuProps {
  isCollapsed?: boolean;
}

export function UserMenu({ isCollapsed = false }: UserMenuProps) {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  if (!user) return null;

  return (
    <div className="relative flex items-center gap-2.5 min-w-0 flex-1 group/build" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-[26px] h-[26px] rounded-full overflow-hidden border border-edge flex-none"
      >
        <img
          src={user.user_metadata.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email || 'U')}`}
          alt=""
          className="w-full h-full object-cover"
        />
      </button>

      {!isCollapsed && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-ts-body text-ink-2 truncate min-w-0 flex-1 text-left"
        >
          {user.email}
        </button>
      )}

      {/* Build info tooltip on hover */}
      <div className="absolute bottom-full left-0 mb-1 px-2 py-1 bg-gray-800 text-gray-200 text-ts-meta rounded shadow-lg whitespace-nowrap opacity-0 group-hover/build:opacity-100 transition-opacity pointer-events-none z-10">
        Build: {__BUILD_HASH__} · {__BUILD_TIME__}
      </div>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[200px] z-20">
          <p className="px-4 py-2 text-ts-meta text-gray-600 truncate border-b border-gray-100">
            {user.email}
          </p>
          <button
            onClick={() => { signOut(); setIsOpen(false); }}
            className="w-full text-left px-4 py-2 text-ts-body text-red-600 hover:bg-red-50 transition-colors"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
