// Test script for WhatsApp notifications
// This script tests the WhatsApp notification system by creating a test user and draft

const { createClient } = require('@supabase/supabase-js');

// Configuration - replace with your actual values
const SUPABASE_URL = 'http://localhost:54321'; // Local Supabase
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testWhatsAppNotifications() {
  try {
    console.log('🧪 Testing WhatsApp notification system...\n');

    // Step 1: Create a test user
    console.log('1️⃣ Creating test user...');
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email: 'test-whatsapp@example.com',
      password: 'testpassword123',
      email_confirm: true
    });

    if (userError) {
      console.error('❌ Error creating user:', userError);
      return;
    }

    const userId = user.user.id;
    console.log('✅ Test user created:', userId);

    // Step 2: Create user profile with WhatsApp number
    console.log('\n2️⃣ Creating user profile with WhatsApp number...');
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        whatsapp_number: '+5511999999999', // Test Brazilian number
        industry: 'Technology',
        company_size: '10-50',
        role: 'Developer'
      });

    if (profileError) {
      console.error('❌ Error creating profile:', profileError);
      return;
    }

    console.log('✅ Profile created with WhatsApp number');

    // Step 3: Create a test draft
    console.log('\n3️⃣ Creating test draft...');
    const { data: draft, error: draftError } = await supabase
      .from('saved_drafts')
      .insert({
        user_id: userId,
        title: 'Test Draft for WhatsApp Notifications',
        content: 'This is a test draft to verify the WhatsApp notification system is working correctly.',
        status: 'ready',
        whatsapp_notification_sent: false
      })
      .select()
      .single();

    if (draftError) {
      console.error('❌ Error creating draft:', draftError);
      return;
    }

    console.log('✅ Test draft created:', draft.id);

    // Step 4: Test the WhatsApp notification service
    console.log('\n4️⃣ Testing WhatsApp notification service...');
    
    // Call the local Edge Function
    const response = await fetch('http://localhost:54321/functions/v1/whatsapp-notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ draftId: draft.id }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ WhatsApp notification service response:', result);
    } else {
      const errorText = await response.text();
      console.error('❌ WhatsApp notification service error:', response.status, errorText);
    }

    // Step 5: Check if notification was marked as sent
    console.log('\n5️⃣ Checking notification status...');
    const { data: updatedDraft, error: checkError } = await supabase
      .from('saved_drafts')
      .select('whatsapp_notification_sent, whatsapp_notification_sent_at')
      .eq('id', draft.id)
      .single();

    if (checkError) {
      console.error('❌ Error checking draft status:', checkError);
    } else {
      console.log('📱 Draft notification status:', {
        sent: updatedDraft.whatsapp_notification_sent,
        sentAt: updatedDraft.whatsapp_notification_sent_at
      });
    }

    console.log('\n🎉 Test completed!');
    console.log('\n📝 Summary:');
    console.log(`   • User ID: ${userId}`);
    console.log(`   • Draft ID: ${draft.id}`);
    console.log(`   • WhatsApp Number: +5511999999999`);
    console.log(`   • Notification Sent: ${updatedDraft?.whatsapp_notification_sent || false}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testWhatsAppNotifications();
