const express = require('express');
const axios = require('axios');
const authMiddleware = require('../middleware/auth');
const { getUserById } = require('../db');

const router = express.Router();

const toRadians = (value) => (value * Math.PI) / 180;

const calculateDistanceKm = (firstLat, firstLon, secondLat, secondLon) => {
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(secondLat - firstLat);
  const longitudeDelta = toRadians(secondLon - firstLon);
  const a =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(toRadians(firstLat)) *
      Math.cos(toRadians(secondLat)) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);

  return earthRadiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const buildAddress = (tags = {}) => {
  const parts = [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:suburb'],
    tags['addr:city'],
    tags['addr:state'],
  ].filter(Boolean);

  return parts.join(', ');
};

const fallbackGymCatalog = [
  {
    id: 'fitai-noida-1',
    name: 'Anytime Fitness Noida Sector 18',
    regionKeys: ['noida', 'sector 18', 'uttar pradesh'],
    address: 'Sector 18, Noida, Uttar Pradesh',
    lat: 28.5708,
    lon: 77.3272,
  },
  {
    id: 'fitai-noida-2',
    name: 'Cult Gym Noida Sector 62',
    regionKeys: ['noida', 'sector 62', 'uttar pradesh'],
    address: 'Sector 62, Noida, Uttar Pradesh',
    lat: 28.6289,
    lon: 77.3649,
  },
  {
    id: 'fitai-delhi-1',
    name: 'Golds Gym Saket',
    regionKeys: ['delhi', 'saket', 'new delhi'],
    address: 'Saket, New Delhi, Delhi',
    lat: 28.5245,
    lon: 77.2066,
  },
  {
    id: 'fitai-delhi-2',
    name: 'Fitness First Connaught Place',
    regionKeys: ['delhi', 'connaught place', 'new delhi'],
    address: 'Connaught Place, New Delhi, Delhi',
    lat: 28.6315,
    lon: 77.2167,
  },
  {
    id: 'fitai-gurgaon-1',
    name: 'Cult Fit Gurgaon Sector 29',
    regionKeys: ['gurgaon', 'gurugram', 'sector 29', 'haryana'],
    address: 'Sector 29, Gurugram, Haryana',
    lat: 28.4675,
    lon: 77.0726,
  },
  {
    id: 'fitai-gurgaon-2',
    name: 'Anytime Fitness DLF Phase 4',
    regionKeys: ['gurgaon', 'gurugram', 'dlf', 'phase 4', 'haryana'],
    address: 'DLF Phase 4, Gurugram, Haryana',
    lat: 28.4671,
    lon: 77.0824,
  },
];

const normalizeText = (value = '') => value.trim().toLowerCase();

const buildGymRecord = (gym, latitude, longitude, provider = 'fitai_fallback') => ({
  id: gym.id,
  name: gym.name,
  address: gym.address,
  distanceKm: Number(calculateDistanceKm(latitude, longitude, gym.lat, gym.lon).toFixed(1)),
  fitaiScore: Math.max(72, 100 - Math.round(calculateDistanceKm(latitude, longitude, gym.lat, gym.lon) * 8)),
  imageSeed: encodeURIComponent(gym.name.toLowerCase().replace(/\s+/g, '-')),
  mapsUrl: `https://www.openstreetmap.org/?mlat=${gym.lat}&mlon=${gym.lon}#map=18/${gym.lat}/${gym.lon}`,
  mapEmbedUrl: `https://www.openstreetmap.org/export/embed.html?bbox=${gym.lon - 0.01}%2C${gym.lat - 0.01}%2C${gym.lon + 0.01}%2C${gym.lat + 0.01}&layer=mapnik&marker=${gym.lat}%2C${gym.lon}`,
  provider,
});

const getFallbackGymsByQuery = (query, latitude, longitude) => {
  const normalizedQuery = normalizeText(query);
  return fallbackGymCatalog
    .filter((gym) => gym.regionKeys.some((key) => normalizedQuery.includes(key)))
    .map((gym) => buildGymRecord(gym, latitude, longitude))
    .sort((first, second) => first.distanceKm - second.distanceKm)
    .slice(0, 8);
};

const searchNearbyGyms = async (latitude, longitude, radiusMeters) => {
  const overpassQuery = `
      [out:json][timeout:25];
      (
        node["leisure"="fitness_centre"](around:${radiusMeters},${latitude},${longitude});
        way["leisure"="fitness_centre"](around:${radiusMeters},${latitude},${longitude});
        node["sport"="fitness"](around:${radiusMeters},${latitude},${longitude});
        way["sport"="fitness"](around:${radiusMeters},${latitude},${longitude});
        node["amenity"="gym"](around:${radiusMeters},${latitude},${longitude});
        way["amenity"="gym"](around:${radiusMeters},${latitude},${longitude});
      );
      out center tags;
    `;

  const overpassResponse = await axios.post('https://overpass-api.de/api/interpreter', overpassQuery, {
    headers: {
      'Content-Type': 'text/plain',
      'User-Agent': 'FitAI/1.0 nearby-gym-search',
    },
    timeout: 15000,
  });

  return overpassResponse.data?.elements || [];
};

