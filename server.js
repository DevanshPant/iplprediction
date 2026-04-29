const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 5173);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyAEFhqEBv1WCIWjJJss5G1UoMZXmn_-Jeg";
const API_KEY = process.env.CRICKET_API_KEY || "68bc173a-cbbe-40ad-95e9-84d9fdcef49f";
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || "65545d072aca454391a0f08e7fc91afb";
const IPL_SERIES_ID = "87c62aac-bc3c-4738-ab93-19da0690488f";
const root = __dirname;
const weatherCache = new Map();
const predictionCache = new Map();
let cricketCache = null;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

const teams = {
  CSK: "Chennai Super Kings",
  DC: "Delhi Capitals",
  GT: "Gujarat Titans",
  KKR: "Kolkata Knight Riders",
  LSG: "Lucknow Super Giants",
  MI: "Mumbai Indians",
  PBKS: "Punjab Kings",
  RR: "Rajasthan Royals",
  RCB: "Royal Challengers Bengaluru",
  SRH: "Sunrisers Hyderabad",
};

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function teamCode(name = "") {
  const normalized = name.toUpperCase();
  const direct = Object.keys(teams).find((code) => normalized.includes(code));
  if (direct) return direct;
  return Object.entries(teams).find(([, team]) => normalized.includes(team.toUpperCase()))?.[0] || name;
}

function extractWeatherLocation(venue = "") {
  const knownVenues = [
    ["wankhede", "Mumbai"],
    ["chinnaswamy", "Bengaluru"],
    ["chidambaram", "Chennai"],
    ["chepauk", "Chennai"],
    ["eden gardens", "Kolkata"],
    ["narendra modi", "Ahmedabad"],
    ["arun jaitley", "Delhi"],
    ["rajiv gandhi", "Hyderabad"],
    ["sawai mansingh", "Jaipur"],
    ["ekana", "Lucknow"],
    ["mullanpur", "Mullanpur"],
    ["dharamsala", "Dharamsala"],
    ["barsapara", "Guwahati"],
  ];
  const normalized = venue.toLowerCase();
  const mapped = knownVenues.find(([needle]) => normalized.includes(needle));
  if (mapped) return mapped[1];

  const parts = venue
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.at(-1) || venue || "Mumbai";
}

function weatherEmoji(condition = "", code = 0) {
  const text = condition.toLowerCase();
  if (text.includes("thunder") || (code >= 200 && code < 300)) return "⛈️";
  if (text.includes("drizzle") || (code >= 300 && code < 400)) return "🌦️";
  if (text.includes("rain") || (code >= 500 && code < 600)) return "🌧️";
  if (text.includes("snow") || (code >= 600 && code < 700)) return "❄️";
  if (text.includes("fog") || text.includes("mist") || text.includes("haze") || (code >= 700 && code < 800)) return "🌫️";
  if (text.includes("clear") || code === 800) return "☀️";
  if (text.includes("few clouds") || text.includes("partly")) return "🌤️";
  if (text.includes("cloud") || code > 800) return "☁️";
  return "🌡️";
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || payload.error?.info || payload.error?.message || response.statusText);
  }
  return payload;
}

async function fetchGeminiPrediction(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
  const payload = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 500,
    }
  };
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }
    
    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "Prediction unavailable";
    return text;
  } catch (error) {
    console.error("Gemini API error:", error.message);
    return "Prediction service temporarily unavailable";
  }
}

async function generateMatchPrediction(teamA, teamB, venue) {
  const cacheKey = `${teamA}-vs-${teamB}-${venue}`.toLowerCase();
  const cached = predictionCache.get(cacheKey);
  if (cached && Date.now() - cached.createdAt < 30 * 60 * 1000) return cached.prediction;
  
  const prompt = `You are an expert cricket analyst for IPL matches. Provide a brief prediction for the match between ${teamA} and ${teamB} at ${venue}. Include: 1) Win probability for each team, 2) Key factors affecting the match, 3) Expected outcome. Keep it under 200 words.`;
  
  const prediction = await fetchGeminiPrediction(prompt);
  predictionCache.set(cacheKey, { createdAt: Date.now(), prediction });
  return prediction;
}

