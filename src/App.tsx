import React, {
  useState,
  useCallback,
  lazy,
  Suspense,
  useEffect,
  useRef,
  useMemo,
} from "react";
import Select from "react-select";
import html2canvas from "html2canvas";
import iso3Data from "./iso3.json";
import "./App.css";

declare global {
  interface Window {
    Plotly: any;
  }
}

const Plot = lazy(() => import("react-plotly.js"));
const STORAGE_KEY = "travel-tracker-visits";

interface CountryVisit {
  country: string;
  countryCode: string;
  date: string;
  color: string;
  loveRating: number; // 0-10 scale
}

interface CountryOption {
  value: string;
  label: string;
  code: string;
}

interface CurrentLocation {
  country: string;
  countryCode: string;
  city?: string;
}

interface IPLocationResponse {
  status: string;
  country: string;
  countryCode: string;
  city: string;
}

const colorPalette = [
  "#4F46E5",
  "#7C3AED",
  "#DB2777",
  "#DC2626",
  "#EA580C",
  "#D97706",
  "#CA8A04",
  "#65A30D",
  "#16A34A",
  "#059669",
  "#0891B2",
  "#0284C7",
  "#2563EB",
  "#4338CA",
  "#6366F1",
];

const normalizeLon = (lon: number) => ((((lon + 180) % 360) + 360) % 360) - 180;

const getAlpha2FromAlpha3 = (alpha3: string) => {
  const match = (
    iso3Data as { "alpha-2": string; "alpha-3": string; name: string }[]
  ).find((c) => c["alpha-3"] === alpha3);
  return match
    ? (match["alpha-2"] as string).toLowerCase()
    : alpha3.slice(0, 2).toLowerCase();
};

