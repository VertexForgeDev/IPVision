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

// Helper: Set status badge state
function setStatus(text, type = 'neutral') {
  statusBadge.textContent = text;
  statusBadge.className = 'status-badge ' + type;
}

// Helper: Show/Hide Spinner
function toggleLoading(isLoading) {
  if (isLoading) {
    loadingSpinner.classList.remove('hidden');
    lookupBtn.disabled = true;
    myIpBtn.disabled = true;
  } else {
    loadingSpinner.classList.add('hidden');
    lookupBtn.disabled = false;
    myIpBtn.disabled = false;
  }
}

// Fetch IP data from your Cloudflare Worker Proxy
async function fetchIpData(ip = '') {
  toggleLoading(true);
  setStatus('Fetching data...', 'neutral');

  try {
    const url = ip ? `${PROXY_ENDPOINT}?ip=${encodeURIComponent(ip)}` : PROXY_ENDPOINT;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    currentData = data;
    displayResults(data);
    setStatus('Ready', 'success');
  } catch (error) {
    console.error('Fetch error:', error);
    setStatus('Error fetching IP data', 'error');
  } finally {
    toggleLoading(false);
  }
}

// Render data into the HTML cards
function displayResults(data) {
  ipAddressEl.textContent = data.ip || data.query || 'N/A';
  
  const city = data.city || '';
  const region = data.region || data.regionName || '';
  const country = data.country || data.country_name || '';
  const locArr = [city, region, country].filter(Boolean);
  locationEl.textContent = locArr.length > 0 ? locArr.join(', ') : 'N/A';

  ispEl.textContent = data.isp || data.org || data.connection?.isp || 'N/A';
  timezoneEl.textContent = data.timezone?.id || data.timezone || 'N/A';
}

// Export functions
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

exportJsonBtn.addEventListener('click', () => {
  if (!currentData) return alert('No data to export!');
  const jsonStr = JSON.stringify(currentData, null, 2);
  downloadFile(jsonStr, 'ipvision-data.json', 'application/json');
});

exportCsvBtn.addEventListener('click', () => {
  if (!currentData) return alert('No data to export!');
  const keys = Object.keys(currentData);
  const values = Object.values(currentData).map(val => 
    typeof val === 'object' ? `"${JSON.stringify(val).replace(/"/g, '""')}"` : `"${val}"`
  );
  const csvStr = `${keys.join(',')}\n${values.join(',')}`;
  downloadFile(csvStr, 'ipvision-data.csv', 'text/csv');
});

// Event Listeners
lookupBtn.addEventListener('click', () => {
  const query = ipInput.value.trim();
  fetchIpData(query);
});

myIpBtn.addEventListener('click', () => {
  ipInput.value = '';
  fetchIpData();
});

ipInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const query = ipInput.value.trim();
    fetchIpData(query);
  }
});

// Automatically fetch user's IP on initial page load
fetchIpData();
