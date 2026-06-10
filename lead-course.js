const LEAD_WECHAT_ID = "zgz20040401";
const LEAD_WECHAT_QR = "assets/wechat-qr.jpg";
const COURSE_KEY = "basketball-library-v1";

function courseBundledSeed() {
  if (!window.BASKETBALL_SITE_DATA) return null;
  return JSON.parse(JSON.stringify(window.BASKETBALL_SITE_DATA));
}

function courseBundledVersion() {
  return window.BASKETBALL_SITE_DATA && window.BASKETBALL_SITE_DATA.dataVersion;
}

function courseSeed() {
  var bundled = courseBundledSeed();
  if (bundled) return bundled;

  return {
    cats: [
      { id: "c1", name: "运球", desc: "控球节奏与突破基本功" },
      { id: "c2", name: "投篮", desc: "建立稳定高效的投篮动作" },
      { id: "c3", name: "防守", desc: "脚步、站位与实战判断" },
      { id: "c4", name: "体能", desc: "速度、爆发与耐力提升" }
    ],
    videos: [],
    users: []
  };
}

function db() {
  var stored = JSON.parse(localStorage.getItem(COURSE_KEY) || "null");
  var version = courseBundledVersion();
  if (version && (!stored || stored.dataVersion !== version)) {
    stored = courseSeed();
    save(stored);
  }
  return stored || courseSeed();
}

function save(x) {
  localStorage.setItem(COURSE_KEY, JSON.stringify(x));
}

function esc(s) {
  return String(s || "").replace(/[&<>"']/g, function(c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" }[c];
  });
}

function leadCourseId() {
  return new URLSearchParams(location.search).get("id") || "";
}

function leadArchiveId(year, month) {
  return year + "-" + String(month).padStart(2, "0");
}

function leadArchiveLabel(x, v) {
  var a = (x.archives || []).find(function(item) { return item.id === v.archive; });
  if (a) return a.year + "年" + a.month + "月更新";
  return "2026年" + (v.month || 6) + "月更新";
}

function leadCourseCategory(x, id) {
  var c = (x.cats || []).find(function(item) { return item.id === id; });
  return c ? c.name : "训练片段";
}

function ensureLeadCourseData(x) {
  if (!Array.isArray(x.archives) || !x.archiveDefaultsSeeded) {
    x.archives = Array.isArray(x.archives) ? x.archives : [];
    for (var m = 1; m <= 12; m++) {
      var id = leadArchiveId(2026, m);
      if (!x.archives.some(function(a) { return a.id === id; })) {
        x.archives.push({ id: id, year: 2026, month: m, title: "2026年" + m + "月", pub: true });
      }
    }
    x.archiveDefaultsSeeded = true;
  }

  const months = [6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 12];
  x.videos.forEach(function(v, i) {
    if (!v.archive) v.archive = leadArchiveId(2026, Number(v.month || months[i % months.length]));
    if (!v.month) v.month = Number(String(v.archive).slice(5, 7)) || months[i % months.length];
    if (!v.code) v.code = "B" + String(i + 1).padStart(3, "0");
    if (!v.fullTime) v.fullTime = v.time || "";
    if (!v.coachBio) v.coachBio = "教练员简介待补充";
    if (!v.douyinUrl) v.douyinUrl = "";
    v.free = true;
  });
  save(x);
}

function copyWechat() {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(LEAD_WECHAT_ID).then(function() { alert("微信号已复制"); });
  } else {
    alert("微信号：" + LEAD_WECHAT_ID);
  }
}

function showWechat() {
  document.getElementById("pop").innerHTML =
    '<div class="modalbg"><section class="modal"><div class="modalhead"><div><h3>添加微信咨询完整内容</h3><p class="muted">扫码或复制微信号，获取完整训练视频、字幕版和训练资料。</p></div><button class="close" onclick="closePop()">×</button></div>' +
    '<div class="wechat-modal"><img src="' + LEAD_WECHAT_QR + '" alt="篮球训练库微信二维码"><div><p class="muted">微信号</p><h2>' + LEAD_WECHAT_ID + '</h2><button class="btn" onclick="copyWechat()">复制微信号</button></div></div></section></div>';
}

function closePop() {
  document.getElementById("pop").innerHTML = "";
}

async function renderLeadCourse() {
  const x = db();
  ensureLeadCourseData(x);
  const v = x.videos.find(function(item) { return item.id === leadCourseId(); });
  const app = document.getElementById("course-app");
  if (!v || !v.pub) {
    app.innerHTML = '<section class="course-detail"><div class="box"><div class="course-alert"><h1>片段不存在或尚未发布</h1><p>请返回首页重新选择。</p><button class="btn" onclick="location.href=\'index.html\'">返回首页</button></div></div></section>';
    return;
  }

  document.title = v.title + " | 篮球训练库";
  const poster = v.cover || v.img || "";
  const archiveText = leadArchiveLabel(x, v);
  const player = v.douyinUrl
    ? '<div class="course-placeholder douyin-panel"><b>抖音视频片段</b><span>点击按钮跳转到抖音查看公开视频片段。</span><a class="btn lead-cta douyin-link" href="' + esc(v.douyinUrl) + '" target="_blank" rel="noopener">打开抖音片段</a></div>'
    : '<div class="course-placeholder douyin-panel"><b>抖音链接待添加</b><span>后台编辑这个课程，填写抖音视频链接后即可跳转观看。</span></div>';

  app.innerHTML =
    '<section class="course-detail lead-course-detail"><div class="box">' +
      '<div class="course-breadcrumb"><button onclick="location.href=\'index.html\'">片段库</button><span>/</span><span>' + archiveText + '</span></div>' +
      '<div class="lead-course-grid">' +
        '<div class="version-card">' +
          '<div class="version-head">' +
            '<span class="access free">' + archiveText + '</span>' +
            '<h1>' + esc(v.title) + '</h1>' +
            '<div class="course-meta-row">' +
              '<span>编号 ' + esc(v.code || "-") + '</span>' +
              '<span>' + esc(leadCourseCategory(x, v.cat)) + '</span>' +
              '<span>片段 ' + esc(v.time || "-") + '</span>' +
              '<span>完整时间 ' + esc(v.fullTime || v.time || "-") + '</span>' +
            '</div>' +
            '<p>' + esc(v.desc || "暂无简介") + '</p>' +
            '<div class="course-coach-box"><h3>教练员简介</h3><p>' + esc(v.coachBio || "教练员简介待补充") + '</p></div>' +
          '</div>' +
          '<div class="course-player" style="' + (poster ? "background-image:url(" + poster + ")" : "") + '">' + player + '</div>' +
        '</div>' +
        '<aside class="lead-contact-panel"><img src="' + LEAD_WECHAT_QR + '" alt="篮球训练库微信二维码"><h2>加微信看完整内容</h2><p>微信号：<b>' + LEAD_WECHAT_ID + '</b></p><p>抖音展示公开视频片段，完整内容、字幕版和训练资料请加微信咨询。</p><button class="btn lead-cta" onclick="copyWechat()">复制微信号</button></aside>' +
      '</div>' +
    '</div></section>';
}

renderLeadCourse();
