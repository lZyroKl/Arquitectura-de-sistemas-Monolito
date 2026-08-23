const fs = require("fs");
const path = require("path");

const USD_TO_CLP = 950;

function generateSizes() {
  const allSizes = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"];
  const count = 5 + Math.floor(Math.random() * 4);
  const start = Math.floor(Math.random() * (allSizes.length - count));
  return allSizes.slice(start, start + count);
}

function generateStock() {
  return 5 + Math.floor(Math.random() * 40);
}

function processProducts() {
  console.log("🔍 Processing verified sneaker database...\n");

  const inputPath = path.join(__dirname, "..", "backend", "sneaks_data_verified.json");
  const rawData = fs.readFileSync(inputPath, "utf-8");
  const SNEAKER_DATABASE = JSON.parse(rawData);

  const products = SNEAKER_DATABASE.map((sneaker) => {
    return {
      name: sneaker.name,
      brand: sneaker.brand,
      category: sneaker.category,
      price: Math.round(sneaker.price_usd * USD_TO_CLP),
      price_usd: sneaker.price_usd,
      description: sneaker.description,
      image_url: sneaker.image_url,
      stock: generateStock(),
      sizes: generateSizes(),
      style_id: sneaker.styleID,
      colorway: sneaker.colorway,
      release_date: "2023-01-01",
      resell_links: {
        stockX: "https://stockx.com/search?s=" + encodeURIComponent(sneaker.name),
        goat: "https://www.goat.com/search?query=" + encodeURIComponent(sneaker.name),
        flightClub: "https://www.flightclub.com/search?query=" + encodeURIComponent(sneaker.name),
      },
    };
  });

  const brandCounts = {};
  const categoryCounts = {};
  for (const p of products) {
    brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1;
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  }

  const outputPath = path.join(__dirname, "..", "backend", "sneaks_data.json");
  fs.writeFileSync(outputPath, JSON.stringify(products, null, 2), "utf-8");
  console.log("✅ " + products.length + " verified products saved successfully!");
}

processProducts();