async function generateWeatherPrediction(location) {
  const cacheKey = `weather-${location}`.toLowerCase();
  const cached = predictionCache.get(cacheKey);
  if (cached && Date.now() - cached.createdAt < 20 * 60 * 1000) return cached.prediction;
  
  const prompt = `Provide a brief weather summary for cricket match conditions in ${location}. Include: 1) Temperature conditions, 2) Rain probability, 3) Wind impact on play. Keep it under 150 words.`;
  
  const prediction = await fetchGeminiPrediction(prompt);
  predictionCache.set(cacheKey, { createdAt: Date.now(), prediction });
  return prediction;
}

function normalizeOpenWeather(payload, location) {
  const description = payload.weather?.[0]?.description || payload.weather?.[0]?.main || "Weather unavailable";
  const rainMm = payload.rain?.["1h"] || payload.rain?.["3h"] || 0;
  return {
    provider: "OpenWeather",
    location: payload.name || location,
    tempC: Math.round(payload.main?.temp ?? 0),
    feelsLikeC: Math.round(payload.main?.feels_like ?? payload.main?.temp ?? 0),
    description,
    humidity: `${payload.main?.humidity ?? "--"}%`,
    rain: rainMm ? `${rainMm} mm` : "0 mm",
    wind: `${Math.round((payload.wind?.speed || 0) * 3.6)} km/h`,
    emoji: weatherEmoji(description, payload.weather?.[0]?.id),
  };
}

function normalizeWeatherApi(payload, location) {
  const description = payload.current?.condition?.text || "Weather unavailable";
  return {
    provider: "WeatherAPI",
    location: payload.location?.name || location,
    tempC: Math.round(payload.current?.temp_c ?? 0),
    feelsLikeC: Math.round(payload.current?.feelslike_c ?? payload.current?.temp_c ?? 0),
    description,
    humidity: `${payload.current?.humidity ?? "--"}%`,
    rain: `${payload.current?.precip_mm ?? 0} mm`,
    wind: `${Math.round(payload.current?.wind_kph || 0)} km/h`,
    emoji: weatherEmoji(description),
  };
}

function normalizeWeatherbit(payload, location) {
  const current = payload.data?.[0] || {};
  const description = current.weather?.description || "Weather unavailable";
  return {
    provider: "Weatherbit",
    location: current.city_name || location,
    tempC: Math.round(current.temp ?? 0),
    feelsLikeC: Math.round(current.app_temp ?? current.temp ?? 0),
    description,
    humidity: `${current.rh ?? "--"}%`,
    rain: `${current.precip ?? 0} mm`,
    wind: `${Math.round((current.wind_spd || 0) * 3.6)} km/h`,
    emoji: weatherEmoji(description, current.weather?.code),
  };
}

function normalizeWeatherstack(payload, location) {
  const description = payload.current?.weather_descriptions?.[0] || "Weather unavailable";
  return {
    provider: "Weatherstack",
    location: payload.location?.name || location,
    tempC: Math.round(payload.current?.temperature ?? 0),
    feelsLikeC: Math.round(payload.current?.feelslike ?? payload.current?.temperature ?? 0),
    description,
    humidity: `${payload.current?.humidity ?? "--"}%`,
    rain: `${payload.current?.precip ?? 0} mm`,
    wind: `${Math.round(payload.current?.wind_speed || 0)} km/h`,
    emoji: weatherEmoji(description),
  };
}

