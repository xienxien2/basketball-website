var KEY = "basketball-library-v1";
var SID = "basket-user";

function seed() {
  return {
    cats: [
      { id: "c1", name: "运球", desc: "控球节奏与突破基本功" },
      { id: "c2", name: "投篮", desc: "建立稳定高效的投篮动作" },
      { id: "c3", name: "防守", desc: "脚步、站位与实战判断" },
      { id: "c4", name: "体能", desc: "速度、爆发与耐力提升" }
    ],
    videos: [
      { id: "v1", title: "零基础控球：原地运球", cat: "c1", desc: "从手型、重心到节奏，掌握每天都能练的控球动作。", time: "08:42", free: true, pub: true },
      { id: "v2", title: "变向突破的三个关键细节", cat: "c1", desc: "学习实战中更有效的变向时机和启动动作。", time: "12:18", free: false, pub: true },
      { id: "v3", title: "投篮手型与发力顺序", cat: "c2", desc: "拆解完整投篮链条，让出手更稳定。", time: "10:26", free: true, pub: true },
      { id: "v4", title: "接球投篮脚步训练", cat: "c2", desc: "练习比赛常见场景中的脚步与出手衔接。", time: "14:05", free: false, pub: true },
      { id: "v5", title: "一对一防守站位", cat: "c3", desc: "掌握距离、重心与封堵方向。", time: "11:33", free: false, pub: true },
      { id: "v6", title: "篮球专项热身训练", cat: "c4", desc: "训练前的完整热身流程。", time: "07:15", free: true, pub: true }
    ],
    users: []
  };
}

