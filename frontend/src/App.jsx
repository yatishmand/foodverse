import { useEffect, useState } from "react";

const features = [
  { id: "scanner", label: "Food Scanner", icon: "◉" },
  { id: "freshness", label: "Freshness Checker", icon: "✳" },
  { id: "cooking", label: "Cooking Assistant", icon: "♨" },
  { id: "nutrition", label: "Nutrition Planner", icon: "▤" },
  { id: "hygiene", label: "Hygiene Monitor", icon: "⌕" },
];

const configuredApiUrl = (import.meta.env.VITE_API_BASE_URL || "").trim();
const API_BASE_URL = configuredApiUrl
  ? `${/^https?:\/\//i.test(configuredApiUrl) ? "" : "https://"}${configuredApiUrl}`.replace(/\/$/, "")
  : "";

async function request(path, options) {
  const response = await fetch(`${API_BASE_URL}/api/${path}`, options);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.detail || "The request could not be completed.");
  }
  return payload;
}

function ImageFeature({ kind, title, description, buttonText }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreview("");
      return undefined;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  async function submit(event) {
    event.preventDefault();
    if (!file) {
      setError("Choose an image before continuing.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    const body = new FormData();
    body.append("image", file);
    try {
      setResult(await request(kind, { method: "POST", body }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <span className="feature-icon">{kind === "scanner" ? "◉" : kind === "freshness" ? "✳" : "⌕"}</span>
        <div><h2>{title}</h2><p>{description}</p></div>
      </div>
      <form onSubmit={submit}>
        <label className="upload-box">
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              setFile(event.target.files?.[0] || null);
              setResult(null);
              setError("");
            }}
          />
          <span className="upload-symbol">＋</span>
          <strong>{file ? file.name : "Choose an image"}</strong>
          <span>JPG, PNG or another image format</span>
        </label>
        {preview && <img className="image-preview" src={preview} alt="Selected food preview" />}
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "Checking…" : buttonText}
        </button>
      </form>
      {error && <p className="error-message" role="alert">{error}</p>}
      {result && <ResultCard result={result} />}
    </section>
  );
}

function ResultCard({ result }) {
  return (
    <div className="result-card" aria-live="polite">
      <div className="result-title">
        <h3>{result.title}</h3>
        <span className="demo-tag">DEMO RESULT</span>
      </div>
      {result.summary && <p>{result.summary}</p>}
      {result.nutrition && (
        <div className="nutrition-grid">
          {Object.entries(result.nutrition).map(([key, value]) => (
            <div className="nutrition-item" key={key}><strong>{value}</strong><span>{key}</span></div>
          ))}
        </div>
      )}
      {result.indicators && (
        <ul className="indicator-list">{result.indicators.map((item) => <li key={item}>{item}</li>)}</ul>
      )}
      {result.note && <p className="disclaimer">{result.note}</p>}
    </div>
  );
}

function TextFeature({ kind, title, description, placeholder, label, buttonText }) {
  const [value, setValue] = useState("");
  const [preferences, setPreferences] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (!value.trim()) {
      setError(`Please enter ${kind === "cooking" ? "at least one ingredient" : "your meal preferences"}.`);
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const body = kind === "cooking"
        ? { ingredients: value }
        : { preferences: value, dietary_restrictions: preferences };
      setResult(await request(kind, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <span className="feature-icon">{kind === "cooking" ? "♨" : "▤"}</span>
        <div><h2>{title}</h2><p>{description}</p></div>
      </div>
      <form onSubmit={submit}>
        <label className="field-label" htmlFor={`${kind}-input`}>{label}</label>
        <textarea id={`${kind}-input`} rows="4" value={value} onChange={(event) => setValue(event.target.value)} placeholder={placeholder} />
        {kind === "nutrition" && (
          <>
            <label className="field-label" htmlFor="diet-input">Dietary preferences (optional)</label>
            <input id="diet-input" value={preferences} onChange={(event) => setPreferences(event.target.value)} placeholder="e.g. vegetarian, gluten-free" />
          </>
        )}
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "Making a plan…" : buttonText}
        </button>
      </form>
      {error && <p className="error-message" role="alert">{error}</p>}
      {result && <ResultCard result={result} />}
    </section>
  );
}

function App() {
  const [active, setActive] = useState("scanner");
  const activeFeature = features.find((feature) => feature.id === active);

  function renderFeature() {
    switch (active) {
      case "scanner":
        return <ImageFeature kind="scanner" title="Food Scanner" description="Get a quick, estimated nutrition snapshot from a food photo." buttonText="Scan food" />;
      case "freshness":
        return <ImageFeature kind="freshness" title="Freshness Checker" description="Review visible cues that may indicate freshness or spoilage." buttonText="Check freshness" />;
      case "hygiene":
        return <ImageFeature kind="hygiene" title="Hygiene Monitor" description="Check a scene for possible visible cleanliness concerns." buttonText="Review image" />;
      case "cooking":
        return <TextFeature kind="cooking" title="Cooking Assistant" description="Turn the ingredients you have into a simple recipe idea." label="Your ingredients" placeholder="e.g. chickpeas, spinach, tomatoes, garlic" buttonText="Suggest a recipe" />;
      default:
        return <TextFeature kind="nutrition" title="Nutrition Planner" description="Create a simple one-day meal plan around your preferences." label="What are your goals or preferences?" placeholder="e.g. balanced meals, more vegetables, quick preparation" buttonText="Create meal plan" />;
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Food Verse AI home"><span className="brand-mark">fv</span><span>food verse <strong>AI</strong></span></a>
        <span className="demo-tag header-demo">DEMO PROJECT</span>
      </header>
      <main>
        <section className="welcome">
          <p className="eyebrow">A LITTLE MORE MINDFUL, EVERY DAY</p>
          <h1>Good food starts with <span>good choices.</span></h1>
          <p>Explore practical food tools, from your next recipe to a quick nutrition check.</p>
        </section>
        <div className="workspace">
          <aside className="sidebar" aria-label="Food tools">
            <p className="sidebar-label">YOUR TOOLS</p>
            <nav>
              {features.map((feature) => (
                <button key={feature.id} className={`nav-item ${active === feature.id ? "active" : ""}`} onClick={() => setActive(feature.id)}>
                  <span className="nav-icon" aria-hidden="true">{feature.icon}</span>{feature.label}
                </button>
              ))}
            </nav>
            <div className="sidebar-note"><span>✦</span><p>Small steps toward feeling good about what you eat.</p></div>
          </aside>
          <div className="content-area">
            <div className="content-heading"><div><p className="eyebrow">FOOD VERSE TOOLKIT</p><h2>{activeFeature.label}</h2></div><span className="demo-tag">SAMPLE DATA</span></div>
            {renderFeature()}
            <p className="site-note">Demo only: image checks use sample responses and do not actually analyze image contents. Nutrition estimates are illustrative, not medical advice.</p>
          </div>
        </div>
      </main>
      <footer>Made for everyday food inspiration <span>·</span> Food Verse AI</footer>
    </div>
  );
}

export default App;
