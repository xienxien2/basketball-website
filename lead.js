const WECHAT_ID = "zgz20040401";
const WECHAT_QR = "assets/wechat-qr.jpg";
let leadArchive = "2026-06";
let leadSearch = "";
let leadCat = "all";

function archiveId(year, month) {
  return year + "-" + String(month).padStart(2, "0");
}

function archiveLabel(item) {
  return item.year + "年" + item.month + "月";
}

function defaultArchives() {
  const items = [];
  for (let i = 1; i <= 12; i++) {
    items.push({ id: archiveId(2026, i), year: 2026, month: i, title: "2026年" + i + "月", pub: true });
  }
  return items;
}

function leadEsc(s) {
  return String(s || "").replace(/[&<>"']/g, function(c) {
    return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c];
  });
}

function normalizeLeadData() {
  const x = db();
  if (!Array.isArray(x.archives) || !x.archiveDefaultsSeeded) {
    x.archives = Array.isArray(x.archives) ? x.archives : [];
    defaultArchives().forEach(function(item) {
      if (!x.archives.some(function(a) { return a.id === item.id; })) x.archives.push(item);
    });
    x.archiveDefaultsSeeded = true;
  }

  const months = [6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 12];
  x.videos.forEach(function(v, i) {
    if (!v.archive) v.archive = archiveId(2026, Number(v.month || months[i % months.length]));
    v.month = Number(String(v.archive).slice(5, 7)) || v.month || 6;
    if (!v.code) v.code = "B" + String(i + 1).padStart(3, "0");
    if (!v.fullTime) v.fullTime = v.time || "";
    v.free = true;
    if (!v.coach) v.coach = "篮球训练库";
    if (!v.coachBio) v.coachBio = "教练员简介待补充";
    if (!v.douyinUrl) v.douyinUrl = "";
  });

  const visible = visibleArchives(x);
  if (!visible.some(function(a) { return a.id === leadArchive; }) && visible[0]) leadArchive = visible[0].id;
  save(x);
  return x;
}

function visibleArchives(x) {
  return (x.archives || []).filter(function(a) { return a.pub !== false; }).sort(function(a, b) {
    return (b.year * 100 + b.month) - (a.year * 100 + a.month);
  });
}

function currentArchive(x) {
  return (x.archives || []).find(function(a) { return a.id === leadArchive; }) || visibleArchives(x)[0];
}

function leadCategory(x, id) {
  return cat(x, id);
}

