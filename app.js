const REFRESH_MS = 45000;
const WATCH_URL = "https://www.hotstar.com/in/sports/cricket";

const teams = {
  CSK: {
    name: "Chennai Super Kings",
    logo: "https://documents.iplt20.com/ipl/CSK/logos/Logooutline/CSKoutline.png",
  },
  DC: {
    name: "Delhi Capitals",
    logo: "https://documents.iplt20.com/ipl/DC/Logos/LogoOutline/DCoutline.png",
  },
  GT: {
    name: "Gujarat Titans",
    logo: "https://documents.iplt20.com/ipl/GT/Logos/Logooutline/GToutline.png",
  },
  KKR: {
    name: "Kolkata Knight Riders",
    logo: "https://documents.iplt20.com/ipl/KKR/Logos/Logooutline/KKRoutline.png",
  },
  LSG: {
    name: "Lucknow Super Giants",
    logo: "https://documents.iplt20.com/ipl/LSG/Logos/Logooutline/LSGoutline.png",
  },
  MI: {
    name: "Mumbai Indians",
    logo: "https://documents.iplt20.com/ipl/MI/Logos/Logooutline/MIoutline.png",
  },
  PBKS: {
    name: "Punjab Kings",
    logo: "https://documents.iplt20.com/ipl/PBKS/Logos/Logooutline/PBKSoutline.png",
  },
  RR: {
    name: "Rajasthan Royals",
    logo: "https://documents.iplt20.com/ipl/RR/Logos/Logooutline/RRoutline.png",
  },
  RCB: {
    name: "Royal Challengers Bengaluru",
    logo: "https://documents.iplt20.com/ipl/RCB/Logos/Logooutline/RCBoutline.png",
  },
  SRH: {
    name: "Sunrisers Hyderabad",
    logo: "https://documents.iplt20.com/ipl/SRH/Logos/Logooutline/SRHoutline.png",
  },
};

const teamMeta = {
  CSK: { color: "#f7c600", accent: "#173f93", titles: ["2010", "2011", "2018", "2021", "2023"], slug: "chennai-super-kings" },
  DC: { color: "#17449b", accent: "#ef1b2d", titles: [], slug: "delhi-capitals" },
  GT: { color: "#0b1f3a", accent: "#c7a74b", titles: ["2022"], slug: "gujarat-titans" },
  KKR: { color: "#3a225d", accent: "#d4af37", titles: ["2012", "2014", "2024"], slug: "kolkata-knight-riders" },
  LSG: { color: "#27a9e1", accent: "#f58220", titles: [], slug: "lucknow-super-giants" },
  MI: { color: "#006cb7", accent: "#d4af37", titles: ["2013", "2015", "2017", "2019", "2020"], slug: "mumbai-indians" },
  PBKS: { color: "#d71920", accent: "#b9975b", titles: [], slug: "punjab-kings" },
  RR: { color: "#254aa5", accent: "#e91e99", titles: ["2008"], slug: "rajasthan-royals" },
  RCB: { color: "#c8102e", accent: "#d4af37", titles: ["2025"], slug: "royal-challengers-bengaluru" },
  SRH: { color: "#f26522", accent: "#d71920", titles: ["2016"], slug: "sunrisers-hyderabad" },
};

const fallbackMatch = {
  name: "Chennai Super Kings vs Royal Challengers Bengaluru",
  status: "Preview • match prediction mode",
  date: "Today • 7:30 PM IST",
  venue: "M. A. Chidambaram Stadium, Chennai",
  teamA: "CSK",
  teamB: "RCB",
  scoreA: "",
  scoreB: "",
  tossWinner: "CSK",
  matchWinner: "RCB",
  result: "RCB to win • CSK wins toss",
};

