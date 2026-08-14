import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Satellite, Leaf, TrendingUp, Info } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { GeoJSON, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLanguage, pcodeMap } from '../contexts/LanguageContext';
import { API_BASE_URL } from '../api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const defaultMapCenter = [20.0, 96.0];
const mapIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], shadowSize: [41, 41],
});

function MapController({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, Math.max(map.getZoom(), 7));
  }, [map, position]);
  return null;
}

function MapClickSelector({ regions, onOutside }) {
  useMapEvents({
    click(event) {
      onOutside(event.latlng);
    },
  });
  return null;
}

export default function NDVIAnalysis() {
  const { t, language } = useLanguage();
  const [regions, setRegions] = useState([]);
  const [boundaries, setBoundaries] = useState(null);
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedPcode, setSelectedPcode] = useState('');
  const [ndviData, setNdviData] = useState({ labels: [], vim: [], viq: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mapWarning, setMapWarning] = useState('');
  const [mapMarkerPosition, setMapMarkerPosition] = useState(defaultMapCenter);

  useEffect(() => {
    const controller = new AbortController();

    const loadRegions = async () => {
      try {
        setError('');
        const response = await axios.get(
          `${API_BASE_URL}/analytics/ndvi-regions`,
          { signal: controller.signal }
        );
        const availableRegions = response.data || [];
        setRegions(availableRegions);
        const firstState = availableRegions.find((region) => !region.PCODE.includes('D'))?.PCODE || availableRegions[0]?.PCODE || '';
        setSelectedState((current) => current || firstState);
        setSelectedPcode((current) => current || firstState);
        const boundaryResponse = await axios.get(`${API_BASE_URL}/analytics/ndvi-boundaries`, { signal: controller.signal });
        setBoundaries(boundaryResponse.data || null);
      } catch (err) {
        if (err.code !== 'ERR_CANCELED') {
          console.error('NDVI regions error:', err);
          setError('Unable to load NDVI regions.');
          setLoading(false);
        }
      }
    };

    loadRegions();
    return () => controller.abort();
  }, []);

  const states = regions.filter((region) => region.level === 'state' || !region.PCODE.includes('D'));
  const districts = regions
    .filter((region) => region.level === 'district' && region.state_pcode === selectedState)
    .sort((a, b) => a.PCODE.localeCompare(b.PCODE));

  const getRegionName = (region) => {
    const name = language === 'my' ? region.name_my : region.name_en;
    if (name) return name;
    return region.PCODE;
  };

  const selectedRegion = regions.find((region) => region.PCODE === selectedPcode) || regions.find((region) => region.PCODE === selectedState);
  const mapPosition = selectedRegion && Number.isFinite(selectedRegion.latitude)
    ? [selectedRegion.latitude, selectedRegion.longitude]
    : defaultMapCenter;

  const selectRegionFromMap = (region, clickedPosition = null) => {
    const pcode = String(region.PCODE || region.pcode || '').trim();
    const matchedRegion = regions.find((item) => item.PCODE === pcode);
    if (!matchedRegion) return;
    setMapWarning('');
    const level = matchedRegion.level || (pcode.includes('D') ? 'district' : 'state');
    const statePcode = level === 'district'
      ? (matchedRegion.state_pcode || pcode.split('D')[0])
      : pcode;
    setSelectedState(statePcode || pcode);
    setSelectedDistrict(level === 'district' ? pcode : '');
    setSelectedPcode(pcode);
    setMapMarkerPosition(clickedPosition || [matchedRegion.latitude, matchedRegion.longitude]);
  };

  const handleOutsideMapClick = () => {
    setMapWarning(t('ndvi.outsideMyanmar'));
  };

  const handleStateChange = (event) => {
    const nextState = event.target.value;
    const nextRegion = regions.find((region) => region.PCODE === nextState);
    setSelectedState(nextState);
    setSelectedDistrict('');
    setSelectedPcode(nextState);
    if (nextRegion) setMapMarkerPosition([nextRegion.latitude, nextRegion.longitude]);
  };

  const handleDistrictChange = (event) => {
    const nextDistrict = event.target.value;
    const nextRegion = regions.find((region) => region.PCODE === (nextDistrict || selectedState));
    setSelectedDistrict(nextDistrict);
    setSelectedPcode(nextDistrict || selectedState);
    if (nextRegion) setMapMarkerPosition([nextRegion.latitude, nextRegion.longitude]);
  };

  useEffect(() => {
    if (!selectedPcode) return undefined;
    const controller = new AbortController();

    const loadNdvi = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await axios.get(
          `${API_BASE_URL}/ndvi/${encodeURIComponent(selectedPcode)}`,
          { signal: controller.signal }
        );
        setNdviData(response.data);
      } catch (err) {
        if (err.code !== 'ERR_CANCELED') {
          console.error('NDVI data error:', err);
          setError('Unable to load NDVI measurements for this region.');
          setNdviData({ labels: [], vim: [], viq: [] });
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadNdvi();
    return () => controller.abort();
  }, [selectedPcode]);

  const chartData = {
    labels: ndviData?.labels || [],
    datasets: [
      {
        label: t('ndvi.latestVim'),
        data: ndviData?.vim || [],
        borderColor: '#2ecc71',
        backgroundColor: 'rgba(46, 204, 113, 0.2)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y'
      },
      {
        label: t('ndvi.latestViq'),
        data: ndviData?.viq || [],
        borderColor: '#f59e0b',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.4,
        yAxisID: 'y1'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        labels: {
          color: '#334155',
          font: { size: 13, weight: '600' },
          padding: 18,
          usePointStyle: true,
        }
      }
    },
    scales: {
      x: { ticks: { color: '#475569' }, grid: { color: 'rgba(148,163,184,0.18)' } },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: { display: true, text: t('ndvi.latestVim'), color: '#2ecc71' },
        ticks: { color: '#475569' },
        grid: { color: 'rgba(148,163,184,0.18)' }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: { display: true, text: t('ndvi.latestViq'), color: '#f59e0b' },
        grid: { drawOnChartArea: false },
        ticks: { color: '#475569' }
      },
    },
  };

  return (
    <div className="ndvi-analysis">
      <h2 className="m-0 text-xl font-semibold"><Satellite size={28} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '10px' }}/> {t('ndvi.title')}</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        {t('ndvi.subtitle')}
      </p>

      {/* Simple explanation box */}
      <div className="glass-panel" style={{ marginBottom: '2rem', background: 'rgba(52, 152, 219, 0.1)', border: '1px solid rgba(52, 152, 219, 0.3)' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3498db', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
          <Info size={18} /> {t('ndvi.whatIsNdvi')}
        </h3>
        <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li><strong>{t('ndvi.vimDesc')}</strong></li>
          <li><strong>{t('ndvi.viqDesc')}</strong></li>
        </ul>
      </div>

      <div className="ndvi-controls glass-panel">
        <div className="ndvi-controls-heading">
          <div className="ndvi-controls-kicker">{t('ndvi.location')}</div>
          <h3>{t('ndvi.selectRegion')}</h3>
        </div>
        <div className="ndvi-control-field">
          <label htmlFor="ndvi-state">{t('ndvi.stateRegion')}</label>
          <select
            id="ndvi-state"
            value={selectedState}
            onChange={handleStateChange}
            disabled={loading && regions.length === 0}
          >
            {states.map((state) => (
              <option key={state.PCODE} value={state.PCODE}>
                {getRegionName(state)}
              </option>
            ))}
          </select>
        </div>
        <div className="ndvi-control-field">
          <label htmlFor="ndvi-district">{t('ndvi.districtDetail')}</label>
          <select id="ndvi-district" value={selectedDistrict} onChange={handleDistrictChange}>
            <option value="">{t('ndvi.allDistricts')}</option>
            {districts.map((district) => (
              <option key={district.PCODE} value={district.PCODE}>
                {getRegionName(district)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="glass-panel ndvi-map-panel">
        <div className="ndvi-map-heading">
          <div>
            <div className="ndvi-controls-kicker">{t('ndvi.mapTitle')}</div>
            <p>{t('ndvi.mapHint')}</p>
          </div>
          <strong>{selectedRegion ? getRegionName(selectedRegion) : t('ndvi.mapMyanmar')}</strong>
        </div>
        <MapContainer center={defaultMapCenter} zoom={6} scrollWheelZoom className="ndvi-map">
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapController position={mapMarkerPosition} />
          <MapClickSelector regions={regions} onOutside={handleOutsideMapClick} />
          {boundaries && (
            <GeoJSON
              data={boundaries}
              style={() => ({ color: '#14742f', weight: 1, fillColor: '#8bcf77', fillOpacity: 0.18 })}
              onEachFeature={(feature, layer) => {
                layer.bindTooltip(language === 'my' ? feature.properties.name_my : feature.properties.name_en);
                layer.on('click', (event) => {
                  // Keep a polygon click from reaching the map-level fallback selector.
                  L.DomEvent.stopPropagation(event.originalEvent);
                  selectRegionFromMap(
                    feature.properties,
                    [event.latlng.lat, event.latlng.lng]
                  );
                });
              }}
            />
          )}
          <Marker position={mapMarkerPosition} icon={mapIcon} />
        </MapContainer>
      </div>

      {mapWarning && <p className="crop-suggestion-error" role="alert">{mapWarning}</p>}
      {error && <p className="crop-suggestion-error" role="alert">{error}</p>}
      {loading && <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>{t('ndvi.loadingData')}</p>}

      <div className="grid grid-cols-3" style={{ gap: '1rem', marginBottom: '2rem' }}>
        <div className="glass-panel">
          <h3><Leaf size={18} style={{ display: 'inline', verticalAlign: 'text-bottom' }}/> {t('ndvi.latestVim')}</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
             {ndviData?.vim?.length ? ndviData.vim[ndviData.vim.length-1].toFixed(3) : '-'}
          </div>
        </div>
        <div className="glass-panel">
          <h3>{t('ndvi.avgVim')}</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--secondary)' }}>
             {ndviData?.vim?.length ? (ndviData.vim.reduce((a,b)=>a+b,0)/ndviData.vim.length).toFixed(3) : '-'}
          </div>
        </div>
        <div className="glass-panel">
          <h3><TrendingUp size={18} style={{ display: 'inline', verticalAlign: 'text-bottom' }}/> {t('ndvi.latestViq')}</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--warning)' }}>
             {ndviData?.viq?.length ? ndviData.viq[ndviData.viq.length-1].toFixed(1) : '-'}
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ height: '400px' }}>
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}
