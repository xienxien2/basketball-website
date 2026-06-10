var KEY = "basketball-library-v1";
var SID = "basket-user";
var AID = "basket-admin";
var route = "home";
var tab = "videos";

function seed() {
  return {
    cats: [
      { id: "c1", name: "运球", desc: "控球节奏与突破基本功" },
      { id: "c2", name: "投篮", desc: "建立稳定高效的投篮动作" },
      { id: "c3", name: "防守", desc: "脚步、站位与实战判断" },
      { id: "c4", name: "体能", desc: "速度、爆发与耐力提升" },
      { id: "c5", name: "进攻技巧", desc: "终结、脚步与个人进攻" },
      { id: "c6", name: "团队战术", desc: "配合、跑位与比赛阅读" },
      { id: "c7", name: "教练专区", desc: "训练设计与执教方法" },
      { id: "c8", name: "青少年训练", desc: "适合初学者的成长课程" }
    ],
    videos: [
      { id: "v1", code: "B001", title: "零基础控球：原地运球", cat: "c1", archive: "2026-06", desc: "从手型、重心到节奏，掌握每天都能练的控球动作。", time: "08:42", fullTime: "42:00", coachBio: "教练员简介待补充", douyinUrl: "", free: true, pub: true },
      { id: "v2", code: "B002", title: "变向突破的三个关键细节", cat: "c1", archive: "2026-06", desc: "学习实战中更有效的变向时机和启动动作。", time: "12:18", fullTime: "50:00", coachBio: "教练员简介待补充", douyinUrl: "", free: true, pub: true }
    ],
    users: [],
    archives: defaultArchives(),
    archiveDefaultsSeeded: true
  };
}

function db() {
  return JSON.parse(localStorage.getItem(KEY) || "null") || seed();
}

function save(x) {
  localStorage.setItem(KEY, JSON.stringify(x));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function esc(s) {
  return String(s || "").replace(/[&<>"']/g, function(c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" }[c];
  });
}

function user(x) {
  return x.users.find(function(u) { return u.id === localStorage.getItem(SID); });
}

function userLabel(u) {
  return u ? (u.email || u.phone || "未填写") : "";
}

function member(u) {
  return u && u.status === "active" && new Date(u.until) > new Date();
}

function cat(x, id) {
  var c = (x.cats || []).find(function(y) { return y.id === id; });
  return c ? c.name : "未分类";
}

function toast(t) {
  var e = document.createElement("div");
  e.className = "toast";
  e.textContent = t;
  document.body.append(e);
  setTimeout(function() { e.remove(); }, 2200);
}

function modal(h) {
  document.getElementById("pop").innerHTML = '<div class="modalbg"><section class="modal">' + h + "</section></div>";
}

function closePop() {
  document.getElementById("pop").innerHTML = "";
}

function fileURL(f) {
  return new Promise(function(ok) {
    var r = new FileReader();
    r.onload = function() { ok(r.result); };
    r.readAsDataURL(f);
  });
}

function archiveId(year, month) {
  return year + "-" + String(month).padStart(2, "0");
}

function defaultArchives() {
  var items = [];
  for (var i = 1; i <= 12; i++) {
    items.push({ id: archiveId(2026, i), year: 2026, month: i, title: "2026年" + i + "月", pub: true });
  }
  return items;
}

function ensureArchives(x) {
  if (!Array.isArray(x.archives)) x.archives = [];
  defaultArchives().forEach(function(item) {
    if (!x.archives.some(function(a) { return a.id === item.id; })) x.archives.push(item);
  });
  x.archiveDefaultsSeeded = true;
  (x.videos || []).forEach(function(v, i) {
    if (!v.archive) v.archive = archiveId(2026, Number(v.month || 6));
    v.month = Number(String(v.archive).slice(5, 7)) || v.month || 6;
    if (!v.code) v.code = "B" + String(i + 1).padStart(3, "0");
    if (!v.fullTime) v.fullTime = v.time || "";
    if (!v.coachBio) v.coachBio = "教练员简介待补充";
    if (!v.douyinUrl) v.douyinUrl = "";
    v.free = true;
  });
  return x;
}