function db() { return JSON.parse(localStorage.getItem(KEY) || "null") || seed(); }
function save(x) { localStorage.setItem(KEY, JSON.stringify(x)); }
function cat(x, id) { var c = x.cats.find(function(y) { return y.id === id; }); return c ? c.name : "未分类"; }
function user(x) { return x.users.find(function(u) { return u.id === localStorage.getItem(SID); }); }
function member(u) { return u && u.status === "active" && new Date(u.until) > new Date(); }
function esc(s) { return String(s || "").replace(/[&<>"']/g, function(c) { return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]; }); }
function goHome() { location.href = "index.html"; }

function mediaDB() {
  return new Promise(function(ok, bad) {
    var q = indexedDB.open("basketball-media", 1);
    q.onupgradeneeded = function() { q.result.createObjectStore("media"); };
    q.onsuccess = function() { ok(q.result); };
    q.onerror = function() { bad(q.error); };
  });
}

function getMedia(k) {
  return mediaDB().then(function(d) {
    return new Promise(function(ok, bad) {
      var q = d.transaction("media").objectStore("media").get(k);
      q.onsuccess = function() { ok(q.result); };
      q.onerror = function() { bad(q.error); };
    });
  });
}

function ensureCatalog(x) {
  var changed = false;
  [
    ["c5", "进攻技巧", "终结、脚步与个人进攻"],
    ["c6", "团队战术", "配合、跑位与比赛阅读"],
    ["c7", "教练专区", "训练设计与执教方法"],
    ["c8", "青少年训练", "适合初学者的成长课程"]
  ].forEach(function(c) {
    if (!x.cats.some(function(y) { return y.id === c[0]; })) {
      x.cats.push({ id: c[0], name: c[1], desc: c[2] });
      changed = true;
    }
  });
  [
    { id: "v7", title: "篮下终结：弱侧手上篮训练", cat: "c5", desc: "提升对抗后的篮下终结稳定性。", time: "16:20", free: false, pub: true, coach: "张教练", rating: 5 },
    { id: "v8", title: "挡拆进攻基础：阅读防守选择", cat: "c6", desc: "拆解持球人和掩护人的判断要点。", time: "21:45", free: false, pub: true, coach: "李教练", rating: 5 },
    { id: "v9", title: "赛季前体能训练计划", cat: "c4", desc: "建立适合篮球运动的爆发力与耐力。", time: "18:10", free: false, pub: true, coach: "王体能教练", rating: 4 },
    { id: "v10", title: "青少年训练课：基础脚步游戏", cat: "c8", desc: "让初学者在趣味练习中建立动作基础。", time: "13:28", free: true, pub: true, coach: "陈教练", rating: 5 },
    { id: "v11", title: "训练课设计：90 分钟完整模板", cat: "c7", desc: "帮助教练组织更高效的团队训练。", time: "25:30", free: false, pub: true, coach: "教练团队", rating: 5 },
    { id: "v12", title: "外线防守：逼迫持球人走弱侧", cat: "c3", desc: "学习压迫、防突破和协防沟通。", time: "17:36", free: false, pub: true, coach: "刘教练", rating: 4 }
  ].forEach(function(v) {
    if (!x.videos.some(function(y) { return y.id === v.id; })) {
      x.videos.push(v);
      changed = true;
    }
  });
  if (changed) save(x);
}

function courseId() { return new URLSearchParams(location.search).get("id") || ""; }

async function renderCourse() {
  var x = db();
  ensureCatalog(x);
  var v = x.videos.find(function(a) { return a.id === courseId(); });
  var u = user(x);
  var app = document.getElementById("course-app");

  if (!v || !v.pub) {
    app.innerHTML = '<section class="course-detail"><div class="box"><div class="course-alert"><h1>课程不存在或尚未发布</h1><p>请返回课程库重新选择课程。</p><button class="btn" onclick="goHome()">返回课程库</button></div></div></section>';
    return;
  }

  document.title = v.title + " | 篮球训练库";
  var hasVip = member(u);
  var poster = v.cover || v.img || "";
  var originalSrc = "";
  var translatedSrc = "";

  if (v.originalBlob || v.blob) {
    var originalFile = await getMedia(v.originalBlob || v.blob);
    if (originalFile) originalSrc = URL.createObjectURL(originalFile);
  }
  if (v.translatedBlob) {
    var translatedFile = await getMedia(v.translatedBlob);
    if (translatedFile) translatedSrc = URL.createObjectURL(translatedFile);
  }

  var originalPlayer = originalSrc
    ? '<video class="course-video" controls src="' + originalSrc + '"></video>'
    : '<div class="course-placeholder"><b>原版视频</b><span>原版内容永久免费。当前演示课程还没有上传原版视频，可在管理后台添加。</span></div>';

  var translatedPlayer = "";
  if (!hasVip) {
    translatedPlayer = '<div class="course-lock"><h2>字幕翻译版需会员</h2><p>原版视频免费看；会员费收取的是中文字幕翻译、校对和整理服务费。</p><button class="btn orange" onclick="goHome()">¥20 / 月，开通翻译服务会员</button></div>';
  } else if (translatedSrc) {
    translatedPlayer = '<video class="course-video" controls src="' + translatedSrc + '"></video>';
  } else {
    translatedPlayer = '<div class="course-placeholder"><b>字幕翻译版</b><span>你已是会员。该课程的字幕翻译版还没有上传，可在管理后台添加。</span></div>';
  }

  app.innerHTML =
    '<section class="course-detail"><div class="box">' +
    '<div class="course-breadcrumb"><button onclick="goHome()">课程库</button><span>›</span><span>' + esc(cat(x, v.cat)) + '</span></div>' +
    '<div class="course-two-column">' +
    '<div class="version-card"><div class="version-head"><span class="access free">原版免费</span><h2>无翻译原版本</h2><p>所有用户都可以免费观看原始教学视频。</p></div><div class="course-player" style="' + (poster && !originalSrc ? "background-image:url(" + poster + ")" : "") + '">' + originalPlayer + '</div></div>' +
    '<div class="version-card"><div class="version-head"><span class="access">字幕VIP</span><h2>中文字幕翻译版</h2><p>会员费用于翻译、字幕制作、校对和内容整理，不是原视频版权收费。</p></div><div class="course-player ' + (!hasVip ? "locked" : "") + '">' + translatedPlayer + '</div></div>' +
    '</div>' +
    '<aside class="course-info course-info-wide"><span class="access free">原版永久免费</span><span class="access">字幕翻译服务会员</span>' +
    '<h1>' + esc(v.title) + '</h1>' +
    '<p class="muted">主讲：' + esc(v.coach || "训练库教练组") + " · " + esc(v.time) + " · " + esc(cat(x, v.cat)) + '</p>' +
    '<p>' + esc(v.desc) + '</p>' +
    '<p class="translation-notice">声明：本网站会员收取的是课程翻译、字幕制作、字幕校对和学习资料整理服务费；无翻译原版视频保持免费试看/免费观看。</p>' +
    '<div class="course-actions"><button class="btn" onclick="goHome()">返回课程库</button><button class="btn alt" onclick="goHome()">查看更多课程</button></div>' +
    '</aside></div></section>';
}

renderCourse();
