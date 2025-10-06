const fs = require("fs");
const crypto = require("crypto");
const nacl = require("tweetnacl");
const {buildPoseidon} = require("circomlibjs"); //This circomlibjs exports buildPoseidon function

//Helper function to hash metadata using SHA-256
function sha256Hash(bufferOrString) {
    return crypto.createHash('sha256').update(bufferOrString).digest('hex');
}

//Converts Hexadecimal String to BigInt safely, as poseidon can work only with BigInt
function hexToBigInt(hexString) {
    if(hexString.startsWith('0x')) hexString = hexString.slice(2);
    if(hexString === '') return BigInt(0);
    return BigInt('0x' + hexString);
}

//Converts BigInt to Hexadecimal String safely
function bigIntToHexNoPrefix(bigInt) {
    let hex = bigInt.toString(16);
    if(hex.length % 2) hex = '0' + hex; //Ensure even length
    return hex;
}

//Converts Hexadecimal String to Uint8Array safely
function hexToUint8Array(hexString) {
    if(hexString.startsWith('0x')) hexString = hexString.slice(2);
    if(hexString.length % 2) hexString = '0' + hexString; //Ensure even length
    const len = hexString.length/2;
    const u8 = new Uint8Array(len);
    for(let i=0; i<len; i++) {
        u8[i] = parseInt(hexString.slice(i*2, i*2+2), 16);
    }
    return u8;
}

async function commitAndSign(photoPath, meta){
    //reads photo
    const imgBytes = fs.readFileSync(photoPath);
    //Hashes image and the metadata
    const imgHashHex = sha256Hash(imgBytes);
    const metaHashHex = sha256Hash(JSON.stringify(meta));
    
    //Build poseidon hash function
    const poseidon = await buildPoseidon();
    
    //Poseidon commitment
    const commitment = poseidon([hexToBigInt(imgHashHex),hexToBigInt(metaHashHex)]);
    const commitmentHex = commitment.toString(16);
    //Generate Ed25519 KeyPair (in production and IRL, load securely from storage !)
    const seed = crypto.randomBytes(32);
    const KeyPair = nacl.sign.keyPair.fromSeed(seed);
    //sign Commitment
    const commitmentBytes = hexToUint8Array(commitmentHex);
    const signature = nacl.sign.detached(commitmentBytes, KeyPair.secretKey);

    return{
        commitmentHex,
        signatureHex: Buffer.from(signature).toString("hex"),
        publicKeyHex: Buffer.from(KeyPair.publicKey).toString("hex"),
        imgHashHex,
        metaHashHex,
    };
}
module.exports = { commitAndSign };
