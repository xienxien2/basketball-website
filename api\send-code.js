const crypto = require("crypto");

const CODE_TTL_MS = 10 * 60 * 1000;

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function sign(payload, secret) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function makeChallenge(email, code, secret) {
  const expires = Date.now() + CODE_TTL_MS;
  const codeHash = crypto.createHash("sha256").update(`${email}:${code}:${secret}`).digest("hex");
  const payload = Buffer.from(JSON.stringify({ email, codeHash, expires })).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

async function sendEmail(email, code) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "篮球训练库 <onboarding@resend.dev>";

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: "篮球训练库邮箱验证码",
      html: `<p>你的篮球训练库验证码是：</p><p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p><p>验证码 10 分钟内有效。如非本人操作，请忽略这封邮件。</p>`
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Email provider failed: ${text}`);
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  try {
    const { email } = req.body || {};
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return json(res, 400, { error: "请输入正确的邮箱地址" });
    }

    const secret = process.env.AUTH_CODE_SECRET;
    if (!secret) return json(res, 500, { error: "AUTH_CODE_SECRET is not configured" });

    const code = String(crypto.randomInt(100000, 999999));
    const challenge = makeChallenge(normalizedEmail, code, secret);
    await sendEmail(normalizedEmail, code);

    json(res, 200, { ok: true, challenge, message: "验证码已发送到邮箱" });
  } catch (error) {
    json(res, 500, { error: error.message || "发送失败" });
  }
};