const coordinates: Record<string, { lon: number; lat: number }> = {
  USA: { lon: -95, lat: 37 },
  CHN: { lon: 104, lat: 35 },
  IND: { lon: 78, lat: 20 },
  BRA: { lon: -55, lat: -10 },
  RUS: { lon: 105, lat: 61 },
  CAN: { lon: -106, lat: 56 },
  AUS: { lon: 133, lat: -27 },
  ARG: { lon: -64, lat: -34 },
  KAZ: { lon: 68, lat: 48 },
  DZA: { lon: 1, lat: 28 },
  SAU: { lon: 45, lat: 24 },
  MEX: { lon: -102, lat: 23 },
  IDN: { lon: 113, lat: -0.8 },
  SDN: { lon: 30, lat: 12 },
  LBY: { lon: 17, lat: 25 },
  IRN: { lon: 53, lat: 32 },
  MNG: { lon: 103, lat: 46 },
  PER: { lon: -75, lat: -9 },
  TCD: { lon: 19, lat: 15 },
  NER: { lon: 8, lat: 16 },
  AGO: { lon: 18, lat: -11 },
  MLI: { lon: -4, lat: 17 },
  ZAF: { lon: 22, lat: -30 },
  COL: { lon: -74, lat: 4 },
  ETH: { lon: 40, lat: 9 },
  BOL: { lon: -63, lat: -16 },
  MAR: { lon: -7, lat: 31 },
  EGY: { lon: 30, lat: 26 },
  TZA: { lon: 34, lat: -6 },
  NGA: { lon: 8, lat: 9 },
  VEN: { lon: -66, lat: 6 },
  PAK: { lon: 69, lat: 30 },
  NAM: { lon: 18, lat: -22 },
  MOZ: { lon: 35, lat: -18 },
  TUR: { lon: 35, lat: 39 },
  CHL: { lon: -71, lat: -35 },
  ZMB: { lon: 27, lat: -13 },
  MMR: { lon: 95, lat: 22 },
  AFG: { lon: 67, lat: 33 },
  FRA: { lon: 2, lat: 46 },
  SOM: { lon: 46, lat: 10 },
  CAF: { lon: 21, lat: 7 },
  UKR: { lon: 31, lat: 49 },
  MDG: { lon: 47, lat: -18 },
  BWA: { lon: 24, lat: -22 },
  KEN: { lon: 37, lat: -0.2 },
  YEM: { lon: 48, lat: 15 },
  THA: { lon: 100, lat: 15 },
  ESP: { lon: -8, lat: 40 },
  TKM: { lon: 59, lat: 38 },
  CMR: { lon: 12, lat: 7 },
  PNG: { lon: 143, lat: -6 },
  SWE: { lon: 18, lat: 60 },
  UZB: { lon: 64, lat: 41 },
  IRQ: { lon: 43, lat: 33 },
  PRY: { lon: -58, lat: -23 },
  ZWE: { lon: 29, lat: -19 },
  NOR: { lon: 8, lat: 60 },
  JPN: { lon: 138, lat: 36 },
  DEU: { lon: 10, lat: 51 },
  COG: { lon: 15, lat: -0.2 },
  FIN: { lon: 25, lat: 61 },
  VNM: { lon: 108, lat: 14 },
  MYS: { lon: 101, lat: 4 },
  CIV: { lon: -5, lat: 7 },
  POL: { lon: 19, lat: 52 },
  OMN: { lon: 55, lat: 21 },
  ITA: { lon: 12, lat: 41 },
  PHL: { lon: 121, lat: 13 },
  BFA: { lon: -2, lat: 12 },
  NZL: { lon: 174, lat: -40 },
  GAB: { lon: 11, lat: -0.8 },
  GIN: { lon: -9, lat: 9 },
  GBR: { lon: -3, lat: 55 },
  UGA: { lon: 32, lat: 1 },
  GHA: { lon: -1, lat: 7 },
  ROU: { lon: 24, lat: 45 },
  LAO: { lon: 102, lat: 19 },
  GUY: { lon: -58, lat: 4 },
  BLR: { lon: 27, lat: 53 },
  KGZ: { lon: 74, lat: 41 },
  SEN: { lon: -14, lat: 14 },
  SYR: { lon: 38, lat: 34 },
  KHM: { lon: 104, lat: 12 },
  URY: { lon: -55, lat: -32 },
  TUN: { lon: 9, lat: 33 },
  SUR: { lon: -56, lat: 3 },
  NPL: { lon: 84, lat: 28 },
  BGD: { lon: 90, lat: 23 },
  TJK: { lon: 71, lat: 38 },
  GRC: { lon: 21, lat: 39 },
  NIC: { lon: -85, lat: 12 },
  ERI: { lon: 39, lat: 15 },
  MKD: { lon: 21, lat: 41 },
  MLW: { lon: 34, lat: -13 },
  BEN: { lon: 2, lat: 9 },
  HND: { lon: -86, lat: 15 },
  LBR: { lon: -9, lat: 6 },
  BGR: { lon: 25, lat: 42 },
  SLE: { lon: -11, lat: 8 },
  SRB: { lon: 21, lat: 44 },
  LKA: { lon: 80, lat: 7 },
  TGO: { lon: 0.8, lat: 8 },
  CHE: { lon: 8, lat: 46 },
  AUT: { lon: 14, lat: 47 },
  HUN: { lon: 19, lat: 47 },
  JOR: { lon: 36, lat: 30 },
  AZE: { lon: 47, lat: 40 },
  PRT: { lon: -8, lat: 39 },
  ARE: { lon: 53, lat: 23 },
  CZE: { lon: 15, lat: 49 },
  PAN: { lon: -80, lat: 8 },
  IRL: { lon: -8, lat: 53 },
  GEO: { lon: 43, lat: 42 },
  LTU: { lon: 23, lat: 55 },
  LVA: { lon: 24, lat: 56 },
  HRV: { lon: 15, lat: 45 },
  BIH: { lon: 17, lat: 43 },
  SVK: { lon: 19, lat: 48 },
  EST: { lon: 25, lat: 58 },
  DNK: { lon: 9, lat: 56 },
  NLD: { lon: 5, lat: 52 },
  BEL: { lon: 4, lat: 50 },
  ARM: { lon: 45, lat: 40 },
  ALB: { lon: 19, lat: 41 },
  SVN: { lon: 14, lat: 46 },
  MDA: { lon: 28, lat: 47 },
  KWT: { lon: 47, lat: 29 },
  GNB: { lon: -15, lat: 11 },
  GMB: { lon: -15, lat: 13 },
  QAT: { lon: 51, lat: 25 },
  JAM: { lon: -77, lat: 18 },
  LBN: { lon: 35, lat: 33 },
  CYP: { lon: 33, lat: 35 },
  PSE: { lon: 35, lat: 31 },
  SWZ: { lon: 31, lat: -26 },
  FJI: { lon: 179, lat: -16 },
  VUT: { lon: 166, lat: -15 },
  MNE: { lon: 19, lat: 42 },
  BHR: { lon: 50, lat: 26 },
  COM: { lon: 43, lat: -11 },
  LUX: { lon: 6, lat: 49 },
  CPV: { lon: -24, lat: 16 },
  MLT: { lon: 14, lat: 35 },
  BRN: { lon: 114, lat: 4 },
  BHS: { lon: -77, lat: 25 },
  MDV: { lon: 73, lat: 3 },
  ISL: { lon: -19, lat: 64 },
  BRB: { lon: -59, lat: 13 },
  VCT: { lon: -61, lat: 12 },
  TON: { lon: -175, lat: -21 },
  KIR: { lon: -157, lat: 1 },
  FSM: { lon: 158, lat: 7 },
  STP: { lon: 6, lat: 0 },
  PLW: { lon: 134, lat: 7 },
  NRU: { lon: 166, lat: -0.5 },
  MHL: { lon: 171, lat: 7 },
  TUV: { lon: 179, lat: -7 },
  SMR: { lon: 12, lat: 43 },
  LIE: { lon: 9, lat: 47 },
  MCO: { lon: 7, lat: 43 },
  AND: { lon: 1, lat: 42 },
  VAT: { lon: 12, lat: 41 },
};

