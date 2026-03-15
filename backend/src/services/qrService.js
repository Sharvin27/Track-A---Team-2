const sharp = require("sharp");
const jsQR = require("jsqr");
const { PNG } = require("pngjs");

async function detectQrCode(imageBuffer) {
  try {
    const pngBuffer = await sharp(imageBuffer)
      .rotate()
      .resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();
    const parsed = PNG.sync.read(pngBuffer);
    const decoded = jsQR(
      new Uint8ClampedArray(parsed.data),
      parsed.width,
      parsed.height,
    );

    if (decoded?.data) {
      return {
        detected: true,
        value: decoded.data,
        decodeState: "decoded",
      };
    }

    const raw = await sharp(imageBuffer)
      .rotate()
      .grayscale()
      .resize({ width: 256, height: 256, fit: "inside", withoutEnlargement: true })
      .raw()
      .toBuffer({ resolveWithObject: true });
    const visuallyDetected = hasQrLikePattern(
      raw.data,
      raw.info.width,
      raw.info.height,
    );

    return {
      detected: visuallyDetected,
      value: null,
      decodeState: visuallyDetected ? "detected" : "not_found",
    };
  } catch (error) {
    return {
      detected: false,
      value: null,
      decodeState: "error",
      error: error instanceof Error ? error.message : "QR analysis failed",
    };
  }
}

function hasQrLikePattern(data, width, height) {
  if (!width || !height || !data.length) return false;

  const threshold = Math.round(
    data.reduce((total, value) => total + value, 0) / data.length,
  );
  let rowMatches = 0;
  let columnMatches = 0;

  for (let y = 0; y < height; y += 2) {
    if (scanLineForFinderPattern(getRowBits(data, width, y, threshold))) {
      rowMatches += 1;
      if (rowMatches >= 2) break;
    }
  }

  for (let x = 0; x < width; x += 2) {
    if (scanLineForFinderPattern(getColumnBits(data, width, height, x, threshold))) {
      columnMatches += 1;
      if (columnMatches >= 2) break;
    }
  }

  return rowMatches >= 2 && columnMatches >= 2;
}

function getRowBits(data, width, y, threshold) {
  const bits = [];
  const rowOffset = y * width;

  for (let x = 0; x < width; x += 1) {
    bits.push(data[rowOffset + x] < threshold);
  }

  return bits;
}

function getColumnBits(data, width, height, x, threshold) {
  const bits = [];

  for (let y = 0; y < height; y += 1) {
    bits.push(data[y * width + x] < threshold);
  }

  return bits;
}

function scanLineForFinderPattern(bits) {
  if (!bits.length) return false;

  const runs = [];
  let previous = bits[0];
  let length = 1;

  for (let index = 1; index < bits.length; index += 1) {
    if (bits[index] === previous) {
      length += 1;
      continue;
    }

    runs.push({ dark: previous, length });
    previous = bits[index];
    length = 1;
  }

  runs.push({ dark: previous, length });

  for (let index = 0; index <= runs.length - 5; index += 1) {
    const slice = runs.slice(index, index + 5);
    if (
      slice[0].dark &&
      !slice[1].dark &&
      slice[2].dark &&
      !slice[3].dark &&
      slice[4].dark &&
      looksLikeFinderPattern(slice.map((entry) => entry.length))
    ) {
      return true;
    }
  }

  return false;
}

function looksLikeFinderPattern(lengths) {
  const sideAverage = (lengths[0] + lengths[1] + lengths[3] + lengths[4]) / 4;
  if (sideAverage < 2) return false;

  return (
    isWithinRatio(lengths[0], sideAverage) &&
    isWithinRatio(lengths[1], sideAverage) &&
    isWithinRatio(lengths[3], sideAverage) &&
    isWithinRatio(lengths[4], sideAverage) &&
    isWithinRatio(lengths[2], sideAverage * 3, 1.25)
  );
}

function isWithinRatio(value, expected, toleranceMultiplier = 0.8) {
  return Math.abs(value - expected) <= expected * toleranceMultiplier;
}

module.exports = {
  detectQrCode,
};
