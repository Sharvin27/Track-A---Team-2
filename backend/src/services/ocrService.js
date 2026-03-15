const Tesseract = require("tesseract.js");

async function extractTextFromImage(imageBuffer) {
  try {
    const result = await Tesseract.recognize(imageBuffer, "eng", {
      logger: () => {},
    });

    return {
      text: result?.data?.text || "",
    };
  } catch (error) {
    return {
      text: "",
      error: error instanceof Error ? error.message : "OCR unavailable",
    };
  }
}

module.exports = {
  extractTextFromImage,
};
