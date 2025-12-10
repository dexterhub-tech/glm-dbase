import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertTriangle, Home, RefreshCw, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';

interface AccessDeniedProps {
  requiredPermission?: string;
  requiredRole?: string;
  message?: string;
  showRetry?: boolean;
  showContactAdmin?: boolean;
  onRetry?: () => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  requiredPermission,
  requiredRole,
  message,
  showRetry = true,
  showContactAdmin = true,
  onRetry
}) => {
  const navigate = useNavigate();
  const { user, refresh } = useAuth();

  const handleRetry = async () => {
    if (onRetry) {
      onRetry();
    } else {
      await refresh();
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleContactAdmin = () => {
    // In a real app, this might open a support ticket or email
    const subject = encodeURIComponent('Access Request - Admin Privileges');
    const body = encodeURIComponent(
      `Hello,\n\nI am requesting access to admin features.\n\n` +
      `User Email: ${user?.email || 'Not logged in'}\n` +
      `Required Permission: ${requiredPermission || 'Not specified'}\n` +
      `Required Role: ${requiredRole || 'Not specified'}\n\n` +
      `Please grant me the necessary permissions.\n\nThank you.`
    );
    
    window.location.href = `mailto:admin@gospellabourministry.com?subject=${subject}&body=${body}`;
  };

  const defaultMessage = requiredPermission 
    ? `You need the "${requiredPermission}" permission to access this feature.`
    : requiredRole
    ? `You need the "${requiredRole}" role to access this feature.`
    : 'You do not have permission to access this resource.';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="border-red-200 shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Access Denied
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {message || defaultMessage}
              </AlertDescription>
            </Alert>

            {user && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <div className="font-medium text-gray-700 mb-1">Current User:</div>
                <div className="text-gray-600">{user.email}</div>
                {user.role && (
                  <div className="text-gray-600">Role: {user.role}</div>
                )}
              </div>
            )}

            <div className="space-y-3">
              {showRetry && (
                <Button 
                  onClick={handleRetry}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Access
                </Button>
              )}

              {showContactAdmin && (
                <Button 
                  onClick={handleContactAdmin}
                  variant="outline"
                  className="w-full"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Administrator
                </Button>
              )}

              <Button 
                onClick={handleGoHome}
                className="w-full"
              >
                <Home className="h-4 w-4 mr-2" />
                Go to Home
              </Button>
            </div>

            <div className="text-xs text-gray-500 text-center pt-2">
              If you believe this is an error, please contact your system administrator.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccessDenied;