import { useState, useEffect, useRef } from "react";
import { X, Save, Calendar, Clock, MapPin, Image, Users, Type, Upload, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Event {
  id: string;
  title: string;
  description?: string;
  event_date: string;
  event_time?: string;
  end_date?: string;
  end_time?: string;
  location?: string;
  image_url?: string;
  event_type: 'regular' | 'special' | 'recurring';
  is_recurring: boolean;
  recurrence_pattern?: string;
  max_attendees?: number;
  registration_required: boolean;
  is_published: boolean;
}

interface EventFormProps {
  event?: Event | null;
  onClose: () => void;
}

const EventForm = ({ event, onClose }: EventFormProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    event_time: '',
    end_date: '',
    end_time: '',
    location: '',
    image_url: '',
    event_type: 'regular' as 'regular' | 'special' | 'recurring',
    is_recurring: false,
    recurrence_pattern: '',
    max_attendees: '',
    registration_required: false,
    is_published: true,
  });
  
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadMethod, setUploadMethod] = useState<'url' | 'upload'>('url');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        event_date: event.event_date || '',
        event_time: event.event_time || '',
        end_date: event.end_date || '',
        end_time: event.end_time || '',
        location: event.location || '',
        image_url: event.image_url || '',
        event_type: event.event_type || 'regular',
        is_recurring: event.is_recurring || false,
        recurrence_pattern: event.recurrence_pattern || '',
        max_attendees: event.max_attendees?.toString() || '',
        registration_required: event.registration_required || false,
        is_published: event.is_published ?? true,
      });
      setImagePreview(event.image_url || '');
    }
  }, [event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const eventData = {
        title: formData.title,
        description: formData.description || null,
        event_date: formData.event_date,
        event_time: formData.event_time || null,
        end_date: formData.end_date || null,
        end_time: formData.end_time || null,
        location: formData.location || null,
        image_url: formData.image_url || null,
        event_type: formData.event_type,
        is_recurring: formData.is_recurring,
        recurrence_pattern: formData.is_recurring ? formData.recurrence_pattern : null,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
        registration_required: formData.registration_required,
        is_published: formData.is_published,
      };

      let error;
      
      if (event) {
        // Update existing event
        const { error: updateError } = await supabase
          .from('events' as any)
          .update(eventData)
          .eq('id', event.id);
        error = updateError;
      } else {
        // Create new event
        const { error: insertError } = await supabase
          .from('events' as any)
          .insert([eventData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: `Event ${event ? 'updated' : 'created'} successfully`,
      });
      
      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: "Error",
        description: `Failed to ${event ? 'update' : 'create'} event`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Update image preview when URL changes
    if (field === 'image_url') {
      setImagePreview(value);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `event-${Date.now()}.${fileExt}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('event-images')
        .upload(fileName, file);

      if (error) {
        // If bucket doesn't exist, create it first
        if (error.message.includes('Bucket not found')) {
          toast({
            title: "Storage Setup Required",
            description: "Please contact admin to set up image storage",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('event-images')
        .getPublicUrl(fileName);

      handleInputChange('image_url', publicUrl);
      setImagePreview(publicUrl);
      
      toast({
        title: "Image uploaded successfully",
        description: "Your event image has been uploaded",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again or use URL instead.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl">
            {event ? 'Edit Event' : 'Create New Event'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Type className="h-4 w-4" />
                <h3 className="font-medium">Basic Information</h3>
              </div>
              
              <div>
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter event title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter event description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="event_type">Event Type</Label>
                  <Select value={formData.event_type} onValueChange={(value) => handleInputChange('event_type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="special">Special</SelectItem>
                      <SelectItem value="recurring">Recurring</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="Event location"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Date and Time */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4" />
                <h3 className="font-medium">Date & Time</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="event_date">Event Date *</Label>
                  <Input
                    id="event_date"
                    type="date"
                    value={formData.event_date}
                    onChange={(e) => handleInputChange('event_date', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="event_time">Event Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="event_time"
                      type="time"
                      value={formData.event_time}
                      onChange={(e) => handleInputChange('event_time', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="end_date">End Date (Optional)</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="end_time">End Time (Optional)</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => handleInputChange('end_time', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Recurring Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="is_recurring">Recurring Event</Label>
                <Switch
                  id="is_recurring"
                  checked={formData.is_recurring}
                  onCheckedChange={(checked) => handleInputChange('is_recurring', checked)}
                />
              </div>

              {formData.is_recurring && (
                <div>
                  <Label htmlFor="recurrence_pattern">Recurrence Pattern</Label>
                  <Select value={formData.recurrence_pattern} onValueChange={(value) => handleInputChange('recurrence_pattern', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select pattern" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Additional Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4" />
                <h3 className="font-medium">Additional Settings</h3>
              </div>

              <div>
                <Label htmlFor="max_attendees">Maximum Attendees</Label>
                <Input
                  id="max_attendees"
                  type="number"
                  value={formData.max_attendees}
                  onChange={(e) => handleInputChange('max_attendees', e.target.value)}
                  placeholder="Leave empty for unlimited"
                  min="1"
                />
              </div>

              {/* Event Image Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Image className="h-4 w-4" />
                  <h3 className="font-medium">Event Flyer/Image</h3>
                </div>

                {/* Upload Method Toggle */}
                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setUploadMethod('url')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      uploadMethod === 'url'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Link className="h-4 w-4" />
                    Image URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMethod('upload')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      uploadMethod === 'upload'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Upload className="h-4 w-4" />
                    Upload File
                  </button>
                </div>

                {/* URL Input */}
                {uploadMethod === 'url' && (
                  <div>
                    <Label htmlFor="image_url">Image URL</Label>
                    <div className="relative">
                      <Link className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="image_url"
                        value={formData.image_url}
                        onChange={(e) => handleInputChange('image_url', e.target.value)}
                        placeholder="https://example.com/event-flyer.jpg"
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Recommended: 4x4 inches (square) format for best display
                    </p>
                  </div>
                )}

                {/* File Upload */}
                {uploadMethod === 'upload' && (
                  <div>
                    <Label>Upload Image</Label>
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-1">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF up to 5MB. Recommended: 4x4 inches (square)
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                )}

                {/* Image Preview */}
                {imagePreview && (
                  <div>
                    <Label>Preview</Label>
                    <div className="mt-2 p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-start gap-4">
                        <img
                          src={imagePreview}
                          alt="Event preview"
                          className="w-24 h-24 object-cover rounded-lg border"
                          onError={() => {
                            setImagePreview('');
                            toast({
                              title: "Invalid image",
                              description: "The image URL is not valid or accessible",
                              variant: "destructive",
                            });
                          }}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Event Flyer</p>
                          <p className="text-xs text-gray-500 mt-1">
                            This image will be displayed on the event detail page
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => {
                              handleInputChange('image_url', '');
                              setImagePreview('');
                            }}
                          >
                            Remove Image
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="registration_required">Registration Required</Label>
                <Switch
                  id="registration_required"
                  checked={formData.registration_required}
                  onCheckedChange={(checked) => handleInputChange('registration_required', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_published">Publish Event</Label>
                <Switch
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => handleInputChange('is_published', checked)}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {event ? 'Update Event' : 'Create Event'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventForm;