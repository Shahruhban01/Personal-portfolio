import crypto from "node:crypto";

// In-memory cache for IP lookups to avoid external rate limits
const geoCache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Salt for privacy-preserving IP hashing (regenerated per server process or stable)
const IP_SALT = process.env.IP_HASH_SALT || "portfolio_visitor_privacy_salt_2026";

/**
 * Checks if an IP is a private, loopback, or local address
 */
export function isPrivateIp(ip) {
  if (!ip) return true;
  const clean = ip.replace(/^::ffff:/, "").trim();
  if (
    clean === "127.0.0.1" ||
    clean === "::1" ||
    clean === "localhost" ||
    clean.startsWith("10.") ||
    clean.startsWith("192.168.") ||
    clean.startsWith("fc00:") ||
    clean.startsWith("fe80:")
  ) {
    return true;
  }
  // 172.16.0.0 - 172.31.255.255
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(clean)) {
    return true;
  }
  return false;
}

/**
 * Extracts the real client IP from Express request headers
 */
export function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const list = forwarded.split(",").map((s) => s.trim());
    for (const ip of list) {
      if (ip && !isPrivateIp(ip)) {
        return ip;
      }
    }
    return list[0];
  }
  return req.headers["x-real-ip"] || req.socket?.remoteAddress || "";
}

/**
 * Creates an irreversible, privacy-preserving pseudonym from an IP address
 */
export function anonymizeIp(rawIp) {
  if (!rawIp) return "anonymous";
  const clean = rawIp.replace(/^::ffff:/, "").trim();
  return crypto.createHash("sha256").update(`${clean}:${IP_SALT}`).digest("hex").slice(0, 16);
}

/**
 * Estimates country, region, and city from an IP address
 * Never pretends IP geolocation gives exact street address.
 */
export async function lookupIpLocation(rawIp) {
  if (!rawIp) {
    return {
      country: "Unknown",
      countryCode: "",
      region: "",
      city: "",
      timezone: "",
      source: "unknown",
    };
  }

  const clean = rawIp.replace(/^::ffff:/, "").trim();

  // Local / Development fallback
  if (isPrivateIp(clean)) {
    return {
      country: "Local Network",
      countryCode: "LOC",
      region: "Development",
      city: "Localhost",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      source: "ip_estimated",
    };
  }

  // Check cache
  const cached = geoCache.get(clean);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(clean)}?fields=status,message,country,countryCode,region,regionName,city,timezone`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.status === "success") {
        const result = {
          country: data.country || "Unknown",
          countryCode: data.countryCode || "",
          region: data.regionName || "",
          city: data.city || "",
          timezone: data.timezone || "",
          source: "ip_estimated",
        };
        geoCache.set(clean, { timestamp: Date.now(), data: result });
        return result;
      }
    }
  } catch (err) {
    // Graceful fallback on network timeout or DNS failure
    console.warn(`[GeoIP] Lookup failed for client IP: ${err.message}`);
  }

  const fallback = {
    country: "Unknown",
    countryCode: "",
    region: "",
    city: "",
    timezone: "",
    source: "unknown",
  };
  geoCache.set(clean, { timestamp: Date.now(), data: fallback });
  return fallback;
}

/**
 * Parses user agent string to identify device category, browser, and OS
 */
export function parseUserAgent(uaString = "") {
  const ua = String(uaString).toLowerCase();

  // Device category
  let category = "desktop";
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    category = "tablet";
  } else if (
    /mobile|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop|windows phone/i.test(ua)
  ) {
    category = "mobile";
  }

  // Browser detection
  let browser = "Other";
  if (ua.includes("edg/")) {
    browser = "Microsoft Edge";
  } else if (ua.includes("opr/") || ua.includes("opera")) {
    browser = "Opera";
  } else if (ua.includes("chrome") && !ua.includes("chromium")) {
    browser = "Chrome";
  } else if (ua.includes("safari") && !ua.includes("chrome")) {
    browser = "Safari";
  } else if (ua.includes("firefox")) {
    browser = "Firefox";
  } else if (ua.includes("msie") || ua.includes("trident/")) {
    browser = "Internet Explorer";
  }

  // OS detection
  let os = "Other";
  if (ua.includes("win")) {
    os = "Windows";
  } else if (ua.includes("android")) {
    os = "Android";
  } else if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) {
    os = "iOS";
  } else if (ua.includes("mac")) {
    os = "macOS";
  } else if (ua.includes("linux")) {
    os = "Linux";
  }

  return { category, browser, os };
}
