const { encodeToBase64, decodeFromBase64 } = require("./cryptoUtils");

// Example usage
async function example() {
  // Generate a random key
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  // Export the key
  const exportedKey = await crypto.subtle.exportKey("raw", key);

  // Convert the key to a Base64-encoded string
  const base64Key = encodeToBase64(new Uint8Array(exportedKey));

  console.log("Generated random key (Base64):", base64Key);

  // Decode the Base64 string back to a Uint8Array
  const decodedKey = decodeFromBase64(base64Key);

  console.log("Decoded key:", decodedKey);
}

// Run the example
example();
