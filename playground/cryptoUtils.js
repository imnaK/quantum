// Function to encode a Uint8Array to a Base64 string
function encodeToBase64(uint8Array) {
  const binaryString = String.fromCharCode.apply(null, uint8Array);
  return btoa(binaryString);
}

// Function to decode a Base64 string to a Uint8Array
function decodeFromBase64(base64String) {
  const binaryString = atob(base64String);
  const uint8Array = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    uint8Array[i] = binaryString.charCodeAt(i);
  }
  return uint8Array;
}

// Export the functions
module.exports = {
  encodeToBase64,
  decodeFromBase64,
};
