const PROXY_ENDPOINT = 'https://ipvision-proxy.jozefmasiar.workers.dev';

// DOM Elements
const ipInput = document.getElementById('ipInput');
const lookupBtn = document.getElementById('lookupBtn');
const myIpBtn = document.getElementById('myIpBtn');
const statusBadge = document.getElementById('statusBadge');
const loadingSpinner = document.getElementById('loadingSpinner');

const ipAddressEl = document.getElementById('ipAddress');
const locationEl = document.getElementById('location');
const ispEl = document.getElementById('isp');
const timezoneEl = document.getElementById('timezone');

const exportJsonBtn = document.getElementById('exportJsonBtn');
const exportCsvBtn = document.getElementById('exportCsvBtn');

let currentData = null;

function setStatus(text, type = 'neutral') {
  if (statusBadge) {
    statusBadge.textContent = text;
    statusBadge.className = 'status-badge ' + type;
  }
}

function toggleLoading(isLoading) {
  if (loadingSpinner) {
    isLoading ? loadingSpinner.classList.remove('hidden') : loadingSpinner.classList.add('hidden');
  }
  if (lookupBtn) lookupBtn.disabled = isLoading;
  if (myIpBtn) myIpBtn.disabled = isLoading;
}

async function fetchIpData(ip = '') {
  toggleLoading(true);
  setStatus('Fetching data...', 'neutral');

  try {
    const cleanIp = ip.trim();
    const url = cleanIp ? `${PROXY_ENDPOINT}?ip=${encodeURIComponent(cleanIp)}` : PROXY_ENDPOINT;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    if (data.error) throw new Error(data.error);

    currentData = data;
    displayResults(data);
    setStatus('Ready', 'success');
  } catch (error) {
    console.error('Fetch error:', error);
    setStatus('Error fetching data', 'error');
  } finally {
    toggleLoading(false);
  }
}

function displayResults(data) {
  if (ipAddressEl) ipAddressEl.textContent = data.ip || data.query || 'N/A';
  
  const city = data.city || '';
  const region = data.region || data.regionName || '';
  const country = data.country || data.country_name || '';
  const locArr = [city, region, country].filter(Boolean);
  
  if (locationEl) locationEl.textContent = locArr.length > 0 ? locArr.join(', ') : 'N/A';
  if (ispEl) ispEl.textContent = data.isp || data.org || 'N/A';
  if (timezoneEl) timezoneEl.textContent = typeof data.timezone === 'string' ? data.timezone : (data.timezone?.id || 'N/A');
}

// Helper: File Downloader
function downloadFile(content, filename, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Event Listeners with Safe Null Checks
if (lookupBtn) {
  lookupBtn.addEventListener('click', () => fetchIpData(ipInput ? ipInput.value : ''));
}

if (myIpBtn) {
  myIpBtn.addEventListener('click', () => {
    if (ipInput) ipInput.value = '';
    fetchIpData();
  });
}

if (ipInput) {
  ipInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') fetchIpData(ipInput.value);
  });
}

if (exportJsonBtn) {
  exportJsonBtn.addEventListener('click', () => {
    if (!currentData) return alert('No data to export!');
    downloadFile(JSON.stringify(currentData, null, 2), 'ipvision-data.json', 'application/json');
  });
}

if (exportCsvBtn) {
  exportCsvBtn.addEventListener('click', () => {
    if (!currentData) return alert('No data to export!');
    const keys = Object.keys(currentData);
    const values = Object.values(currentData).map(val => 
      typeof val === 'object' ? `"${JSON.stringify(val).replace(/"/g, '""')}"` : `"${val}"`
    );
    downloadFile(`${keys.join(',')}\n${values.join(',')}`, 'ipvision-data.csv', 'text/csv');
  });
}

// Initial fetch on load
fetchIpData();
