import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Heart, MapPin, Pencil, Save, Sprout, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { accountRequest } from '../accountApi.js'
import { API_BASE_URL } from '../api.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useLanguage } from '../contexts/LanguageContext.jsx'

const emptyProfile = { farmName: '', regionPcode: '', regionName: '', districtName: '', areaAcres: '', soilType: '', notes: '' }
const soilTypeOptions = [
  { value: 'Alluvial', my: 'နုန်းတင်မြေ (မြစ်ဝှမ်းမြေ)' },
  { value: 'Clay', my: 'ရွှံ့မြေ' },
  { value: 'Loam', my: 'သဲနုန်းမြေ (စိုက်ပျိုးရန်ကောင်းသောမြေ)' },
  { value: 'Sandy', my: 'သဲမြေ' },
  { value: 'Silt', my: 'နုန်းမြေ' },
  { value: 'Laterite', my: 'ဂဝံမြေ' },
  { value: 'Red soil', my: 'မြေနီ' },
  { value: 'Black soil', my: 'မြေမည်း' },
  { value: 'Peaty', my: 'သစ်ဆွေးမြေ' },
  { value: 'Gravelly', my: 'ကျောက်စရစ်မြေ' },
]

function normalizeSoilType(input) {
  const normalized = input.trim().toLocaleLowerCase()
  const option = soilTypeOptions.find((item) => (
    item.value.toLocaleLowerCase() === normalized || item.my === input.trim()
  ))
  return option?.value || input
}

function displaySoilType(value, language) {
  const option = soilTypeOptions.find((item) => item.value === value || item.my === value)
  if (!option) return value || ''
  return language === 'my' ? option.my : option.value
}

function hasRequiredProfile(profile) {
  return Boolean(profile?.farmName?.trim() && profile?.regionPcode && profile?.districtName?.trim() && profile?.areaAcres !== '' && profile?.areaAcres !== null && profile?.areaAcres !== undefined && Number(profile.areaAcres) > 0 && profile?.soilType?.trim())
}

