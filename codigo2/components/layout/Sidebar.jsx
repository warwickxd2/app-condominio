import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, DollarSign, AlertTriangle,
  Megaphone, CalendarDays, LogOut, Menu, X, ChevronLeft, Wrench,
  ClipboardList, Package, Shield, Home, User, UserCog
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useProfile } from '@/lib/ProfileContext';
import { cn } from '@/lib/utils';

const moradorNav = [
  { path: '/', label: 'Início', icon: Home },
  { path: '/notices', label: 'Avisos', icon: Megaphone },
  { path: '/reservations', label: 'Reservas', icon: CalendarDays },
  { path: '/occurrences', label: 'Ocorrências', icon: AlertTriangle },
  { path: '/deliveries', label: 'Entregas', icon: Package },
];

const adminNav = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/units', label: 'Unidades', icon: Building2 },
  { path: '/finances', label: 'Financeiro', icon: DollarSign },
  { path: '/occurrences', label: 'Ocorrências', icon: AlertTriangle },
  { path: '/notices', label: 'Avisos', icon: Megaphone },
  { path: '/reservations', label: 'Reservas', icon: CalendarDays },
  { path: '/maintenances', label: 'Manutenções', icon: Wrench },
  { path: '/workorders', label: 'Ordens de Serviço', icon: ClipboardList },
  { path: '/deliveries', label: 'Entregas', icon: Package },
  { path: '/gate', label: 'Portaria', icon: Shield },
];

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeProfile, switchProfile, canSwitch } = useProfile();

  const handleLogout = () => base44.auth.logout();

  const handleSwitch = (profile) => {
    switchProfile(profile);
    navigate('/');
    setMobileOpen(false);
  };

  const navItems = activeProfile === 'admin' ? adminNav : moradorNav;

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 flex items-center justify-between border-b border-white/10">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center glow-cyan">
              <Building2 className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="font-display font-bold text-base text-white">CondoGest</h1>
              <p className="text-[11px] text-white/40">Gestão Condominial</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center mx-auto glow-cyan">
            <Building2 className="w-5 h-5 text-cyan-400" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex text-white/40 hover:text-white hover:bg-white/10 h-8 w-8"
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden text-white/40 hover:text-white hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Profile Switcher */}
      {canSwitch && !collapsed && (
        <div className="px-3 pt-3">
          <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
            <button
              onClick={() => handleSwitch('morador')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all",
                activeProfile === 'morador' ? "bg-cyan-500/20 text-cyan-400 border border-cyan-400/30" : "text-white/50 hover:text-white/80"
              )}
            >
              <User className="w-3.5 h-3.5" /> Morador
            </button>
            <button
              onClick={() => handleSwitch('admin')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all",
                activeProfile === 'admin' ? "bg-cyan-500/20 text-cyan-400 border border-cyan-400/30" : "text-white/50 hover:text-white/80"
              )}
            >
              <UserCog className="w-3.5 h-3.5" /> Admin
            </button>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                isActive
                  ? "bg-cyan-500/15 text-cyan-400 border border-cyan-400/20 glow-cyan"
                  : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent",
                collapsed && "justify-center px-2"
              )}
            >
              <item.icon className={cn("w-[18px] h-[18px] shrink-0", isActive && "drop-shadow-[0_0_6px_rgba(0,212,255,0.5)]")} />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="p-3 border-t border-white/10 space-y-2">
        {!collapsed && user && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 text-xs font-bold">
              {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">{user.full_name || 'Usuário'}</p>
              <p className="text-[10px] text-white/40 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl w-full transition-all text-white/50 hover:text-red-400 hover:bg-red-500/10",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="w-[18px] h-[18px]" />
          {!collapsed && <span className="text-sm font-medium">Sair</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={cn(
        "fixed top-0 left-0 h-full z-50 transform transition-transform duration-300 lg:hidden",
        "bg-white/[0.03] backdrop-blur-2xl border-r border-white/10 w-64",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <NavContent />
      </aside>

      <aside className={cn(
        "hidden lg:flex flex-col h-screen sticky top-0 transition-all duration-300",
        "bg-white/[0.03] backdrop-blur-2xl border-r border-white/10",
        collapsed ? "w-[72px]" : "w-64"
      )}>
        <NavContent />
      </aside>
    </>
  );
}