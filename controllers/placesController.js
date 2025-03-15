import axios from "axios";

export async function getPlaces(req, res) {
  const { lat, lon, radius = 500 } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: "Latitude and longitude are required" });
  }

  const query = `
    [out:json];
    node
      ["amenity"="cafe"]
      (around:${radius},${lat},${lon});
    out;
  `;

  const url = "https://overpass-api.de/api/interpreter";

  try {
    const response = await axios.post(url, `data=${encodeURIComponent(query)}`, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const cafes = response.data?.elements.map((cafe) => ({
      id: cafe.id,
      name: cafe.tags.name || "Name Not Found",
      lat: cafe.lat || "Unknown",
      lon: cafe.lon || "Unknown",
      number: cafe.tags['addr:housenumber'] || "Unknown",
      street: cafe.tags['addr:street'] || "Address Not Found",
      amenity: cafe.tags.amenity  || "Unknown",
      indoor_seating: cafe.tags.indoor_seating  || "Unknown",
      outdoor_seating: cafe.tags.outdoor_seating  || "Unknown",      
    })) || [];

    res.json(cafes);
  } catch (error) {
    console.error("Error fetching cafes:", error);
    res.status(500).json({ error: "Error fetching places" });
  }
}
