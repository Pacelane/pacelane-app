import React, { useState, useEffect } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit, Search, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';
const Profile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [whatsapp, setWhatsapp] = useState('');
  const [bio, setBio] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    const getUser = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        navigate('/signin');
        return;
      }
      setUser(session.user);
      setLoading(false);
    };
    getUser();
  }, [navigate]);
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/signin');
      toast.success('Signed out successfully');
    } catch (error: any) {
      toast.error('Error signing out');
    }
  };
  const handleSaveProfile = async () => {
    toast.success('Profile updated successfully');
  };
  const handleSaveBio = async () => {
    toast.success('Bio updated successfully');
  };
  const handleSaveAddress = async () => {
    toast.success('Address updated successfully');
  };
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
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
                          <h4 className="font-semibold text-gray-900">{user?.email?.split('@')[0]}</h4>
                          <p className="text-sm text-gray-500">User Designer @ Acme Inc</p>
                        </div>
                        <Button variant="ghost" size="icon" className="ml-auto">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Whatsapp
                          </label>
                          <div className="flex gap-2">
                            <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-md bg-gray-50">
                              <span className="text-sm text-gray-600">🇧🇷</span>
                              <span className="text-sm text-gray-600">+55</span>
                            </div>
                            <Input type="text" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="(00) 0 0000-0000" className="flex-1" />
                          </div>
                          <Button className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2" onClick={handleSaveProfile}>
                            Save
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Bio */}
                <Card className="border border-gray-200 shadow-sm rounded-lg">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between p-6 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900 text-lg">Bio</h3>
                    </div>
                    
                    <div className="p-6">
                      <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Cras tellus lacus consequetur lacinia hrisque mauris. Rhoncus ut erat nec venenatis vulputate per inceptor lorem." className="min-h-[120px] resize-none" />
                      <Button className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2" onClick={handleSaveBio}>
                        Save
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Address */}
                <Card className="border border-gray-200 shadow-sm rounded-lg">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between p-6 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900 text-lg">Address</h3>
                    </div>
                    
                    <div className="p-6 space-y-4">
                      <p className="text-sm text-gray-600 mb-4">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                      </p>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City
                        </label>
                        <Input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="Curitiba" />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country
                        </label>
                        <Input type="text" value={country} onChange={e => setCountry(e.target.value)} placeholder="Brazil" />
                      </div>

                      <Button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2" onClick={handleSaveAddress}>
                        Save
                      </Button>
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