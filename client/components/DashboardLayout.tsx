import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/NewAuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Zap, 
  FileText, 
  Users, 
  BarChart3, 
  Settings, 
  CreditCard,
  LogOut,
  Mail,
  Crown
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'AI Generator', href: '/dashboard/ai-generator', icon: Zap },
    { name: 'Templates', href: '/dashboard/templates', icon: FileText },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  ];

  // Only add subscription for non-superuser roles
  if (user?.role !== 'superuser') {
    navigation.push({ name: 'Subscription', href: '/dashboard/subscription', icon: CreditCard });
  }

  // Add role-specific navigation
  if (user?.role === 'enterprise_manager') {
    navigation.push({ name: 'Team Management', href: '/dashboard/team', icon: Users });
  }

  if (user?.role === 'superuser') {
    navigation.push({ name: 'Enterprise', href: '/dashboard/enterprise', icon: Crown });
  }

  // Add settings last
  navigation.push({ name: 'Settings', href: '/dashboard/settings', icon: Settings });

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      superuser: { label: 'System Administrator', color: 'bg-red-100 text-red-800' },
      enterprise_manager: { label: 'Manager', color: 'bg-purple-100 text-purple-800' },
      enterprise_user: { label: 'Enterprise', color: 'bg-emerald-100 text-emerald-800' },
      pro_plus: { label: 'Pro Plus', color: 'bg-purple-100 text-purple-800' },
      pro: { label: 'Pro', color: 'bg-blue-100 text-blue-800' },
      free: { label: 'Free', color: 'bg-gray-100 text-gray-800' },
    };

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.free;
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Mail className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">MailoReply AI</h1>
              <p className="text-xs text-gray-500">Smart Email Assistant</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">
                {user?.email?.[0]?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.email}
              </p>
              <div className="mt-1">
                {getRoleBadge(user?.role || 'free')}
              </div>
            </div>
          </div>
          
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="w-full justify-start"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}