ZK-Camera — Postman Requests (with Bodies)

Base URL

http://localhost:4000

1️⃣ Upload Image → Create Commitment
Request
Field	Value
Method	POST
URL	/upload
Body Type	form-data
Body (form-data)
Key	Type	Value
photo	File	(select image file)
state	Text	Odisha
Expected Response
{
  "commitment": "3502653511876195594517180122372520840841480382488044849811243937781203720806"
}


📌 Save this commitment — used in all next requests.

2️⃣ Generate ZK Proof (Verifier Query)
Request
Field	Value
Method	POST
URL	/prove/query
Body Type	raw → JSON
Body (JSON)
{
  "commitment": "3502653511876195594517180122372520840841480382488044849811243937781203720806",
  "minTimestamp": 1200000000,
  "maxTimestamp": 1770071160,
  "expectedState": 19
}


📌 Notes:

minTimestamp, maxTimestamp → UNIX (seconds, UTC)

expectedState → integer code

Odisha = 19

Karnataka = 11

Himachal Pradesh = 9

Expected Response
{
  "success": true,
  "proof": {
    "pi_a": [...],
    "pi_b": [...],
    "pi_c": [...],
    "protocol": "groth16",
    "curve": "bn128"
  },
  "publicSignals": ["1"]
}

Meaning

"1" → authentic and satisfies query

"0" → authentic, but query false

3️⃣ Verify Proof (Final Check)
Request
Field	Value
Method	POST
URL	/verify/query
Body Type	raw → JSON
Body (JSON)
{
  "proof": {
    "pi_a": [...],
    "pi_b": [...],
    "pi_c": [...],
    "protocol": "groth16",
    "curve": "bn128"
  },
  "publicSignals": ["1"]
}


(Use the exact response from /prove/query)

Expected Responses
✅ Valid + Query True
{
  "valid": true
}

✅ Valid + Query False
{
  "valid": false
}

Invalid / Tampered Proof
{
  "error": "Invalid proof / proof not authentic"
}

Negative Test Bodies (Optional)
Wrong State (should return valid: false)
{
  "commitment": "3502653511876195594517180122372520840841480382488044849811243937781203720806",
  "minTimestamp": 1200000000,
  "maxTimestamp": 1770071160,
  "expectedState": 1
}

Random Commitment (should error)
{
  "commitment": "123456789",
  "minTimestamp": 1200000000,
  "maxTimestamp": 1770071160,
  "expectedState": 19
}

Minimal Flow Reminder
/upload        → get commitment
/prove/query  → get proof + publicSignals
/verify/query → get final boolean