const autocompleteGooglePlaces = async ({ input, latitude, longitude }) => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    return null;
  }

  const requestBody = {
    input,
    includedPrimaryTypes: ['(regions)', '(cities)'],
    includeQueryPredictions: true,
  };

  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    requestBody.locationBias = {
      circle: {
        center: {
          latitude,
          longitude,
        },
        radius: 30000,
      },
    };
  }

  let response;

  try {
    response = await axios.post('https://places.googleapis.com/v1/places:autocomplete', requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask':
          'suggestions.placePrediction.placeId,suggestions.placePrediction.text.text,suggestions.queryPrediction.text.text',
      },
      timeout: 12000,
    });
  } catch (error) {
    const details = error.response?.data || error.message || 'Unknown Google Places autocomplete error';
    console.error('Google Places autocomplete failed:', details);
    return null;
  }

  return (response.data?.suggestions || [])
    .map((suggestion, index) => {
      const placeText = suggestion.placePrediction?.text?.text;
      const queryText = suggestion.queryPrediction?.text?.text;
      const label = placeText || queryText;

      if (!label) {
        return null;
      }

      return {
        id: `google-suggestion-${index}`,
        label,
        provider: 'google_places',
      };
    })
    .filter(Boolean)
    .slice(0, 5);
};

router.get('/autocomplete', authMiddleware, async (req, res) => {
  const input = String(req.query.q || '').trim();

  if (input.length < 2) {
    return res.json({ suggestions: [] });
  }

  try {
    const latitude = Number(req.query.lat);
    const longitude = Number(req.query.lon);

    const googleSuggestions = await autocompleteGooglePlaces({
      input,
      latitude,
      longitude,
    });

    if (googleSuggestions?.length) {
      return res.json({
        suggestions: googleSuggestions,
        provider: 'google_places',
      });
    }

    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: input,
        format: 'jsonv2',
        limit: 5,
      },
      headers: {
        'User-Agent': 'FitAI/1.0 location-autocomplete',
      },
      timeout: 10000,
    });

    const suggestions = (response.data || []).map((item, index) => ({
      id: `osm-suggestion-${index}`,
      label: item.display_name,
      provider: 'openstreetmap',
    }));

    return res.json({
      suggestions,
      provider: 'openstreetmap',
    });
  } catch (_error) {
    return res.json({ suggestions: [] });
  }
});

const searchGooglePlacesGyms = async ({ query, latitude, longitude, hasCoordinates }) => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    return null;
  }

  const requestBody = hasCoordinates
    ? {
        textQuery: 'gym',
        pageSize: 8,
        locationBias: {
          circle: {
            center: {
              latitude,
              longitude,
            },
            radius: 5000,
          },
        },
      }
    : {
        textQuery: `gym in ${query}`,
        pageSize: 8,
      };

  let response;

  try {
    response = await axios.post('https://places.googleapis.com/v1/places:searchText', requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask':
          'places.displayName,places.formattedAddress,places.location,places.googleMapsUri,places.rating,places.userRatingCount',
      },
      timeout: 15000,
    });
  } catch (error) {
    const details = error.response?.data || error.message || 'Unknown Google Places searchText error';
    console.error('Google Places searchText failed:', details);
    return null;
  }

  return (response.data?.places || [])
    .map((place, index) => {
      const placeLat = Number(place.location?.latitude);
      const placeLon = Number(place.location?.longitude);

      if (!placeLat || !placeLon) {
        return null;
      }

      const distanceKm = Number(calculateDistanceKm(latitude, longitude, placeLat, placeLon).toFixed(1));
      const rating = Number(place.rating || 4.2);
      const userRatingCount = Number(place.userRatingCount || 20);
      const fitaiScore = Math.min(99, Math.max(75, Math.round(rating * 18 + Math.min(userRatingCount, 150) / 12)));

      return {
        id: `google-${index}-${place.displayName?.text || 'gym'}`,
        name: place.displayName?.text || 'Nearby Fitness Center',
        address: place.formattedAddress || query || 'Nearby area',
        distanceKm,
        fitaiScore,
        rating,
        userRatingCount,
        imageSeed: encodeURIComponent((place.displayName?.text || 'fitai-gym').toLowerCase().replace(/\s+/g, '-')),
        mapsUrl: place.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${placeLat},${placeLon}`,
        mapEmbedUrl: `https://www.openstreetmap.org/export/embed.html?bbox=${placeLon - 0.01}%2C${placeLat - 0.01}%2C${placeLon + 0.01}%2C${placeLat + 0.01}&layer=mapnik&marker=${placeLat}%2C${placeLon}`,
        provider: 'google_places',
      };
    })
    .filter(Boolean);
};

