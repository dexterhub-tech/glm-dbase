import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  AlertCircle, 
  CheckCircle2, 
  Edit, 
  User, 
  Phone, 
  Heart, 
  MapPin,
  Briefcase 
} from 'lucide-react';
import { 
  generateCompletionPrompts, 
  calculateProfileCompletion,
  type ProfileData 
} from '@/utils/profileDataHandling';

interface ProfileCompletionPromptProps {
  profileData: Partial<ProfileData>;
  onEditProfile: () => void;
  showDetailed?: boolean;
  className?: string;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'basic': return <User className="w-4 h-4" />;
    case 'contact': return <Phone className="w-4 h-4" />;
    case 'emergency': return <Heart className="w-4 h-4" />;
    case 'personal': return <Briefcase className="w-4 h-4" />;
    case 'spiritual': return <CheckCircle2 className="w-4 h-4" />;
    default: return <MapPin className="w-4 h-4" />;
  }
};

const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
  switch (priority) {
    case 'high': return 'destructive';
    case 'medium': return 'default';
    case 'low': return 'secondary';
    default: return 'secondary';
  }
};

export const ProfileCompletionPrompt: React.FC<ProfileCompletionPromptProps> = ({
  profileData,
  onEditProfile,
  showDetailed = false,
  className = '',
}) => {
  const completion = calculateProfileCompletion(profileData);
  const prompts = generateCompletionPrompts(profileData);

  // Don't show if profile is complete enough and no required fields missing
  if (completion.completionPercentage >= 90 && !prompts.hasRequiredMissing) {
    return null;
  }

  if (!showDetailed && !prompts.hasRequiredMissing && completion.completionPercentage >= 70) {
    return (
      <Alert className={className}>
        <CheckCircle2 className="h-4 w-4" />
        <AlertTitle>Profile Looking Good!</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>Your profile is {completion.completionPercentage}% complete.</span>
          <Button variant="outline" size="sm" onClick={onEditProfile}>
            <Edit className="w-3 h-3 mr-1" />
            Add More
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {prompts.hasRequiredMissing ? (
              <AlertCircle className="h-5 w-5 text-destructive" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-primary" />
            )}
            <CardTitle className="text-lg">
              {prompts.hasRequiredMissing ? 'Complete Your Profile' : 'Enhance Your Profile'}
            </CardTitle>
          </div>
          <Badge variant={prompts.hasRequiredMissing ? 'destructive' : 'default'}>
            {completion.completionPercentage}% Complete
          </Badge>
        </div>
        <CardDescription>
          {prompts.primaryPrompt}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Profile Completion</span>
            <span>{completion.completedCount} of {completion.totalFields} fields</span>
          </div>
          <Progress 
            value={completion.completionPercentage} 
            className="h-2"
          />
        </div>

        {/* Primary Action */}
        <Button 
          onClick={onEditProfile}
          variant={prompts.hasRequiredMissing ? 'default' : 'outline'}
          className="w-full"
        >
          <Edit className="w-4 h-4 mr-2" />
          {prompts.hasRequiredMissing ? 'Complete Required Fields' : 'Edit Profile'}
        </Button>

        {/* Detailed View */}
        {showDetailed && prompts.actionItems.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Missing Information:</h4>
            <div className="grid gap-2">
              {prompts.actionItems.slice(0, 6).map((item) => (
                <div 
                  key={item.field}
                  className="flex items-center justify-between p-2 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(item.category)}
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <Badge 
                    variant={getPriorityColor(item.priority)}
                    size="sm"
                  >
                    {item.priority}
                  </Badge>
                </div>
              ))}
              {prompts.actionItems.length > 6 && (
                <div className="text-center text-sm text-muted-foreground">
                  +{prompts.actionItems.length - 6} more fields
                </div>
              )}
            </div>
          </div>
        )}

        {/* Secondary Prompts */}
        {prompts.secondaryPrompts.length > 0 && (
          <div className="space-y-1">
            {prompts.secondaryPrompts.map((prompt, index) => (
              <p key={index} className="text-sm text-muted-foreground">
                {prompt}
              </p>
            ))}
          </div>
        )}

        {/* Completed Fields Summary */}
        {completion.completedFields.length > 0 && showDetailed && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-green-700">Completed:</h4>
            <div className="flex flex-wrap gap-1">
              {completion.completedFields.slice(0, 8).map((field) => (
                <Badge key={field} variant="outline" className="text-xs">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {field}
                </Badge>
              ))}
              {completion.completedFields.length > 8 && (
                <Badge variant="outline" className="text-xs">
                  +{completion.completedFields.length - 8} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileCompletionPrompt;