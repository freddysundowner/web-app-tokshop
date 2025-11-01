import { Settings } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSettings } from '@/lib/settings-context';
import { useAuth } from '@/lib/auth-context';

interface AppHeaderProps {
  onMobileMenuToggle?: () => void;
  mobileMenuOpen?: boolean;
  onMobileMenuClose?: () => void;
  hideLogo?: boolean;
}

export function AppHeader({ onMobileMenuToggle, hideLogo = false }: AppHeaderProps) {
  const { settings } = useSettings();
  const { user } = useAuth();

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.firstName) {
      return user.firstName[0].toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'A';
  };

  const userId = (user as any)?._id || user?.id;

  return (
    <header className="sticky top-0 z-50 border-b bg-background border-border">
      <div className="flex justify-center w-full">
        <div className="flex items-center justify-between h-14 px-3 sm:px-6 w-full">
          {/* Left Section - Logo */}
          {!hideLogo && (
            <Link href="/admin/dashboard" data-testid="link-admin-home">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">
                    {settings.app_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-bold text-foreground">{settings.app_name}</span>
                  <span className="text-xs text-muted-foreground -mt-1">Admin Panel</span>
                </div>
              </div>
            </Link>
          )}

          {/* Right Section - Admin Actions */}
          <div className="flex items-center gap-2">
            {/* Settings Button */}
            <Link href="/admin/settings">
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-9 w-9 rounded-full"
                data-testid="button-admin-settings"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </Link>

            {/* Admin Avatar - Click to go to profile */}
            {user && (
              <Link href="/admin/profile" data-testid="link-admin-profile">
                <Avatar className="h-9 w-9 cursor-pointer">
                  <AvatarImage src={user.profilePhoto} alt={`${user.firstName || user.email}`} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