router.get('/nearby-gyms', authMiddleware, async (req, res) => {
  const query = String(req.query.q || '').trim();
  const latitudeQuery = Number(req.query.lat);
  const longitudeQuery = Number(req.query.lon);
  const hasCoordinates = Number.isFinite(latitudeQuery) && Number.isFinite(longitudeQuery);

  try {
    const user = getUserById(req.user.id);
    const locationQuery = query || user?.preferences?.gymSearchLocation || req.query.label || '';

    if (!locationQuery && !hasCoordinates) {
      return res.status(400).json({ error: 'Add a city or area in settings to find nearby gyms.' });
    }

    let place = null;
    let latitude = latitudeQuery;
    let longitude = longitudeQuery;

    if (!hasCoordinates) {
      const geocodeResponse = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: locationQuery,
          format: 'jsonv2',
          limit: 1,
        },
        headers: {
          'User-Agent': 'FitAI/1.0 nearby-gym-search',
        },
        timeout: 12000,
      });

      place = geocodeResponse.data?.[0];

      if (!place) {
        return res.status(404).json({ error: 'Location not found. Try a clearer city, area, or locality name.' });
      }

      latitude = Number(place.lat);
      longitude = Number(place.lon);
    } else {
      const reverseResponse = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: {
          lat: latitude,
          lon: longitude,
          format: 'jsonv2',
        },
        headers: {
          'User-Agent': 'FitAI/1.0 nearby-gym-search',
        },
        timeout: 12000,
      });

      place = reverseResponse.data || {
        display_name: req.query.label || 'Current location',
      };
    }

    const googleGyms = await searchGooglePlacesGyms({
      query: locationQuery || place.display_name,
      latitude,
      longitude,
      hasCoordinates,
    });

    if (googleGyms?.length) {
      return res.json({
        locationQuery,
        center: {
          label: place.display_name,
          lat: latitude,
          lon: longitude,
        },
        radiusUsed: 5000,
        provider: 'google_places',
        gyms: googleGyms,
      });
    }

    const requestedRadius = Number(req.query.radius || 5000);
    const fallbackRadius = Number(req.query.fallbackRadius || 15000);
    let rawGyms = await searchNearbyGyms(latitude, longitude, requestedRadius);
    let radiusUsed = requestedRadius;

    if (!rawGyms.length && fallbackRadius > requestedRadius) {
      rawGyms = await searchNearbyGyms(latitude, longitude, fallbackRadius);
      radiusUsed = fallbackRadius;
    }

    let gyms = rawGyms
      .map((item) => {
        const gymLat = Number(item.lat || item.center?.lat);
        const gymLon = Number(item.lon || item.center?.lon);

        if (!gymLat || !gymLon) {
          return null;
        }

        return {
          id: `${item.type}-${item.id}`,
          name: item.tags?.name || 'Nearby Fitness Center',
          address: buildAddress(item.tags) || place.display_name,
          distanceKm: Number(calculateDistanceKm(latitude, longitude, gymLat, gymLon).toFixed(1)),
          fitaiScore: Math.max(72, 100 - Math.round(calculateDistanceKm(latitude, longitude, gymLat, gymLon) * 8)),
          imageSeed: encodeURIComponent((item.tags?.name || 'fitai-gym').toLowerCase().replace(/\s+/g, '-')),
          mapsUrl: `https://www.openstreetmap.org/?mlat=${gymLat}&mlon=${gymLon}#map=18/${gymLat}/${gymLon}`,
          mapEmbedUrl: `https://www.openstreetmap.org/export/embed.html?bbox=${gymLon - 0.01}%2C${gymLat - 0.01}%2C${gymLon + 0.01}%2C${gymLat + 0.01}&layer=mapnik&marker=${gymLat}%2C${gymLon}`,
          provider: 'openstreetmap',
        };
      })
      .filter(Boolean)
      .sort((first, second) => first.distanceKm - second.distanceKm)
      .slice(0, 8);

    if (!gyms.length && locationQuery) {
      gyms = getFallbackGymsByQuery(locationQuery, latitude, longitude);
    }

    return res.json({
      locationQuery,
      center: {
        label: place.display_name,
        lat: latitude,
        lon: longitude,
      },
      radiusUsed,
      provider: gyms[0]?.provider || 'openstreetmap',
      gyms,
    });
  } catch (error) {
    const fallbackQuery = normalizeText(query || req.query.label || '');
    if (fallbackQuery) {
      const fallbackGyms = getFallbackGymsByQuery(fallbackQuery, 28.6139, 77.209);
      if (fallbackGyms.length) {
        return res.json({
          locationQuery: query || req.query.label || '',
          center: {
            label: query || req.query.label || 'Fallback search area',
            lat: 28.6139,
            lon: 77.209,
          },
          radiusUsed: 15000,
          provider: 'fitai_fallback',
          gyms: fallbackGyms,
          fallback: true,
        });
      }
    }

    return res.status(400).json({
      error: 'Unable to fetch nearby gyms right now. Please try again after a moment.',
      details: error.message,
    });
  }
});

module.exports = router;