function sortedArchives(x) {
  return ensureArchives(x).archives.slice().sort(function(a, b) {
    return (b.year * 100 + b.month) - (a.year * 100 + a.month);
  });
}

function archiveLabel(a) {
  return a ? (a.title || a.year + "年" + a.month + "月") : "未分类";
}

function archiveName(x, id) {
  var a = ensureArchives(x).archives.find(function(item) { return item.id === id; });
  return archiveLabel(a);
}

function monthOptions(value) {
  var html = "";
  for (var i = 1; i <= 12; i++) {
    html += '<option value="' + i + '" ' + (Number(value) === i ? "selected" : "") + ">" + i + "月</option>";
  }
  return html;
}

function archiveOptions(x, value) {
  return sortedArchives(x).map(function(a) {
    return '<option value="' + a.id + '" ' + (a.id === value ? "selected" : "") + ">" + esc(archiveLabel(a)) + (a.pub === false ? "（隐藏）" : "") + "</option>";
  }).join("");
}

function render() {
  var app = document.getElementById("app");
  if (!app) return;
  if (route === "admin") {
    app.innerHTML = admin(db());
    return;
  }
  if (typeof renderLead === "function") {
    renderLead();
  }
}

function go(r) {
  route = r;
  if (r === "admin") location.hash = "admin";
  render();
}

function adminEntry() {
  if (sessionStorage.getItem(AID)) return go("admin");
  modal('<div class="modalhead"><h3>管理员登录</h3><button class="close" onclick="closePop()">×</button></div><p class="muted">请输入管理员账号密码</p><form class="form" onsubmit="adminLogin(event)"><label>账号<input name="user" value="3190712839"></label><label>密码<input name="pass" type="password"></label><button class="btn">进入后台</button></form>');
}

function adminLogin(e) {
  e.preventDefault();
  var f = new FormData(e.target);
  if (f.get("user") !== "3190712839" || f.get("pass") !== "Zgz20030401@") return toast("账号或密码错误");
  sessionStorage.setItem(AID, "1");
  closePop();
  go("admin");
}

function admin(x) {
  if (!sessionStorage.getItem(AID)) {
    setTimeout(adminEntry);
    return '<section class="section"><div class="box panel"><h2>后台登录</h2><p class="muted">正在打开管理员登录框。</p></div></section>';
  }
  ensureArchives(x);
  save(x);
  return '<div class="admin"><aside><button onclick="tab=\'videos\';render()">课程管理</button><button onclick="tab=\'archives\';render()">年月目录</button><button onclick="tab=\'cats\';render()">训练分类</button><button onclick="tab=\'users\';render()">用户会员</button><button onclick="tab=\'data\';render()">数据备份</button><button onclick="sessionStorage.removeItem(AID);location.hash=\'\';route=\'home\';render()">退出后台</button></aside><div class="content">' + adminBody(x) + "</div></div>";
}

