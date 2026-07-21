/*
=================================================
 IPVision Frontend Script - Fully Synchronized
=================================================
*/

const PROXY_ENDPOINT = 'https://ipvision-proxy.jozefmasiar.workers.dev';

// DOM Elements
const ipInput = document.getElementById('ipInput');
const lookupBtn = document.getElementById('lookupBtn');
const myIpBtn = document.getElementById('myIpBtn');
const statusBadge = document.getElementById('statusBadge');
const loadingSpinner = document.getElementById('loadingSpinner');
const detectedFlag = document.getElementById('detected-flag');

// Main Display Elements
const ipAddressEl = document.getElementById('ipAddress');
const locationEl = document.getElementById('location');
const ispEl = document.getElementById('isp');
const timezoneEl = document.getElementById('timezone');

// Grid Data Elements
const valCountry = document.getElementById('val-country');
const valRegion = document.getElementById('val-region');
const valCoords = document.getElementById('val-coords');
const valPostal = document.getElementById('val-postal');
const valAsn = document.getElementById('val-asn');
const valTime = document.getElementById('val-time');
const valCurrency = document.getElementById('val-currency');
const valCalling = document.getElementById('val-calling');
const valContinent = document.getElementById('val-continent');
const valLanguages = document.getElementById('val-languages');
const securityBadges = document.getElementById('val-security-badges');
const googleMapsBtn = document.getElementById('btn-google-maps');
const historyContainer = document.getElementById('history-container');

// Share & Action Buttons
const btnCopyIp = document.getElementById('btn-copy-ip');
const btnShare = document.getElementById('btn-share');
const btnClearHistory = document.getElementById('btn-clear-history');
const exportJsonBtn = document.getElementById('exportJsonBtn');
const exportCsvBtn = document.getElementById('exportCsvBtn');

// State Management
let currentData = null;
let lookupHistory = JSON.parse(localStorage.getItem('ipvision_history') || '[]');

function setStatus(text, isError = false) {
  if (statusBadge) {
    statusBadge.innerHTML = isError 
      ? `<span class="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span> ${text}`
      : `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> ${text}`;
    statusBadge.className = isError
      ? 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20'
      : 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
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
  let targetIp = typeof ip === 'string' ? ip.trim() : '';
  
  if (targetIp.toLowerCase() === 'self' || !targetIp) {
    targetIp = '';
  }

  toggleLoading(true);
  setStatus('Fetching target data...');

  try {
    const url = targetIp 
      ? `${PROXY_ENDPOINT}?ip=${encodeURIComponent(targetIp)}&nocache=${Date.now()}` 
      : `${PROXY_ENDPOINT}?nocache=${Date.now()}`;
    
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Gateway error`);
    }

    const data = await response.json();
    if (data.error || data.success === false) {
      throw new Error(data.message || data.error || 'Invalid IP or lookup failed');
    }

    currentData = data;
    displayResults(data);

    const resolvedIp = data.client_ip || data.ip || targetIp;
    if (resolvedIp) {
      addToHistory(resolvedIp);
    }

    setStatus('Active Target');
  } catch (error) {
    console.error('Fetch error:', error);
    setStatus('Lookup Failed', true);
    if (ipAddressEl) ipAddressEl.textContent = 'Error';
    if (locationEl) locationEl.textContent = error.message;
  } finally {
    toggleLoading(false);
  }
}

function displayResults(data) {
  // FIXED: Read client_ip from Cloudflare worker output
  const ipVal = data.client_ip || data.ip || 'N/A';
  if (ipAddressEl) ipAddressEl.textContent = ipVal;

  if (detectedFlag) {
    detectedFlag.textContent = '';
  }

  const city = data.city || '';
  const region = data.region || '';
  const country = data.country || '';
  const locArr = [city, region, country].filter(Boolean);

  if (locationEl) {
    locationEl.innerHTML = `<i class="fa-solid fa-location-dot text-indigo-400" aria-hidden="true"></i> ${locArr.length > 0 ? locArr.join(', ') : 'N/A'}`;
  }

  const ispName = data.isp || 'N/A';
  if (ispEl) ispEl.textContent = ispName;
  if (valAsn) valAsn.textContent = 'ASN: N/A';

  const tzId = data.timezone || 'N/A';
  if (timezoneEl) timezoneEl.textContent = tzId;
  
  if (valTime && data.timezone) {
    try {
      const localTimeStr = new Date().toLocaleTimeString('en-US', { timeZone: data.timezone });
      valTime.textContent = `Local Time: ${localTimeStr}`;
    } catch (e) {
      valTime.textContent = `Timezone: ${data.timezone}`;
    }
  }

  if (valCountry) valCountry.textContent = country || 'N/A';
  if (valRegion) valRegion.textContent = [city, region].filter(Boolean).join(', ') || 'N/A';

  const lat = data.latitude;
  const lon = data.longitude;
  if (valCoords) valCoords.textContent = (lat !== null && lon !== null && lat !== undefined && lon !== undefined) ? `${lat}, ${lon}` : 'N/A';
  if (valPostal) valPostal.textContent = `Postal Code: N/A`;

  if (valCurrency) valCurrency.textContent = 'N/A';
  if (valCalling) valCalling.textContent = `Calling Code: N/A`;

  if (valContinent) valContinent.textContent = 'N/A';
  if (valLanguages) valLanguages.textContent = `Neighbours: N/A`;

  if (securityBadges) {
    securityBadges.innerHTML = `
      <span class="px-2 py-1 rounded text-xs bg-slate-800 text-slate-300">
        Type: Cloudflare Edge Direct
      </span>
    `;
  }

  if (googleMapsBtn) {
    if (lat !== null && lon !== null && lat !== undefined && lon !== undefined) {
      googleMapsBtn.href = `https://www.google.com/maps?q=${lat},${lon}`;
      googleMapsBtn.classList.remove('pointer-events-none', 'opacity-50');
    } else {
      googleMapsBtn.classList.add('pointer-events-none', 'opacity-50');
    }
  }
}

