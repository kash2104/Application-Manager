document.addEventListener('DOMContentLoaded', function() {
  const jobTitleInput = document.getElementById('jobTitle');
  const jobLinkInput = document.getElementById('jobLink');
  const jobCategorySelect = document.getElementById('jobCategory');
  const addJobButton = document.getElementById('addJobButton');

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

    if (jobTitle && jobLink) {
      addJob(jobCategory, jobTitle, jobLink);
      saveJob(jobCategory, jobTitle, jobLink);
      jobTitleInput.value = '';
      jobLinkInput.value = '';
    }
  });

  loadJobs();

  function addJob(category, title, link) {
    const jobId = `job-${Date.now()}`;
    const jobItem = document.createElement('div');
    jobItem.id = jobId;
    jobItem.className = 'job-item';
    jobItem.dataset.category = category;
    jobItem.innerHTML = `
      <strong>${title}</strong>
      <a href="${link}" target="_blank">${link}</a>
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

  function saveJob(category, title, link) {
    chrome.storage.local.get('jobs', data => {
      const jobs = data.jobs || {};
      if (!jobs[category]) {
        jobs[category] = [];
      }
      jobs[category].push({ title, link });
      chrome.storage.local.set({ jobs });
    });
  }

  function updateJobCategory(jobItem, newCategory) {
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
      jobs[newCategory].push({ title, link });

      jobItem.dataset.category = newCategory;
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
      // console.log(jobs[category]);

      if (jobs[category]) {
        const updateJobCategory = jobs[category].filter(job => job.title !== title);
        jobs[category] = updateJobCategory;
      }
      // console.log(jobs[category]);
      chrome.storage.local.set({ jobs });
      jobItem.remove();
      // console.log(jobs[category]);
    });

  }

  function loadJobs() {
    chrome.storage.local.get('jobs', data => {
      const jobs = data.jobs || {};
      for (const category in jobs) {
        jobs[category].forEach(job => addJob(category, job.title, job.link));
      }
    });
  }

  function showEditModal(jobItem) {
    const modal = document.createElement('div');
    modal.className = 'modal';
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
        <button id="saveEditButton">Save</button>
        <button id="cancelEditButton">Cancel</button>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('saveEditButton').addEventListener('click', () => {
      const newCategory = document.getElementById('editCategorySelect').value;
      updateJobCategory(jobItem, newCategory);
      document.body.removeChild(modal);
    });

    document.getElementById('cancelEditButton').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
  }
});