function goLeadHome() {
  leadSearch = "";
  renderLead();
  if (location.hash) {
    setTimeout(function() { scrollToSection(location.hash.slice(1)); }, 0);
  }
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function leadCourseUrl(id) {
  return "course.html?id=" + encodeURIComponent(id);
}

function coachPreview(text) {
  const value = String(text || "教练员简介待补充").trim();
  return value.length > 90 ? value.slice(0, 90) + "..." : value;
}

function renderCategoryNav(x) {
  const target = document.getElementById("category-nav");
  if (!target) return;
  target.innerHTML =
    '<button class="' + (leadCat === "all" ? "active" : "") + '" onclick="chooseLeadCategory(\'all\')">全部方向</button>' +
    x.cats.map(function(c) {
      return '<button class="' + (leadCat === c.id ? "active" : "") + '" onclick="chooseLeadCategory(\'' + c.id + '\')">' + leadEsc(c.name) + '</button>';
    }).join("");
}

function leadCard(x, v) {
  const img = v.cover || v.img || "";
  const archive = (x.archives || []).find(function(a) { return a.id === v.archive; });
  return '<a class="lead-card" href="' + leadCourseUrl(v.id) + '">' +
    '<div class="lead-cover cover-' + v.cat + '">' +
      (img ? '<img src="' + img + '" alt="" onerror="this.remove()">' : "") +
      '<span class="lead-badge">' + leadEsc(archive ? archiveLabel(archive) : "本月") + '</span>' +
      '<span class="lead-play">抖音片段</span>' +
    '</div>' +
    '<div class="lead-card-body">' +
      '<p>' + leadEsc(leadCategory(x, v.cat)) + " · 会员更新</p>" +
      '<h3>' + leadEsc(v.title) + '</h3>' +
      '<div class="lead-meta"><span>编号 ' + leadEsc(v.code || "-") + '</span><span>完整时间 ' + leadEsc(v.fullTime || v.time || "-") + '</span></div>' +
      '<div class="lead-coach"><b>教练简介</b><span>' + leadEsc(coachPreview(v.coachBio)) + '</span><em>点开查看完整教练简介</em></div>' +
      '<small>' + leadEsc(v.desc || "暂无简介") + '</small>' +
      '<strong>' + (v.douyinUrl ? "点开后可看抖音片段" : "待添加抖音链接") + '</strong>' +
    '</div>' +
  '</a>';
}

function archiveVideos(x) {
  const q = leadSearch.trim().toLowerCase();
  return x.videos.filter(function(v) {
    const text = (v.title + v.desc + (v.coachBio || "") + leadCategory(x, v.cat)).toLowerCase();
    return v.pub && v.archive === leadArchive && (leadCat === "all" || v.cat === leadCat) && (!q || text.indexOf(q) >= 0);
  });
}

function archiveSidebar(x) {
  const items = visibleArchives(x);
  return '<aside class="archive-sidebar">' +
    '<div class="archive-sidebar-head"><b>会员月度目录</b><span>按更新时间查看</span></div>' +
    '<div class="archive-price-box"><p>价格筛选</p><b>会员 ¥99/月</b><span>单个视频 ¥29/个</span></div>' +
    '<div class="archive-list">' + items.map(function(a) {
      const count = x.videos.filter(function(v) { return v.pub && v.archive === a.id; }).length;
      return '<button class="' + (a.id === leadArchive ? "active" : "") + '" onclick="chooseLeadArchive(\'' + a.id + '\')">' +
        '<span>' + leadEsc(archiveLabel(a)) + '</span><em>' + count + '条</em>' +
      '</button>';
    }).join("") + '</div>' +
    '<button class="archive-wechat" onclick="showWechat()">加微信获取更新提醒</button>' +
  '</aside>';
}

function renderFixedArchive(x) {
  const target = document.getElementById("fixed-archive");
  if (target) target.innerHTML = archiveSidebar(x);
}

function hideFixedArchive() {
  const target = document.getElementById("fixed-archive");
  if (target) target.innerHTML = "";
  document.body.classList.add("admin-mode");
}

function chooseLeadArchive(id) {
  leadArchive = id;
  renderLead();
  setTimeout(function() { scrollToSection("monthly"); }, 0);
}

function chooseLeadCategory(id) {
  leadCat = id;
  renderLead();
  setTimeout(function() { scrollToSection("clips"); }, 0);
}

function quickSearch(e) {
  e.preventDefault();
  const input = document.getElementById("site-search");
  leadSearch = input ? input.value : "";
  renderLead();
  setTimeout(function() { scrollToSection("monthly"); }, 0);
}

function copyWechat() {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(WECHAT_ID).then(function() { toast("微信号已复制"); });
  } else {
    toast("微信号：" + WECHAT_ID);
  }
}

function showWechat() {
  modal('<div class="modalhead"><div><h3>添加微信咨询完整内容</h3><p class="muted">扫码或复制微信号，获取完整训练视频、字幕版和训练资料。</p></div><button class="close" onclick="closePop()">×</button></div>' +
    '<div class="wechat-modal">' +
      '<img src="' + WECHAT_QR + '" alt="篮球训练库微信二维码">' +
      '<div><p class="muted">微信号</p><h2>' + WECHAT_ID + '</h2><button class="btn" onclick="copyWechat()">复制微信号</button></div>' +
    '</div>');
}

