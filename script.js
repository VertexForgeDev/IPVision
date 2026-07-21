const PROXY_ENDPOINT = 'https://ipvision-proxy.jozefmasiar.workers.dev/';

// DOM Elements
const ipInput = document.getElementById('ipInput');
const searchForm = document.getElementById('search-form');
const lookupBtn = document.getElementById('lookupBtn');
const myIpBtn = document.getElementById('myIpBtn');
const ipAddressEl = document.getElementById('ipAddress');
const locationEl = document.getElementById('location');
const statusBadge = document.getElementById('statusBadge');
const loadingSpinner = document.getElementById('loadingSpinner');
const detectedFlag = document.getElementById('detected-flag');
const btnGoogleMaps = document.getElementById('btn-google-maps');
const historyContainer = document.getElementById('history-container');

let currentData = null;
let historyList = JSON.parse(localStorage.getItem('ipvision_history') || '[]');

// -------------------------------------------------------------
// Fetch & Process IP Data
// -------------------------------------------------------------
async function fetchIpData(ip = '') {
  const targetIp = ip.trim();
  toggleLoading(true);
  setStatus('Fetching target data...');

  try {
    // Pass the input IP, or 'self' if blank to let Worker extract browser IP
    const queryParam = targetIp ? `?ip=${encodeURIComponent(targetIp)}` : '?ip=self';
    const response = await fetch(`${PROXY_ENDPOINT}${queryParam}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Gateway error`);
    }

    const data = await response.json();

    if (data.error || data.success === false) {
      throw new Error(data.message || data.error || 'Invalid IP or lookup failed');
    }

    currentData = data;
    displayResults(data);
    addToHistory(data.ip || targetIp);
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

// -------------------------------------------------------------
// Render Results into UI
// -------------------------------------------------------------
function displayResults(data) {
  // Main Hero Info
  if (ipAddressEl) ipAddressEl.textContent = data.ip || '---';
  
  const city = data.city || '';
  const region = data.region || '';
  const country = data.country || 'Unknown';
  const locString = [city, region, country].filter(Boolean).join(', ');
  
  if (locationEl) {
    locationEl.innerHTML = `<i class="fa-solid fa-location-dot text-indigo-400"></i> ${locString}`;
  }

  // Flag (Emoji or SVG)
  if (detectedFlag) {
    detectedFlag.textContent = data.flag?.emoji || data.country_flag || '🌐';
  }

  // Google Maps Link
  if (btnGoogleMaps && data.latitude && data.longitude) {
    btnGoogleMaps.href = `https://www.google.com/maps?q=${data.latitude},${data.longitude}`;
  }

  // Data Grid Fields
  setElText('val-country', `${country} (${data.country_code || 'N/A'})`);
  setElText('val-region', `${region || 'N/A'}, ${city || 'N/A'}`);
  setElText('val-coords', `${data.latitude ?? 0}, ${data.longitude ?? 0}`);
  setElText('val-postal', `Postal: ${data.postal || 'N/A'}`);
  
  // Connection / ISP
  const ispName = data.connection?.isp || data.isp || '---';
  const asnNum = data.connection?.asn || data.asn || '---';
  setElText('isp', ispName);
  setElText('val-asn', `ASN: ${asnNum}`);

  // Timezone & Time
  const tz = data.timezone?.id || data.timezone || '---';
  const currentTime = data.timezone?.current_time 
    ? new Date(data.timezone.current_time).toLocaleTimeString() 
    : '--:--:--';
  setElText('timezone', tz);
  setElText('val-time', `Local Time: ${currentTime}`);

  // Currency & Calling Code
  const curr = data.currency?.name ? `${data.currency.name} (${data.currency.code})` : '---';
  setElText('val-currency', curr);
  setElText('val-calling', `Calling Code: +${data.country_phone || data.calling_code || '---'}`);

  // Continent
  setElText('val-continent', data.continent || '---');
  setElText('val-languages', `Capital: ${data.country_capital || '---'}`);

  // Security Badges
  const securityContainer = document.getElementById('val-security-badges');
  if (securityContainer) {
    const isProxy = data.security?.proxy || false;
    const isVpn = data.security?.vpn || false;
    const isTor = data.security?.tor || false;

    securityContainer.innerHTML = `
      <span class="px-2 py-1 rounded text-xs ${isProxy || isVpn || isTor ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}">
        ${isProxy ? 'Proxy' : isVpn ? 'VPN' : isTor ? 'Tor' : 'Clean / Direct'}
      </span>
    `;
  }
}

// Helper to safely set textContent
function setElText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// Status & Loading Helpers
function setStatus(text, isError = false) {
  if (!statusBadge) return;
  statusBadge.className = `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
    isError 
      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
  }`;
  statusBadge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full ${isError ? 'bg-rose-400' : 'bg-emerald-400 animate-pulse'}"></span> ${text}`;
}

function toggleLoading(isLoading) {
  if (loadingSpinner) {
    loadingSpinner.classList.toggle('hidden', !isLoading);
  }
}

// -------------------------------------------------------------
// History Management
// -------------------------------------------------------------
function addToHistory(ip) {
  if (!ip || ip === 'self') return;
  historyList = [ip, ...historyList.filter(item => item !== ip)].slice(0, 8);
  localStorage.setItem('ipvision_history', JSON.stringify(historyList));
  renderHistory();
}

function renderHistory() {
  if (!historyContainer) return;
  if (historyList.length === 0) {
    historyContainer.innerHTML = '<span class="text-xs text-slate-500 italic">No recent lookups recorded.</span>';
    return;
  }

  historyContainer.innerHTML = historyList
    .map(ip => `<button onclick="fetchIpData('${ip}')" class="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-mono text-indigo-300 transition">${ip}</button>`)
    .join('');
}

// -------------------------------------------------------------
// Event Listeners & Initialization
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Form submission (Lookup button or Enter key)
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = ipInput ? ipInput.value.trim() : '';
      if (val) fetchIpData(val);
    });
  }

  // Refresh Self IP button
  if (myIpBtn) {
    myIpBtn.addEventListener('click', () => {
      if (ipInput) ipInput.value = '';
      fetchIpData('');
    });
  }

  // Copy IP to Clipboard
  document.getElementById('btn-copy-ip')?.addEventListener('click', () => {
    const text = ipAddressEl?.textContent;
    if (text && text !== '---.---.---.---') {
      navigator.clipboard.writeText(text);
      alert(`Copied IP: ${text}`);
    }
  });

  // Clear History
  document.getElementById('btn-clear-history')?.addEventListener('click', () => {
    historyList = [];
    localStorage.removeItem('ipvision_history');
    renderHistory();
  });

  renderHistory();
  
  // Initial load: lookup user's current static/public IP
  fetchIpData('');
});
