chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.onAlarm.addListener(alarm => {
        const [type, jobTitle] = alarm.name.split('-');
  
        if (type === 'oneWeek') {
            showNotification(`Interview for ${jobTitle} is in one week!`);
        } else if (type === 'threeDays') {
            showNotification(`Interview for ${jobTitle} is in three days!`);
        } else if (type === 'onTheDay') {
            showNotification(`Interview for ${jobTitle} is today!`);
        }
    });
});
  
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'scheduleInterview') {
        scheduleInterviewNotifications(message.date, message.title);
    }
});
  
function scheduleInterviewNotifications(interviewDate, jobTitle) {
    const interviewTime = new Date(interviewDate).getTime();
  
    const oneWeekBefore = interviewTime - 7 * 24 * 60 * 60 * 1000;
    const threeDaysBefore = interviewTime - 3 * 24 * 60 * 60 * 1000;
    const onTheDay = interviewTime;
  
    // Remove existing alarms for the job title
    chrome.alarms.getAll(alarms => {
        alarms.forEach(alarm => {
            if (alarm.name.startsWith(jobTitle)) {
                chrome.alarms.clear(alarm.name);
            }
        });

        // Schedule new alarms
        if (Date.now() < threeDaysBefore) {
            chrome.alarms.create(`oneWeek-${jobTitle}`, { when: oneWeekBefore });
        }
        if (Date.now() < onTheDay) {
            chrome.alarms.create(`threeDays-${jobTitle}`, { when: threeDaysBefore });
        }
        chrome.alarms.create(`onTheDay-${jobTitle}`, { when: onTheDay });
    });
}
  
function showNotification(message) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.jpg',
        title: 'Interview Reminder',
        message: message
    });
}
