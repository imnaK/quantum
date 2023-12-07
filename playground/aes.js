async function doit() {
  // Example using AES-GCM for symmetric encryption and decryption
  async function encryptMessage(message, key) {
    const encodedMessage = new TextEncoder().encode(message);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    console.log("iv", iv);

    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encodedMessage
    );

    return { encryptedData: new Uint8Array(encryptedBuffer), iv };
  }

  async function decryptMessage(encryptedData, iv, key) {
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encryptedData
    );

    return new TextDecoder().decode(decryptedBuffer);
  }

  // Example usage:
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  console.log("key", key);

  const message = "Hello, encryption!";
  const { encryptedData, iv } = await encryptMessage(message, key);
  console.log("encryptedData", encryptedData);
  const decryptedMessage = await decryptMessage(encryptedData, iv, key);

  console.log("Original message:", message);
  console.log("En- then Decrypted message:", decryptedMessage);
}

doit();