function renderLead() {
  document.body.classList.remove("admin-mode");
  const x = normalizeLeadData();
  renderFixedArchive(x);
  renderCategoryNav(x);
  const archive = currentArchive(x);
  const featured = x.videos.filter(function(v) { return v.pub && (leadCat === "all" || v.cat === leadCat); }).slice(0, 4);
  const current = archiveVideos(x);
  const inlineArchive = '<div class="inline-archive">' + archiveSidebar(x) + '</div>';
  const app = document.getElementById("app");
  app.innerHTML =
    '<section class="lead-hero">' +
      '<div class="box lead-hero-grid">' +
        '<div class="lead-copy">' +
          '<span class="lead-kicker">篮球训练库 · 包月会员更新</span>' +
          '<h1>按月份看更新，<br>训练内容更好找</h1>' +
          '<p>视频按年月归档，会员可以快速找到每个月更新的篮球教学片段。完整视频、字幕版和训练资料请加微信咨询。</p>' +
          '<div class="lead-price-strip"><div><span>包月会员</span><b>¥99/月</b><em>适合长期训练</em></div><div><span>单个视频</span><b>¥29/个</b><em>适合先试一节</em></div></div>' +
          '<div class="lead-actions"><button class="btn lead-cta" onclick="showWechat()">加微信咨询会员内容</button><button class="btn alt" onclick="scrollToSection(\'monthly\')">查看月度目录</button></div>' +
        '</div>' +
        '<aside class="lead-qr-card">' +
          '<img src="' + WECHAT_QR + '" alt="篮球训练库微信二维码">' +
          '<p>微信号</p><h2>' + WECHAT_ID + '</h2>' +
          '<button class="btn" onclick="copyWechat()">复制微信号</button>' +
        '</aside>' +
      '</div>' +
    '</section>' +
    '<section class="lead-section" id="clips"><div class="box"><div class="lead-section-head"><h2>' + (leadCat === "all" ? "精选视频片段" : leadEsc(leadCategory(x, leadCat)) + "训练片段") + '</h2><button onclick="showWechat()">加微信看完整内容</button></div><div class="lead-grid">' + (featured.length ? featured.map(function(v) { return leadCard(x, v); }).join("") : '<div class="lead-empty"><h3>这个方向暂时没有片段</h3><p>可以先切换其他训练方向，或加微信咨询。</p></div>') + '</div></div></section>' +
    '<section class="lead-section lead-muted" id="monthly"><div class="box"><div class="lead-section-head"><h2>每月更新目录</h2><button onclick="showWechat()">咨询价格和会员</button></div>' +
      '<div class="lead-pricing-panel"><div><p>包月会员</p><h3>¥99/月</h3><span>适合每月持续看更新内容</span></div><div><p>单个视频</p><h3>¥29/个</h3><span>适合只想先买某一个片段</span></div><button onclick="showWechat()">加微信咨询购买</button></div>' +
      '<div class="lead-archive-shell">' +
        inlineArchive +
        '<div class="archive-content"><div class="archive-title"><p>当前分类</p><h3>' + leadEsc(archive ? archiveLabel(archive) : "月度内容") + '</h3><span>共 ' + current.length + ' 个视频片段</span></div>' +
          (current.length ? '<div class="lead-grid archive-grid">' + current.map(function(v) { return leadCard(x, v); }).join("") + '</div>' : '<div class="lead-empty"><h3>' + leadEsc(archive ? archiveLabel(archive) : "本月") + '内容准备中</h3><p>这个月份暂时没有发布内容。你可以先加微信获取更新提醒。</p><button class="btn lead-cta" onclick="showWechat()">加微信获取提醒</button></div>') +
        '</div>' +
      '</div></div></section>' +
    '<section class="lead-section" id="directions"><div class="box"><div class="lead-section-head"><h2>训练方向</h2><button onclick="showWechat()">咨询适合你的训练</button></div><div class="lead-directions">' + x.cats.map(function(c) { return '<button onclick="showWechat()"><b>' + leadEsc(c.name) + '</b><span>' + leadEsc(c.desc) + '</span></button>'; }).join("") + '</div></div></section>' +
    '<section class="lead-final"><div class="box lead-final-inner"><h2>想看完整视频和字幕资料？</h2><p>扫码加微信，直接告诉我你想练投篮、运球、防守还是体能。</p><button class="btn lead-cta" onclick="showWechat()">扫码加微信咨询</button></div></section>';
}

if (location.hash === "#admin") {
  hideFixedArchive();
  route = "admin";
  render();
} else {
  renderLead();
}

window.addEventListener("hashchange", function() {
  if (location.hash === "#admin") {
    hideFixedArchive();
    route = "admin";
    render();
  } else {
    route = "home";
    renderLead();
  }
});