export default function AccountPage() {
  const { currentUser } = useAuth()
  const { language, t } = useLanguage()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(emptyProfile)
  const [locations, setLocations] = useState([])
  const [history, setHistory] = useState([])
  const [favorites, setFavorites] = useState([])
  const [cropNameMap, setCropNameMap] = useState({})
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!currentUser) {
      navigate('/?auth=signin', { replace: true })
      return
    }
    Promise.all([
      accountRequest('/account/profile'),
      accountRequest('/account/history'),
      accountRequest('/account/favorites'),
      axios.get(`${API_BASE_URL}/analytics/ndvi-regions`),
    ]).then(([savedProfile, savedHistory, savedFavorites, regionResponse]) => {
      const nextProfile = { ...emptyProfile, ...savedProfile }
      setProfile(nextProfile)
      setEditingProfile(!hasRequiredProfile(nextProfile))
      setProfileLoaded(true)
      setHistory(savedHistory || [])
      setFavorites(savedFavorites || [])
      setLocations(regionResponse.data || [])
    }).catch((requestError) => {
      setError(language === 'my' ? t('account.requestError') : requestError.message)
      setProfileLoaded(true)
      setEditingProfile(true)
    })
  }, [currentUser, navigate])

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      axios.get(`${API_BASE_URL}/crop-requirements`, { params: { language: 'en', limit: 100 }, signal: controller.signal }),
      axios.get(`${API_BASE_URL}/crop-requirements`, { params: { language: 'my', limit: 100 }, signal: controller.signal }),
    ]).then(([englishResponse, myanmarResponse]) => {
      const myanmarByKey = new Map((myanmarResponse.data || []).map((crop) => [crop.cropKey, crop.crop]))
      const names = {}
      for (const crop of englishResponse.data || []) {
        const myanmarName = myanmarByKey.get(crop.cropKey)
        const displayName = language === 'my' ? (myanmarName || crop.crop) : crop.crop
        names[crop.cropKey.toLocaleLowerCase()] = displayName
        names[crop.crop.toLocaleLowerCase()] = displayName
        if (myanmarName) names[myanmarName.toLocaleLowerCase()] = displayName
      }
      setCropNameMap(names)
    }).catch((requestError) => {
      if (requestError.code !== 'ERR_CANCELED') setCropNameMap({})
    })
    return () => controller.abort()
  }, [language])

  const locationOptions = useMemo(() => {
    const states = new Map(locations.filter((item) => item.level === 'state').map((item) => [item.PCODE, item]))
    return locations.filter((item) => item.level === 'district' || item.PCODE?.includes('D')).map((district) => {
      const state = states.get(district.state_pcode || district.PCODE?.split('D')[0])
      return { ...district, regionName: state ? (language === 'my' ? state.name_my : state.name_en) : '', districtName: language === 'my' ? district.name_my : district.name_en }
    }).sort((a, b) => `${a.regionName} ${a.districtName}`.localeCompare(`${b.regionName} ${b.districtName}`))
  }, [language, locations])

  const updateProfileField = (field, value) => setProfile((current) => ({ ...current, [field]: value }))

  const displayCropName = (item) => {
    const cropKey = item.cropKey || item.crop || item.cropName || ''
    const savedName = item.crop || item.cropName || cropKey
    return cropNameMap[String(cropKey).toLocaleLowerCase()]
      || cropNameMap[String(savedName).toLocaleLowerCase()]
      || savedName
  }

  const selectLocation = (event) => {
    const selected = locationOptions.find((item) => item.PCODE === event.target.value)
    if (!selected) return
    setProfile((current) => ({ ...current, regionPcode: selected.PCODE, regionName: selected.regionName, districtName: selected.districtName }))
  }

  const updateProfile = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    if (!hasRequiredProfile(profile)) {
      setError(t('account.requiredProfile') || 'Please complete farm name, location, area, and soil type.')
      return
    }
    try {
      const saved = await accountRequest('/account/profile', { method: 'PUT', body: JSON.stringify(profile) })
      setProfile({ ...emptyProfile, ...saved })
      setEditingProfile(false)
      setMessage(t('account.saved') || 'Farm profile saved.')
    } catch (requestError) { setError(language === 'my' ? t('account.requestError') : requestError.message) }
  }

  const removeFavorite = async (cropKey) => {
    try {
      await accountRequest(`/account/favorites/${encodeURIComponent(cropKey)}`, { method: 'DELETE' })
      setFavorites((items) => items.filter((item) => item.cropKey !== cropKey))
    } catch (requestError) { setError(language === 'my' ? t('account.requestError') : requestError.message) }
  }

  if (!currentUser) return null
  if (!profileLoaded) return (
    <div className="account-page">
      <div className="account-page-heading"><div><p className="ndvi-controls-kicker">{t('account.kicker') || 'FARMER ACCOUNT'}</p><h1>{t('account.title') || 'My farm workspace'}</h1><p>{t('account.subtitle') || 'Save your farm context and return to useful analysis faster.'}</p></div><UserRound size={44} aria-hidden="true" /></div>
      <section className="glass-panel account-card"><p className="account-empty">{t('common.loading') || 'Loading your workspace...'}</p></section>
    </div>
  )

  return (
    <div className="account-page">
      <div className="account-page-heading"><div><p className="ndvi-controls-kicker">{t('account.kicker') || 'FARMER ACCOUNT'}</p><h1>{t('account.title') || 'My farm workspace'}</h1><p>{t('account.subtitle') || 'Save your farm context and return to useful analysis faster.'}</p></div><UserRound size={44} aria-hidden="true" /></div>
      {message && <p className="account-message">{message}</p>}
      {error && <p className="crop-suggestion-error" role="alert">{error}</p>}

      {editingProfile ? (
        <form className="glass-panel account-card account-profile-setup" onSubmit={updateProfile}>
          <div><h2><Sprout size={20} /> {hasRequiredProfile(profile) ? (t('account.editProfile') || 'Edit farm profile') : (t('account.setupProfile') || 'Set up your farm profile')}</h2><p className="account-required-note">{t('account.requiredProfile') || 'Complete these details to personalize your farm workspace.'}</p></div>
          <label>{t('account.farmName') || 'Farm name'}<input required value={profile.farmName || ''} onChange={(e) => updateProfileField('farmName', e.target.value)} placeholder={t('account.farmPlaceholder')} /></label>
          <label>{t('account.farmLocation') || 'Region and district'}<select required value={profile.regionPcode || ''} onChange={selectLocation}><option value="">{t('account.chooseLocation') || 'Choose a region and district'}</option>{locationOptions.map((item) => <option key={item.PCODE} value={item.PCODE}>{item.regionName} — {item.districtName}</option>)}</select></label>
          <label>{t('account.area') || 'Farm area (acres)'}<input required type="number" min="0.01" step="0.01" value={profile.areaAcres || ''} onChange={(e) => updateProfileField('areaAcres', e.target.value)} /></label>
          <label>{t('account.soilType') || 'Soil type'}<input required list="account-soil-types" value={displaySoilType(profile.soilType, language)} onChange={(e) => updateProfileField('soilType', normalizeSoilType(e.target.value))} placeholder={t('account.soilPlaceholder') || 'Choose or type a soil type'} /><datalist id="account-soil-types">{soilTypeOptions.map((soilType) => <option key={soilType.value} value={language === 'my' ? soilType.my : soilType.value} />)}</datalist><small className="account-field-help">{t('account.soilHelp')}</small></label>
          <label>{t('account.notes') || 'Notes'}<textarea value={profile.notes || ''} onChange={(e) => updateProfileField('notes', e.target.value)} rows="3" /></label>
          <div className="account-action-row"><button className="btn btn-primary" type="submit"><Save size={16} /> {t('account.saveProfile') || 'Save profile'}</button>{hasRequiredProfile(profile) && <button className="btn btn-secondary" type="button" onClick={() => setEditingProfile(false)}>{t('common.close') || 'Cancel'}</button>}</div>
        </form>
      ) : (
        <section className="glass-panel account-profile-summary"><div className="account-profile-summary-heading"><div><p className="ndvi-controls-kicker">{t('account.farmProfile') || 'FARM PROFILE'}</p><h2>{profile.farmName}</h2></div><button className="btn btn-secondary" type="button" onClick={() => setEditingProfile(true)}><Pencil size={16} /> {t('account.editProfile') || 'Edit profile'}</button></div><div className="account-profile-details"><span><MapPin size={16} /> {profile.regionName} — {profile.districtName}</span><span>{profile.areaAcres} {t('account.acres')}</span><span>{displaySoilType(profile.soilType, language)}</span></div>{profile.notes && <p className="account-profile-notes">{profile.notes}</p>}</section>
      )}

      <div className="account-grid">
        <section className="glass-panel account-card"><h2><Heart size={20} /> {t('account.favorites') || 'Favorite crops'}</h2>{favorites.length ? <div className="account-list">{favorites.map((item) => { const cropName = displayCropName(item); return <div className="account-list-row" key={item.cropKey}><strong>{cropName}</strong><button type="button" onClick={() => removeFavorite(item.cropKey)} aria-label={t('account.removeFavorite').replace('{crop}', cropName)}>×</button></div> })}</div> : <p className="account-empty">{t('account.noFavorites') || 'Favorite a crop from a recommendation to see it here.'}</p>}</section>
        <section className="glass-panel account-card"><h2><Sprout size={20} /> {t('account.history') || 'Recommendation history'}</h2>{history.length ? <div className="account-list">{history.map((item) => <div className="account-history-row" key={item.id || item.createdAt}><strong>{displayCropName(item)}</strong><span>{item.suitabilityPercent ? `${item.suitabilityPercent}%` : ''}</span><small>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</small></div>)}</div> : <p className="account-empty">{t('account.noHistory') || 'Saved recommendations will appear here.'}</p>}</section>
      </div>
    </div>
  )
}
