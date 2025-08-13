// Test script for pacing scheduler
// Run this in your browser console or Node.js to test the logic

// Test data
const testSchedules = [
  {
    user_id: 'user-1',
    frequency: 'weekly',
    selected_days: ['monday', 'wednesday', 'friday'],
    preferred_time: 'Morning (8-10 AM)',
    is_active: true
  },
  {
    user_id: 'user-2',
    frequency: 'daily',
    selected_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    preferred_time: 'Evening (6-8 PM)',
    is_active: true
  },
  {
    user_id: 'user-3',
    frequency: 'bi-weekly',
    selected_days: ['monday', 'friday'],
    preferred_time: 'Afternoon (12-2 PM)',
    is_active: true
  }
];

// Test functions
function isScheduledDay(selectedDays, testDate = new Date()) {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[testDate.getDay()];
  return selectedDays.includes(dayName);
}

function getNextScheduledDate(selectedDays, fromDate = new Date()) {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  // Find the next scheduled day
  let daysToAdd = 1;
  while (daysToAdd <= 7) {
    const nextDate = new Date(fromDate);
    nextDate.setDate(fromDate.getDate() + daysToAdd);
    const nextDayName = dayNames[nextDate.getDay()];
    
    if (selectedDays.includes(nextDayName)) {
      return nextDate;
    }
    daysToAdd++;
  }
  
  // If no next day found in the next week, return the first scheduled day of next week
  const firstScheduledDay = selectedDays[0];
  const firstDayIndex = dayNames.indexOf(firstScheduledDay);
  const daysUntilFirst = (7 - fromDate.getDay() + firstDayIndex) % 7;
  
  const nextDate = new Date(fromDate);
  nextDate.setDate(fromDate.getDate() + daysUntilFirst);
  return nextDate;
}

// Test today's schedule
const today = new Date();
const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const todayName = dayNames[today.getDay()];

console.log(`📅 Today is ${todayName}`);
console.log('');

// Test each schedule
testSchedules.forEach((schedule, index) => {
  const isToday = isScheduledDay(schedule.selected_days, today);
  const nextDate = getNextScheduledDate(schedule.selected_days, today);
  
  console.log(`📋 Schedule ${index + 1} (${schedule.user_id}):`);
  console.log(`   Frequency: ${schedule.frequency}`);
  console.log(`   Days: ${schedule.selected_days.join(', ')}`);
  console.log(`   Time: ${schedule.preferred_time}`);
  console.log(`   Today (${todayName}): ${isToday ? '✅ SCHEDULED' : '⏭️ Not scheduled'}`);
  console.log(`   Next scheduled: ${nextDate.toDateString()} (${dayNames[nextDate.getDay()]})`);
  console.log('');
});

// Test with different dates
console.log('🧪 Testing with different dates:');
const testDates = [
  new Date('2025-01-13'), // Monday
  new Date('2025-01-14'), // Tuesday
  new Date('2025-01-15'), // Wednesday
  new Date('2025-01-16'), // Thursday
  new Date('2025-01-17'), // Friday
  new Date('2025-01-18'), // Saturday
  new Date('2025-01-19')  // Sunday
];

testDates.forEach(date => {
  const dayName = dayNames[date.getDay()];
  const dateStr = date.toDateString();
  
  console.log(`\n📅 ${dateStr} (${dayName}):`);
  
  testSchedules.forEach((schedule, index) => {
    const isScheduled = isScheduledDay(schedule.selected_days, date);
    console.log(`   Schedule ${index + 1}: ${isScheduled ? '✅' : '⏭️'}`);
  });
});

console.log('\n✨ Test completed!');
