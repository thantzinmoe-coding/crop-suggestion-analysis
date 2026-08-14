import React, { useState, useRef } from 'react';
import axios from 'axios';
import {
  CircleDollarSign,
  CircleCheck,
  Droplets,
  FlaskConical,
  LandPlot,
  Leaf,
  Lightbulb,
  MapPin,
  Satellite,
  Scale,
  Sparkles,
  Sprout,
  ThermometerSun,
  TriangleAlert,
  Wheat,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useLanguage } from '../contexts/LanguageContext';
import { API_BASE_URL, authHeaders } from '../api';

const mockSuggestions = {
  Rice: { icon: '🌾', match: 94, marketRate: 1450, yieldPerAcre: 2100, reason: 'Warm temperatures, balanced soil pH, and strong rainfall make these conditions well suited for rice.' },
  Maize: { icon: '🌽', match: 89, marketRate: 980, yieldPerAcre: 1800, reason: 'The current temperature and soil conditions support strong maize establishment and healthy growth.' },
  Chickpea: { icon: '🌱', match: 86, marketRate: 3200, yieldPerAcre: 850, reason: 'Low rainfall and near-neutral soil favor chickpea, which performs well in relatively dry conditions.' },
};

const cropDetails = {
  ...mockSuggestions,
  Corn: { icon: '🌽', match: 89, marketRate: 980, yieldPerAcre: 1800, reason: 'The current conditions support strong corn establishment and healthy growth.' },
  Wheat: { icon: '🌾', match: 85, marketRate: 1250, yieldPerAcre: 1500, reason: 'Cooler temperatures make these conditions suitable for wheat.' },
  Beans: { icon: '🌱', match: 84, marketRate: 2600, yieldPerAcre: 900, reason: 'Moderate rainfall and temperature provide suitable growing conditions for beans.' },
  Sesame: { icon: '🌿', match: 88, marketRate: 3500, yieldPerAcre: 650, reason: 'Lower rainfall favors drought-tolerant sesame.' },
};

const cropIconMap = {
  Rice: Wheat,
  Wheat,
  Corn: Sprout,
  Beans: Leaf,
  Sesame: Leaf,
};

function CropIcon({ cropKey, size = 32 }) {
  const Icon = cropIconMap[cropKey] || Sprout;
  return <Icon size={size} strokeWidth={1.8} aria-hidden="true" />;
}

function AdvisoryIcon({ severity }) {
  if (severity === 'warning' || severity === 'danger') {
    return <TriangleAlert size={20} aria-hidden="true" />;
  }
  if (severity === 'success') {
    return <CircleCheck size={20} aria-hidden="true" />;
  }
  return <Lightbulb size={20} aria-hidden="true" />;
}

