// Push notification utilities

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const sendNotification = (title: string, options?: NotificationOptions) => {
  if (!('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options
    });
  }
};

export const scheduleClassReminder = (className: string, startTime: string, minutesBefore: number = 15) => {
  const now = new Date();
  const [hours, minutes] = startTime.split(':').map(Number);
  
  const classTime = new Date();
  classTime.setHours(hours, minutes, 0, 0);
  
  const reminderTime = new Date(classTime.getTime() - minutesBefore * 60 * 1000);
  
  const timeUntilReminder = reminderTime.getTime() - now.getTime();
  
  if (timeUntilReminder > 0) {
    setTimeout(() => {
      sendNotification(`Class Starting Soon! 🎓`, {
        body: `${className} starts in ${minutesBefore} minutes`,
        tag: `class-${className}-${startTime}`,
        requireInteraction: true
      });
    }, timeUntilReminder);
  }
};

export const sendAttendanceReminder = () => {
  sendNotification('Mark Your Attendance! 📝', {
    body: "Don't forget to mark your attendance for today's classes",
    tag: 'attendance-reminder',
    requireInteraction: true
  });
};

export const sendStudyReminder = (subject: string) => {
  sendNotification('Study Time! 📚', {
    body: `Time to study ${subject}`,
    tag: `study-${subject}`,
    requireInteraction: true
  });
};

export const sendAttendanceAlert = (subject: string, currentPercentage: number, threshold: number = 75) => {
  if (currentPercentage < threshold) {
    sendNotification('Attendance Alert! ⚠️', {
      body: `Your ${subject} attendance is ${currentPercentage.toFixed(1)}%, below the ${threshold}% requirement`,
      tag: `attendance-alert-${subject}`,
      requireInteraction: true
    });
  }
};
