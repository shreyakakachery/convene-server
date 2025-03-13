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
      name: cafe.tags.name || "Unnamed Cafe",
      lat: cafe.lat,
      lon: cafe.lon,
      address: cafe.tags["addr:street"] || "Unknown Address",
    //   tags: cafe.tags    
    })) || [];

    res.json(cafes);
  } catch (error) {
    console.error("Error fetching cafes:", error);
    res.status(500).json({ error: "Error fetching places" });
  }
}
