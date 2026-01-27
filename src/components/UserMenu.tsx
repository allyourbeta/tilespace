import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';

export function UserMenu() {
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
    <div className="fixed bottom-4 right-4 z-40" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-lg hover:shadow-xl transition-shadow"
      >
        <img 
          src={user.user_metadata.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email || 'U')}`} 
          alt="" 
          className="w-full h-full object-cover" 
        />
      </button>
      
      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[200px]">
          <p className="px-4 py-2 text-sm text-gray-600 truncate border-b border-gray-100">
            {user.email}
          </p>
          <button
            onClick={() => { signOut(); setIsOpen(false); }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