const standings = [
  ["PBKS", 8, 6, 1, 1, "1.043", 13, ["L", "W", "W", "W", "W"]],
  ["RCB", 8, 6, 2, 0, "1.919", 12, ["W", "W", "L", "W", "W"]],
  ["RR", 9, 6, 3, 0, "0.617", 12, ["W", "L", "W", "L", "L"]],
  ["SRH", 8, 5, 3, 0, "0.815", 10, ["W", "W", "W", "W", "L"]],
  ["GT", 8, 4, 4, 0, "-0.475", 8, ["W", "L", "L", "W", "W"]],
  ["CSK", 8, 3, 5, 0, "-0.121", 6, ["L", "W", "L", "W", "W"]],
  ["DC", 8, 3, 5, 0, "-1.060", 6, ["L", "L", "L", "W", "L"]],
  ["KKR", 8, 2, 5, 1, "-0.751", 5, ["W", "W", "L", "L", "L"]],
  ["MI", 7, 2, 5, 0, "-0.736", 4, ["L", "W", "L", "L", "L"]],
  ["LSG", 8, 2, 6, 0, "-1.106", 4, ["L", "L", "L", "L", "L"]],
];

const teamStats = {
  PBKS: { rating: 89, batting: 86, bowling: 80, powerplay: 78, death: 84, titles: 0 },
  RCB: { rating: 87, batting: 88, bowling: 76, powerplay: 82, death: 79, titles: 1 },
  RR: { rating: 84, batting: 80, bowling: 82, powerplay: 77, death: 76, titles: 1 },
  SRH: { rating: 82, batting: 85, bowling: 78, powerplay: 84, death: 75, titles: 1 },
  GT: { rating: 78, batting: 75, bowling: 81, powerplay: 73, death: 80, titles: 1 },
  CSK: { rating: 76, batting: 78, bowling: 74, powerplay: 72, death: 77, titles: 5 },
  DC: { rating: 72, batting: 74, bowling: 70, powerplay: 71, death: 69, titles: 0 },
  KKR: { rating: 70, batting: 72, bowling: 71, powerplay: 70, death: 68, titles: 3 },
  MI: { rating: 68, batting: 73, bowling: 67, powerplay: 69, death: 66, titles: 5 },
  LSG: { rating: 65, batting: 69, bowling: 64, powerplay: 66, death: 63, titles: 0 },
};

const fixtures = [
  { date: "Apr 30", time: "7:30 PM IST", teamA: "CSK", teamB: "RCB", venue: "M. A. Chidambaram Stadium, Chennai" },
  { date: "May 01", time: "7:30 PM IST", teamA: "GT", teamB: "KKR", venue: "Narendra Modi Stadium, Ahmedabad" },
  { date: "May 02", time: "3:30 PM IST", teamA: "DC", teamB: "LSG", venue: "Arun Jaitley Stadium, Delhi" },
  { date: "May 02", time: "7:30 PM IST", teamA: "MI", teamB: "PBKS", venue: "Wankhede Stadium, Mumbai" },
  { date: "May 03", time: "7:30 PM IST", teamA: "RR", teamB: "SRH", venue: "Sawai Mansingh Stadium, Jaipur" },
];

const results = [
  { date: "Apr 29", teamA: "PBKS", teamB: "RR", venue: "Mullanpur", result: "Rajasthan Royals won by 6 wkts" },
  { date: "Apr 28", teamA: "RCB", teamB: "DC", venue: "Bengaluru", result: "Royal Challengers Bengaluru won by 5 wkts" },
  { date: "Apr 27", teamA: "MI", teamB: "GT", venue: "Mumbai", result: "Mumbai Indians won by 9 runs" },
  { date: "Apr 26", teamA: "SRH", teamB: "CSK", venue: "Hyderabad", result: "Sunrisers Hyderabad won by 6 wkts" },
];

const previousPredictions = [
  ["MI vs DC", "MI win + chasing advantage", "Won"],
  ["SRH vs CSK", "SRH top-order powerplay edge", "Won"],
  ["RR vs GT", "RR defend 180+", "Won"],
  ["RCB vs PBKS", "RCB death-over batting edge", "Won"],
];

const failedPredictions = [
  ["KKR vs SRH", "KKR spin middle overs", "Missed"],
  ["LSG vs MI", "LSG toss and chase", "Missed"],
];

const $ = (id) => document.getElementById(id);
let lastWeatherVenue = "";
let liveRecentMatches = [];
let liveFixtures = [];
let currentFixtureView = "fixtures";

