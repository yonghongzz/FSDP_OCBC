// Initialize map
const map = L.map('map').setView([1.3521, 103.8198], 12); // Default to Singapore coordinates

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

let currentCategory = 'branches';
let markers = L.layerGroup().addTo(map);

class BankLocation {
  constructor(bank_name, address, postal_code, operating_hours) {
    this.bank_name = bank_name;
    this.address = address;
    this.postal_code = postal_code;
    this.operating_hours = operating_hours;
  }
}

// Mock API calls (replace these with actual API endpoints)
async function fetchLocations(category) {
  try {
    // Simulate API call - replace with actual endpoint
    const response = await fetch(`/api/${category}`);
    const data = await response.json();
    return data.recordset.map(
      (row) => new BankLocation(row.bank_name, row.address, row.postal_code, row.operating_hours)
    );
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
    // Simulate geocoding - replace with actual geocoding service
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${searchInput}`);
    const data = await response.json();
    
    if (data.length > 0) {
      const { lat, lon } = data[0];
      map.setView([lat, lon], 15);
      await updateLocations();
    }
  } catch (error) {
    console.error('Error during search:', error);
  }
};

// Category selection
window.setCategory = async (category) => {
  currentCategory = category;
  
  // Update UI
  document.getElementById('branchesBtn').classList.toggle('active', category === 'branches');
  document.getElementById('atmBtn').classList.toggle('active', category === 'atm');
  
  await updateLocations();
};

// Update map markers
async function updateLocations() {
  // Clear existing markers
  markers.clearLayers();
  
  // Fetch and display new locations
  const locations = await fetchLocations(currentCategory);
  
  locations.forEach(location => {
    // In a real application, you would use the actual coordinates from the location data
    // Here we're using a geocoding service to convert addresses to coordinates
    geocodeAddress(location);
  });
}

async function geocodeAddress(location) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location.address)}`
    );
    const data = await response.json();
    
    if (data.length > 0) {
      const { lat, lon } = data[0];
      const marker = L.marker([lat, lon])
        .bindPopup(`
          <strong>${location.bank_name}</strong><br>
          ${location.address}<br>
          Postal Code: ${location.postal_code}<br>
          Hours: ${location.operating_hours}
        `);
      markers.addLayer(marker);
    }
  } catch (error) {
    console.error('Error geocoding address:', error);
  }
}

// Initial load
updateLocations();