'use client';

import { useState } from 'react';
import Image from 'next/image';
import Inbox from './Inbox';
import Compose from './Compose';
import ChangePin from './ChangePin';
import Help from './Help';
import Wipe from './Wipe';

const NavIcon = {
  inbox: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-6l-2 3h-4l-2-3H2"/>
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
    </svg>
  ),
  compose: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  pin: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  help: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  wipe: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      <line x1="10" y1="11" x2="10" y2="17"/>
      <line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
  ),
  signout: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
};

export default function AppShell({ session, onLogout }) {
  const [view, setView] = useState('inbox');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'inbox', label: 'Inbox', icon: NavIcon.inbox },
    { id: 'compose', label: 'New Message', icon: NavIcon.compose },
  ];

  const settingsItems = [
    { id: 'pin', label: 'Change PIN', icon: NavIcon.pin },
    { id: 'help', label: 'Help', icon: NavIcon.help },
  ];

  const dangerItems = [
    { id: 'wipe', label: 'Wipe Account', icon: NavIcon.wipe, danger: true },
  ];

  const renderContent = () => {
    switch (view) {
      case 'inbox':
        return <Inbox session={session} onCompose={() => setView('compose')} />;
      case 'compose':
        return <Compose session={session} onSent={() => setView('inbox')} onCancel={() => setView('inbox')} />;
      case 'pin':
        return <ChangePin session={session} onSuccess={() => setView('inbox')} />;
      case 'help':
        return <Help />;
      case 'wipe':
        return <Wipe session={session} onWiped={onLogout} />;
      default:
        return <Inbox session={session} onCompose={() => setView('compose')} />;
    }
  };

  const NavLink = ({ item, onClick }) => (
    <button
      onClick={() => { onClick ? onClick() : setView(item.id); setMobileMenuOpen(false); }}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        view === item.id
          ? 'bg-violet-600 text-white'
          : item.danger
          ? 'text-red-600 hover:bg-red-50'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {item.icon}
      {item.label}
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Image src="/icon.png" alt="Jumy" width={32} height={32} className="rounded-lg" />
          <span className="font-semibold text-gray-900">Jumy</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-64 bg-white p-4" onClick={e => e.stopPropagation()}>
            <div className="space-y-1">
              {navItems.map(item => <NavLink key={item.id} item={item} />)}
            </div>
            <div className="my-4 border-t border-gray-100" />
            <div className="space-y-1">
              {settingsItems.map(item => <NavLink key={item.id} item={item} />)}
            </div>
            <div className="my-4 border-t border-gray-100" />
            <div className="space-y-1">
              {dangerItems.map(item => <NavLink key={item.id} item={item} />)}
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                {NavIcon.signout}
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-6">
          <Image src="/icon.png" alt="Jumy" width={40} height={40} className="rounded-xl" />
          <span className="text-xl font-semibold text-gray-900">Jumy</span>
        </div>
        
        <nav className="flex-1 space-y-1">
          {navItems.map(item => <NavLink key={item.id} item={item} />)}
          
          <div className="my-4 border-t border-gray-100" />
          
          {settingsItems.map(item => <NavLink key={item.id} item={item} />)}
          
          <div className="my-4 border-t border-gray-100" />
          
          {dangerItems.map(item => <NavLink key={item.id} item={item} />)}
          
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {NavIcon.signout}
            Sign Out
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 overflow-auto">
        <div className="max-w-3xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