export default function CropSuggestion() {
  const { t, language } = useLanguage();
  const { currentUser } = useAuth();
  const [shareStatus, setShareStatus] = useState('');
  
  // Form data — auto-filled by satellite or entered manually
  const [formData, setFormData] = useState({
    soil_pH: 6.5,
    rainfall_mm: 0,
    temperature_c: 28.0,
  });
  
  // Location & weather state
  const [mode, setMode] = useState('auto'); // 'auto' or 'manual'
  const [locStatus, setLocStatus] = useState('idle'); // idle | detecting | fetching | done | error
  const [weatherData, setWeatherData] = useState(null);
  const [locError, setLocError] = useState(null);
  
  // ML prediction state
  const [suggestion, setSuggestion] = useState(null);
  const [predictionConfidence, setPredictionConfidence] = useState(null);
  const [predictionRecommendations, setPredictionRecommendations] = useState([]);
  const [selectedRecommendationIndex, setSelectedRecommendationIndex] = useState(0);
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [error, setError] = useState(null);
  const [marketWeight, setMarketWeight] = useState(100);
  
  const streamedTextRef = useRef('');

  const handleChange = (e) => {
    const value = e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value === '' ? '' : Number(value)
    });
  };

  // ─── Auto-Detect Location ──────────────────────────────────────
  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocError(t('loc.error'));
      setLocStatus('error');
      return;
    }

    setLocStatus('detecting');
    setLocError(null);
    setWeatherData(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocStatus('fetching');

        try {
          const response = await axios.post(`${API_BASE_URL}/location-weather`, {
            latitude,
            longitude,
            language
          });

          const data = response.data;
          setWeatherData(data);

          // Auto-fill form with satellite data
          setFormData({
            soil_pH: data.current.soil_pH_estimate,
            rainfall_mm: data.current.rainfall_7d_mm,
            temperature_c: data.current.temperature_c,
          });

          setLocStatus('done');
        } catch (err) {
          console.error('Weather fetch error:', err);
          setLocError(t('loc.error'));
          setLocStatus('error');
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        if (err.code === err.PERMISSION_DENIED) {
          setLocError(t('loc.permDenied'));
        } else {
          setLocError(t('loc.error'));
        }
        setLocStatus('error');
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  // ─── LLM Crop Explanation ─────────────────────────────────────
  const fetchExplanation = async (crop) => {
    setExplaining(true);
    setExplanation('');
    streamedTextRef.current = '';
    
    try {
      const response = await fetch(`${API_BASE_URL}/crop-explanation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, crop, language })
      });

      if (!response.body) throw new Error('ReadableStream not supported.');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let buffer = '';
      let streamDone = false;
      
      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.content) {
                streamedTextRef.current += data.content;
                setExplanation(streamedTextRef.current);
              }
              if (data.done) streamDone = true;
            } catch (e) { /* skip */ }
          }
        }
      }
    } catch (err) {
      console.error(err);
      setExplanation(t('chat.error'));
    } finally {
      setExplaining(false);
    }
  };

  // ─── Submit Prediction ────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuggestion(null);
    setPredictionRecommendations([]);
    setSelectedRecommendationIndex(0);
    setExplanation('');
    
    try {
      const payload = Object.fromEntries(
        Object.entries(formData)
          .filter(([, value]) => value !== '' && value !== null && value !== undefined)
          .map(([key, value]) => [key, Number(value)])
      );
      if (weatherData?.region?.name_en) payload.admin1 = weatherData.region.name_en;
      if (Object.values(payload).some((value) => typeof value === 'number' && !Number.isFinite(value))) {
        setError('Please enter valid numbers for all crop conditions.');
        setLoading(false);
        return;
      }
      const response = await axios.post(
        `${API_BASE_URL}/crop-suggestion`,
        { ...payload, language }
      );
      const crop = response.data.crop;
      setSuggestion(crop);
      setPredictionConfidence(response.data.confidencePercent);
      setPredictionRecommendations(response.data.recommendations || []);
      setSelectedRecommendationIndex(0);
      setExplanation(
        response.data.recommendations?.[0]?.description
        || `${crop} is the best rule-based match for the supplied conditions.`
      );
      setLoading(false);
    } catch (err) {
      console.error('Crop prediction error:', err);
      setError(err.response?.data?.detail || 'Unable to get a crop suggestion.');
      setLoading(false);
    }
  };

  const selectedRecommendation =
    predictionRecommendations[selectedRecommendationIndex] || null;

  const selectedPrice = Number(selectedRecommendation?.marketPriceMmkPerKg) || 0;

  const selectRecommendation = (recommendation, index) => {
    setSelectedRecommendationIndex(index);
    setSuggestion(recommendation.crop);
    setPredictionConfidence(recommendation.suitabilityPercent);
    setExplanation(recommendation.description);
  };

  const shareToCommunity = async () => {
    if (!currentUser || !selectedRecommendation) return;

    try {
      setShareStatus('Sharing...');
      const response = await fetch(`${API_BASE_URL}/community/posts`, {
        method: 'POST',
        headers: authHeaders(currentUser.token, true),
        body: JSON.stringify({
          userId: currentUser.id,
          userName: currentUser.email?.split('@')[0] || 'Farmer',
          content: `I checked crop suitability for ${selectedRecommendation.crop}. The model suggests ${selectedRecommendation.suitabilityPercent}% suitability in this field. ${selectedRecommendation.description}`,
          postType: 'analysis',
          crop: selectedRecommendation.crop,
          region: weatherData?.region?.name_en || weatherData?.region?.name_my || 'Local field',
          sourceAnalysisId: `crop-suggestion-${Date.now()}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Unable to share analysis to the community.');
      }

      setShareStatus('Analysis shared successfully.');
    } catch (err) {
      console.error('Share analysis error:', err);
      setShareStatus(err.message || 'Unable to share analysis.');
    }
  };

  const saveAnalysis = async () => {
    if (!currentUser || !selectedRecommendation) return;
    try {
      const response = await fetch(`${API_BASE_URL}/social/saved-analyses`, {
        method: 'POST',
        headers: authHeaders(currentUser.token, true),
        body: JSON.stringify({
          title: `${selectedRecommendation.crop} suitability analysis`,
          analysisType: 'crop-suggestion',
          summary: `${selectedRecommendation.suitabilityPercent}% suitability. ${selectedRecommendation.description}`,
          crop: selectedRecommendation.crop,
          region: weatherData?.region?.name_en || weatherData?.region?.name_my || 'Local field',
          metadata: { suitabilityPercent: selectedRecommendation.suitabilityPercent, marketPriceMmkPerKg: selectedPrice },
        }),
      });
      if (!response.ok) throw new Error('Unable to save analysis.');
      setShareStatus('Analysis saved to your account.');
    } catch (err) {
      setShareStatus(err.message);
    }
  };

  return (
    <div className={`crop-suggestion ${language === 'my' ? 'language-my' : ''}`}>
      <section className="crop-page-hero" aria-labelledby="crop-page-title">
        <div className="crop-page-hero-copy">
          <p className="crop-page-eyebrow"><Sparkles size={15} /> {t('crop.pageEyebrow')}</p>
          <h1 id="crop-page-title">
            {language === 'my' ? 'သင့်လယ်ကွင်းအတွက် သင့်တော်သော သီးနှံကို ရွေးချယ်ပါ။' : 'Choose what grows best here.'}
          </h1>
          <p>{t('crop.subtitle')}</p>
          <div className="crop-page-benefits" aria-label="Planner benefits">
            <span><Satellite size={16} /> {t('crop.benefitSatellite')}</span>
            <span><LandPlot size={16} /> {t('crop.benefitLocal')}</span>
            <span><Sprout size={16} /> {t('crop.benefitGuidance')}</span>
          </div>
        </div>
        <Sprout className="crop-page-hero-art" size={250} strokeWidth={0.7} aria-hidden="true" />
      </section>

      <div className="crop-planner-grid">
        <section className="crop-planner-card crop-source-card" aria-labelledby="crop-source-title">
          <header className="crop-card-heading">
            <span>01</span>
            <div><p>{t('crop.fieldData')}</p><h2 id="crop-source-title">{t('crop.chooseSource')}</h2></div>
          </header>

          <div className="mode-toggle crop-mode-toggle">
            <button type="button" className={mode === 'auto' ? 'active' : ''} onClick={() => setMode('auto')}><Satellite size={16} /> {t('loc.autoMode')}</button>
            <button type="button" className={mode === 'manual' ? 'active' : ''} onClick={() => setMode('manual')}><FlaskConical size={16} /> {t('loc.manualMode')}</button>
          </div>

          {mode === 'auto' ? (
            <div className="crop-source-action">
              <div className="crop-source-intro">
                <MapPin size={22} aria-hidden="true" />
                <div><strong>{t('crop.currentLocation')}</strong><p>{t('crop.retrieveWeather')}</p></div>
              </div>
              <button className="detect-btn" type="button" onClick={detectLocation} disabled={locStatus === 'detecting' || locStatus === 'fetching'}>
                {locStatus === 'detecting' && <><span className="spinner" /> {t('loc.detecting')}</>}
                {locStatus === 'fetching' && <><span className="spinner" /> {t('loc.fetchWeather')}</>}
                {(locStatus === 'idle' || locStatus === 'error' || locStatus === 'done') && <><MapPin size={17} /> {t('loc.detect')}</>}
              </button>
              {locError && <p className="crop-location-error" role="alert">{locError}</p>}

              {weatherData && (
                <div className="crop-weather-summary">
                  <div className="region-badge"><MapPin size={16} />{language === 'my' ? weatherData.region.name_my : weatherData.region.name_en}</div>
                  <div className="weather-grid">
                    <div className="weather-card"><ThermometerSun size={20} /><div className="weather-label">{t('loc.currentTemp')}</div><div className="weather-value">{weatherData.current.temperature_c}<span className="weather-unit">°C</span></div></div>
                    <div className="weather-card"><Droplets size={20} /><div className="weather-label">{t('loc.rain7d')}</div><div className="weather-value">{weatherData.current.rainfall_7d_mm}<span className="weather-unit">mm</span></div></div>
                    {weatherData.current.humidity_pct && <div className="weather-card"><Droplets size={20} /><div className="weather-label">{t('loc.humidity')}</div><div className="weather-value">{weatherData.current.humidity_pct}<span className="weather-unit">%</span></div></div>}
                    <div className="weather-card"><FlaskConical size={20} /><div className="weather-label">{t('loc.soilPh')}</div><div className="weather-value">{weatherData.current.soil_pH_estimate}</div></div>
                  </div>
                  <span className="data-source-tag"><Satellite size={12} /> {t('loc.source')}</span>
                  <p className="crop-weather-note">{t('loc.phNote')}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="crop-manual-note"><FlaskConical size={22} aria-hidden="true" /><div><strong>{t('crop.ownMeasurements')}</strong><p>{t('crop.enterReadings')}</p></div></div>
          )}
        </section>

        <form onSubmit={handleSubmit} className="crop-planner-card crop-web-form" aria-labelledby="crop-conditions-title">
          <header className="crop-card-heading">
            <span>02</span>
            <div><p>{t('crop.growingConditions')}</p><h2 id="crop-conditions-title">{t('crop.reviewField')}</h2></div>
          </header>
          {mode === 'auto' && weatherData && <p className="crop-form-note">{t('loc.override')}</p>}
          <div className="form-group"><label htmlFor="soil-pH"><FlaskConical size={17} /> {t('crop.soilPh')}</label><input id="soil-pH" type="number" name="soil_pH" step="0.1" value={formData.soil_pH} onChange={handleChange} required /></div>
          <div className="form-group"><label htmlFor="rainfall"><Droplets size={17} /> {t('crop.rainfall')}</label><input id="rainfall" type="number" name="rainfall_mm" step="1" value={formData.rainfall_mm} onChange={handleChange} required /></div>
          <div className="form-group"><label htmlFor="temperature"><ThermometerSun size={17} /> {t('crop.temp')}</label><input id="temperature" type="number" name="temperature_c" step="0.1" value={formData.temperature_c} onChange={handleChange} required /></div>
          <button type="submit" className="btn btn-primary crop-suggestion-submit" disabled={loading || explaining}><Sprout size={18} />{loading ? t('crop.analyzing') : t('crop.suggestBtn')}</button>
          {error && <p className="crop-suggestion-error" role="alert">{error}</p>}
        </form>
      </div>

      {weatherData && weatherData.advisories?.length > 0 && mode === 'auto' && (
        <section className="crop-advisories-section">
          <header><Lightbulb size={21} /><div><p>{t('crop.currentConditions')}</p><h2>{t('loc.advisories')}</h2></div></header>
          <div className="advisories-container">
            {weatherData.advisories.map((adv, idx) => (
              <div key={idx} className={`advisory-card ${adv.severity}`}>
                <div className="advisory-icon"><AdvisoryIcon severity={adv.severity} /></div>
                <div className="advisory-content"><div className="advisory-title">{language === 'my' ? adv.title_my : adv.title_en}</div><div className="advisory-message">{language === 'my' ? adv.message_my : adv.message_en}</div></div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div hidden>
      <h2 className="m-0 text-xl font-semibold">{t('crop.title')}</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        {t('crop.subtitle')}
      </p>

      <div className="crop-input-layout">
        {/* ─── Left Panel: Location + Inputs ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignSelf: 'start' }}>

          {/* Mode Toggle */}
          <div className="mode-toggle">
            <button className={mode === 'auto' ? 'active' : ''} onClick={() => setMode('auto')}>
              <Satellite size={14} style={{display:'inline', marginRight:'0.4rem', verticalAlign:'text-bottom'}}/> {t('loc.autoMode')}
            </button>
            <button className={mode === 'manual' ? 'active' : ''} onClick={() => setMode('manual')}>
               {t('loc.manualMode')}
            </button>
          </div>

          {/* Auto Mode: Detect Location */}
          {mode === 'auto' && (
            <div className="glass-panel">
              <button 
                className="detect-btn"
                onClick={detectLocation}
                disabled={locStatus === 'detecting' || locStatus === 'fetching'}
              >
                {locStatus === 'detecting' && <><div className="spinner" /> {t('loc.detecting')}</>}
                {locStatus === 'fetching' && <><div className="spinner" /> {t('loc.fetchWeather')}</>}
                {(locStatus === 'idle' || locStatus === 'error' || locStatus === 'done') && (
                  <><div className="pulse-dot" /> {t('loc.detect')}</>
                )}
              </button>

              {locError && (
                <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '0.75rem', textAlign: 'center' }}>
                  {locError}
                </p>
              )}

              {/* Weather Data Cards */}
              {weatherData && (
                <div style={{ marginTop: '1.25rem', animation: 'fadeIn 0.5s ease' }}>
                  {/* Region Badge */}
                  <div className="region-badge">
                    <MapPin size={16} />
                    {language === 'my' ? weatherData.region.name_my : weatherData.region.name_en}
                  </div>

                  <div className="weather-grid">
                    <div className="weather-card">
                      <div className="weather-icon">🌡️</div>
                      <div className="weather-label">{t('loc.currentTemp')}</div>
                      <div className="weather-value">
                        {weatherData.current.temperature_c}<span className="weather-unit">°C</span>
                      </div>
                    </div>
                    <div className="weather-card">
                      <div className="weather-icon">🌧️</div>
                      <div className="weather-label">{t('loc.rain7d')}</div>
                      <div className="weather-value">
                        {weatherData.current.rainfall_7d_mm}<span className="weather-unit">mm</span>
                      </div>
                    </div>
                    {weatherData.current.humidity_pct && (
                      <div className="weather-card">
                        <div className="weather-icon">💧</div>
                        <div className="weather-label">{t('loc.humidity')}</div>
                        <div className="weather-value">
                          {weatherData.current.humidity_pct}<span className="weather-unit">%</span>
                        </div>
                      </div>
                    )}
                    <div className="weather-card">
                      <div className="weather-icon">🧪</div>
                      <div className="weather-label">{t('loc.soilPh')}</div>
                      <div className="weather-value">
                        {weatherData.current.soil_pH_estimate}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span className="data-source-tag">
                      <Satellite size={12} /> {t('loc.source')}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    {t('loc.phNote')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ─── Smart Advisories ─── */}
          {weatherData && weatherData.advisories && weatherData.advisories.length > 0 && mode === 'auto' && (
            <div className="glass-panel" style={{ animation: 'fadeIn 0.5s ease' }}>
              <h3 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lightbulb size={20} /> {t('loc.advisories')}
              </h3>
              <div className="advisories-container">
                {weatherData.advisories.map((adv, idx) => (
                  <div key={idx} className={`advisory-card ${adv.severity}`}>
                    <div className="advisory-icon">
                      <AdvisoryIcon severity={adv.severity} />
                    </div>
                    <div className="advisory-content">
                      <div className="advisory-title">
                        {language === 'my' ? adv.title_my : adv.title_en}
                      </div>
                      <div className="advisory-message">
                        {language === 'my' ? adv.message_my : adv.message_en}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Input Form (always visible) ─── */}
          <form onSubmit={handleSubmit} className="glass-panel crop-suggestion-form">
            {mode === 'auto' && weatherData && (
              <p className="crop-form-note">
                {t('loc.override')}
              </p>
            )}
            <div className="form-group">
              <label><FlaskConical size={16} style={{display:'inline', marginRight:'0.5rem', verticalAlign:'text-bottom'}}/> {t('crop.soilPh')}</label>
              <input 
                type="number" 
                name="soil_pH" 
                step="0.1" 
                value={formData.soil_pH} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label><Droplets size={16} style={{display:'inline', marginRight:'0.5rem', verticalAlign:'text-bottom'}}/> {t('crop.rainfall')}</label>
              <input 
                type="number" 
                name="rainfall_mm" 
                step="1" 
                value={formData.rainfall_mm} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label><ThermometerSun size={16} style={{display:'inline', marginRight:'0.5rem', verticalAlign:'text-bottom'}}/> {t('crop.temp')}</label>
              <input 
                type="number" 
                name="temperature_c" 
                step="0.1" 
                value={formData.temperature_c} 
                onChange={handleChange} 
                required 
              />
            </div>
            <button type="submit" className="btn btn-primary crop-suggestion-submit" disabled={loading || explaining}>
              <Sprout size={18} />
              {loading ? t('crop.analyzing') : t('crop.suggestBtn')}
            </button>
            {error && (
              <p className="crop-suggestion-error" role="alert">
                {error}
              </p>
            )}
          </form>
        </div>

        {/* ─── Right Panel: Result ─── */}
        <div className="suggestion-result-slot" style={{ display: 'none' }}>
          {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
          
          {suggestion ? (
            <div className="suggestion-dashboard">
              <div className="suggestion-hero">
                <div className="suggestion-crop-icon">
                  <CropIcon cropKey={selectedRecommendation?.cropKey} size={42} />
                </div>
                <div>
                  <p className="suggestion-eyebrow">{t('crop.recommended')}</p>
                  <h2>{suggestion}</h2>
                  <span className="match-badge">{predictionConfidence ?? cropDetails[suggestion]?.match}% model confidence</span>
                </div>
              </div>

              <div className="suggestion-stats">
                <div><span>Best season</span><strong>{cropDetails[suggestion]?.season || 'Varies'}</strong></div>
                <div><span>Harvest time</span><strong>{cropDetails[suggestion]?.harvest || 'Varies'}</strong></div>
                <div><span>Water need</span><strong>{cropDetails[suggestion]?.water || 'Varies'}</strong></div>
              </div>
              
              <div className="ai-explanation">
                <div className="ai-explanation-header">
                  <Sparkles size={18} /> {t('crop.analysis')}
                </div>
                {explanation || (explaining && <div className="typing-indicator" style={{ padding: 0 }}><span></span><span></span><span></span></div>)}
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', margin: 'auto', padding: '3rem 1rem' }}>
              <Sprout size={64} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>{t('crop.fillForm')}</p>
            </div>
          )}
        </div>
      </div>
      </div>

      {suggestion && selectedRecommendation && (
        <div className="suggestion-modal-backdrop" onClick={() => setSuggestion(null)}>
          <section className="suggestion-pop-card" role="dialog" aria-modal="true" aria-label="Crop suggestion" onClick={(event) => event.stopPropagation()}>
            <button className="suggestion-close" type="button" aria-label="Close" onClick={() => setSuggestion(null)}>
              <X size={20} />
            </button>
            <div className="suggestion-crop-icon">
              <CropIcon cropKey={selectedRecommendation.cropKey} size={42} />
            </div>
            <p className="suggestion-eyebrow">{t('crop.recommended')}</p>
            <h2>{selectedRecommendation.crop}</h2>
            <span className="match-badge">{selectedRecommendation.suitabilityPercent}% {t('crop.suitable')}</span>
            <p className="suggestion-pop-reason">{selectedRecommendation.description}</p>

            {(selectedRecommendation.sunlight || selectedRecommendation.growthPeriodYears) && (
              <div className="crop-profile-note">
                <span>{t('crop.growingProfile')}</span>
                {selectedRecommendation.sunlight && <strong>{selectedRecommendation.sunlight}</strong>}
                {selectedRecommendation.growthPeriodYears && <strong>{selectedRecommendation.growthPeriodYears} {t('crop.yearGrowth')}</strong>}
                {selectedRecommendation.waterNeedLitersPerDay > 0 && <strong>{selectedRecommendation.waterNeedLitersPerDay} {t('crop.waterNeed')}</strong>}
              </div>
            )}

            <div className="crop-market-price-summary">
              <span>{t('crop.latestMarketPrice')}</span>
              <strong>{selectedPrice.toLocaleString()} MMK/kg</strong>
              <small>{selectedRecommendation.marketPriceSource || 'Project history'}{selectedRecommendation.marketPriceObservedDate ? ` · ${selectedRecommendation.marketPriceObservedDate}` : ''}</small>
            </div>

            {predictionRecommendations.length > 1 && (
              <div className="recommendation-options" aria-label={t('crop.chooseCrop')}>
                {predictionRecommendations.map((recommendation, index) => (
                  <button
                    type="button"
                    key={recommendation.crop}
                    className={`recommendation-option ${selectedRecommendationIndex === index ? 'active' : ''}`}
                    aria-pressed={selectedRecommendationIndex === index}
                    onClick={() => selectRecommendation(recommendation, index)}
                  >
                    <span className="recommendation-option-name">
                      <span className="recommendation-option-icon">
                        <CropIcon cropKey={recommendation.cropKey} size={22} />
                      </span>
                      <span>
                        <small>{t('crop.option')} {index + 1}</small>
                        <strong>{recommendation.crop}</strong>
                      </span>
                    </span>
                    <span className="recommendation-score">{recommendation.suitabilityPercent}%</span>
                  </button>
                ))}
              </div>
            )}

            <div className="crop-calculators crop-market-calculator">
              <div className="crop-calculator-card">
                <div className="calculator-heading">
                  <span><CircleDollarSign size={18} /> {t('crop.marketValue')}</span>
                  <small>{selectedPrice.toLocaleString()} MMK/kg</small>
                </div>
                <label htmlFor="market-weight"><Scale size={14} /> {t('crop.productWeight')}</label>
                <input
                  id="market-weight"
                  type="number"
                  min="0"
                  step="1"
                  value={marketWeight}
                  onChange={(event) => setMarketWeight(Math.max(0, Number(event.target.value)))}
                />
                <p className="calculator-result">
                  <span>{t('crop.estimatedValue')}</span>
                  <strong>{(marketWeight * selectedPrice).toLocaleString()} MMK</strong>
                </p>
              </div>

            </div>
            <div className="flex gap-3">
              <button type="button" className="btn btn-secondary" onClick={() => setSuggestion(null)}>{t('common.close')}</button>
              <button type="button" className="btn btn-secondary" onClick={saveAnalysis} disabled={!currentUser}>
                {currentUser ? 'Save analysis' : 'Login to save'}
              </button>
              <button type="button" className="btn btn-primary" onClick={shareToCommunity} disabled={!currentUser}>
                {currentUser ? 'Share to community' : 'Login to share'}
              </button>
            </div>
            {shareStatus && <p className="crop-suggestion-error" style={{ marginTop: '0.8rem', marginBottom: 0 }}>{shareStatus}</p>}
          </section>
        </div>
      )}
    </div>
  );
}
