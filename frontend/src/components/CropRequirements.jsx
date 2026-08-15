import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  Droplets,
  FlaskConical,
  Search,
  Sprout,
  Sun,
  ThermometerSun,
} from 'lucide-react'
import { API_BASE_URL } from '../api'
import { useLanguage } from '../contexts/LanguageContext'

const POPULAR_CROPS = ['Rice', 'Corn', 'Wheat', 'Mint', 'Tomato', 'Potato']

export default function CropRequirements() {
  const { language, t } = useLanguage()
  const [query, setQuery] = useState('')
  const [catalog, setCatalog] = useState([])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    axios.get(`${API_BASE_URL}/crop-requirements`, {
      params: { language, limit: 100 },
      signal: controller.signal,
    }).then((response) => {
      const crops = response.data || []
      setCatalog(crops)
      setResult((current) => {
        if (!current) return current
        return crops.find((crop) => crop.cropKey === current.cropKey) || current
      })
    }).catch((requestError) => {
      if (requestError.code !== 'ERR_CANCELED') {
        setCatalog([])
        setError(t('requirements.error'))
      }
    })
    return () => controller.abort()
  }, [language, t])

  const textSuggestions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    if (normalizedQuery) {
      return catalog
        .filter((crop) => (
          crop.crop.toLocaleLowerCase().includes(normalizedQuery)
          || crop.cropKey.toLocaleLowerCase().includes(normalizedQuery)
        ))
        .slice(0, 6)
    }

    const popular = POPULAR_CROPS
      .map((cropKey) => catalog.find((crop) => crop.cropKey === cropKey))
      .filter(Boolean)
    return popular.length ? popular : catalog.slice(0, 6)
  }, [catalog, query])

  const findRequirements = async (cropQuery) => {
    const cleanQuery = cropQuery.trim()
    if (!cleanQuery) {
      setError(t('requirements.enterCrop'))
      setResult(null)
      return
    }

    setLoading(true)
    setError('')
    try {
      const response = await axios.get(`${API_BASE_URL}/crop-requirements`, {
        params: { query: cleanQuery, language, limit: 10 },
      })
      const crop = response.data?.[0] || null
      setResult(crop)
      if (!crop) setError(t('requirements.notFound'))
    } catch (requestError) {
      console.error('Crop requirement search error:', requestError)
      setResult(null)
      setError(t('requirements.error'))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    findRequirements(query)
  }

  const chooseSuggestion = (crop) => {
    setQuery(crop.crop)
    findRequirements(crop.crop)
  }

  return (
    <div className={`crop-library-page ${language === 'my' ? 'language-my' : ''}`}>
      <section className="crop-library-hero" aria-labelledby="crop-library-title">
        <p className="crop-page-eyebrow"><Sprout size={16} /> {t('requirements.eyebrow')}</p>
        <h1 id="crop-library-title">{t('requirements.pageTitle')}</h1>
        <p>{t('requirements.pageSubtitle')}</p>
      </section>

      <section className="crop-requirements-card crop-requirements-page-card" aria-labelledby="crop-requirements-title">
        <div className="crop-requirements-copy">
          <p className="crop-page-eyebrow"><Search size={15} /> {t('requirements.searchEyebrow')}</p>
          <h2 id="crop-requirements-title">{t('requirements.title')}</h2>
          <p>{t('requirements.subtitle')}</p>
          <form className="crop-requirements-search" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="crop-requirement-query">{t('requirements.searchLabel')}</label>
            <input
              id="crop-requirement-query"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('requirements.placeholder')}
              autoComplete="off"
            />
            <button className="btn btn-primary" type="submit" disabled={loading}>
              <Search size={17} />
              {loading ? t('requirements.searching') : t('requirements.search')}
            </button>
          </form>

          <div className="crop-text-suggestions" aria-label={t('requirements.suggestionsLabel')}>
            <span>{query.trim() ? t('requirements.matchingSuggestions') : t('requirements.popularSuggestions')}</span>
            <div>
              {textSuggestions.map((crop) => (
                <button key={crop.cropKey} type="button" onClick={() => chooseSuggestion(crop)}>
                  {crop.crop}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="crop-suggestion-error" role="alert">{error}</p>}
        </div>

        {result ? (
          <div className="crop-requirements-result" aria-live="polite">
            <div className="crop-requirements-result-heading">
              <Sprout size={24} />
              <div><span>{t('requirements.resultFor')}</span><h3>{result.crop}</h3></div>
            </div>
            <div className="crop-requirements-grid">
              <div><ThermometerSun size={19} /><span>{t('requirements.temperature')}</span><strong>{result.averageTemperatureC}°C</strong></div>
              <div><Droplets size={19} /><span>{t('requirements.waterNeed')}</span><strong>{result.waterNeed}</strong></div>
              <div><FlaskConical size={19} /><span>{t('requirements.soilPh')}</span><strong>{result.averageSoilPh}</strong></div>
              <div><Droplets size={19} /><span>{t('requirements.humidity')}</span><strong>{result.averageHumidityPct}%</strong></div>
              <div><Sun size={19} /><span>{t('requirements.light')}</span><strong>{result.lightIntensity}</strong></div>
            </div>
          </div>
        ) : (
          <div className="crop-requirements-empty"><Sun size={54} /><p>{t('requirements.empty')}</p></div>
        )}
      </section>
    </div>
  )
}
