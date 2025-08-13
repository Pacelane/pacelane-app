import { supabase } from '@/integrations/supabase/client';

export interface PacingSchedule {
  id?: string;
  user_id: string;
  frequency: 'daily' | 'weekly' | 'bi-weekly';
  selected_days: string[];
  preferred_time: string;
  is_active?: boolean;
}

export interface PacingScheduleResponse {
  data?: PacingSchedule;
  error?: string;
}

export interface PacingSchedulesResponse {
  data?: PacingSchedule[];
  error?: string;
}

export class PacingService {
  /**
   * Create a new pacing schedule for a user
   */
  static async createPacingSchedule(
    userId: string,
    scheduleData: Omit<PacingSchedule, 'user_id'>
  ): Promise<PacingScheduleResponse> {
    try {
      console.log('PacingService: Creating pacing schedule for user:', userId, scheduleData);
      
      const { data: schedule, error } = await supabase
        .from('pacing_schedules')
        .insert({
          user_id: userId,
          frequency: scheduleData.frequency,
          selected_days: scheduleData.selected_days,
          preferred_time: scheduleData.preferred_time,
          is_active: scheduleData.is_active ?? true
        })
        .select()
        .single();
      
      if (error) {
        console.error('PacingService: Create schedule error:', error);
        throw error;
      }
      
      console.log('PacingService: Pacing schedule created successfully');
      return { data: schedule };
    } catch (error: any) {
      console.error('PacingService: createPacingSchedule failed:', error);
      return { error: error.message || 'Failed to create pacing schedule' };
    }
  }

  /**
   * Get all pacing schedules for a user
   */
  static async getUserPacingSchedules(userId: string): Promise<PacingSchedulesResponse> {
    try {
      console.log('PacingService: Getting pacing schedules for user:', userId);
      
      const { data: schedules, error } = await supabase
        .from('pacing_schedules')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('PacingService: Get schedules error:', error);
        throw error;
      }
      
      console.log('PacingService: Retrieved', schedules?.length || 0, 'pacing schedules');
      return { data: schedules || [] };
    } catch (error: any) {
      console.error('PacingService: getUserPacingSchedules failed:', error);
      return { error: error.message || 'Failed to get pacing schedules' };
    }
  }

  /**
   * Update an existing pacing schedule
   */
  static async updatePacingSchedule(
    scheduleId: string,
    updates: Partial<Omit<PacingSchedule, 'id' | 'user_id'>>
  ): Promise<PacingScheduleResponse> {
    try {
      console.log('PacingService: Updating pacing schedule:', scheduleId, updates);
      
      const { data: schedule, error } = await supabase
        .from('pacing_schedules')
        .update(updates)
        .eq('id', scheduleId)
        .select()
        .single();
      
      if (error) {
        console.error('PacingService: Update schedule error:', error);
        throw error;
      }
      
      console.log('PacingService: Pacing schedule updated successfully');
      return { data: schedule };
    } catch (error: any) {
      console.error('PacingService: updatePacingSchedule failed:', error);
      return { error: error.message || 'Failed to update pacing schedule' };
    }
  }

  /**
   * Delete a pacing schedule
   */
  static async deletePacingSchedule(scheduleId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('PacingService: Deleting pacing schedule:', scheduleId);
      
      const { error } = await supabase
        .from('pacing_schedules')
        .delete()
        .eq('id', scheduleId);
      
      if (error) {
        console.error('PacingService: Delete schedule error:', error);
        throw error;
      }
      
      console.log('PacingService: Pacing schedule deleted successfully');
      return { success: true };
    } catch (error: any) {
      console.error('PacingService: deletePacingSchedule failed:', error);
      return { success: false, error: error.message || 'Failed to delete pacing schedule' };
    }
  }

  /**
   * Convert onboarding pacing preferences to a pacing schedule
   */
  static convertOnboardingToSchedule(
    userId: string,
    onboardingPacing: any
  ): PacingSchedule {
    // Map onboarding frequency to schedule frequency
    let frequency: 'daily' | 'weekly' | 'bi-weekly' = 'weekly';
    if (onboardingPacing.pace === 'light') {
      frequency = 'bi-weekly';
    } else if (onboardingPacing.pace === 'hardcore') {
      frequency = 'daily';
    }

    return {
      user_id: userId,
      frequency,
      selected_days: onboardingPacing.frequency || ['monday', 'wednesday', 'friday'],
      preferred_time: onboardingPacing.recommendations_time || 'Morning (8-10 AM)',
      is_active: true
    };
  }

  /**
   * Check if today is a scheduled day for a user
   */
  static isScheduledDay(selectedDays: string[]): boolean {
    const today = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[today.getDay()];
    
    return selectedDays.includes(todayName);
  }

  /**
   * Get next scheduled date for a user
   */
  static getNextScheduledDate(selectedDays: string[]): Date {
    const today = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[today.getDay()];
    
    // Find the next scheduled day
    let daysToAdd = 1;
    while (daysToAdd <= 7) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + daysToAdd);
      const nextDayName = dayNames[nextDate.getDay()];
      
      if (selectedDays.includes(nextDayName)) {
        return nextDate;
      }
      daysToAdd++;
    }
    
    // If no next day found in the next week, return the first scheduled day of next week
    const firstScheduledDay = selectedDays[0];
    const firstDayIndex = dayNames.indexOf(firstScheduledDay);
    const daysUntilFirst = (7 - today.getDay() + firstDayIndex) % 7;
    
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysUntilFirst);
    return nextDate;
  }
}
