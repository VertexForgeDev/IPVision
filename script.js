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

// Share & Copy Buttons
const btnCopyIp = document.getElementById('btn-copy-ip');
const btnShare = document.getElementById('btn-share');
const btnClearHistory = document.getElementById('btn-clear-history');

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
  toggleLoading(true);
  setStatus('Fetching target data...');

  try {
    const cleanIp = ip.trim();
    const url = cleanIp ? `${PROXY_ENDPOINT}?ip=${encodeURIComponent(cleanIp)}` : PROXY_ENDPOINT;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to reach gateway`);
    }

    const data = await response.json();
    if (data.error || data.success === false) {
      throw new Error(data.message || data.error || 'Invalid IP or Lookup Failed');
    }

    currentData = data;
    displayResults(data);
    addToHistory(data.ip || cleanIp);
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
  // IP & Basic Info
  const ipVal = data.ip || 'N/A';
  if (ipAddressEl) ipAddressEl.textContent = ipVal;
  
  // Country Flag Image
  if (detectedFlag) {
    if (data.country_flag) {
      detectedFlag.innerHTML = `<img src="${data.country_flag}" alt="Flag" class="w-6 h-4 inline-block rounded shadow-sm" />`;
    } else if (data.flag?.emoji) {
      detectedFlag.textContent = data.flag.emoji;
    } else {
      detectedFlag.textContent = '';
    }
  }

  // Location string
  const city = data.city || '';
  const region = data.region || '';
  const country = data.country || '';
  const locArr = [city, region, country].filter(Boolean);
  
  if (locationEl) {
    locationEl.innerHTML = `<i class="fa-solid fa-location-dot text-indigo-400" aria-hidden="true"></i> ${locArr.length > 0 ? locArr.join(', ') : 'N/A'}`;
  }

  // Network / ISP (handling ipwhois connection object)
  const ispName = data.connection?.isp || data.isp || data.org || 'N/A';
  const asnVal = data.connection?.asn ? `AS${data.connection.asn}` : (data.asn || 'N/A');
  const orgName = data.connection?.org || data.org || '';

  if (ispEl) ispEl.textContent = ispName;
  if (valAsn) valAsn.textContent = `${asnVal}${orgName ? ` (${orgName})` : ''}`;

  // Timezone Details
  const tzObj = data.timezone || {};
  const tzId = typeof tzObj === 'string' ? tzObj : (tzObj.id || tzObj.name || 'N/A');
  const currentTime = tzObj.current_time ? new Date(tzObj.current_time).toLocaleTimeString() : (tzObj.utc ? `UTC ${tzObj.utc}` : 'N/A');

  if (timezoneEl) timezoneEl.textContent = tzId;
  if (valTime) valTime.textContent = `Local Time: ${currentTime}`;

  // Grid Data Mappings
  if (valCountry) valCountry.textContent = country ? `${country} (${data.country_code || ''})` : 'N/A';
  if (valRegion) valRegion.textContent = [city, region].filter(Boolean).join(', ') || 'N/A';
  
  const lat = data.latitude;
  const lon = data.longitude;
  if (valCoords) valCoords.textContent = (lat !== undefined && lon !== undefined) ? `${lat}, ${lon}` : 'N/A';
  if (valPostal) valPostal.textContent = `Postal Code: ${data.postal || 'N/A'}`;
  
  // Currency & Dialing Code
  const currCode = data.currency?.code || data.currency_code || data.currency || 'N/A';
  const currSymbol = data.currency?.symbol || data.currency_symbol || '';
  if (valCurrency) valCurrency.textContent = `${currCode} ${currSymbol ? `(${currSymbol})` : ''}`;
  if (valCalling) valCalling.textContent = `Calling Code: ${data.country_phone || data.calling_code || 'N/A'}`;
  
  // Continent & Languages
  if (valContinent) valContinent.textContent = data.continent || 'N/A';
  if (valLanguages) valLanguages.textContent = `Neighbours: ${data.country_neighbours || data.languages || 'N/A'}`;

  // Security Indicators
  if (securityBadges) {
    if (data.security) {
      const isProxy = data.security.proxy || data.security.vpn || data.security.tor;
      securityBadges.innerHTML = `
        <span class="px-2 py-1 rounded text-xs ${isProxy ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}">
          Proxy/VPN: ${isProxy ? 'Detected' : 'Clean'}
        </span>
        <span class="px-2 py-1 rounded text-xs bg-slate-800 text-slate-300">
          Type: ${data.type || 'IPv4'}
        </span>
      `;
    } else {
      securityBadges.innerHTML = `
        <span class="px-2 py-1 rounded text-xs bg-slate-800 text-slate-300">Type: ${data.type || 'IPv4'}</span>
        <span class="px-2 py-1 rounded text-xs bg-slate-800 text-slate-400">Security: Standard</span>
      `;
    }
  }

  // Google Maps Redirection
  if (googleMapsBtn) {
    if (lat !== undefined && lon !== undefined) {
      googleMapsBtn.href = `https://www.google.com/maps?q=${lat},${lon}`;
      googleMapsBtn.classList.remove('pointer-events-none', 'opacity-50');
    } else {
      googleMapsBtn.classList.add('pointer-events-none', 'opacity-50');
    }
  }
}

// History Handling
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

// File Downloads
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
    fetchIpData();
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
    if (currentData && currentData.ip) {
      navigator.clipboard.writeText(currentData.ip);
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
        text: `IP: ${currentData.ip} - ${currentData.city}, ${currentData.country}`,
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

const exportJsonBtn = document.getElementById('exportJsonBtn');
const exportCsvBtn = document.getElementById('exportCsvBtn');

if (exportJsonBtn) {
  exportJsonBtn.addEventListener('click', () => {
    if (!currentData) return alert('No data available to export.');
    downloadFile(JSON.stringify(currentData, null, 2), `ipvision-${currentData.ip || 'data'}.json`, 'application/json');
  });
}

if (exportCsvBtn) {
  exportCsvBtn.addEventListener('click', () => {
    if (!currentData) return alert('No data available to export.');
    const keys = Object.keys(currentData);
    const values = Object.values(currentData).map(val => 
      typeof val === 'object' ? `"${JSON.stringify(val).replace(/"/g, '""')}"` : `"${val}"`
    );
    downloadFile(`${keys.join(',')}\n${values.join(',')}`, `ipvision-${currentData.ip || 'data'}.csv`, 'text/csv');
  });
}

// Initial Load
renderHistory();
fetchIpData();
