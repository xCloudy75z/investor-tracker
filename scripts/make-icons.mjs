import sharp from "sharp";

// Render the green portfolio favicon.svg to the PNG sizes iOS/Android need.
// Flattened onto the dark-green so there is no transparency (iOS rounds it itself;
// transparent corners would otherwise show as black on the home screen).
const src = "public/favicon.svg";
const out = [
  ["public/apple-touch-icon.png", 180],
  ["public/icon-192.png", 192],
  ["public/icon-512.png", 512],
];

for (const [file, size] of out) {
  await sharp(src, { density: 512 })
    .resize(size, size)
    .flatten({ background: "#1d5a36" })
    .png()
    .toFile(file);
  console.log("wrote", file, size + "px");
}
