import { Request, Response } from "express";
import axios from "axios";

const API_KEY = "AIzaSyDgEtuwmqp4BnpciS5oJH1xnNJHCnv095w";

// Step 1: Get businesses
const getPlaces = async (query: string, location: string) => {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json`;

  const res = await axios.get(url, {
    params: {
      query: `${query} in ${location}`,
      key: API_KEY,
    },
  });

  return res.data.results;
};

// Step 2: Get details (website, phone)
const getDetails = async (place_id: string) => {
  const url = `https://maps.googleapis.com/maps/api/place/details/json`;

  const res = await axios.get(url, {
    params: {
      place_id,
      fields: "name,website,formatted_phone_number",
      key: API_KEY,
    },
  });

  return res.data.result;
};

// Step 3: Extract email from website
const extractEmail = async (url: string) => {
  try {
    const res = await axios.get(url, { timeout: 5000 });
    const html = res.data;

    const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
    const emails = html.match(emailRegex);

    return emails ? emails[0] : null;
  } catch {
    return null;
  }
};

// Step 4: Analyze website
const analyzeWebsite = async (url: string) => {
  let score = 0;
  const issues = [];

  try {
    const start = Date.now();
    const res = await axios.get(url, { timeout: 5000 });
    const loadTime = (Date.now() - start) / 1000;

    if (!url.startsWith("https")) {
      score++;
      issues.push("No SSL");
    }

    if (res.data.includes('meta[name="description"]')) {
      score++;
      issues.push("No meta description");
    }

    if (loadTime > 3) {
      score++;
      issues.push("Slow site");
    }

    if (
      !res.data.toLowerCase().includes("facebook") &&
      !res.data.toLowerCase().includes("instagram") &&
      !res.data.toLowerCase().includes("linkedin")
    ) {
      score++;
      issues.push("No social links");
    }
  } catch {
    score += 3;
    issues.push("Site unreachable");
  }

  return { score, issues: issues.join(", ") };
};

export const heiproEndpoint = (req: Request, res: Response) => {
  (async () => {
    const { query, location } = req.query;

    try {
      const places = await getPlaces(query as string, location as string);
      const results = [];

      for (const place of places) {
        const details = await getDetails(place.place_id);

        if (details.website) {
          const analysis = await analyzeWebsite(details.website);
          const email = await extractEmail(details.website);

          if (analysis.score >= 2) {
            results.push({
              name: details.name,
              website: details.website,
              phone: details.formatted_phone_number || "N/A",
              email: email || "Not found",
              score: analysis.score,
              issues: analysis.issues,
            });
          }
        }
      }

      res.status(200).json(results);
    } catch (err) {
      return res.status(500).json({
        err,
        action: "Heipro endpoint",
      });
    }
  })();
};
