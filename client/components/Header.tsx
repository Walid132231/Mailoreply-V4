import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Mail, Menu, X, User, Settings, LogOut, Shield } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">MailoReply</span>
            <Badge variant="secondary" className="hidden sm:inline-flex">AI</Badge>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/how-it-works" 
              className={`text-sm font-medium transition-colors ${
                isActive('/how-it-works') ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              How It Works
            </Link>
            <Link 
              to="/privacy" 
              className={`text-sm font-medium transition-colors ${
                isActive('/privacy') ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Privacy
            </Link>
            <Link 
              to="/terms" 
              className={`text-sm font-medium transition-colors ${
                isActive('/terms') ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Terms
            </Link>
          </nav>

          {/* Auth Buttons / User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                {user.role === 'superuser' && (
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/dashboard/admin-settings">
                      <Shield className="h-4 w-4 mr-2" />
                      Admin
                    </Link>
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{user.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user.name}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700" asChild>
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-gray-600" />
            ) : (
              <Menu className="h-6 w-6 text-gray-600" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-4">
              <Link 
                to="/how-it-works" 
                className={`text-sm font-medium transition-colors ${
                  isActive('/how-it-works') ? 'text-blue-600' : 'text-gray-600'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                How It Works
              </Link>
              <Link 
                to="/privacy" 
                className={`text-sm font-medium transition-colors ${
                  isActive('/privacy') ? 'text-blue-600' : 'text-gray-600'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Privacy
              </Link>
              <Link 
                to="/terms" 
                className={`text-sm font-medium transition-colors ${
                  isActive('/terms') ? 'text-blue-600' : 'text-gray-600'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Terms
              </Link>
              <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
                {user ? (
                  <>
                    <div className="px-2 py-2 text-sm">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-gray-500">{user.email}</p>
                    </div>
                    <Button variant="ghost" asChild>
                      <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
                    </Button>
                    {user.role === 'superuser' && (
                      <Button variant="ghost" asChild>
                        <Link to="/dashboard/admin-settings" onClick={() => setIsMenuOpen(false)}>Admin</Link>
                      </Button>
                    )}
                    <Button variant="ghost" onClick={() => { logout(); setIsMenuOpen(false); }}>
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" asChild>
                      <Link to="/login" onClick={() => setIsMenuOpen(false)}>Sign In</Link>
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700" asChild>
                      <Link to="/signup" onClick={() => setIsMenuOpen(false)}>Sign Up</Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