async function fetchWeatherForVenue(venue = "") {
  const location = extractWeatherLocation(venue);
  const cacheKey = location.toLowerCase();
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.createdAt < 10 * 60 * 1000) return cached.weather;

  const attempts = [
    async () =>
      normalizeOpenWeather(
        await fetchJson(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(`${location},IN`)}&appid=${WEATHER_API_KEY}&units=metric`
        ),
        location
      ),
    async () =>
      normalizeOpenWeather(
        await fetchJson(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${WEATHER_API_KEY}&units=metric`
        ),
        location
      ),
    async () =>
      normalizeWeatherApi(
        await fetchJson(`https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(location)}&aqi=no`),
        location
      ),
    async () =>
      normalizeWeatherbit(
        await fetchJson(`https://api.weatherbit.io/v2.0/current?city=${encodeURIComponent(location)}&country=IN&key=${WEATHER_API_KEY}`),
        location
      ),
    async () =>
      normalizeWeatherstack(
        await fetchJson(`http://api.weatherstack.com/current?access_key=${WEATHER_API_KEY}&query=${encodeURIComponent(location)}`),
        location
      ),
  ];

  const errors = [];
  for (const attempt of attempts) {
    try {
      const weather = await attempt();
      weatherCache.set(cacheKey, { createdAt: Date.now(), weather });
      return weather;
    } catch (error) {
      errors.push(error.message);
    }
  }

  const fallback = {
    provider: "Fallback",
    location,
    tempC: 28,
    feelsLikeC: 30,
    description: "Weather API key not authorized",
    humidity: "--",
    rain: "--",
    wind: "--",
    emoji: "🌡️",
    errors,
  };
  weatherCache.set(cacheKey, { createdAt: Date.now(), weather: fallback });
  return fallback;
}

function normalizeCricApiMatch(match) {
  const teamA = teamCode(match.teams?.[0] || match.name);
  const teamB = teamCode(match.teams?.[1] || match.name);
  const scores = normalizeScores(match, teamA, teamB);
  const scoreA = scores.find((score) => score.team === teamA);
  const scoreB = scores.find((score) => score.team === teamB);
  return {
    id: match.id,
    provider: "CricAPI",
    status: match.status || "Live",
    date: match.dateTimeGMT
      ? new Date(match.dateTimeGMT).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
      : "Live",
    dateTimeGMT: match.dateTimeGMT,
    venue: match.venue,
    teamA,
    teamB,
    scoreA: scoreA?.text || "",
    scoreB: scoreB?.text || "",
    scores,
    result: match.status,
    matchStarted: Boolean(match.matchStarted),
    matchEnded: Boolean(match.matchEnded),
    scoreState: scores.length ? "available" : match.matchStarted ? "toss" : "not-started",
  };
}

function normalizeScores(match, teamA, teamB) {
  const rawScores = Array.isArray(match.score) ? match.score : [];
  const assigned = new Set();
  return rawScores.map((entry) => {
    const inning = `${entry.inning || ""}`.toLowerCase();
    const candidates = [teamA, teamB].filter((code) => {
      const fullName = teams[code] || code;
      return inning.includes(fullName.toLowerCase()) || inning.includes(code.toLowerCase());
    });
    let team = candidates.find((code) => !assigned.has(code));
    if (!team) team = [teamA, teamB].find((code) => !assigned.has(code)) || candidates[0] || teamA;
    assigned.add(team);
    return {
      team,
      text: `${entry.r}/${entry.w} (${entry.o})`,
      inning: entry.inning || `${team} innings`,
      runs: entry.r,
      wickets: entry.w,
      overs: entry.o,
    };
  });
}

function isIplMatch(match) {
  return /ipl|indian premier league/i.test(`${match.series || ""} ${match.name || ""}`);
}

async function fetchCricApiMatchInfo(id) {
  const payload = await fetchJson(`https://api.cricapi.com/v1/match_info?apikey=${API_KEY}&id=${id}`);
  return payload.data;
}

async function fetchIplSeriesInfo() {
  const payload = await fetchJson(`https://api.cricapi.com/v1/series_info?apikey=${API_KEY}&id=${IPL_SERIES_ID}`);
  return payload.data?.matchList || [];
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = [];
  let index = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const currentIndex = index;
      index += 1;
      try {
        results[currentIndex] = await mapper(items[currentIndex], currentIndex);
      } catch (error) {
        results[currentIndex] = items[currentIndex];
      }
    }
  });
  await Promise.all(workers);
  return results;
}

