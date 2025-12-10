import React from 'react';
import { 
  Users, 
  Calendar, 
  Settings, 
  AlertTriangle, 
  RefreshCw, 
  Home,
  Shield,
  Database,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';

interface FallbackDashboardProps {
  error?: string;
  missingComponents?: string[];
  onRetry?: () => void;
  onRefresh?: () => void;
}

const FallbackDashboard: React.FC<FallbackDashboardProps> = ({
  error,
  missingComponents = [],
  onRetry,
  onRefresh,
}) => {
  const { user, isSuperUser, isAdmin } = useAuth();

  const handleNavigation = (path: string) => {
    window.location.href = path;
  };

  const basicStats = [
    {
      title: 'System Status',
      value: 'Limited Mode',
      icon: AlertTriangle,
      description: 'Running with basic functionality',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'User Access',
      value: isAdmin ? 'Admin' : 'User',
      icon: Shield,
      description: `Logged in as ${user?.email || 'Unknown'}`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Available Features',
      value: `${4 - missingComponents.length}/4`,
      icon: Activity,
      description: 'Core features accessible',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ];

  const availableActions = [
    {
      title: 'User Management',
      description: 'Manage church members and users',
      icon: Users,
      path: '/admin/users',
      available: !missingComponents.includes('UserManagement'),
    },
    {
      title: 'Events Management',
      description: 'Create and manage church events',
      icon: Calendar,
      path: '/admin/events',
      available: !missingComponents.includes('EventsManagement'),
    },
    {
      title: 'Members Directory',
      description: 'View and manage member profiles',
      icon: Database,
      path: '/admin/members',
      available: !missingComponents.includes('MembersManager'),
    },
    {
      title: 'System Settings',
      description: 'Configure system preferences',
      icon: Settings,
      path: '/admin/settings',
      available: !missingComponents.includes('Settings'),
    },
  ];

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="h-8 w-8 text-yellow-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard - Limited Mode</h1>
          <p className="text-gray-600 mt-2">
            Some components couldn't load, but core functionality is still available.
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Component Loading Issue:</strong> {error}
            {missingComponents.length > 0 && (
              <div className="mt-2">
                <strong>Affected components:</strong> {missingComponents.join(', ')}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-center">
        {onRetry && (
          <Button
            onClick={onRetry}
            className="flex items-center gap-2"
            variant="default"
          >
            <RefreshCw className="h-4 w-4" />
            Retry Loading
          </Button>
        )}
        
        {onRefresh && (
          <Button
            onClick={onRefresh}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Page
          </Button>
        )}
        
        <Button
          onClick={() => handleNavigation('/admin')}
          variant="ghost"
          className="flex items-center gap-2"
        >
          <Home className="h-4 w-4" />
          Dashboard Home
        </Button>
      </div>

      {/* Basic Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {basicStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Available Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableActions.map((action, index) => (
            <Card 
              key={index} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                action.available 
                  ? 'border-gray-200 hover:border-blue-300' 
                  : 'border-gray-100 bg-gray-50 opacity-60'
              }`}
              onClick={() => action.available && handleNavigation(action.path)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    action.available ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <action.icon className={`h-5 w-5 ${
                      action.available ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div>
                    <CardTitle className={`text-base ${
                      action.available ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {action.title}
                      {!action.available && (
                        <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                          Unavailable
                        </span>
                      )}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className={action.available ? 'text-gray-600' : 'text-gray-400'}>
                  {action.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Help Section */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900 mb-1">Need Help?</h3>
              <p className="text-sm text-blue-800 mb-3">
                If you continue to experience issues, try refreshing the page or contact your system administrator.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-blue-700 hover:bg-blue-100"
                  onClick={() => handleNavigation('/admin')}
                >
                  Go to Main Dashboard
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FallbackDashboard;