function adminBody(x) {
  ensureArchives(x);
  if (tab === "archives") {
    return '<div class="head"><div><h2>年月目录</h2><p class="muted">用于前台左侧固定目录，例如 2026年1月、2027年1月。</p></div><button class="btn small" onclick="archiveForm()">新增年月</button></div><div class="table"><table><tr><th>年月</th><th>显示状态</th><th>视频数量</th><th>操作</th></tr>' + sortedArchives(x).map(function(a) {
      var n = x.videos.filter(function(v) { return v.archive === a.id; }).length;
      return '<tr><td>' + esc(archiveLabel(a)) + "</td><td>" + (a.pub === false ? "已隐藏" : "显示中") + "</td><td>" + n + '</td><td><button class="act" onclick="archiveForm(\'' + a.id + "')\">编辑</button><button class=\"act\" onclick=\"toggleArchive('" + a.id + "')\">" + (a.pub === false ? "显示" : "隐藏") + '</button><button class="act red" onclick="delArchive(\'' + a.id + "')\">删除</button></td></tr>";
    }).join("") + "</table></div>";
  }
  if (tab === "cats") {
    return '<div class="head"><h2>训练分类</h2><button class="btn small" onclick="addCat()">新增分类</button></div><div class="table"><table>' + x.cats.map(function(c) {
      return "<tr><td>" + esc(c.name) + "</td><td>" + esc(c.desc) + '</td><td><button class="act red" onclick="delCat(\'' + c.id + "')\">删除</button></td></tr>";
    }).join("") + "</table></div>";
  }
  if (tab === "users") {
    return '<h2>用户会员</h2><div class="table"><table><tr><th>邮箱/账号</th><th>状态</th><th>到期</th><th>操作</th></tr>' + (x.users || []).map(function(u) {
      return "<tr><td>" + esc(userLabel(u)) + "</td><td>" + (member(u) ? "有效会员" : "普通用户") + "</td><td>" + (u.until ? new Date(u.until).toLocaleDateString() : "无") + '</td><td><button class="act" onclick="extend(\'' + u.id + "')\">续期30天</button><button class=\"act red\" onclick=\"stop('" + u.id + "')\">取消</button></td></tr>";
    }).join("") + "</table></div>";
  }
  if (tab === "data") {
    return '<div class="head"><div><h2>数据备份</h2><p class="muted">后台数据保存在当前浏览器。部署上线不会自动带走本机浏览器数据，请先导出 JSON。</p></div><button class="btn small" onclick="exportSiteData()">导出数据</button></div>' +
      '<div class="panel"><h3>导出当前后台数据</h3><p class="muted">导出的 JSON 包含训练分类、年月目录、课程片段、用户会员等本地后台数据。把这个文件发给我，我可以把它写进代码并重新部署。</p><button class="btn" onclick="exportSiteData()">下载 JSON 备份</button></div>' +
      '<div class="panel" style="margin-top:16px"><h3>导入 JSON 数据</h3><p class="muted">把之前导出的 JSON 粘贴到下面，可以恢复到当前浏览器后台。</p><textarea id="data-import-box" style="min-height:180px" placeholder="粘贴 basketball-library-data.json 内容"></textarea><div style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap"><button class="btn" onclick="importSiteData()">导入并覆盖当前数据</button><button class="btn alt" onclick="resetSiteData()">恢复代码默认数据</button></div></div>';
  }
  return '<div class="head"><div><h2>课程管理</h2><p class="muted">现在视频片段使用抖音链接，不再上传本地视频文件。</p></div><button class="btn small" onclick="addVideo()">新增课程</button></div><div class="table"><table><tr><th>编号</th><th>课程</th><th>年月</th><th>分类</th><th>完整时间</th><th>抖音链接</th><th>状态</th><th>操作</th></tr>' + x.videos.map(function(v, i) {
    return "<tr><td>" + esc(v.code || ("B" + String(i + 1).padStart(3, "0"))) + "</td><td>" + esc(v.title) + "</td><td>" + esc(archiveName(x, v.archive)) + "</td><td>" + esc(cat(x, v.cat)) + "</td><td>" + esc(v.fullTime || v.time || "未填") + "</td><td>" + (v.douyinUrl ? "已填写" : "未填写") + "</td><td>" + (v.pub ? "已发布" : "未发布") + '</td><td><button class="act" onclick="editVideo(\'' + v.id + "')\">编辑</button><button class=\"act red\" onclick=\"delVideo('" + v.id + "')\">删除</button></td></tr>";
  }).join("") + "</table></div>";
}