function addToHistory(ip) {
  if (!ip || ip === 'N/A') return;
  lookupHistory = [ip, ...lookupHistory.filter(item => item !== ip)].slice(0, 8);
  localStorage.setItem('ipvision_history', JSON.stringify(lookupHistory));
  renderHistory();
}

function renderHistory() {
  if (!historyContainer) return;
  if (lookupHistory.length === 0) {
    historyContainer.innerHTML = `<span class="text-xs text-slate-500 italic">No recent lookups recorded.</span>`;
    return;
  }

  historyContainer.innerHTML = lookupHistory
    .map(ip => `<button onclick="fetchIpData('${ip}')" class="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-mono text-indigo-300 hover:text-white transition">${ip}</button>`)
    .join('');
}

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

// Event Listeners
if (lookupBtn) {
  lookupBtn.addEventListener('click', (e) => {
    e.preventDefault();
    fetchIpData(ipInput ? ipInput.value : '');
  });
}

if (myIpBtn) {
  myIpBtn.addEventListener('click', () => {
    if (ipInput) ipInput.value = '';
    fetchIpData('');
  });
}

if (ipInput) {
  ipInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      fetchIpData(ipInput.value);
    }
  });
}

if (btnCopyIp) {
  btnCopyIp.addEventListener('click', () => {
    if (currentData && currentData.client_ip) {
      navigator.clipboard.writeText(currentData.client_ip);
      const icon = btnCopyIp.querySelector('i');
      if (icon) {
        icon.className = 'fa-solid fa-check text-emerald-400 text-xl';
        setTimeout(() => icon.className = 'fa-regular fa-copy text-xl', 2000);
      }
    }
  });
}

if (btnShare) {
  btnShare.addEventListener('click', () => {
    if (navigator.share && currentData) {
      navigator.share({
        title: 'IPVision Lookup',
        text: `IP: ${currentData.client_ip} - ${currentData.city}, ${currentData.country}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Page URL copied to clipboard!');
    }
  });
}

if (btnClearHistory) {
  btnClearHistory.addEventListener('click', () => {
    lookupHistory = [];
    localStorage.removeItem('ipvision_history');
    renderHistory();
  });
}

if (exportJsonBtn) {
  exportJsonBtn.addEventListener('click', () => {
    if (!currentData) return alert('No data available to export.');
    downloadFile(JSON.stringify(currentData, null, 2), `ipvision-${currentData.client_ip || 'data'}.json`, 'application/json');
  });
}

if (exportCsvBtn) {
  exportCsvBtn.addEventListener('click', () => {
    if (!currentData) return alert('No data available to export.');
    const keys = Object.keys(currentData);
    const values = Object.values(currentData).map(val => 
      typeof val === 'object' ? `"${JSON.stringify(val).replace(/"/g, '""')}"` : `"${val}"`
    );
    downloadFile(`${keys.join(',')}\n${values.join(',')}`, `ipvision-${currentData.client_ip || 'data'}.csv`, 'text/csv');
  });
}

// Initial Page Load Initialization
renderHistory();
fetchIpData('');
