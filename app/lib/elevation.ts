import { fromUrl, type GeoTIFF, type GeoTIFFImage } from "geotiff";

const DEM_SOURCE_URL = "/usgs_dem_10m_oahu_29e8_fb74_0930.tif";
const COORDINATE_PRECISION = 5;
const MIN_ELEVATION_DELTA_METERS = 0.01;

type GeoReference = {
  originX: number;
  originY: number;
  pixelScaleX: number;
  pixelScaleY: number;
  width: number;
  height: number;
  noDataValue?: number;
};

let tiffPromise: Promise<GeoTIFF> | null = null;
let imagePromise: Promise<GeoTIFFImage> | null = null;
let geoReferencePromise: Promise<GeoReference> | null = null;

const elevationCache = new Map<string, number | null>();

async function loadGeoTiff(): Promise<GeoTIFF> {
  if (tiffPromise) {
    return tiffPromise;
  }

  tiffPromise = fromUrl(DEM_SOURCE_URL);
  return tiffPromise;
}

async function loadImage(): Promise<GeoTIFFImage> {
  if (imagePromise) {
    return imagePromise;
  }

  imagePromise = loadGeoTiff().then((tiff) => tiff.getImage());
  return imagePromise;
}

async function resolveGeoReference(): Promise<GeoReference> {
  if (geoReferencePromise) {
    return geoReferencePromise;
  }

  geoReferencePromise = loadImage().then((image) => {
    const fileDirectory = image.getFileDirectory();
    const pixelScale = fileDirectory.ModelPixelScale;
    const tiePoints = fileDirectory.ModelTiepoint;

    if (!pixelScale || pixelScale.length < 2 || !tiePoints || tiePoints.length < 6) {
      throw new Error("Elevation data is missing required georeference metadata.");
    }

    const [pixelScaleX, pixelScaleY] = pixelScale;
    const originX = tiePoints[3];
    const originY = tiePoints[4];

    const noDataValueRaw = image.getGDALNoData();
    const noDataValue =
      typeof noDataValueRaw === "string"
        ? Number.parseFloat(noDataValueRaw)
        : typeof noDataValueRaw === "number"
          ? noDataValueRaw
          : undefined;

    return {
      originX,
      originY,
      pixelScaleX,
      pixelScaleY,
      width: image.getWidth(),
      height: image.getHeight(),
      noDataValue: Number.isFinite(noDataValue) ? noDataValue : undefined,
    };
  });

  return geoReferencePromise;
}

function roundCoordinate(value: number): number {
  const factor = 10 ** COORDINATE_PRECISION;
  return Math.round(value * factor) / factor;
}

function buildCacheKey(lat: number, lng: number): string {
  return `${roundCoordinate(lat)},${roundCoordinate(lng)}`;
}

type RasterArray =
  | Float32Array
  | Float64Array
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | number[];

async function readElevationSample(
  image: GeoTIFFImage,
  x: number,
  y: number,
): Promise<number | null> {
  const rawSample = (await image.readRasters({
    window: [x, y, x + 1, y + 1],
    width: 1,
    height: 1,
    samples: [0],
  })) as RasterArray[] | RasterArray | undefined;

  const dataArray = (Array.isArray(rawSample) ? rawSample[0] : rawSample) as RasterArray | undefined;

  if (!dataArray || dataArray.length === 0) {
    return null;
  }

  const value = dataArray[0];

  if (!Number.isFinite(value)) {
    return null;
  }

  if (Math.abs(value) <= MIN_ELEVATION_DELTA_METERS) {
    return 0;
  }

  return value as number;
}

/**
 * Load and cache the elevation model so the first lookup is faster for future calls.
 */
export async function preloadElevationModel(): Promise<void> {
  await resolveGeoReference();
}

/**
 * Returns elevation in meters for the provided latitude and longitude.
 * Falls back to null when the coordinate is outside of the DEM bounds or undefined.
 */
export async function getElevationMeters(lat: number, lng: number): Promise<number | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  const cacheKey = buildCacheKey(lat, lng);
  if (elevationCache.has(cacheKey)) {
    return elevationCache.get(cacheKey) ?? null;
  }

  if (typeof window === "undefined") {
    // Server-side rendering should not attempt to fetch elevation data.
    return null;
  }

  try {
    const [image, geoReference] = await Promise.all([loadImage(), resolveGeoReference()]);
    const { originX, originY, pixelScaleX, pixelScaleY, width, height, noDataValue } =
      geoReference;

    const rasterX = Math.floor((lng - originX) / pixelScaleX);
    const rasterY = Math.floor((originY - lat) / pixelScaleY);

    if (Number.isNaN(rasterX) || Number.isNaN(rasterY)) {
      elevationCache.set(cacheKey, null);
      return null;
    }

    if (rasterX < 0 || rasterX >= width || rasterY < 0 || rasterY >= height) {
      elevationCache.set(cacheKey, null);
      return null;
    }

    const elevation = await readElevationSample(image, rasterX, rasterY);

    if (elevation == null) {
      elevationCache.set(cacheKey, null);
      return null;
    }

    if (noDataValue !== undefined && Math.abs(elevation - noDataValue) <= MIN_ELEVATION_DELTA_METERS) {
      elevationCache.set(cacheKey, null);
      return null;
    }

    elevationCache.set(cacheKey, elevation);
    return elevation;
  } catch (error) {
    console.error("Failed to lookup elevation", error);
    elevationCache.set(cacheKey, null);
    return null;
  }
}

export function clearElevationCache(): void {
  elevationCache.clear();
}
