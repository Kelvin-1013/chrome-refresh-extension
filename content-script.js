// Content script that runs on Upwork job search pages
const SEARCH_URL_PATTERN = 'https://www.upwork.com/nx/jobs/search/*';
let previousJobs = new Set();

// Function to extract job data
function extractJobData() {
  const jobs = [];
  const jobElements = document.querySelectorAll('[data-test="job-tile-list"] > div');
  
  jobElements.forEach(jobElement => {
    const titleElement = jobElement.querySelector('[data-test="job-title-link"]');
    if (!titleElement) return;
    
    const job = {
      id: titleElement.href?.split('~')[1] || Date.now().toString(),
      title: titleElement.textContent.trim(),
      link: titleElement.href,
      description: jobElement.querySelector('[data-test="job-description-text"]')?.textContent.trim() || '',
      budget: jobElement.querySelector('[data-test="budget"]')?.textContent.trim() || 'N/A',
      posted: jobElement.querySelector('[data-test="posted-on"]')?.textContent.trim() || 'N/A'
    };
    
    jobs.push(job);
  });
  
  return jobs;
}

// Function to check for new jobs
function checkForNewJobs() {
  const currentJobs = extractJobData();
  const newJobs = currentJobs.filter(job => !previousJobs.has(job.id));
  
  if (newJobs.length > 0) {
    // Send new jobs to background script
    chrome.runtime.sendMessage({
      type: 'NEW_JOBS',
      jobs: newJobs
    });
    
    // Update previous jobs
    newJobs.forEach(job => previousJobs.add(job.id));
  }
}

// Start monitoring if we're on the job search page
if (window.location.href.match(SEARCH_URL_PATTERN)) {
  // Initial check
  checkForNewJobs();
  
  // Set up a mutation observer to detect when new jobs are loaded
  const observer = new MutationObserver(checkForNewJobs);
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

