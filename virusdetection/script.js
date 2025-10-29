// Global State Variables
let selectedFiles = [];
let quarantineFiles = [];
let reports = [];
let scanning = false;
let totalScannedEver = 0;
let totalInfectedEver = 0;
let totalCleanEver = 0;

// Virus Signatures Database (Mock)
const virusSignatures = {
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855': 'Generic.Trojan',
  '5d41402abc4b2a76b9719d911017c592': 'EICAR.Test.Virus',
  'd41d8cd98f00b204e9800998ecf8427e': 'Suspicious.EmptyFile'
};

// === Tab Switching ===
function switchTab(tabName) {
  document.querySelectorAll('.content').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(tabName).classList.add('active');
  event.target.classList.add('active');
}

// === File Selection ===
document.getElementById('fileInput').addEventListener('change', e => {
  selectedFiles = Array.from(e.target.files);
  if (selectedFiles.length > 0) {
    document.getElementById('fileListContainer').style.display = 'block';
    document.getElementById('scanBtn').disabled = false;
    let html = '';
    selectedFiles.forEach(file => {
      html += `<div class="file-item">• ${file.name} (${(file.size / 1024).toFixed(2)} KB)</div>`;
    });
    document.getElementById('fileList').innerHTML = html;
  }
});

// === Logging System ===
function addLog(type, message) {
  const logContainer = document.getElementById('logContainer');
  const time = new Date().toLocaleTimeString();

  if (logContainer.querySelector('[style*="text-align"]')) logContainer.innerHTML = '';
  const logEntry = document.createElement('div');
  logEntry.className = 'log-entry ' + type;
  logEntry.innerHTML = `<span class="log-time">[${time}]</span><span>${message}</span>`;
  logContainer.appendChild(logEntry);
  logContainer.scrollTop = logContainer.scrollHeight;
}

// === Mock File Hashing ===
function calculateHash(file) {
  return new Promise(resolve => {
    if (file.size === 0) resolve('d41d8cd98f00b204e9800998ecf8427e');
    else if (Math.random() > 0.85) resolve('5d41402abc4b2a76b9719d911017c592');
    else resolve('clean_' + Math.random().toString(36).substr(2, 9));
  });
}

// === Helper Delay ===
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// === Progress Animation ===
function animateProgress(targetProgress) {
  return new Promise(resolve => {
    const progressBar = document.getElementById('progressBar');
    const progressPercent = document.getElementById('progressPercent');
    const currentProgress = parseFloat(progressBar.style.width) || 0;
    const duration = 800;
    const steps = 60;
    const increment = (targetProgress - currentProgress) / steps;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const newProgress = currentProgress + increment * currentStep;
      if (currentStep >= steps) {
        progressBar.style.width = targetProgress + '%';
        progressPercent.textContent = Math.round(targetProgress) + '%';
        clearInterval(interval);
        resolve();
      } else {
        progressBar.style.width = newProgress + '%';
        progressPercent.textContent = Math.round(newProgress) + '%';
      }
    }, stepDuration);
  });
}

// === Start Scan ===
async function startScan() {
  if (selectedFiles.length === 0 || scanning) return;

  scanning = true;
  document.getElementById('scanBtn').disabled = true;
  document.getElementById('selectBtn').disabled = true;
  document.getElementById('progressSection').style.display = 'block';
  document.getElementById('statsContainer').style.display = 'grid';

  document.getElementById('progressBar').style.width = '0%';
  document.getElementById('progressPercent').textContent = '0%';

  let infected = 0;
  let clean = 0;
  const startTime = Date.now();

  addLog('info', `Started scanning ${selectedFiles.length} file(s)...`);

  for (let i = 0; i < selectedFiles.length; i++) {
    const file = selectedFiles[i];
    await sleep(800); // simulate scan delay

    const hash = await calculateHash(file);
    const virusName = virusSignatures[hash];

    if (virusName) {
      infected++;
      quarantineFiles.push({ name: file.name, threat: virusName, date: new Date().toLocaleString() });
      addLog('danger', `⚠️ Threat detected in ${file.name} → ${virusName}`);
    } else {
      clean++;
      addLog('success', `✔️ ${file.name} is clean.`);
    }

    totalScannedEver++;
    await animateProgress(((i + 1) / selectedFiles.length) * 100);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  addLog('info', `Scan completed in ${duration}s.`);

  document.getElementById('statTotal').textContent = selectedFiles.length;
  document.getElementById('statInfected').textContent = infected;
  document.getElementById('statClean').textContent = clean;

  totalInfectedEver += infected;
  totalCleanEver += clean;

  // Add report
  reports.unshift({
    date: new Date().toLocaleString(),
    total: selectedFiles.length,
    infected,
    clean,
    duration
  });
  updateReports();

  // Reset
  scanning = false;
  document.getElementById('selectBtn').disabled = false;
  document.getElementById('scanBtn').disabled = false;
  selectedFiles = [];
  document.getElementById('fileListContainer').style.display = 'none';
  document.getElementById('fileInput').value = '';
}

// === Update Reports Tab ===
function updateReports() {
  const reportsList = document.getElementById('reportsList');

  if (reports.length === 0) {
    reportsList.innerHTML = `
      <div class="empty-state">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <h3>No reports available</h3>
        <p>Run a scan to generate reports</p>
      </div>`;
    return;
  }

  let html = '';
  reports.forEach(r => {
    html += `
      <div class="report-item">
        <div class="report-header">
          <div class="report-date">${r.date}</div>
          <div class="report-duration">${r.duration}s</div>
        </div>
        <div class="report-stats">
          <div class="stat-card total"><div class="stat-value">${r.total}</div><div class="stat-label">Total</div></div>
          <div class="stat-card infected"><div class="stat-value">${r.infected}</div><div class="stat-label">Threats</div></div>
          <div class="stat-card clean"><div class="stat-value">${r.clean}</div><div class="stat-label">Clean</div></div>
        </div>
      </div>`;
  });
  reportsList.innerHTML = html;
}
