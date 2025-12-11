// driver/js/driver.js
(function () {
  const user = Auth.currentUser();
  if (!user || user.role !== 'captain') { /* allow demo but redirect if desired */ }
  const driverNameEl = document.getElementById('driverName');
  if (driverNameEl) driverNameEl.textContent = user ? user.name : 'Driver';

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => { Auth.logout(); location.href = '../common/signin.html'; });

  // Location broadcasting is now handled by driver_socket.js
  // which uses navigator.geolocation for real location updates

  /* Disabled - replaced by driver_socket.js location tracking
  let interval = null;
  const statusEl = document.getElementById('driverStatus');
  function startBroadcast(){
    if(interval) return;
    interval = setInterval(()=>{
      const loc = { lat: (20 + Math.random()*0.06).toFixed(5), lng:(78 + Math.random()*0.06).toFixed(5), ts:Date.now() };
      // Use DriverSocket.updateLocation() instead of emit()
      if (DriverSocket && DriverSocket.updateLocation) {
        DriverSocket.updateLocation(user ? user.id : 999, loc);
      }
      statusEl && (statusEl.textContent = `Location sent: ${loc.lat}, ${loc.lng}`);
    }, 3000);
  }
  function stopBroadcast(){ clearInterval(interval); interval = null; statusEl && (statusEl.textContent = 'Stopped'); }

  document.getElementById('goOnline')?.addEventListener('click', ()=> startBroadcast());
  document.getElementById('goOffline')?.addEventListener('click', ()=> stopBroadcast());
  */
})();

// Simple driver simulator that emits location updates to DriverSocket
window.DriverSim = (function () {
  let timer = null, lat = 50, lng = 50;
  return {
    start() {
      if (timer) return; timer = setInterval(() => {
        lat += (Math.random() - 0.5) * 0.4; lng += (Math.random() - 0.5) * 0.4;
        DriverSocket.emit('location', { lat, lng });
      }, 800);
    },
    stop() { if (timer) { clearInterval(timer); timer = null; } }
  };
})();

// Debug utility to clear active rides
window.debugClearActiveRides = async function () {
  if (!confirm('DEBUG: Are you sure you want to clear ALL active rides? This will cancel existing rides.')) return;

  const btn = (window.event && window.event.target) || document.querySelector('button[onclick*="debugClearActiveRides"]');
  const originalText = btn ? btn.innerHTML : 'Debug';

  if (btn) {
    btn.innerHTML = 'Clearing...';
    btn.disabled = true;
  }

  try {
    const res = await apiFetch('/rides/clear-active', { method: 'POST' });
    if (res.ok) {
      alert(`Success! Cleared ${res.data.count} rides.`);
      window.location.reload();
    } else {
      alert('Failed: ' + (res.data?.error || res.status));
    }
  } catch (e) {
    alert('Error: ' + e.message);
  } finally {
    if (btn) {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  }
};
