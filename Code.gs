/**
 * Quiz Game — Leaderboard backend (4 subjects)
 * ផ្ទាំងខាងក្រោយសម្រាប់តារាងពិន្ទុ (៤ មុខវិជ្ជា)
 *
 * HOW TO UPDATE / របៀបធ្វើបច្ចុប្បន្នភាព:
 *   1. Open your Google Sheet → Extensions → Apps Script.
 *   2. Select all the old code, delete it, paste this file in, Save.
 *   3. Deploy → Manage deployments → edit (pencil) → Version: New version → Deploy.
 *      (Keep the SAME deployment so your /exec URL does not change.)
 *
 * Old rows without a Subject column are treated as "cyber" automatically.
 */

var SHEET_NAME     = 'Scores';
var EXPECTED_TOTAL = 10;     // must match CHALLENGE_N in index.html
var MIN_SECONDS    = 5;
var MAX_SECONDS    = 7200;
var MAX_NAME       = 20;
var CACHE_SECONDS  = 60;

var SUBJECTS = { cyber: 'Cybersecurity', se: 'Software Engineering', ap: 'Advance Programming', net: 'Networking' };
var SUBJECT_IDS = ['cyber', 'se', 'ap', 'net'];
var DEFAULT_SUBJECT = 'cyber';

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(['Timestamp', 'Name', 'Score', 'Total', 'Seconds', 'Percent', 'Subject']);
    sh.setFrozenRows(1);
  }
  return sh;
}

function cleanName_(s) {
  return String(s == null ? '' : s)
    .replace(/[<>]/g, '').replace(/[\r\n\t]/g, ' ')
    .replace(/\s+/g, ' ').trim().slice(0, MAX_NAME);
}

function cleanSubject_(s) {
  var v = String(s == null ? '' : s).trim().toLowerCase();
  return SUBJECTS[v] ? v : DEFAULT_SUBJECT;
}

/** All valid rows, normalised. */
function rows_(sh) {
  var last = sh.getLastRow();
  if (last < 2) return [];
  var vals = sh.getRange(2, 1, last - 1, 7).getValues();
  var out = [];
  for (var i = 0; i < vals.length; i++) {
    var name  = cleanName_(vals[i][1]);
    var score = Number(vals[i][2]);
    var total = Number(vals[i][3]);
    var secs  = Number(vals[i][4]);
    var subj  = cleanSubject_(vals[i][6]);
    if (!name || !total || isNaN(score) || isNaN(secs)) continue;
    if (score < 0 || score > total) continue;
    out.push({ name: name, score: score, total: total, seconds: secs, subject: subj });
  }
  return out;
}

/** Best attempt per player for one subject. */
function bestForSubject_(all, subject) {
  var map = {};
  for (var i = 0; i < all.length; i++) {
    var r = all[i];
    if (r.subject !== subject) continue;
    var key = r.name.toLowerCase();
    var cur = map[key];
    if (!cur || r.score > cur.score || (r.score === cur.score && r.seconds < cur.seconds)) {
      map[key] = { name: r.name, score: r.score, total: r.total, seconds: r.seconds };
    }
  }
  var list = [];
  for (var k in map) list.push(map[k]);
  list.sort(function (a, b) { return (b.score - a.score) || (a.seconds - b.seconds); });
  return list;
}

/** Combined board: best per subject summed, out of 4 x EXPECTED_TOTAL. */
function overall_(all) {
  var per = {};
  for (var s = 0; s < SUBJECT_IDS.length; s++) {
    var sid = SUBJECT_IDS[s];
    var list = bestForSubject_(all, sid);
    for (var i = 0; i < list.length; i++) {
      var key = list[i].name.toLowerCase();
      if (!per[key]) per[key] = { name: list[i].name, score: 0, seconds: 0, done: 0 };
      per[key].score   += list[i].score;
      per[key].seconds += list[i].seconds;
      per[key].done    += 1;
    }
  }
  var out = [];
  for (var k in per) {
    out.push({
      name: per[k].name, score: per[k].score,
      total: EXPECTED_TOTAL * SUBJECT_IDS.length,
      seconds: per[k].seconds, done: per[k].done, subjects: SUBJECT_IDS.length
    });
  }
  out.sort(function (a, b) { return (b.score - a.score) || (a.seconds - b.seconds); });
  return out;
}

function clearCache_() {
  try {
    var c = CacheService.getScriptCache();
    var keys = ['b_overall'];
    for (var i = 0; i < SUBJECT_IDS.length; i++) keys.push('b_' + SUBJECT_IDS[i]);
    c.removeAll(keys);
  } catch (e) {}
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var d = JSON.parse(e.postData.contents);
    var name    = cleanName_(d.name);
    var subject = String(d.subject == null ? '' : d.subject).trim().toLowerCase();
    var score   = Math.round(Number(d.score));
    var total   = Math.round(Number(d.total));
    var secs    = Math.round(Number(d.seconds));

    if (name.length < 2)            return json_({ ok: false, error: 'ឈ្មោះខ្លីពេក' });
    if (!SUBJECTS[subject])         return json_({ ok: false, error: 'មុខវិជ្ជាមិនត្រឹមត្រូវ' });
    if (total !== EXPECTED_TOTAL)   return json_({ ok: false, error: 'ចំនួនសំណួរមិនត្រឹមត្រូវ' });
    if (isNaN(score) || score < 0 || score > total)
                                    return json_({ ok: false, error: 'ពិន្ទុមិនត្រឹមត្រូវ' });
    if (isNaN(secs) || secs < MIN_SECONDS || secs > MAX_SECONDS)
                                    return json_({ ok: false, error: 'ពេលវេលាមិនត្រឹមត្រូវ' });

    lock.waitLock(15000);
    var sh = sheet_();
    sh.appendRow([new Date(), name, score, total, secs, Math.round(score / total * 100), subject]);
    SpreadsheetApp.flush();
    clearCache_();

    var all = rows_(sh);
    var list = bestForSubject_(all, subject);
    var key = name.toLowerCase();
    var rank = list.length;
    for (var i = 0; i < list.length; i++) {
      if (list[i].name.toLowerCase() === key) { rank = i + 1; break; }
    }
    var ov = overall_(all);
    var orank = ov.length;
    for (var j = 0; j < ov.length; j++) {
      if (ov[j].name.toLowerCase() === key) { orank = j + 1; break; }
    }
    return json_({ ok: true, rank: rank, players: list.length, overallRank: orank });

  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}

function doGet(e) {
  try {
    var p = (e && e.parameter) ? e.parameter : {};
    var top = Number(p.top);
    if (isNaN(top) || top < 1) top = 50;
    top = Math.min(top, 200);

    var isOverall = String(p.board || '') === 'overall';
    var subject = cleanSubject_(p.subject);
    var cacheKey = isOverall ? 'b_overall' : ('b_' + subject);

    var cache = null, hit = null;
    try { cache = CacheService.getScriptCache(); hit = cache.get(cacheKey); } catch (e1) {}
    var list;
    if (hit) {
      list = JSON.parse(hit);
    } else {
      var all = rows_(sheet_());
      list = isOverall ? overall_(all) : bestForSubject_(all, subject);
      try { if (cache) cache.put(cacheKey, JSON.stringify(list), CACHE_SECONDS); } catch (e2) {}
    }
    return json_({ ok: true, board: isOverall ? 'overall' : subject, rows: list.slice(0, top) });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}