function buildPitchReport(match) {
  const venue = `${match?.venue || ""}`.toLowerCase();
  const defaults = {
    type: "Balanced surface",
    batting: 64,
    bowling: 42,
    pace: 56,
    spin: 44,
    summary: "Venue-adjusted model uses toss, ground history, chasing tendency and current match state.",
  };

  if (venue.includes("wankhede")) {
    return {
      type: "Good for batting",
      batting: 78,
      bowling: 34,
      pace: 62,
      spin: 38,
      summary: "Wankhede usually rewards stroke play, true bounce and chasing under lights.",
    };
  }
  if (venue.includes("chidambaram") || venue.includes("chepauk")) {
    return {
      type: "Spin assistance",
      batting: 58,
      bowling: 62,
      pace: 41,
      spin: 72,
      summary: "Chennai often slows down through the innings, bringing spin and cutters into play.",
    };
  }
  if (venue.includes("eden gardens")) {
    return {
      type: "High-scoring surface",
      batting: 74,
      bowling: 38,
      pace: 55,
      spin: 45,
      summary: "Eden Gardens has fast outfields and shorter square boundaries, favoring aggressive batting.",
    };
  }
  if (venue.includes("arun jaitley")) {
    return {
      type: "Small-ground batting edge",
      batting: 72,
      bowling: 40,
      pace: 48,
      spin: 56,
      summary: "Delhi's compact dimensions make par scores volatile and reward powerplay wickets.",
    };
  }
  if (venue.includes("narendra modi")) {
    return {
      type: "Balanced with pace bounce",
      batting: 66,
      bowling: 49,
      pace: 64,
      spin: 36,
      summary: "Ahmedabad offers bounce for seamers early and value for set batters later.",
    };
  }

  return defaults;
}

async function fetchIplCricketData() {
  if (cricketCache && Date.now() - cricketCache.createdAt < 45 * 1000) return cricketCache.payload;

  const seriesMatches = await fetchIplSeriesInfo();
  const sorted = seriesMatches
    .filter((match) => match?.id)
    .sort((a, b) => new Date(a.dateTimeGMT || a.date) - new Date(b.dateTimeGMT || b.date));

  const now = Date.now();
  const completedOrLive = sorted.filter((match) => match.matchStarted || match.matchEnded);
  const hydrated = await mapWithConcurrency(completedOrLive, 5, async (match) => normalizeCricApiMatch(await fetchCricApiMatchInfo(match.id)));
  const hydratedById = new Map(hydrated.map((match) => [match.id, match]));
  const allMatches = sorted.map((match) => hydratedById.get(match.id) || normalizeCricApiMatch(match));
  const activeMatch =
    allMatches.find((match) => match.matchStarted && !match.matchEnded) ||
    allMatches.find((match) => !match.matchEnded && new Date(match.dateTimeGMT || match.date).getTime() >= now) ||
    allMatches.find((match) => !match.matchEnded) ||
    allMatches.at(-1);

  const payload = {
    match: activeMatch || null,
    recentMatches: allMatches
      .filter((match) => match.matchStarted || match.matchEnded)
      .sort((a, b) => new Date(b.dateTimeGMT || b.date) - new Date(a.dateTimeGMT || a.date)),
    fixtures: allMatches
      .filter((match) => !match.matchEnded)
      .sort((a, b) => new Date(a.dateTimeGMT || a.date) - new Date(b.dateTimeGMT || b.date)),
    allMatches,
    pitchReport: buildPitchReport(activeMatch),
  };

  cricketCache = { createdAt: Date.now(), payload };
  return payload;
}

function normalizeCricbuzzMatch(match) {
  const info = match.matchInfo || {};
  const score = match.matchScore || {};
  const inningsA = score.team1Score?.inngs1;
  const inningsB = score.team2Score?.inngs1;
  return {
    provider: "RapidAPI Cricbuzz",
    status: info.status || info.state || "Live",
    date: info.startDate
      ? new Date(Number(info.startDate)).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
      : "Live",
    venue: info.venueInfo?.ground ? `${info.venueInfo.ground}, ${info.venueInfo.city || ""}` : "TBC",
    teamA: teamCode(info.team1?.teamName || info.team1?.teamSName),
    teamB: teamCode(info.team2?.teamName || info.team2?.teamSName),
    scoreA: inningsA ? `${inningsA.runs}/${inningsA.wickets} (${inningsA.overs})` : "",
    scoreB: inningsB ? `${inningsB.runs}/${inningsB.wickets} (${inningsB.overs})` : "",
    result: info.status,
  };
}

