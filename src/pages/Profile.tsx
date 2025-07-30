import React, { useState, useEffect } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit, Search, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/api/useProfile';
const Profile = () => {
  // Use our clean auth and profile hooks
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, saving, updateBasicProfile, error } = useProfile();
  
  // Local state for form inputs (only fields that exist in DB)
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const navigate = useNavigate();

  // Load profile data into form when profile loads
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setPhoneNumber(profile.phone_number || '');
    }
  }, [profile]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/signin');
    }
  }, [user, authLoading, navigate]);
  const handleSignOut = async () => {
    const result = await signOut();
    if (result.error) {
      toast.error('Error signing out');
    } else {
      navigate('/signin');
      toast.success('Signed out successfully');
    }
  };

  const handleSaveProfile = async () => {
    const result = await updateBasicProfile({
      display_name: displayName,
      phone_number: phoneNumber
    });
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Profile updated successfully');
    }
  };
  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return null; // Will redirect to signin
  }
  return <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar userName={user?.email?.split('@')[0] || 'User'} userAvatar="/lovable-uploads/fe97b466-2c78-4c2a-baeb-f2e13105460d.png" navigationItems={[{
        id: 'home',
        label: 'Home',
        icon: 'home',
        isActive: false
      }, {
        id: 'posts',
        label: 'Posts',
        icon: 'knowledge',
        isActive: false
      }, {
        id: 'profile',
        label: 'Profile',
        icon: 'profile',
        isActive: true
      }, {
        id: 'knowledge',
        label: 'Knowledge',
        icon: 'knowledge',
        isActive: false
      }, {
        id: 'calendar',
        label: 'Calendar',
        icon: 'calendar',
        isActive: false
      }]} onCreateNew={() => {}} onUserMenuClick={() => {}} onNavigationClick={itemId => {
        if (itemId === 'home') navigate('/product-home');
        if (itemId === 'knowledge') navigate('/knowledge');
        if (itemId === 'profile') navigate('/profile');
        if (itemId === 'posts') navigate('/posts');
      }} onFinishOnboarding={() => {}} onHelpClick={() => {}} />
        
        <SidebarInset>
          
          
          <div className="flex-1 bg-gray-50">
            <div className="w-full max-w-4xl mx-auto p-8">
              <div className="mb-8">
                <h1 className="text-4xl font-bold font-playfair text-[#111115] mb-2">Profile</h1>
                <p className="text-[#4E4E55] text-sm">
                  Here you can find all the details about your strategy or content creation
                </p>
              </div>

              <div className="space-y-8">
                {/* Personal Information */}
                <Card className="border border-gray-200 shadow-sm rounded-lg">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between p-6 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900 text-lg">Personal Information</h3>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex items-center gap-4 mb-6">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src="" />
                          <AvatarFallback className="bg-gray-200 text-gray-600 text-lg">
                            {user?.email?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {profile?.display_name || user?.email?.split('@')[0] || 'User'}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {profile?.linkedin_headline || 'User @ Pacelane'}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" className="ml-auto">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Display Name
                          </label>
                          <Input 
                            type="text" 
                            value={displayName} 
                            onChange={e => setDisplayName(e.target.value)} 
                            placeholder="Your display name" 
                            className="mb-4" 
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number
                          </label>
                          <Input 
                            type="text" 
                            value={phoneNumber} 
                            onChange={e => setPhoneNumber(e.target.value)} 
                            placeholder="+55 (11) 99999-9999" 
                            className="w-full" 
                          />
                          <Button 
                            className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2" 
                            onClick={handleSaveProfile}
                            disabled={saving}
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* LinkedIn Information */}
                <Card className="border border-gray-200 shadow-sm rounded-lg">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between p-6 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900 text-lg">LinkedIn Profile</h3>
                    </div>
                    
                    <div className="p-6 space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>LinkedIn URL:</strong> {profile?.linkedin_profile || 'Not set'}
                        </p>
                        {profile?.linkedin_name && (
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Name:</strong> {profile.linkedin_name}
                          </p>
                        )}
                        {profile?.linkedin_company && (
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Company:</strong> {profile.linkedin_company}
                          </p>
                        )}
                        {profile?.linkedin_headline && (
                          <p className="text-sm text-gray-600">
                            <strong>Headline:</strong> {profile.linkedin_headline}
                          </p>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-500">
                        LinkedIn information is set during onboarding and updated automatically when available.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Sign Out Section */}
                <div className="pt-8 border-t border-gray-200">
                  <Button 
                    variant="destructive" 
                    onClick={handleSignOut}
                    className="w-full"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>;
};
export default Profile;