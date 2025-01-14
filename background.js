// Background script to handle notifications and refresh timing
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
let refreshTimer = null;

// SendGrid API credentials
const SENDGRID_API_KEY = 'YOUR_SENDGRID_API_KEY';
const SENDER_EMAIL = 'your-verified@email.com';
const RECIPIENT_EMAIL = 'your@email.com';

// Function to send email notifications using SendGrid
async function sendEmailNotification(jobs) {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: RECIPIENT_EMAIL }]
        }],
        from: { email: SENDER_EMAIL },
        subject: `New Upwork Jobs Found - ${jobs.length} new listings`,
        content: [{
          type: 'text/html',
          value: `
            <h2>New Jobs Found on Upwork</h2>
            ${jobs.map(job => `
              <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
                <h3>${job.title}</h3>
                <p><strong>Budget:</strong> ${job.budget}</p>
                <p><strong>Posted:</strong> ${job.posted}</p>
                <p>${job.description}</p>
                <a href="${job.link}" style="background-color: #14a800; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">View Job</a>
              </div>
            `).join('')}
          `
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`SendGrid API error: ${response.status}`);
    }
    console.log('Email notification sent successfully');
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}


// Function to send notifications
async function sendNotifications(jobs) {
  // Send email using SendGrid
  await sendEmailNotification(jobs);

  // Send Telegram notification
  try {
    const TELEGRAM_BOT_TOKEN = 'YOUR_BOT_TOKEN';
    const TELEGRAM_CHAT_ID = 'YOUR_CHAT_ID';
    
    const message = jobs.map(job => (
      `🆕 New Job: ${job.title}\n💰 Budget: ${job.budget}\n⏰ Posted: ${job.posted}\n🔗 ${job.link}`
    )).join('\n\n');

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
  }
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'NEW_JOBS') {
    sendNotifications(message.jobs);
  }
});

// Handle automatic refresh
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.url?.includes('upwork.com/nx/jobs/search')) {
    if (!refreshTimer) {
      refreshTimer = setInterval(() => {
        chrome.tabs.reload(tabId);
      }, REFRESH_INTERVAL);
    }
  }
});