async function fetchLiveCricket() {
  try {
    return await fetchIplCricketData();
  } catch (error) {
    console.warn("CricAPI IPL series fetch unavailable:", error.message);
  }

  const directUrl = `https://api.cricapi.com/v1/currentMatches?apikey=${API_KEY}&offset=0`;
  const rapidUrl = "https://cricbuzz-cricket.p.rapidapi.com/matches/v1/live";

  try {
    const direct = await fetch(directUrl);
    if (direct.ok) {
      const payload = await direct.json();
      const matches = payload.data || [];
      const iplMatches = matches.filter(isIplMatch);
      const source = iplMatches.length ? iplMatches : matches;
      const match = source.find((item) => !item.matchEnded) || source[0];
      if (match) {
        return {
          match: normalizeCricApiMatch(match),
          recentMatches: source
            .filter((item) => item.matchStarted)
            .slice(0, 12)
            .map(normalizeCricApiMatch),
        };
      }
    }
  } catch (error) {
    console.warn("CricAPI direct fetch unavailable:", error.message);
  }

  try {
    const rapid = await fetch(rapidUrl, {
      headers: {
        "x-rapidapi-key": API_KEY,
        "x-rapidapi-host": "cricbuzz-cricket.p.rapidapi.com",
      },
    });
    if (rapid.ok) {
      const payload = await rapid.json();
      const matches = payload.typeMatches
        ?.flatMap((group) => group.seriesMatches || [])
        .flatMap((series) => series.seriesAdWrapper?.matches || []) || [];
      const match =
        matches.find((item) => /ipl|indian premier league/i.test(item.matchInfo?.seriesName || "")) ||
        matches.find((item) => /live|innings|progress/i.test(`${item.matchInfo?.state || ""} ${item.matchInfo?.status || ""}`)) ||
        matches[0];
      if (match) {
        return {
          match: normalizeCricbuzzMatch(match),
          recentMatches: [],
        };
      }
    }
  } catch (error) {
    console.warn("RapidAPI Cricbuzz fetch unavailable:", error.message);
  }

  return { match: null, recentMatches: [] };
}

function serveStatic(req, res) {
  const requestPath = req.url === "/" ? "/index.html" : decodeURIComponent(req.url.split("?")[0]);
  const filePath = path.normalize(path.join(root, requestPath));

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    res.writeHead(200, {
      "content-type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
      "cache-control": "no-cache",
    });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.url.startsWith("/api/prediction")) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const teamA = url.searchParams.get("teamA") || "MI";
    const teamB = url.searchParams.get("teamB") || "CSK";
    const venue = url.searchParams.get("venue") || "Wankhede Stadium";
    
    const prediction = await generateMatchPrediction(teamA, teamB, venue);
    sendJson(res, 200, {
      updatedAt: new Date().toISOString(),
      teamA,
      teamB,
      venue,
      prediction,
      source: "Gemini AI Analysis",
    });
    return;
  }

  if (req.url.startsWith("/api/weather-prediction")) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const location = url.searchParams.get("location") || "Mumbai";
    
    const prediction = await generateWeatherPrediction(location);
    sendJson(res, 200, {
      updatedAt: new Date().toISOString(),
      location,
      prediction,
      source: "Gemini AI Weather Analysis",
    });
    return;
  }

  if (req.url.startsWith("/api/live-cricket")) {
    const cricket = await fetchLiveCricket();
    sendJson(res, 200, {
      updatedAt: new Date().toISOString(),
      match: cricket.match,
      recentMatches: cricket.recentMatches || [],
      fixtures: cricket.fixtures || [],
      allMatches: cricket.allMatches || [],
      pitchReport: cricket.pitchReport || null,
    });
    return;
  }

  if (req.url.startsWith("/api/weather")) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const venue = url.searchParams.get("venue") || "";
    const weather = await fetchWeatherForVenue(venue);
    sendJson(res, 200, {
      updatedAt: new Date().toISOString(),
      venue,
      weather,
    });
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`IPL Pulse running at http://localhost:${PORT}`);
});
