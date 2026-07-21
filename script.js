// ... top DOM element declarations ...

async function fetchIpData(ip = '') {
  const targetIp = ip.trim();
  toggleLoading(true);
  setStatus('Fetching target data...');

  try {
    // FIX
    const param = (targetIp && targetIp.toLowerCase() !== 'self') 
      ? `?ip=${encodeURIComponent(targetIp)}` 
      : '';

    const response = await fetch(`${PROXY_ENDPOINT}${param}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Gateway error`);
    }

    const data = await response.json();

    if (data.error || data.success === false) {
      throw new Error(data.message || data.error || 'Invalid IP or lookup failed');
    }

    currentData = data;
    displayResults(data);
    
    // Only record in history if user entered a specific IP
    if (targetIp && targetIp.toLowerCase() !== 'self') {
      addToHistory(data.ip || targetIp);
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

// ... rest of script.js ...
