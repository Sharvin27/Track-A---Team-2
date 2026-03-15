const db = require("../db/database");

const FOOD_NEED_DATASET_URL =
  "https://data.cityofnewyork.us/resource/4kc9-zrs2.json?%24limit=1000&%24order=year%20DESC%2C%20weighted_score%20DESC";
const NTA_BOUNDARY_DATASET_URL =
  "https://data.cityofnewyork.us/resource/9nt8-h7nd.json?%24limit=1000";

const upsertRegionStatement = db.prepare(`
  INSERT INTO need_regions (
    region_code,
    region_name,
    borough_name,
    region_type,
    geometry_json,
    centroid_lat,
    centroid_lng,
    food_insecure_percentage,
    food_need_score,
    weighted_rank,
    source_year,
    updated_at
  ) VALUES (
    @regionCode,
    @regionName,
    @boroughName,
    @regionType,
    @geometryJson,
    @centroidLat,
    @centroidLng,
    @foodInsecurePercentage,
    @foodNeedScore,
    @weightedRank,
    @sourceYear,
    @updatedAt
  )
  ON CONFLICT(region_code) DO UPDATE SET
    region_name = excluded.region_name,
    borough_name = excluded.borough_name,
    region_type = excluded.region_type,
    geometry_json = excluded.geometry_json,
    centroid_lat = excluded.centroid_lat,
    centroid_lng = excluded.centroid_lng,
    food_insecure_percentage = excluded.food_insecure_percentage,
    food_need_score = excluded.food_need_score,
    weighted_rank = excluded.weighted_rank,
    source_year = excluded.source_year,
    updated_at = excluded.updated_at
`);

const selectAllRegionsStatement = db.prepare(`
  SELECT *
  FROM need_regions
  ORDER BY food_insecure_percentage DESC, food_need_score DESC, region_name ASC
`);

const selectAllHotspotsStatement = db.prepare(`
  SELECT id, lat, lng
  FROM hotspot_locations
`);

const updateHotspotRegionStatement = db.prepare(`
  UPDATE hotspot_locations
  SET
    region_code = @regionCode,
    region_name = @regionName,
    region_need_score = @regionNeedScore
  WHERE id = @id
`);

function getStoredNeedRegions() {
  return selectAllRegionsStatement.all().map(normalizeRegionRow);
}

async function importNeedRegionsFromNycOpenData() {
  const [scoreRows, boundaryRows] = await Promise.all([
    fetchJson(FOOD_NEED_DATASET_URL),
    fetchJson(NTA_BOUNDARY_DATASET_URL),
  ]);

  const latestYear = scoreRows.reduce((latest, row) => {
    const year = Number(row.year);
    return Number.isFinite(year) && year > latest ? year : latest;
  }, 0);

  const latestScores = scoreRows.filter((row) => Number(row.year) === latestYear);
  const scoreByRegion = new Map(
    latestScores.map((row) => [
      row.nta,
      {
        regionCode: row.nta,
        regionName: row.nta_name,
        foodInsecurePercentage: Number(row.food_insecure_percentage),
        foodNeedScore: Number(row.weighted_score),
        weightedRank: Number(row.rank),
        sourceYear: row.year,
      },
    ]),
  );

  const joinedRegions = boundaryRows
    .map((row) => {
      const scoreRow = scoreByRegion.get(row.nta2020);
      if (!scoreRow || !row.the_geom) return null;

      const centroid = calculateGeometryCentroid(row.the_geom);
      if (!centroid) return null;

      return {
        regionCode: scoreRow.regionCode,
        regionName: scoreRow.regionName || row.ntaname,
        boroughName: row.boroname || "",
        regionType: row.cdtaname || row.ntatype || "",
        geometryJson: JSON.stringify(row.the_geom),
        centroidLat: centroid.lat,
        centroidLng: centroid.lng,
        foodInsecurePercentage: scoreRow.foodInsecurePercentage,
        foodNeedScore: scoreRow.foodNeedScore,
        weightedRank: scoreRow.weightedRank,
        sourceYear: scoreRow.sourceYear,
        updatedAt: new Date().toISOString(),
      };
    })
    .filter(Boolean);

  const transaction = db.transaction((regions) => {
    for (const region of regions) {
      upsertRegionStatement.run(region);
    }
  });

  transaction(joinedRegions);
  const annotationSummary = annotateStoredHotspotsWithNeedRegions();

  return {
    importedCount: joinedRegions.length,
    sourceCount: latestScores.length,
    sourceYear: String(latestYear),
    annotatedHotspotCount: annotationSummary.annotatedCount,
  };
}

