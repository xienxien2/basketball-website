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

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  try {
    const { email, code, challenge } = req.body || {};
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const secret = process.env.AUTH_CODE_SECRET;
    if (!secret) return json(res, 500, { error: "AUTH_CODE_SECRET is not configured" });
    if (!challenge || !challenge.includes(".")) return json(res, 400, { error: "请先发送验证码" });

    const [payload, signature] = challenge.split(".");
    const expectedSignature = sign(payload, secret);
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return json(res, 400, { error: "验证码凭证无效" });
    }

    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (Date.now() > data.expires) return json(res, 400, { error: "验证码已过期，请重新发送" });
    if (data.email !== normalizedEmail) return json(res, 400, { error: "邮箱和验证码不匹配" });

    const enteredHash = codeHash(normalizedEmail, String(code || ""), secret);
    if (!crypto.timingSafeEqual(Buffer.from(data.codeHash), Buffer.from(enteredHash))) {
      return json(res, 400, { error: "验证码错误" });
    }

    json(res, 200, { ok: true });
  } catch (error) {
    json(res, 500, { error: error.message || "验证失败" });
  }
};
