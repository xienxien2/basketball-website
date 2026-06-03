const crypto = require("crypto");

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function sign(payload, secret) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function codeHash(email, code, secret) {
  return crypto.createHash("sha256").update(`${email}:${code}:${secret}`).digest("hex");
}

function readBody(req) {
  if (req.body && typeof req.body === "object") return Promise.resolve(req.body);
  if (typeof req.body === "string") return Promise.resolve(JSON.parse(req.body || "{}"));
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", chunk => { raw += chunk; });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(new Error("Invalid request JSON"));
      }
    });
    req.on("error", reject);
  });
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  try {
    const { email, code, challenge } = await readBody(req);
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const secret = process.env.AUTH_CODE_SECRET;
    if (!secret) return json(res, 500, { error: "AUTH_CODE_SECRET is not configured" });
    if (!challenge || !challenge.includes(".")) return json(res, 400, { error: "Please send a verification code first" });

    const [payload, signature] = challenge.split(".");
    const expectedSignature = sign(payload, secret);
    if (!safeEqual(signature, expectedSignature)) {
      return json(res, 400, { error: "Invalid verification challenge" });
    }

    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (Date.now() > data.expires) return json(res, 400, { error: "Verification code expired, please send a new one" });
    if (data.email !== normalizedEmail) return json(res, 400, { error: "Email does not match verification challenge" });

    const enteredHash = codeHash(normalizedEmail, String(code || ""), secret);
    if (!safeEqual(data.codeHash, enteredHash)) {
      return json(res, 400, { error: "Incorrect verification code" });
    }

    json(res, 200, { ok: true });
  } catch (error) {
    json(res, 500, { error: error.message || "Verification failed" });
  }
};
