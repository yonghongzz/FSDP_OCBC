// Initialize map centered on Singapore
const SINGAPORE_BOUNDS = {
  north: 1.4504,
  south: 1.2500,
  east: 104.0240,
  west: 103.6000
};

const map = L.map('map', {
  maxBounds: [
    [SINGAPORE_BOUNDS.south, SINGAPORE_BOUNDS.west],
    [SINGAPORE_BOUNDS.north, SINGAPORE_BOUNDS.east]
  ],
  minZoom: 11
}).setView([1.3521, 103.8198], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

let currentCategory = 'banks';
let markers = L.layerGroup().addTo(map);
let userLocationMarker = null;

// Get device location
function getUserLocation() {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Check if location is within Singapore bounds
        if (latitude >= SINGAPORE_BOUNDS.south && 
            latitude <= SINGAPORE_BOUNDS.north && 
            longitude >= SINGAPORE_BOUNDS.west && 
            longitude <= SINGAPORE_BOUNDS.east) {
          
          // Remove existing user location marker if it exists
          if (userLocationMarker) {
            userLocationMarker.remove();
          }

          // Add user location marker with Google Maps style
          userLocationMarker = L.marker([latitude, longitude], {
            icon: L.divIcon({
              className: 'user-location-marker',
              html: '<div></div>',
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            })
          }).addTo(map);

          // Center map on user location
          map.setView([latitude, longitude], 15);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
      }
    );
  }
}

// Mock API calls (replace these with actual API endpoints)
async function fetchLocations(category) {
  try {
    // Simulate API call - replace with actual endpoint
    const response = await fetch(`/${category}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching locations:', error);
    return [];
  }
}

// Search functionality
window.handleSearch = async () => {
  const searchInput = document.getElementById('search').value;
  if (!searchInput) return;

  try {
    // Add Singapore to the search query to limit results
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${searchInput}, Singapore`);
    const data = await response.json();
    
    if (data.length > 0) {
      const { lat, lon } = data[0];
      
      // Verify the location is within Singapore bounds
      if (lat >= SINGAPORE_BOUNDS.south && 
          lat <= SINGAPORE_BOUNDS.north && 
          lon >= SINGAPORE_BOUNDS.west && 
          lon <= SINGAPORE_BOUNDS.east) {
        map.setView([lat, lon], 15);
        await updateLocations();
      }
    }
  } catch (error) {
    console.error('Error during search:', error);
  }
};

// Add keyboard support for search
document.getElementById('search').addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    handleSearch();
  }
});

// Category selection
window.setCategory = async (category) => {
  currentCategory = category;
  
  // Update UI
  document.getElementById('branchesBtn').classList.toggle('active', category === 'banks');
  document.getElementById('atmBtn').classList.toggle('active', category === 'atms');
  
  await updateLocations();
};

// Overlay functionality
window.showOverlay = (location) => {
  const overlay = document.getElementById('locationOverlay');
  const details = document.getElementById('locationDetails');
  
  details.innerHTML = `
    <div class="location-name">${location.bank_name}</div>
    <div class="location-info">
      <strong>Address:</strong><br>
      ${location.address}
    </div>
    <div class="location-info">
      <strong>Operating Hours:</strong><br>
      ${location.operating_hours}
    </div>
  `;
  
  overlay.classList.add('active');
};

window.closeOverlay = () => {
  const overlay = document.getElementById('locationOverlay');
  overlay.classList.remove('active');
};

// Update map markers
async function updateLocations() {
  // Clear existing markers
  markers.clearLayers();
  
  // Fetch and display new locations
  const locations = await fetchLocations(currentCategory);
  
  locations.forEach(location => {
    const marker = L.marker([location.latitude, location.longitude])
      .on('click', () => showOverlay(location));
    markers.addLayer(marker);
  });
}

// Initial setup
getUserLocation();
updateLocations();