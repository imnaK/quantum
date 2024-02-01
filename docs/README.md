<h1 align="center">
  <img src="../assets/img/quantum-color.svg" alt="Quantum logo" width="160px">
  <br />
  Quantum
</h1>

<p align="center">
  Quantum is a Better Discord plugin offering enhanced privacy through message encryption. <br />
  <b>Disclaimer</b>: Please note that while this messaging system offers enhanced security measures, it does not provide absolute security. We also cannot be held responsible for any misuse of this software or any consequences resulting from its use.
</p>

<p align="center">
  <a href="../../../releases/latest"><img alt="Current Version" src="https://img.shields.io/github/package-json/version/imnak/quantum"></a>
  &nbsp;
  <a href="../LICENSE"><img alt="GitHub License" src="https://img.shields.io/github/license/imnak/quantum"></a>
  &nbsp;
  <a href="https://betterdiscord.app/"><img alt="BetterDiscord" src="https://img.shields.io/badge/Better-Discord-gray?labelColor=%234C83E8"></a>
</p>

<h5 align="center">
  <a href="#prerequisites">Prerequisites</a>
  &nbsp;‒&nbsp;
  <a href="#getting-started">Getting started</a>
  &nbsp;‒&nbsp;
  <a href="#build">Build</a>
  &nbsp;‒&nbsp;
  <a href="#features">Features</a>
  &nbsp;‒&nbsp;
  <a href="#usage">Usage</a>
</h5>

## Is this safe?

As mentioned above, this plugin serves as an additional layer of security rather than an absolute safeguard. It facilitates secure encryption and decryption of messages and keys across different channels. However, it's important to note that there are no fail-safes like 2FA or similar measures in place.

## What cryptography techniques do we use?

All encryption methods employed in this project utilize widely recognized and trusted libraries. We opted against the risky endeavor of developing proprietary cryptography algorithms. For transparency, you can review the libraries and packages used in our project  [here](../package.json).

For messages we use the [XChaCha20-Poly1305](https://en.wikipedia.org/wiki/ChaCha20-Poly1305) encryption technique. It uses a 256-bit (32-byte) key and a 192-bit nonce. XChaCha20 is a variant of the ChaCha20 stream cipher, designed for high-speed secure encryption. Poly1305 is a cryptographic message authentication code (MAC) used alongside to ensure data integrity and authenticity.<br />
For secure key exchange between channels, we use the [Ed25519](https://www.cryptopp.com/wiki/Ed25519) signature scheme.

## Prerequisites

- [git](https://git-scm.com/downloads) | or clone this repo via GitHub
- [Node.js & npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) | or any other node package manager and js runtime
- [BetterDiscord](https://betterdiscord.app)

## Getting started

Clone the project:

```bash
git clone https://github.com/imnaK/quantum.git
```

Go to the project directory:

```bash
cd ./quantum
```

Install dependencies:

```bash
npm install
```

Currently the secret key is still imported at build time, so a corresponding json file with the 32 byte key must be created:

```bash
node -e "require('fs').writeFileSync('.secret.json',JSON.stringify({key:require('crypto').randomBytes(32).toString('hex')}));"
```

<b>Disclaimer</b>: Please note that anyone possessing the secret key has the ability to decrypt the messages!

## Build

Build the project:

```bash
npm run build
```

Build a production ready minified file:

```bash
npm run build:production
```

The corresponding file `build\Quantum.plugin.js` or `build\Quantum.min.plugin.js` will be created.

Afterwards, the plugin will be automatically copied to the BetterDiscord plugin directory.

### Additional Tools

Format using the [project standard](../.prettierrc)
.
```bash
npm run format
```

## Features

As this project continues to evolve, it's possible that some features listed here may be pending development. Rest assured, they are on their way.

- **Message Encryption and Decryption:**
  - Implement encryption and decryption mechanisms for messages exchanged in direct message chats.
  - Ensure that sensitive information remains protected during transmission and storage on Discord.
  - Continuously enhance security measures, acknowledging our ongoing investigation into potential vulnerabilities, such as transmissions to Discord during typing.
- **Key Exchange:**
  - Establish a method for securely exchanging encryption keys between users in direct message chats.
- **Key Storage in "quantum" Directory:**
  - Store encryption keys per user account in a directory named "quantum."
  - Ensure that the "quantum" directory is located as a sibling to the plugins directory.
  - Implement security measures to protect keys stored in the "quantum" directory.

## Usage

When you launch Quantum for the first time, a popup will appear, prompting you to enter a master password. This password protects your chat encryption keys, ensuring their security. You'll need to enter this password each time you restart Discord, Quantum, or switch between accounts. While the encrypted file is highly secure and resistant to brute force attacks, it's crucial to choose a strong password for added protection.

### Message encryption and decryption

If you want to en-/decrypt messages in a direct message chat you first need to exchange a key:
> The procedure for the key exchange is still in development. Check back later too see if *this* line of text is gone. :)

After a key is exchanged you can use the prefix `q:` to write encrypted messages and decrypt them by right clicking -> "Decrypt Message".<br />
Example:

<p align="center">
  <img src="../assets/img/quantum-usage.gif" alt="Usage GIF">
</p>

## Contribution Guidelines

At this point of development there is not much of contributing to this project. If you still have interest in contributing, contact us on our [Discord](https://discord.gg/gjpCnjx7mN).

## License
This software is licensed under the [GPL v3](https://www.gnu.org/licenses/gpl-3.0.en.html#license-text) license included [here](../LICENSE).
