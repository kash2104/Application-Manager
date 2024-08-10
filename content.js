document.addEventListener('DOMContentLoaded', function() {
  const jobTitleInput = document.getElementById('jobTitle');
  const jobLinkInput = document.getElementById('jobLink');
  const jobCategorySelect = document.getElementById('jobCategory');
  const jobDateInput = document.getElementById('jobDate');
  const addJobButton = document.getElementById('addJobButton');

  // Set default date to today's date
  const today = new Date().toISOString().split('T')[0];
  jobDateInput.value = today;

  jobCategorySelect.addEventListener('change', function() {
    if (jobCategorySelect.value === 'interview') {
      jobDateInput.style.display = 'block';
      jobDateInput.value = today;
    } else {
      jobDateInput.style.display = 'none';
      jobDateInput.value = '';
    }
  });

  // Get the current active tab's URL
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    if (currentTab) {
      jobLinkInput.value = currentTab.url; // Set the URL in the input field
    }
  });

  addJobButton.addEventListener('click', () => {
    const jobTitle = jobTitleInput.value.trim();
    const jobLink = jobLinkInput.value.trim();
    const jobCategory = jobCategorySelect.value;
    const jobDate = jobCategory === 'interview' ? jobDateInput.value : '';

    if (jobTitle && jobLink) {
      addJob(jobCategory, jobTitle, jobLink, jobDate);
      saveJob(jobCategory, jobTitle, jobLink, jobDate);
      jobTitleInput.value = '';
      jobLinkInput.value = '';
      jobDateInput.value = jobCategory === 'interview' ? today : '';
    }
  });

  loadJobs();

  function addJob(category, title, link, date) {
    const jobId = `job-${Date.now()}`;
    const jobItem = document.createElement('div');
    jobItem.id = jobId;
    jobItem.className = 'job-item';
    jobItem.dataset.category = category;
    jobItem.innerHTML = `
      <strong>${title}</strong>
      <a href="${link}" target="_blank">${link}</a>
      ${category === 'interview' ? `<p>Date: ${date}</p>` : ''}
      <button class="delete-btn">&times;</button>
      <button class="edit-btn">&#9998;</button>
    `;

    jobItem.querySelector('.delete-btn').addEventListener('click', () => {
      deleteJob(jobItem);
    });

    jobItem.querySelector('.edit-btn').addEventListener('click', () => {
      showEditModal(jobItem);
    });

    document.getElementById(category).appendChild(jobItem);
  }

  function saveJob(category, title, link, date) {
    chrome.storage.local.get('jobs', data => {
      const jobs = data.jobs || {};
      if (!jobs[category]) {
        jobs[category] = [];
      }
      jobs[category].push({ title, link, date });
      chrome.storage.local.set({ jobs });
  
      if (category === 'interview' && date) {
        chrome.runtime.sendMessage({ action: 'scheduleInterview', date, title });
      }
    });
  }
  

  function updateJobCategory(jobItem, newCategory, date) {
    const title = jobItem.querySelector('strong').textContent;
    const link = jobItem.querySelector('a').href;
    const oldCategory = jobItem.dataset.category;
  
    chrome.storage.local.get('jobs', data => {
      const jobs = data.jobs || {};
  
      if (jobs[oldCategory]) {
        jobs[oldCategory] = jobs[oldCategory].filter(job => job.title !== title);
      }
  
      if (!jobs[newCategory]) {
        jobs[newCategory] = [];
      }
      jobs[newCategory].push({ title, link, date });
  
      jobItem.dataset.category = newCategory;
      jobItem.querySelector('p') ? jobItem.querySelector('p').remove() : null;
      if (newCategory === 'interview') {
        jobItem.innerHTML += `<p>Date: ${date}</p>`;
        // Schedule notifications for the interview
        chrome.runtime.sendMessage({ action: 'scheduleInterview', date, title });
      }
      document.getElementById(newCategory).appendChild(jobItem);
      chrome.storage.local.set({ jobs });
    });
  }
  
  function deleteJob(jobItem) {
    const category = jobItem.dataset.category;
    const link = jobItem.querySelector('a').href.trim();
    const title = jobItem.querySelector('strong').textContent;

    chrome.storage.local.get('jobs', data => {
      const jobs = data.jobs || {};

      if (jobs[category]) {
        const updateJobCategory = jobs[category].filter(job => job.title !== title);
        jobs[category] = updateJobCategory;
      }

      chrome.storage.local.set({ jobs });
      jobItem.remove();
    });
  }

  function loadJobs() {
    chrome.storage.local.get('jobs', data => {
      const jobs = data.jobs || {};
      for (const category in jobs) {
        jobs[category].forEach(job => addJob(category, job.title, job.link, job.date));
      }
    });
  }

  function showEditModal(jobItem) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    const today = new Date().toISOString().split('T')[0];
    modal.innerHTML = `
      <div class="modal-content">
        <h3>Edit Job Category</h3>
        <select id="editCategorySelect">
          <option value="apply-later" ${jobItem.dataset.category === 'apply-later' ? 'selected' : ''}>Apply Later</option>
          <option value="applied" ${jobItem.dataset.category === 'applied' ? 'selected' : ''}>Applied</option>
          <option value="interview" ${jobItem.dataset.category === 'interview' ? 'selected' : ''}>Interview</option>
          <option value="offered" ${jobItem.dataset.category === 'offered' ? 'selected' : ''}>Offered</option>
          <option value="rejection" ${jobItem.dataset.category === 'rejection' ? 'selected' : ''}>Rejection</option>
        </select>
        ${jobItem.dataset.category === 'interview' ? `<input type="date" id="editDateInput" value="${jobItem.querySelector('p').textContent.split('Date: ')[1]}">` : ''}
        <div id="modalContentGap"></div>
        <button id="saveEditButton">Save</button>
        <button id="cancelEditButton">Cancel</button>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('editCategorySelect').addEventListener('change', function() {
      if (this.value === 'interview') {
        const editDateInput = document.createElement('input');
        editDateInput.type = 'date';
        editDateInput.id = 'editDateInput';
        editDateInput.value = today;
        modal.querySelector('.modal-content').insertBefore(editDateInput, document.getElementById('saveEditButton'));
      } else {
        const editDateInput = document.getElementById('editDateInput');
        if (editDateInput) {
          editDateInput.remove();
        }
      }
    });

    document.getElementById('saveEditButton').addEventListener('click', () => {
      const newCategory = document.getElementById('editCategorySelect').value;
      const date = newCategory === 'interview' ? document.getElementById('editDateInput').value : '';
      updateJobCategory(jobItem, newCategory, date);
      document.body.removeChild(modal);
    });

    document.getElementById('cancelEditButton').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
  }
});
