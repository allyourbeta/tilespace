import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/auth';

export function UserMenu() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
  };

  // Get initials as fallback for avatar
  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email?.slice(0, 2).toUpperCase() ?? '??';

  return (
    <div ref={menuRef} className="fixed bottom-4 right-4 z-40">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-lg hover:shadow-xl transition-shadow"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name || 'User'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-600 flex items-center justify-center text-white font-medium text-sm">
            {initials}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-xl border p-2 min-w-[200px]">
          <p className="px-3 py-2 text-sm text-gray-600 truncate">{user.email}</p>
          <hr className="my-1" />
          <button
            onClick={handleSignOut}
            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