function annotateStoredHotspotsWithNeedRegions() {
  const regions = getStoredNeedRegions();
  const hotspots = selectAllHotspotsStatement.all();
  let annotatedCount = 0;

  const transaction = db.transaction((rows) => {
    for (const row of rows) {
      const assignment = findNeedRegionForPoint(row.lat, row.lng, regions);

      updateHotspotRegionStatement.run({
        id: row.id,
        regionCode: assignment?.regionCode || null,
        regionName: assignment?.regionName || null,
        regionNeedScore: assignment?.foodNeedScore ?? null,
      });

      if (assignment) annotatedCount += 1;
    }
  });

  transaction(hotspots);

  return { annotatedCount };
}

function findNeedRegionForPoint(lat, lng, cachedRegions) {
  const regions = cachedRegions || getStoredNeedRegions();

  for (const region of regions) {
    if (pointInGeometry({ lat, lng }, region.geometry)) {
      return region;
    }
  }

  return null;
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Failed to fetch NYC Open Data: ${response.status} ${body}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeRegionRow(row) {
  const geometry =
    typeof row.geometry_json === "string" ? JSON.parse(row.geometry_json) : row.geometry_json;

  return {
    id: String(row.id),
    regionCode: row.region_code,
    regionName: row.region_name,
    boroughName: row.borough_name || "",
    regionType: row.region_type || "",
    geometry,
    centroidLat: row.centroid_lat,
    centroidLng: row.centroid_lng,
    foodInsecurePercentage: row.food_insecure_percentage,
    foodNeedScore: row.food_need_score,
    weightedRank: row.weighted_rank,
    sourceYear: row.source_year,
  };
}

function calculateGeometryCentroid(geometry) {
  const points = flattenGeometryPoints(geometry);
  if (points.length === 0) return null;

  const totals = points.reduce(
    (accumulator, [lng, lat]) => ({
      lat: accumulator.lat + lat,
      lng: accumulator.lng + lng,
    }),
    { lat: 0, lng: 0 },
  );

  return {
    lat: totals.lat / points.length,
    lng: totals.lng / points.length,
  };
}

function pointInGeometry(point, geometry) {
  if (!geometry) return false;

  if (geometry.type === "Polygon") {
    return pointInPolygonRings(point, geometry.coordinates);
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.some((polygon) => pointInPolygonRings(point, polygon));
  }

  return false;
}

function pointInPolygonRings(point, polygonRings) {
  if (!Array.isArray(polygonRings) || polygonRings.length === 0) return false;

  const [outerRing, ...holes] = polygonRings;
  if (!pointInRing(point, outerRing)) return false;

  return !holes.some((ring) => pointInRing(point, ring));
}

function pointInRing(point, ring) {
  let inside = false;

  for (let currentIndex = 0, previousIndex = ring.length - 1; currentIndex < ring.length; previousIndex = currentIndex++) {
    const [x1, y1] = ring[currentIndex];
    const [x2, y2] = ring[previousIndex];
    const intersects =
      y1 > point.lat !== y2 > point.lat &&
      point.lng <
        ((x2 - x1) * (point.lat - y1)) / ((y2 - y1) || Number.EPSILON) + x1;

    if (intersects) inside = !inside;
  }

  return inside;
}

function flattenGeometryPoints(geometry) {
  if (geometry.type === "Polygon") {
    return geometry.coordinates.flat();
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.flat(2);
  }

  return [];
}

module.exports = {
  annotateStoredHotspotsWithNeedRegions,
  findNeedRegionForPoint,
  getStoredNeedRegions,
  importNeedRegionsFromNycOpenData,
};
