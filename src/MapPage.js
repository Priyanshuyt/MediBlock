// src/MapPage.js
import React, { useEffect, useRef, useState } from 'react';

function MapPage({ onPharmacySelect }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  
  const [locationInput, setLocationInput] = useState('Greater Noida');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // State to hold the list of found pharmacies
  const [pharmacies, setPharmacies] = useState([]);

  const findPharmacies = () => {
    if (!locationInput) {
      setError("Please enter a location.");
      return;
    }
    setIsLoading(true);
    setError('');
    setPharmacies([]); // Clear previous list

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: locationInput }, (results, status) => {
      if (status === 'OK') {
        const location = results[0].geometry.location;

        if (!mapRef.current) {
          mapRef.current = new window.google.maps.Map(mapContainerRef.current, {
            center: location,
            zoom: 14
          });
        } else {
          mapRef.current.setCenter(location);
        }

        const request = {
          location: location,
          radius: '2000',
          keyword: 'pharmacy'
        };

        const service = new window.google.maps.places.PlacesService(mapRef.current);
        service.nearbySearch(request, (placeResults, placeStatus) => {
          clearMarkers();
          if (placeStatus === window.google.maps.places.PlacesServiceStatus.OK && placeResults) {
            // Store pharmacy data in state to render the list
            const pharmacyData = placeResults.map(place => ({
              id: place.place_id,
              name: place.name,
              address: place.vicinity,
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            }));
            setPharmacies(pharmacyData);
            pharmacyData.forEach(createMarker);
          } else {
            setError("No pharmacies found nearby.");
          }
          setIsLoading(false);
        });
      } else {
        setError("Could not find the location: " + status);
        setIsLoading(false);
      }
    });
  };

  const createMarker = (pharmacy) => {
    const marker = new window.google.maps.Marker({
      map: mapRef.current,
      position: { lat: pharmacy.lat, lng: pharmacy.lng },
      title: pharmacy.name,
    });

    const infoWindowContent = `<div><strong>${pharmacy.name}</strong><br>${pharmacy.address}</div>`;
    const infowindow = new window.google.maps.InfoWindow({ content: infoWindowContent });
    marker.addListener("click", () => infowindow.open(mapRef.current, marker));
    markersRef.current.push(marker);
  };

  const clearMarkers = () => {
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
  };

  useEffect(() => {
    findPharmacies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const styles = {
    pageContainer: { maxWidth: '800px', margin: 'auto', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden' },
    header: { padding: '16px', backgroundColor: '#f8f9fa', borderBottom: '1px solid #dee2e6', textAlign: 'center' },
    searchContainer: { display: 'flex', padding: '16px', justifyContent: 'center', alignItems: 'center' },
    input: { padding: '10px', fontSize: '16px', width: '300px', marginRight: '10px', border: '1px solid #ccc', borderRadius: '4px' },
    button: { padding: '10px 20px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#20B2AA', color: 'white', border: 'none', borderRadius: '4px' },
    mapContainer: { height: '40vh', width: '100%' },
    listContainer: { padding: '0 16px 16px 16px', maxHeight: '25vh', overflowY: 'auto' },
    pharmacyItem: { display: 'flex', alignItems: 'center', padding: '12px', borderBottom: '1px solid #e9ecef', cursor: 'pointer' },
    pharmacyIcon: { fontSize: '24px', marginRight: '16px', color: '#20B2AA' },
    pharmacyInfo: { flex: 1 },
    pharmacyName: { fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' },
    pharmacyAddress: { fontSize: '14px', color: '#6c757d' }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.header}>
        <h2 style={{ margin: 0, fontSize: '24px' }}>🏥 Nearby Pharmacy Locator</h2>
      </div>
      <div style={styles.searchContainer}>
        <input style={styles.input} type="text" value={locationInput} onChange={e => setLocationInput(e.target.value)} />
        <button style={styles.button} onClick={findPharmacies} disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Find Pharmacies'}
        </button>
      </div>
      {error && <p style={{textAlign: 'center', color: 'red'}}>{error}</p>}
      <div id="map" ref={mapContainerRef} style={styles.mapContainer} />
      
      <div style={styles.listContainer}>
        {pharmacies.map((pharmacy) => (
          <div 
            key={pharmacy.id} 
            style={styles.pharmacyItem} 
            onClick={() => onPharmacySelect(pharmacy)} // This triggers the navigation
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f1f1'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={styles.pharmacyIcon}>&#127973;</div>
            <div style={styles.pharmacyInfo}>
              <div style={styles.pharmacyName}>{pharmacy.name}</div>
              <div style={styles.pharmacyAddress}>{pharmacy.address}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MapPage;