function exportSiteData() {
  var data = ensureArchives(db());
  var text = JSON.stringify(data, null, 2);
  var blob = new Blob([text], { type: "application/json;charset=utf-8" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = "basketball-library-data.json";
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(function() { URL.revokeObjectURL(url); }, 500);
  toast("数据已导出");
}

function importSiteData() {
  var box = document.getElementById("data-import-box");
  if (!box || !box.value.trim()) return toast("请先粘贴 JSON 数据");
  try {
    var data = JSON.parse(box.value);
    if (!Array.isArray(data.videos) || !Array.isArray(data.cats)) return toast("JSON 格式不对，缺少 videos 或 cats");
    save(ensureArchives(data));
    toast("数据已导入");
    render();
  } catch (e) {
    toast("JSON 解析失败");
  }
}

function resetSiteData() {
  if (!confirm("确定恢复代码默认数据？当前浏览器后台数据会被覆盖。")) return;
  save(seed());
  toast("已恢复默认数据");
  render();
}

function addCat() {
  var n = prompt("分类名称");
  if (!n) return;
  var x = db();
  x.cats.push({ id: uid(), name: n, desc: prompt("简短介绍") || "" });
  save(x);
  render();
}

function delCat(id) {
  var x = db();
  if (x.videos.some(function(v) { return v.cat === id; })) return toast("请先删除或移动该分类下的视频");
  x.cats = x.cats.filter(function(c) { return c.id !== id; });
  save(x);
  render();
}

function addVideo() {
  videoForm("");
}

function editVideo(id) {
  videoForm(id);
}

function videoForm(id) {
  var x = ensureArchives(db());
  var v = x.videos.find(function(a) { return a.id === id; }) || {};
  modal('<div class="modalhead"><h3>' + (id ? "编辑" : "新增") + '课程片段</h3><button class="close" onclick="closePop()">×</button></div><form class="form" onsubmit="saveVideo(event,\'' + id + "')\">" +
    '<label>课程编号<input name="code" required placeholder="例如 B001" value="' + esc(v.code || "") + '"></label>' +
    '<label>课程标题<input name="title" required value="' + esc(v.title || "") + '"></label>' +
    '<label>更新年月<select name="archive">' + archiveOptions(x, v.archive || archiveId(2026, new Date().getMonth() + 1)) + "</select></label>" +
    '<label>训练分类<select name="cat">' + x.cats.map(function(c) { return '<option value="' + c.id + '" ' + (v.cat === c.id ? "selected" : "") + ">" + esc(c.name) + "</option>"; }).join("") + "</select></label>" +
    '<label>片段时长<input name="time" required placeholder="例如 03:20" value="' + esc(v.time || "10:00") + '"></label>' +
    '<label>完整时间<input name="fullTime" required placeholder="例如 完整版 42:30" value="' + esc(v.fullTime || v.time || "") + '"></label>' +
    '<label>抖音视频链接<input name="douyinUrl" type="url" placeholder="粘贴抖音视频分享链接" value="' + esc(v.douyinUrl || "") + '"></label>' +
    '<label>课程简介<textarea name="desc" required>' + esc(v.desc || "") + "</textarea></label>" +
    '<label>教练员简介<textarea name="coachBio" required placeholder="例如：前职业青年队训练师，擅长控球和投篮细节拆解。">' + esc(v.coachBio || "") + "</textarea></label>" +
    '<label>封面图片 / 展示图片<input name="cover" type="file" accept="image/png,image/jpeg,image/webp"></label>' +
    '<label><span><input name="pub" type="checkbox" ' + (v.pub !== false ? "checked" : "") + "> 发布片段</span></label>" +
    '<p class="muted">用户点击课程后，会看到“打开抖音片段”按钮。完整内容仍引导加微信咨询。</p><button class="btn">保存片段</button></form>');
}

async function saveVideo(e, id) {
  e.preventDefault();
  var x = ensureArchives(db());
  var f = new FormData(e.target);
  var cover = f.get("cover");
  var v = x.videos.find(function(a) { return a.id === id; });
  if (!v) {
    v = { id: uid() };
    x.videos.push(v);
  }
  v.code = String(f.get("code") || "").trim();
  v.title = String(f.get("title") || "").trim();
  v.cat = f.get("cat");
  v.archive = f.get("archive");
  v.month = Number(String(v.archive).slice(5, 7)) || new Date().getMonth() + 1;
  v.time = String(f.get("time") || "").trim();
  v.fullTime = String(f.get("fullTime") || "").trim();
  v.douyinUrl = String(f.get("douyinUrl") || "").trim();
  v.desc = String(f.get("desc") || "").trim();
  v.coachBio = String(f.get("coachBio") || "").trim();
  v.free = true;
  v.pub = f.get("pub") === "on";
  delete v.originalBlob;
  delete v.translatedBlob;
  delete v.blob;
  if (cover && cover.size) v.cover = await fileURL(cover);
  save(x);
  closePop();
  toast("片段已保存");
  render();
}

function delVideo(id) {
  if (!confirm("确定删除这个视频片段吗？")) return;
  var x = db();
  x.videos = x.videos.filter(function(v) { return v.id !== id; });
  save(x);
  render();
}

function archiveForm(id) {
  var x = ensureArchives(db());
  var a = x.archives.find(function(item) { return item.id === id; }) || { year: new Date().getFullYear(), month: new Date().getMonth() + 1, pub: true };
  modal('<div class="modalhead"><h3>' + (id ? "编辑" : "新增") + '年月目录</h3><button class="close" onclick="closePop()">×</button></div><form class="form" onsubmit="saveArchive(event,\'' + (id || "") + "')\">" +
    '<label>年份<input name="year" type="number" min="2020" max="2099" required value="' + a.year + '"></label>' +
    '<label>月份<select name="month">' + monthOptions(a.month) + "</select></label>" +
    '<label>显示名称<input name="title" required value="' + esc(archiveLabel(a)) + '"></label>' +
    '<label><span><input name="pub" type="checkbox" ' + (a.pub !== false ? "checked" : "") + "> 前台显示这个月份</span></label>" +
    '<p class="muted">隐藏后前台左侧目录不会显示，但视频数据仍保留。</p><button class="btn">保存年月</button></form>');
}

function saveArchive(e, id) {
  e.preventDefault();
  var x = ensureArchives(db());
  var f = new FormData(e.target);
  var year = Number(f.get("year"));
  var month = Number(f.get("month"));
  var newId = archiveId(year, month);
  var a = x.archives.find(function(item) { return item.id === id; });
  if (!a && x.archives.some(function(item) { return item.id === newId; })) return toast("这个年月已经存在");
  if (a && id !== newId && x.archives.some(function(item) { return item.id === newId; })) return toast("这个年月已经存在");
  if (!a) {
    a = { id: newId };
    x.archives.push(a);
  }
  var oldId = a.id;
  a.id = newId;
  a.year = year;
  a.month = month;
  a.title = String(f.get("title") || year + "年" + month + "月");
  a.pub = f.get("pub") === "on";
  if (oldId !== newId) x.videos.forEach(function(v) { if (v.archive === oldId) v.archive = newId; });
  save(x);
  closePop();
  toast("年月目录已保存");
  render();
}

function toggleArchive(id) {
  var x = ensureArchives(db());
  var a = x.archives.find(function(item) { return item.id === id; });
  if (!a) return;
  a.pub = a.pub === false;
  save(x);
  render();
}

function delArchive(id) {
  var x = ensureArchives(db());
  if (x.videos.some(function(v) { return v.archive === id; })) return toast("这个月份下还有视频，先移动视频或隐藏该月份");
  if (!confirm("确定删除这个年月目录吗？")) return;
  x.archives = x.archives.filter(function(a) { return a.id !== id; });
  save(x);
  render();
}

function extend(id) {
  var x = db();
  var u = x.users.find(function(a) { return a.id === id; });
  if (!u) return;
  u.status = "active";
  u.until = new Date(Math.max(Date.now(), new Date(u.until || 0).getTime()) + 2592000000).toISOString();
  save(x);
  render();
}

function stop(id) {
  var x = db();
  var u = x.users.find(function(a) { return a.id === id; });
  if (!u) return;
  u.status = "cancelled";
  u.until = null;
  save(x);
  render();
}
