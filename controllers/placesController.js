import axios from "axios";

export async function getPlaces(req, res) {
  const { lat, lon, radius = 500, category = "cafe" } = req.query;

  if (!lat || !lon) {
    return res
      .status(400)
      .json({ error: "Latitude and longitude are required" });
  }

  const query = `
    [out:json];
    node
      ["amenity"="${category}"]
      (around:${radius},${lat},${lon});
    out center;
  `;


  // const url = "https://overpass-api.de/api/interpreter"; // slow mirror, used by many

  const url = "https://overpass.kumi.systems/api/interpreter"; // faster, usa mirror

  // https://overpass.openstreetmap.fr/api/interpreter // japan mirror

  // https://overpass.nchc.org.tw/api/interpreter // germany mirror

  try {
    const response = await axios.post(
      url,
      `data=${encodeURIComponent(query)}`,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept-Encoding": "gzip",
        },
      }
    );

    const places =
      response.data?.elements.map((place) => ({
        id: place.id,
        name: place.tags.name || "Name Not Found",
        lat: place.lat || "Unknown",
        lon: place.lon || "Unknown",
        number: place.tags["addr:housenumber"] || "Unknown",
        street: place.tags["addr:street"] || "Address Not Found",
        amenity: place.tags.amenity || "Unknown",
      })) || [];

    res.json(places);
  } catch (error) {
    console.error("Error fetching places:", error);
    res.status(500).json({ error: "Error fetching places" });
  }
}
