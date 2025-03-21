import axios from "axios";

export async function getPlaces(req, res) {
  const { lat, lon, radius = 500 } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: "Latitude and longitude are required" });
  }

  // const query = `
  //   [out:json];
  //   node
  //     ["amenity"="cafe"]
  //     (around:${radius},${lat},${lon});
  //   out;
  // `;

  const query = `
  [out:json];
  (
    node["amenity"="cafe"](around:${radius},${lat},${lon});
    node["amenity"="restaurant"](around:${radius},${lat},${lon});
  );
  out;
`;

  const url = "https://overpass-api.de/api/interpreter";

  try {
    const response = await axios.post(url, `data=${encodeURIComponent(query)}`, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const places = response.data?.elements.map((place) => ({
      id: place.id,
      name: place.tags.name || "Name Not Found",
      lat: place.lat || "Unknown",
      lon: place.lon || "Unknown",
      number: place.tags['addr:housenumber'] || "Unknown",
      street: place.tags['addr:street'] || "Address Not Found",
      amenity: place.tags.amenity  || "Unknown",
      indoor_seating: place.tags.indoor_seating  || "Unknown",
      outdoor_seating: place.tags.outdoor_seating  || "Unknown",      
    })) || [];

    res.json(places);
  } catch (error) {
    console.error("Error fetching places:", error);
    res.status(500).json({ error: "Error fetching places" });
  }
}