const App: React.FC = () => {
  const [visits, setVisits] = useState<CountryVisit[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const loadedVisits = saved ? JSON.parse(saved) : [];
      // Ensure existing trips have loveRating property
      return loadedVisits.map((visit: CountryVisit) => ({
        ...visit,
        loveRating: visit.loveRating !== undefined ? visit.loveRating : 0,
      }));
    } catch (error) {
      console.log("Error loading saved visits:", error);
      return [];
    }
  });
  const [selectedCountry, setSelectedCountry] = useState<CountryOption | null>(
    null,
  );
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [view, setView] = useState({ lon: 20, lat: 20, scale: 1 });
  const [targetCountry, setTargetCountry] = useState<{
    lon: number;
    lat: number;
    scale: number;
  } | null>(null);
  const [currentLocation, setCurrentLocation] =
    useState<CurrentLocation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayIndex, setCurrentPlayIndex] = useState(0);
  const [loveRating, setLoveRating] = useState<number>(0);
  const [isHeartAnimating, setIsHeartAnimating] = useState<boolean>(false);
  const [flyingParticles, setFlyingParticles] = useState<
    Array<{
      id: number;
      emoji: string;
      x: number;
      y: number;
      vx: number;
      vy: number;
    }>
  >([]);
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const animationRef = useRef<number | undefined>(undefined);
  const playTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const heartButtonRef = useRef<HTMLButtonElement | null>(null);

  const countryOptions: CountryOption[] = (
    iso3Data as { "alpha-2": string; "alpha-3": string; name: string }[]
  )
    .map((country) => ({
      value: country.name,
      label: country.name,
      code: country["alpha-3"],
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const saveToLocalStorage = useCallback((newVisits: CountryVisit[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newVisits));
    } catch (error) {
      console.log("Error saving to localStorage:", error);
    }
  }, []);

  const generateColorByLove = (rating: number): string => {
    if (rating === 0) return "#ef4444"; // Red for no love
    if (rating <= 5) {
      // Gradient from red to green (0-5)
      const intensity = rating / 5;
      const red = Math.round(239 * (1 - intensity) + 34 * intensity);
      const green = Math.round(68 * (1 - intensity) + 197 * intensity);
      const blue = Math.round(68 * (1 - intensity) + 94 * intensity);
      return `rgb(${red}, ${green}, ${blue})`;
    } else if (rating <= 10) {
      // Gradient from green to gold (5-10)
      const intensity = (rating - 5) / 5;
      const red = Math.round(34 * (1 - intensity) + 251 * intensity);
      const green = Math.round(197 * (1 - intensity) + 191 * intensity);
      const blue = Math.round(94 * (1 - intensity) + 36 * intensity);
      return `rgb(${red}, ${green}, ${blue})`;
    } else {
      // Infinity love - rainbow/magical color
      return "#ff6b9d"; // Pink for infinity
    }
  };

  const getCountryCoordinates = (
    countryCode: string,
  ): { lon: number; lat: number } => {
    return coordinates[countryCode] || { lon: 0, lat: 0 };
  };

  const addVisit = useCallback(() => {
    if (!selectedCountry || !selectedDate) return;
    const existingIndex = visits.findIndex(
      (v) => v.countryCode === selectedCountry.code,
    );
    const color = generateColorByLove(loveRating);
    const newVisit: CountryVisit = {
      country: selectedCountry.label,
      countryCode: selectedCountry.code,
      date: selectedDate,
      color: color,
      loveRating: loveRating,
    };
    let updatedVisits: CountryVisit[];
    if (existingIndex >= 0) {
      updatedVisits = [...visits];
      updatedVisits[existingIndex] = newVisit;
    } else {
      updatedVisits = [...visits, newVisit];
    }
    setVisits(updatedVisits);
    saveToLocalStorage(updatedVisits);
    const coords = getCountryCoordinates(selectedCountry.code);
    setTargetCountry({ lon: coords.lon, lat: coords.lat, scale: 3 });
    setSelectedCountry(null);
    setSelectedDate("");
    setLoveRating(0);
  }, [selectedCountry, selectedDate, loveRating, visits, saveToLocalStorage]);

  const removeVisit = useCallback(
    (countryCode: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      const updatedVisits = visits.filter((v) => v.countryCode !== countryCode);
      setVisits(updatedVisits);
      saveToLocalStorage(updatedVisits);
    },
    [visits, saveToLocalStorage],
  );

  // Fetch current location based on IP (optional feature)
  useEffect(() => {
    const fetchCurrentLocation = async () => {
      try {
        const response = await fetch("https://ip-api.com/json/");
        const data: IPLocationResponse = await response.json();
        if (data.status === "success" && data.country && data.countryCode) {
          // Convert alpha-2 to alpha-3 country code
          const countryData = (
            iso3Data as { "alpha-2": string; "alpha-3": string; name: string }[]
          ).find(
            (c) =>
              c["alpha-2"].toLowerCase() === data.countryCode.toLowerCase(),
          );

          if (countryData) {
            setCurrentLocation({
              country: data.country,
              countryCode: countryData["alpha-3"],
              city: data.city,
            });
          }
        }
      } catch (error) {
        console.log("Could not fetch location:", error);
      }
    };

    fetchCurrentLocation();
  }, []);

  const getRandomEmoji = (rating: number) => {
    const heartEmojis = [
      "❤️",
      "💖",
      "💕",
      "💘",
      "💝",
      "💗",
      "💓",
      "💞",
      "💟",
      "♥️",
      "🧡",
      "💛",
      "💚",
      "💙",
      "💜",
      "🤍",
      "🖤",
      "❣️",
      "💋",
      "😍",
      "🥰",
      "😘",
    ];
    const sparkleEmojis = [
      "✨",
      "🌟",
      "⭐",
      "💫",
      "🎊",
      "🎉",
      "🌈",
      "🦄",
      "👑",
    ];

    if (rating > 10) {
      // Infinity love - mix of the best emojis
      const infinityEmojis = [
        "❤️",
        "💖",
        "💕",
        "✨",
        "🌟",
        "💫",
        "🎊",
        "🌈",
        "🦄",
        "👑",
        "💎",
        "🔥",
      ];
      return infinityEmojis[Math.floor(Math.random() * infinityEmojis.length)];
    }

    const isHeartEmoji = Math.random() < 0.9; // 90% hearts, 10% sparkles
    const emojiArray = isHeartEmoji ? heartEmojis : sparkleEmojis;
    return emojiArray[Math.floor(Math.random() * emojiArray.length)];
  };
  const handleHeartClick = useCallback(() => {
    const now = Date.now();
    // Performance: throttle rapid clicks
    if (now - lastClickTime < 100) return;
    setLastClickTime(now);

    setLoveRating((prev) => {
      const newRating = prev >= 10 ? 11 : prev + 1; // Go to infinity at 11
      setIsHeartAnimating(true);
      setTimeout(() => setIsHeartAnimating(false), 300);

      // Get heart button position more accurately
      const heartButton = heartButtonRef.current;
      let startX = window.innerWidth * 0.5;
      let startY = window.innerHeight * 0.5;

      if (heartButton) {
        const rect = heartButton.getBoundingClientRect();
        // Use viewport-relative position (no scroll offset needed for fixed overlay)
        startX = rect.left + rect.width / 2;
        startY = rect.top + rect.height / 2;
      }

      // Create flying particles based on love rating (optimized for performance)
      const baseCount = Math.min(newRating * 2, 15); // Cap at 15 for performance
      const particleCount = Math.max(baseCount, 1);
      const newParticles: Array<{
        id: number;
        emoji: string;
        x: number;
        y: number;
        vx: number;
        vy: number;
      }> = [];

      for (let i = 0; i < particleCount; i++) {
        const particle = {
          id: Date.now() + i + Math.random(),
          emoji: getRandomEmoji(newRating),
          x: startX,
          y: startY,
          vx: (Math.random() - 0.5) * 12, // Random horizontal velocity
          vy: Math.random() * -8 - 3, // Upward velocity
        };
        newParticles.push(particle);
      }

      setFlyingParticles((prev) => {
        // Performance: limit total particles on screen for better performance
        const filteredPrev = prev.slice(-30000);
        return [...filteredPrev, ...newParticles];
      });

      // Performance: Remove particles after animation completes (reduced from 3000ms)
      const removeParticles = () => {
        setTimeout(() => {
          setFlyingParticles((prev) =>
            prev.filter((p) => !newParticles.some((np) => np.id === p.id)),
          );
        }, 2500); // Slightly shorter than CSS animation duration
      };

      removeParticles();

      return newRating;
    });
  }, [lastClickTime]);

  const getHeartColor = (rating: number): string => {
    return generateColorByLove(rating);
  };

  const exportMap = useCallback(async () => {
    // ALL BELOW WORNG. NO BATTERY TO FIX IT. FOR NOW I ALERT
    alert(
      "my battery died before having the time to implement this. just imagine it works",
    );
    return;
    if (visits.length === 0) return;

    setIsExporting(true);

    try {
      // Find the map container
      const mapContainer = document.querySelector(
        ".map-container",
      ) as HTMLElement;
      if (!mapContainer) throw new Error("Map container not found");

      // Create a proper 1:1 export container
      const exportContainer = document.createElement("div");
      exportContainer.style.position = "absolute";
      exportContainer.style.left = "-9999px";
      exportContainer.style.top = "0px";
      exportContainer.style.width = "800px";
      exportContainer.style.height = "800px";
      exportContainer.style.backgroundColor = "white";
      exportContainer.style.padding = "0px";
      exportContainer.style.fontFamily = "Arial, sans-serif";
      exportContainer.style.display = "grid";
      exportContainer.style.gridTemplateColumns = "500px 300px";
      exportContainer.style.gridTemplateRows = "1fr";
      document.body.appendChild(exportContainer);

      // Create left side - map container
      const mapSection = document.createElement("div");
      mapSection.style.width = "500px";
      mapSection.style.height = "800px";
      mapSection.style.position = "relative";

      // Create actual map with Plotly
      const mapDiv = document.createElement("div");
      mapDiv.style.width = "500px";
      mapDiv.style.height = "800px";
      mapSection.appendChild(mapDiv);

      // Create export data for natural earth projection
      const exportData = visits.map((visit) => ({
        type: "choropleth" as const,
        locations: [visit.countryCode],
        z: [1],
        colorscale: [
          [0, visit.color],
          [1, visit.color],
        ],
        showscale: false,
        hoverinfo: "skip",
        marker: {
          line: {
            color: "#374151",
            width: 1,
          },
        },
      }));

      // Use window.Plotly if available
      if (window.Plotly) {
        await window.Plotly.newPlot(
          mapDiv,
          exportData,
          {
            width: 500,
            height: 800,
            margin: { l: 0, r: 0, t: 0, b: 0 },
            paper_bgcolor: "transparent",
            plot_bgcolor: "transparent",
            geo: {
              projection: {
                type: "natural earth",
              },
              domain: { x: [0, 1], y: [0, 1] },
              showcoastlines: false,
              showland: true,
              landcolor: "#f1f5f9",
              showocean: true,
              oceancolor: "rgba(0,0,0,0)",
              showlakes: true,
              lakecolor: "#e2e8f0",
              showrivers: false,
              showcountries: true,
              countrycolor: "#d1d5db",
              countrywidth: 0.8,
              bgcolor: "transparent",
            },
          },
          {
            displayModeBar: false,
            staticPlot: true,
          },
        );
      } else {
        // Fallback if Plotly not available
        mapDiv.style.backgroundColor = "#f8fafc";
        mapDiv.style.border = "2px solid #e5e7eb";
        mapDiv.style.borderRadius = "12px";
        mapDiv.style.display = "flex";
        mapDiv.style.alignItems = "center";
        mapDiv.style.justifyContent = "center";
        mapDiv.innerHTML =
          '<div style="text-align: center; color: #6b7280;"><div style="font-size: 48px;">🗺️</div><div>Travel Map</div></div>';
      }

      exportContainer.appendChild(mapSection);

      // Create right side - countries list
      const countriesSection = document.createElement("div");
      countriesSection.style.width = "300px";
      countriesSection.style.height = "800px";
      countriesSection.style.overflowY = "auto";
      countriesSection.style.padding = "20px";
      countriesSection.style.backgroundColor = "#f8fafc";

      const countriesList = document.createElement("div");
      countriesList.style.fontSize = "14px";
      countriesList.style.color = "#1f2937";
      countriesList.innerHTML = `
        <h3 style="margin-bottom: 20px; font-size: 18px; font-weight: bold;">Visited Countries (${visits.length})</h3>
        ${visits
          .map((visit) => {
            const alpha2 =
              (
                iso3Data as {
                  "alpha-2": string;
                  "alpha-3": string;
                  name: string;
                }[]
              )
                .find((c) => c["alpha-3"] === visit.countryCode)
                ?.["alpha-2"]?.toLowerCase() || "";
            return `<div style="margin-bottom: 12px; display: flex; align-items: center; gap: 8px; padding: 8px; background: #f9fafb; border-radius: 8px;">
            <img src="https://flagcdn.com/24x18/${alpha2}.png" alt="${visit.country} flag" style="width: 24px; height: 18px; border-radius: 2px;" />
            <span style="background-color: ${visit.color}; width: 12px; height: 12px; border-radius: 50%;"></span>
            <div style="flex: 1;">
              <div style="font-weight: 600; font-size: 14px;">${visit.country}</div>
              <div style="color: #6b7280; font-size: 12px;">${new Date(visit.date).toLocaleDateString()}</div>
            </div>
          </div>`;
          })
          .join("")}
      `;

      countriesSection.appendChild(countriesList);
      exportContainer.appendChild(countriesSection);

      // Wait a moment for rendering
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Capture with html2canvas
      const canvas = await html2canvas(exportContainer, {
        width: 800,
        height: 800,
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: true,
      });

      // Download the image
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.download = `travel-map-${new Date().toISOString().split("T")[0]}.png`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
          }
        },
        "image/png",
        1.0,
      );

      // Cleanup
      document.body.removeChild(exportContainer);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }, [visits]);
  const focusOnCountry = useCallback((countryCode: string) => {
    const coords = getCountryCoordinates(countryCode);
    setTargetCountry({ lon: coords.lon, lat: coords.lat, scale: 3 });
  }, []);

  const startPlayMode = useCallback(() => {
    if (visits.length === 0) return;

    setIsPlaying(true);
    setCurrentPlayIndex(0);

    // Sort visits by date (earliest first) for the tour
    const sortedVisits = [...visits].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const playNextCountry = (index: number) => {
      if (index >= sortedVisits.length) {
        setIsPlaying(false);
        setCurrentPlayIndex(0);
        return;
      }

      const visit = sortedVisits[index];
      focusOnCountry(visit.countryCode);

      // Store the country code being played for highlighting
      setCurrentPlayIndex(
        visits.findIndex((v) => v.countryCode === visit.countryCode),
      );

      playTimeoutRef.current = setTimeout(() => {
        playNextCountry(index + 1);
      }, 2000); // 2 seconds per country
    };

    playNextCountry(0);
  }, [visits, focusOnCountry]);

  const stopPlayMode = useCallback(() => {
    setIsPlaying(false);
    setCurrentPlayIndex(0);
    if (playTimeoutRef.current) {
      clearTimeout(playTimeoutRef.current);
    }
  }, []);

  // Auto-scroll to currently playing country within container only
  useEffect(() => {
    if (isPlaying && currentPlayIndex >= 0 && scrollContainerRef.current) {
      const sortedVisits = [...visits].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      const currentVisit = sortedVisits[currentPlayIndex];
      if (currentVisit && cardRefs.current[currentVisit.countryCode]) {
        const cardElement = cardRefs.current[currentVisit.countryCode];
        const containerElement = scrollContainerRef.current;

        if (cardElement && containerElement) {
          // Calculate positions relative to the container
          const cardRect = cardElement.getBoundingClientRect();
          const containerRect = containerElement.getBoundingClientRect();

          // Calculate the offset from the top of the container
          const cardTop =
            cardRect.top - containerRect.top + containerElement.scrollTop;
          const cardHeight = cardRect.height;
          const containerHeight = containerRect.height;

          // Calculate the scroll position to center the card in the container
          const scrollPosition = cardTop - containerHeight / 2 + cardHeight / 2;

          // Smooth scroll within the container only
          containerElement.scrollTo({
            top: scrollPosition,
            behavior: "smooth",
          });
        }
      }
    }
  }, [isPlaying, currentPlayIndex, visits]);

  // Cleanup play timeout on unmount
  useEffect(() => {
    return () => {
      if (playTimeoutRef.current) {
        clearTimeout(playTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const animate = () => {
      if (targetCountry) {
        setView((prev) => {
          const desiredLon = targetCountry.lon;
          const desiredLat = targetCountry.lat;
          const desiredScale = targetCountry.scale;
          const currentLon = normalizeLon(prev.lon);
          const lonDiff = ((desiredLon - currentLon + 540) % 360) - 180;
          const latDiff = desiredLat - prev.lat;
          const scaleDiff = desiredScale - prev.scale;
          const step = 0.12;
          const nextLon = currentLon + lonDiff * step;
          const nextLat = prev.lat + latDiff * step;
          const nextScale = prev.scale + scaleDiff * step;
          if (
            Math.abs(lonDiff) < 0.1 &&
            Math.abs(latDiff) < 0.1 &&
            Math.abs(scaleDiff) < 0.01
          ) {
            setTargetCountry(null);
            return { lon: desiredLon, lat: desiredLat, scale: desiredScale };
          }
          return {
            lon: normalizeLon(nextLon),
            lat: nextLat,
            scale: nextScale,
          };
        });
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    if (targetCountry) {
      animationRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetCountry]);

  const getFavoriteCountries = useCallback(() => {
    if (visits.length === 0) return [];

    // Handle trips that might not have loveRating (existing trips)
    const tripsWithLove = visits.filter(
      (v) => v.loveRating !== undefined && v.loveRating > 0,
    );
    if (tripsWithLove.length === 0) return [];

    const maxLove = Math.max(...tripsWithLove.map((v) => v.loveRating));
    return tripsWithLove.filter((v) => v.loveRating === maxLove);
  }, [visits]);

  const getMapSize = useMemo(() => {
    const width = window.innerWidth;
    if (width <= 480) {
      return { width: 250, height: 250 };
    } else if (width <= 768) {
      return { width: 300, height: 300 };
    } else {
      return { width: 685, height: 565 };
    }
  }, []);

  const getPlotlyData = () => {
    if (visits.length === 0) {
      return [
        {
          type: "choropleth" as const,
          locations: [],
          z: [],
          colorscale: [
            [0, "#f8fafc"],
            [1, "#f8fafc"],
          ],
          showscale: false,
          hoverinfo: "skip",
        },
      ];
    }
    return visits.map((visit) => ({
      type: "choropleth" as const,
      locations: [visit.countryCode],
      z: [1],
      colorscale: [
        [0, visit.color],
        [1, visit.color],
      ],
      showscale: false,
      hovertemplate: `<b>${visit.country}</b><br>Visited: ${new Date(visit.date).toLocaleDateString()}<extra></extra>`,
      marker: {
        line: {
          color: "#9ca3af",
          width: 1,
        },
      },
    }));
  };

  const latestVisit = useMemo(() => {
    if (visits.length === 0) return null;
    return [...visits].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )[0];
  }, [visits]);

  return (
    <div className="app">
      {/* Flying particles overlay */}
      <div className="flying-particles-overlay">
        {flyingParticles.map((particle) => (
          <div
            key={particle.id}
            className="flying-particle"
            style={
              {
                left: particle.x,
                top: particle.y,
                "--vx": particle.vx,
                "--vy": particle.vy,
              } as React.CSSProperties
            }
          >
            {particle.emoji}
          </div>
        ))}
      </div>
      <div className="container">
        {/* Fancy Travel Tracker Title */}
        <div className="fancy-title-container">
          <h1 className="fancy-title">
            <span className="sparkle sparkle-1">✨</span>
            <span className="title-text">Travel Tracker</span>
            <span className="sparkle sparkle-2">✨</span>
          </h1>
          <div className="title-glow"></div>
        </div>

        <div className="main-layout">
          <div className="globe-section">
            <div className="map-container">
              <Suspense
                fallback={
                  <div className="map-loading">
                    <div className="loading-spinner"></div>
                  </div>
                }
              >
                <Plot
                  data={getPlotlyData()}
                  layout={{
                    width: getMapSize.width,
                    height: getMapSize.height,
                    margin: { l: 0, r: 0, t: 0, b: 0 },
                    geo: {
                      projection: {
                        type: "orthographic", // Available types: "orthographic", "mercator", "equirectangular", "conic equal area", "conic conformal", "conic equidistant", "azimuthal equal area", "azimuthal equidistant", "gnomonic", "stereographic", "mollweide", "hammer", "transverse mercator", "albers usa", "winkel tripel", "eckert4", "kavrayskiy7", "miller", "robinson", "eckert6", "sinusoidal", "natural earth"
                        rotation: {
                          lon: view.lon,
                          lat: view.lat,
                          roll: 2,
                        },
                        scale: view.scale,
                      },
                      domain: { x: [0.05, 0.95], y: [0.05, 0.95] },
                      showcoastlines: false,
                      showland: true,
                      landcolor: "#f1f5f9",
                      showocean: true,
                      oceancolor: "#ffffff",
                      showlakes: true,
                      lakecolor: "#e2e8f0",
                      showrivers: false,
                      showcountries: true,
                      countrycolor: "#d1d5db",
                      countrywidth: 0.8,
                    },
                  }}
                  config={{
                    displayModeBar: false,
                    responsive: true,
                    staticPlot: false,
                  }}
                />
              </Suspense>
            </div>
          </div>
          <div className="countries-sidebar">
            <h3 className="sidebar-title">Your Travels</h3>

            {/* Play and Export buttons */}
            {visits.length > 0 && (
              <div className="buttons-section">
                <button
                  onClick={isPlaying ? stopPlayMode : startPlayMode}
                  className="play-button"
                  disabled={visits.length === 0}
                >
                  {isPlaying ? "⏸️" : "▶️"}
                  <span>{isPlaying ? "Stop Tour" : "Play Tour"}</span>
                </button>
                <button
                  onClick={exportMap}
                  className="export-button"
                  disabled={visits.length === 0 || isExporting}
                >
                  {isExporting ? "⏳" : "📥"}
                  <span>{isExporting ? "Exporting..." : "Export Map"}</span>
                </button>
              </div>
            )}

            {/* Current location card */}
            {currentLocation && (
              <div className="current-location-card">
                <div className="location-header">Current Location</div>
                <div className="country-card-content">
                  <img
                    src={`https://flagcdn.com/192x144/${getAlpha2FromAlpha3(currentLocation.countryCode)}.png`}
                    alt={`${currentLocation.country} flag`}
                    className="country-flag"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <div className="visit-info">
                    <div className="visit-country">
                      {currentLocation.country}
                    </div>
                    {currentLocation.city && (
                      <div className="visit-date">{currentLocation.city}</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Trips header with scroll indicator */}
            <div className="trips-header">
              <div className="trips-title">Your Trips</div>
              {visits.length > 4 && (
                <div className="scroll-indicator">
                  <span>↕</span>
                  <span className="scroll-text">Scroll to see all</span>
                </div>
              )}
            </div>

            {/* Empty state when no trips */}
            {visits.length === 0 && (
              <div className="empty-state">
                <div className="empty-doodle">
                  <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
                    <circle
                      cx="25"
                      cy="25"
                      r="15"
                      stroke="#e5e7eb"
                      strokeWidth="2"
                      fill="none"
                      strokeDasharray="3,3"
                    />
                    <circle
                      cx="55"
                      cy="35"
                      r="10"
                      stroke="#e5e7eb"
                      strokeWidth="2"
                      fill="none"
                      strokeDasharray="2,2"
                    />
                    <path
                      d="M15 45 Q40 35 65 45"
                      stroke="#e5e7eb"
                      strokeWidth="2"
                      fill="none"
                      strokeDasharray="4,2"
                    />
                    <circle cx="20" cy="15" r="2" fill="#d1d5db" />
                    <circle cx="60" cy="25" r="1.5" fill="#d1d5db" />
                    <circle cx="35" cy="50" r="1" fill="#d1d5db" />
                  </svg>
                </div>
                <div className="empty-text">So empty..</div>
                <div className="empty-subtext">
                  Start adding your travel memories!
                </div>
              </div>
            )}

            {visits.length > 0 && (
              <div className="countries-list" ref={scrollContainerRef}>
                {visits
                  .sort(
                    (a, b) =>
                      new Date(b.date).getTime() - new Date(a.date).getTime(),
                  )
                  .map((visit, index) => (
                    <div
                      key={visit.countryCode}
                      ref={(el) => {
                        cardRefs.current[visit.countryCode] = el;
                      }}
                      className={`country-card ${isPlaying && currentPlayIndex === index ? "playing" : ""}`}
                      onClick={() => focusOnCountry(visit.countryCode)}
                    >
                      <img
                        src={`https://flagcdn.com/192x144/${getAlpha2FromAlpha3(visit.countryCode)}.png`}
                        alt={`${visit.country} flag`}
                        className="country-flag"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <div
                        className="visit-color"
                        style={{ backgroundColor: visit.color }}
                        title={`Love rating: ${visit.loveRating > 10 ? "∞" : visit.loveRating || 0}/10`}
                      ></div>
                      <div className="visit-info">
                        <div className="visit-country">{visit.country}</div>
                        <div className="visit-date">
                          {new Date(visit.date).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={(e) => removeVisit(visit.countryCode, e)}
                        className="remove-button"
                        aria-label={`Remove ${visit.country}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
        <div className="input-section">
          <div className="input-row">
            <div className="input-group country-group">
              <Select
                value={selectedCountry}
                onChange={setSelectedCountry}
                options={countryOptions}
                placeholder="Select a country..."
                className="country-select"
                classNamePrefix="select"
                isSearchable
              />
            </div>
            <div className="input-group date-group">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="date-input"
              />
            </div>
            <div className="input-group love-group">
              <div className="love-rating-container">
                <div className="heart-wrapper">
                  <button
                    ref={heartButtonRef}
                    type="button"
                    onClick={handleHeartClick}
                    className={`heart-button ${isHeartAnimating ? "animating" : ""}`}
                    style={{ color: getHeartColor(loveRating) }}
                  >
                    ❤️
                  </button>
                </div>
                <div className="love-counter">
                  <span className="love-number">
                    {loveRating > 10 ? "∞" : loveRating}
                  </span>
                  <span className="love-label">
                    {loveRating > 10 ? "Infinite" : "Love"}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={addVisit}
              disabled={!selectedCountry || !selectedDate}
              className="add-button"
            >
              Add Visit
            </button>
          </div>
        </div>
        <div className="stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{visits.length}</div>
              <div className="stat-label">Countries Visited</div>
            </div>
            <div className="stat-card">
              {(() => {
                const favorites = getFavoriteCountries();
                if (favorites.length === 0) {
                  return (
                    <>
                      <div className="stat-number">-</div>
                      <div className="stat-label">No Favorites Yet</div>
                    </>
                  );
                }

                const displayCountry = favorites[0];
                const hasMultiple = favorites.length > 1;

                return (
                  <>
                    <img
                      src={`https://flagcdn.com/64x48/${getAlpha2FromAlpha3(displayCountry.countryCode)}.png`}
                      alt={`${displayCountry.country} flag`}
                      className="country-flag"
                      style={{
                        width: "48px",
                        height: "36px",
                        marginBottom: "8px",
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <div className="stat-country">
                      {displayCountry.country}
                      {hasMultiple && ` +${favorites.length - 1}`}
                    </div>
                    <div className="stat-label">
                      Favorite{hasMultiple ? "s" : ""} (
                      {displayCountry.loveRating > 10
                        ? "∞"
                        : displayCountry.loveRating}
                      )
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="stat-card">
              {latestVisit && (
                <img
                  src={`https://flagcdn.com/64x48/${getAlpha2FromAlpha3(
                    latestVisit.countryCode,
                  )}.png`}
                  alt={`${latestVisit.country} flag`}
                  className="country-flag"
                  style={{ width: "48px", height: "36px", marginBottom: "8px" }}
                />
              )}
              <div className="stat-country">
                {latestVisit ? latestVisit.country : "None yet"}
              </div>
              <div className="stat-label">Latest Trip</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
