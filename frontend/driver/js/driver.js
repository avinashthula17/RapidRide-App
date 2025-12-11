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
    // 1. Fix DB Dates (Auto-repair corrupted data)
    try {
      await apiFetch('/auth/fix-db-date', { method: 'POST' });
    } catch (ignore) { console.warn('Fix date failed', ignore); }

    // 2. Clear Rides
    const res = await apiFetch('/rides/clear-active', { method: 'POST' });
    if (res.ok) {
      alert(`Success! Cleared ${res.data.count} rides & Repaired DB.`);
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

// ==========================================
// Ride Request Modal Logic
// ==========================================
let currentRequest = null;
let requestTimer = null;

window.showRequestModal = function (rideData) {
  currentRequest = rideData;
  const modal = document.getElementById('rideRequestModal');
  if (!modal) return;

  // Populate Fields
  const riderName = rideData.riderName || 'Unknown';
  document.getElementById('modal-rider-name').textContent = `Rider: ${riderName}`;
  document.getElementById('modal-fare').textContent = Math.round(rideData.fare);

  if (rideData.distance) {
    document.getElementById('modal-distance').textContent = `${rideData.distance} km`;
  }
  if (rideData.duration) {
    document.getElementById('modal-duration').textContent = `${rideData.duration} min`;
  }

  document.getElementById('modal-pickup').textContent = rideData.pickup.address;
  document.getElementById('modal-drop').textContent = rideData.destination.address;

  // Show Modal
  modal.classList.remove('hidden');

  // Play Sound
  try {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS57OihUhQOTKXh8bVkHQU2jdXyy3krBSh+zPDcjjwKElyx6OyrWBQJR53e8r5uIQUrgc7y2Yk2CBhkuezooVIUDkyl4fG1ZB0FNo3V8st5KwUofsz');
    audio.play().catch(e => console.log('Audio play failed', e));
  } catch (e) { }

  // Start Countdown
  startCountdown();
};

function startCountdown() {
  const el = document.getElementById('modal-countdown');
  let timeLeft = 30;
  if (el) el.textContent = timeLeft;

  if (requestTimer) clearInterval(requestTimer);

  requestTimer = setInterval(() => {
    timeLeft--;
    if (el) el.textContent = timeLeft;
    if (timeLeft <= 0) {
      rejectRide();
    }
  }, 1000);
}

window.acceptRide = async function () {
  if (!currentRequest) return;

  if (requestTimer) clearInterval(requestTimer);

  const btn = event.currentTarget; // Get the button clicked
  const originalText = btn.innerText;
  btn.innerText = 'ACCEPTING...';
  btn.disabled = true;

  try {
    // Call DriverSocket directly if available
    if (window.DriverSocket) {
      await window.DriverSocket.acceptRide(currentRequest.rideId);
    } else {
      throw new Error('DriverSocket not initialized');
    }

    // Success - Hide Modal and Redirect
    document.getElementById('rideRequestModal').classList.add('hidden');
    window.location.href = `ride_active.html?rideId=${currentRequest.rideId}`;

  } catch (error) {
    console.error('Accept failed:', error);
    alert('Failed to accept ride: ' + error.message);
    btn.innerText = originalText;
    btn.disabled = false;
  }
};

window.rejectRide = function () {
  if (requestTimer) clearInterval(requestTimer);
  document.getElementById('rideRequestModal').classList.add('hidden');
  currentRequest = null;
  // interactions with socket rejection if needed
};