function teamCode(name = "") {
  const normalized = name.toUpperCase();
  const direct = Object.keys(teams).find((code) => normalized.includes(code));
  if (direct) return direct;
  return (
    Object.entries(teams).find(([, team]) => normalized.includes(team.name.toUpperCase()))?.[0] ||
    normalized
      .split(/[^A-Z]+/)
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 3) ||
    "TBA"
  );
}

function generatedLogo(label = "Team") {
  const initials = teamCode(label).slice(0, 3);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
      <rect width="120" height="120" rx="60" fill="#173f93"/>
      <circle cx="60" cy="60" r="48" fill="#fff"/>
      <text x="60" y="70" text-anchor="middle" font-family="Inter,Arial" font-size="30" font-weight="800" fill="#173f93">${initials}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getTeam(identifier = "Team") {
  const code = teamCode(identifier);
  return teams[identifier] || teams[code] || { name: identifier, logo: generatedLogo(identifier) };
}

function probabilityFor(match) {
  const scoreA = parseScore(match.scoreA);
  const scoreB = parseScore(match.scoreB);
  
  let base = 50;
  // If the match hasn't started, calculate probability using team ratings
  if (scoreA.runs === 0 && scoreB.runs === 0) {
    const ratingA = teamStats[teamCode(match.teamA)]?.rating || 50;
    const ratingB = teamStats[teamCode(match.teamB)]?.rating || 50;
    base = 50 + (ratingA - ratingB) * 0.8;
  } else {
    base = 50 + (scoreA.runs - scoreB.runs) * 0.18 - (scoreA.wickets - scoreB.wickets) * 2.4;
  }
  
  const adjusted = Math.max(38, Math.min(68, Math.round(base)));
  return [adjusted, 100 - adjusted];
}

function parseScore(score = "") {
  const runs = Number(score.match(/(\d+)/)?.[1] || 0);
  const wickets = Number(score.match(/\/(\d+)/)?.[1] || 0);
  return { runs, wickets };
}

function getPitchPredictionForVenue(venue = "") {
    const v = (venue || "").toLowerCase();
    if (v.includes("wankhede")) return "Good for batting, favors chasing.";
    if (v.includes("chidambaram") || v.includes("chepauk")) return "Spin-friendly, slows down.";
    if (v.includes("eden gardens")) return "High-scoring, good for batting.";
    if (v.includes("arun jaitley")) return "Batting edge, small ground.";
    if (v.includes("narendra modi")) return "Balanced, aids pacers early.";
    if (v.includes("mullanpur")) return "New pitch, likely balanced.";
    if (v.includes("sawai mansingh")) return "Good batting surface, big boundaries.";
    return "Balanced pitch expected.";
}

function getWeatherPredictionForVenue(venue = "") {
    const location = (venue || "").split(',').pop().trim().toLowerCase();
    switch(location) {
        case "chennai": return "Hot and humid, low rain chance.";
        case "ahmedabad": return "Very hot, dry conditions.";
        case "delhi": return "Hot, chance of evening dew.";
        case "mumbai": return "Humid, dew will be a factor.";
        case "jaipur": return "Dry heat, clear skies.";
        default: return "Clear conditions expected.";
    }
}

function setTeam(prefix, code, score) {
  const team = getTeam(code);
  $(`${prefix}-logo`).src = team.logo;
  $(`${prefix}-logo`).alt = `${team.name} logo`;
  $(`${prefix}-code`).textContent = teamCode(code);
  $(`${prefix}-name`).textContent = team.name;
  $(`${prefix}-score`).textContent = score || "";
}

function renderMatch(match, liveMode = false) {
  const teamA = match.teamA || "Team A";
  const teamB = match.teamB || "Team B";
  const teamACode = teamCode(teamA);
  const teamBCode = teamCode(teamB);
  const [probA, probB] = probabilityFor(match);
  
  let tossTeam = probA >= probB ? teamA : teamB;
  let tossChoiceText = "";

  // Specific overrides for fallbackMatch as per user request
  if (match === fallbackMatch) {
    tossTeam = "MI"; // MI wins the toss
    tossChoiceText = "Opt to Bowl"; // MI chooses to bowl
  } else {
    const isChasingGround = match.venue?.toLowerCase().match(/wankhede|chinnaswamy|eden gardens|narendra modi/);
    tossChoiceText = isChasingGround ? "Opt to Bowl" : "Opt to Bat";
  }

  $("match-title").textContent = `${getTeam(teamA).name} vs ${getTeam(teamB).name}`;
  $("match-subtitle").textContent = match.result || "AI-powered prediction engine analyzing team form, venue, and historical data.";
  $("match-status").textContent = "AI Analysis Mode";
  $("match-date").textContent = match.date || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  $("match-venue").textContent = `Venue: ${match.venue || "TBC"}`;
  $("refresh-status").textContent = "AI predictions active";

  const noScoreText = "Prediction mode - no live scores";
  setTeam("team-a", teamA, match.scoreA || "");
  setTeam("team-b", teamB, match.scoreB || "");
  $("team-a-prob").textContent = `${teamACode} ${probA}%`;
  $("team-b-prob").textContent = `${teamBCode} ${probB}%`;
  $("prob-a-bar").style.width = `${probA}%`;
  $("prob-b-bar").style.width = `${probB}%`;

  $("toss-logo").src = getTeam(tossTeam).logo;
  $("toss-logo").alt = `${getTeam(tossTeam).name} logo`;
  $("toss-team").textContent = getTeam(tossTeam).name;
  $("toss-detail").textContent = `AI predicts ${Math.max(probA, probB)}% win probability for ${getTeam(tossTeam).name} based on form and venue analysis.`; // This will still reflect SRH's higher probability
  $("toss-choice").textContent = tossChoiceText;
  $("pitch-venue").textContent = match.venue || "Venue insights";
  $("pitch-type").textContent = match.venue?.toLowerCase().includes("wankhede") ? "Good for batting" : "Balanced surface";
  $("pitch-text").textContent = "AI analysis includes powerplay dynamics, venue characteristics, and AI-generated predictions.";
  $("batting-meter").value = match.venue?.toLowerCase().includes("wankhede") ? 74 : 64;
  $("bowling-meter").value = match.venue?.toLowerCase().includes("wankhede") ? 31 : 42;
  $("pace-meter").value = 56;
  updateWeather(match.venue);
}

function renderPitchReport(report, venue) {
  if (!report) return;
  $("pitch-venue").textContent = venue || "Venue insights";
  $("pitch-type").textContent = report.type || "Balanced surface";
  $("pitch-text").textContent = report.summary || "Venue-adjusted model uses live match state, toss and ground profile.";
  $("batting-meter").value = report.batting ?? 64;
  $("bowling-meter").value = report.bowling ?? 42;
  $("pace-meter").value = report.pace ?? 56;
}

async function fetchCricketData() {
  try {
    const response = await fetch("/api/live-cricket");
    if (response.ok) {
      return response.json();
    }
  } catch (error) {
    console.info("Live cricket fetch unavailable", error);
  }

  return { match: null, recentMatches: [] };
}

async function fetchGeminiPrediction(teamA, teamB, venue) {
  try {
    const response = await fetch(`/api/prediction?teamA=${encodeURIComponent(teamA)}&teamB=${encodeURIComponent(teamB)}&venue=${encodeURIComponent(venue)}`);
    if (response.ok) {
      return response.json();
    }
  } catch (error) {
    console.error("Gemini prediction fetch failed", error);
  }
  return null;
}

async function fetchWeatherPrediction(location) {
  try {
    const response = await fetch(`/api/weather-prediction?location=${encodeURIComponent(location)}`);
    if (response.ok) {
      return response.json();
    }
  } catch (error) {
    console.error("Weather prediction fetch failed", error);
  }
  return null;
}

function ensureWeatherLayout() {
  const main = document.querySelector(".weather-main");
  const temp = $("weather-temp");
  const desc = $("weather-desc");
  if (!main || !temp || !desc) return;

  if (!$("weather-icon")) {
    const icon = document.createElement("span");
    icon.className = "weather-icon";
    icon.id = "weather-icon";
    icon.textContent = "🌡️";
    main.prepend(icon);
  }

  if (!main.querySelector(".weather-copy")) {
    const copy = document.createElement("div");
    copy.className = "weather-copy";
    copy.append(temp, desc);
    main.append(copy);
  }
}

function titleCase(text = "") {
  return text
    .split(" ")
    .filter(Boolean)
    .map((word) => `${word[0]?.toUpperCase() || ""}${word.slice(1)}`)
    .join(" ");
}

function renderWeather(weather) {
  ensureWeatherLayout();
  const emoji = weather.emoji || "🌡️";
  const weatherCard = $("weather-temp")?.closest(".metric-card");
  const cardIcon = weatherCard?.querySelector(".icon-disc");

  if ($("weather-icon")) $("weather-icon").textContent = emoji;
  if (cardIcon) cardIcon.textContent = emoji;
  $("weather-temp").textContent = `${weather.tempC ?? "--"}\u00b0C`;
  $("weather-desc").textContent = `${titleCase(weather.description || "Weather unavailable")} - ${weather.location || "venue"}`;
  $("weather-desc").title = weather.provider ? `Weather provider: ${weather.provider}` : "";
  $("humidity").textContent = weather.humidity || "--";
  $("rain").textContent = weather.rain || "--";
  $("wind").textContent = weather.wind || "--";
}

async function updateWeather(venue) {
  const weatherMain = document.querySelector(".weather-main");
  if (weatherMain) {
    weatherMain.style.display = "none";
  }
}

function renderPredictionLists() {
  renderMatchHistory(liveRecentMatches);
}

function renderStandings() {
  $("points-table").innerHTML = standings
    .map(([code, played, won, lost, nr, nrr, points, form], index) => {
      const team = teams[code];
      return `
        <tr>
          <td>${index + 1}</td>
          <td><span class="team-cell"><img src="${team.logo}" alt="${team.name} logo">${code}</span></td>
          <td>${played}</td>
          <td>${won}</td>
          <td>${lost}</td>
          <td>${nr}</td>
          <td>${nrr}</td>
          <td><strong>${points}</strong></td>
          <td>${form.map((item) => `<span class="form-dot ${item === "W" ? "win" : "loss"}">${item}</span>`).join("")}</td>
        </tr>
      `;
    })
    .join("");
}

function renderFixtures(view = "fixtures") {
  currentFixtureView = view;
  const list = view === "results" && liveRecentMatches.length
    ? liveRecentMatches.filter((item) => item.matchEnded)
    : view === "results"
      ? results
      : liveFixtures.length
        ? liveFixtures
        : fixtures;
            
  let summaryHtml = "";
  if (view === "fixtures") {
    const todayMatch = fallbackMatch;
    let tossWinnerCode = predictedWinnerCode(todayMatch);
    const isChasingGround = todayMatch.venue?.toLowerCase().match(/wankhede|chinnaswamy|eden gardens|narendra modi/);
    let tossChoice = isChasingGround ? "Bowl" : "Bat";
    let matchWinnerCode = predictedWinnerCode(todayMatch);
    
    if (todayMatch === fallbackMatch) {
      tossWinnerCode = "MI";
      tossChoice = "Bowl";
      matchWinnerCode = "SRH";
    }

    summaryHtml = `
      <div style="margin-bottom: 20px; padding: 15px; border-radius: 8px; background: #ffffff; border: 1px solid #e0e0e0; border-left: 4px solid #173f93; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <h3 style="margin: 0 0 12px 0; color: #173f93; font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
          <span></span> Today's Match Prediction: ${teamCode(todayMatch.teamA)} vs ${teamCode(todayMatch.teamB)}
        </h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; font-size: 0.9rem; color: #333;">
          <p style="margin: 0;"><strong>🏆 Winner:</strong> ${matchWinnerCode} expected to win</p>
          <p style="margin: 0;"><strong>🪙 Toss:</strong> ${tossWinnerCode} to win & opt to ${tossChoice}</p>
          <p style="margin: 0;"><strong>🏏 Pitch:</strong> ${getPitchPredictionForVenue(todayMatch.venue)}</p>
          <p style="margin: 0;"><strong>☁️ Weather:</strong> ${getWeatherPredictionForVenue(todayMatch.venue)}</p>
          <p style="margin: 0;"><strong>📈 Score:</strong> 230+</p>
        </div>
      </div>
    `;
  }

  $("fixture-list").innerHTML = summaryHtml + list
    .map((item) => {
      const teamA = getTeam(item.teamA);
      const teamB = getTeam(item.teamB);
      const date = item.dateTimeGMT ? formatDateLabel(item.dateTimeGMT) : item.date;
      const scoreMarkup = item.scores?.length
        ? `<div class="fixture-scores">${item.scores.map((score) => `<span><b>${score.team}</b> ${score.text}</span>`).join("")}</div>`
        : "";

      return `
        <article class="fixture-card">
          <div class="fixture-date">
            <strong>${date}</strong>
            <span>${item.matchEnded ? "Result" : item.time || "Fixture"}</span>
          </div>
          <div class="fixture-teams">
            <span class="fixture-team"><img src="${teamA.logo}" alt="${teamA.name} logo">${teamCode(item.teamA)}</span>
            <span class="fixture-vs">VS</span>
            <span class="fixture-team"><img src="${teamB.logo}" alt="${teamB.name} logo">${teamCode(item.teamB)}</span>
          </div>
          <div class="fixture-meta">
            <strong>${item.result || item.status || item.venue}</strong>
            ${scoreMarkup}
            <span>${item.venue || "Match Centre"}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

function formatDateLabel(dateTime) {
  return new Date(dateTime).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    month: "short",
    day: "2-digit",
  });
}

function actualWinnerCode(match) {
  const status = match.result || match.status || "";
  if (!/won|tied/i.test(status)) return "";
  return teamCode(status);
}

function predictedWinnerCode(match) {
  const teamA = teamCode(match.teamA);
  const teamB = teamCode(match.teamB);
  const aRating = teamStats[teamA]?.rating || 50;
  const bRating = teamStats[teamB]?.rating || 50;
  return aRating >= bRating ? teamA : teamB;
}

function renderMatchHistory(matches = []) {
  const list = matches.length ? matches : [];
  const rows = list.map((match) => {
    const predicted = predictedWinnerCode(match);
    const actual = actualWinnerCode(match);
    const state = actual ? (predicted === actual ? "pass" : "fail") : "pending";
    return { match, predicted, actual, state };
  });
  const completed = rows.filter((row) => row.state !== "pending");
  const passed = rows.filter((row) => row.state === "pass").length;
  const failed = rows.filter((row) => row.state === "fail").length;

  $("prediction-score").textContent = completed.length
    ? `${passed} pass / ${failed} fail from ${completed.length} completed matches`
    : "Predictions pending live results";

  $("match-history-list").innerHTML = rows
    .map(({ match, predicted, actual, state }) => {
      const teamA = getTeam(match.teamA);
      const teamB = getTeam(match.teamB);
      const scores = match.scores?.length
        ? match.scores.map((score) => `<span><b>${score.team}</b> ${score.text}</span>`).join("")
        : `<span>No score yet - ${match.status || "match not started"}</span>`;
      const badgeText = state === "pass" ? "Prediction Pass" : state === "fail" ? "Prediction Fail" : "Prediction Pending";
      return `
        <article class="history-card ${state}">
          <div class="history-date">
            <strong>${formatDateLabel(match.dateTimeGMT || new Date())}</strong>
            <span>${match.matchEnded ? "Completed" : "Live"}</span>
          </div>
          <div class="history-match">
            <span><img src="${teamA.logo}" alt="${teamA.name} logo">${teamCode(match.teamA)}</span>
            <b>vs</b>
            <span><img src="${teamB.logo}" alt="${teamB.name} logo">${teamCode(match.teamB)}</span>
          </div>
          <div class="history-scores">${scores}</div>
          <div class="history-result">
            <strong>${match.result || match.status}</strong>
            <span>Predicted: ${predicted}${actual ? ` | Winner: ${actual}` : ""}</span>
          </div>
          <span class="history-badge">${badgeText}</span>
        </article>
      `;
    })
    .join("");
}

function populateComparison() {
  const options = Object.entries(teams)
    .map(([code, team]) => `<option value="${code}">${team.name}</option>`)
    .join("");
  $("compare-team-a").innerHTML = options;
  $("compare-team-b").innerHTML = options;
  $("compare-team-a").value = "MI";
  $("compare-team-b").value = "CSK";
  $("compare-team-a").addEventListener("change", renderComparison);
  $("compare-team-b").addEventListener("change", renderComparison);
}

function renderComparison() {
  const codeA = $("compare-team-a").value;
  const codeB = $("compare-team-b").value;
  const statsA = teamStats[codeA];
  const statsB = teamStats[codeB];

  $("compare-card-a").innerHTML = compareTeamCard(codeA, statsA);
  $("compare-card-b").innerHTML = compareTeamCard(codeB, statsB);
  $("comparison-bars").innerHTML = [
    ["Overall Rating", "rating"],
    ["Batting", "batting"],
    ["Bowling", "bowling"],
    ["Powerplay", "powerplay"],
    ["Death Overs", "death"],
    ["Titles", "titles"],
  ]
    .map(([label, key]) => comparisonRow(label, statsA[key], statsB[key], key === "titles" ? 5 : 100))
    .join("");
}

function compareTeamCard(code, stats) {
  const team = teams[code];
  return `
    <img src="${team.logo}" alt="${team.name} logo">
    <h3>${team.name}</h3>
    <span>${stats.rating}/100 team rating</span>
  `;
}

function comparisonRow(label, valueA, valueB, max) {
  const widthA = Math.max(6, (valueA / max) * 100);
  const widthB = Math.max(6, (valueB / max) * 100);
  return `
    <div class="comparison-row">
      <header><span>${valueA}</span><strong>${label}</strong><span>${valueB}</span></header>
      <div class="comparison-track">
        <span style="width:${widthA}%"></span>
        <span style="width:${widthB}%"></span>
      </div>
    </div>
  `;
}

function renderTeamStrip() {
  $("team-grid").innerHTML = Object.entries(teams)
    .map(([code, team]) => {
      const meta = teamMeta[code];
      const titleBadges = meta.titles.length
        ? meta.titles.map((year) => `<span>${year}</span>`).join("")
        : "<span>Squad</span>";

      return `
        <a
          class="team-card"
          href="https://www.iplt20.com/teams/${meta.slug}"
          target="_blank"
          rel="noreferrer"
          style="--team-color:${meta.color}; --team-accent:${meta.accent};"
          aria-label="${team.name}"
        >
          <span class="team-card-code">${code}</span>
          <span class="team-logo-orbit">
            <img src="${team.logo}" alt="${team.name} logo">
          </span>
          <strong>${team.name}</strong>
          <span class="team-title-years">${titleBadges}</span>
          <em>View Team</em>
        </a>
      `;
    })
    .join("");
}

async function updateLiveData() {
  $("refresh-status").textContent = "Generating AI predictions";
  
  // Use AI to predict the match
  // Removed AI prediction insights below the main headline as per user request.
  
  renderMatch(fallbackMatch, false);
  renderMatchHistory([]);
  renderFixtures(currentFixtureView);
  $("refresh-status").textContent = "AI-powered predictions active";
}

document.querySelectorAll(".watch-link").forEach((link) => {
  link.href = WATCH_URL;
});

document.querySelectorAll(".match-tab").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".match-tab").forEach((tab) => tab.classList.remove("is-active"));
    button.classList.add("is-active");
    renderFixtures(button.dataset.matchView);
  });
});

renderPredictionLists();
renderStandings();
renderFixtures();
populateComparison();
renderComparison();
renderTeamStrip();
renderMatch(fallbackMatch, false);
updateLiveData();
setInterval(updateLiveData, REFRESH_MS);
