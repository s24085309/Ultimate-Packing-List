type WeatherKind = 'sun' | 'partly' | 'cloud' | 'rain' | 'storm' | 'snow' | 'fog';

function kindFor(conditions: string | undefined): WeatherKind {
  const c = (conditions ?? '').toLowerCase();
  if (c.includes('snow')) return 'snow';
  if (c.includes('storm') || c.includes('thunder')) return 'storm';
  if (c.includes('rain') || c.includes('shower') || c.includes('drizzle')) return 'rain';
  if (c.includes('fog') || c.includes('mist') || c.includes('haze')) return 'fog';
  if ((c.includes('cloud') && (c.includes('sun') || c.includes('partly'))) || c.includes('partly')) return 'partly';
  if (c.includes('cloud') || c.includes('overcast')) return 'cloud';
  if (c.includes('sun') || c.includes('clear')) return 'sun';
  return 'partly';
}

const CLOUD_PATH = 'M6 16.5c-2.2 0-4-1.8-4-4 0-2 1.5-3.6 3.4-3.9C6 6.1 8.2 4.3 11 4.3c3 0 5.5 2.1 6.1 4.9 2.2.2 3.9 2 3.9 4.2 0 2.3-1.9 4.2-4.2 4.2H6z';

export default function AnimatedWeatherIcon({ conditions, size = 32 }: { conditions: string | undefined; size?: number }) {
  const kind = kindFor(conditions);

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ overflow: 'visible', display: 'block', margin: '0 auto' }}>
      {kind === 'sun' && (
        <g>
          <circle cx="12" cy="12" r="5" fill="#fbbf24" className="wxSunPulse" />
          <g className="wxSunSpin" stroke="#fbbf24" strokeWidth="1.6" strokeLinecap="round">
            <line x1="12" y1="1.5" x2="12" y2="4" />
            <line x1="12" y1="20" x2="12" y2="22.5" />
            <line x1="1.5" y1="12" x2="4" y2="12" />
            <line x1="20" y1="12" x2="22.5" y2="12" />
            <line x1="4.2" y1="4.2" x2="6" y2="6" />
            <line x1="18" y1="18" x2="19.8" y2="19.8" />
            <line x1="4.2" y1="19.8" x2="6" y2="18" />
            <line x1="18" y1="6" x2="19.8" y2="4.2" />
          </g>
        </g>
      )}

      {kind === 'partly' && (
        <g>
          <g className="wxSunPulse">
            <circle cx="8" cy="8" r="4" fill="#fbbf24" />
          </g>
          <g className="wxCloudDrift">
            <path d={CLOUD_PATH} fill="#cbd5e1" transform="translate(1,4) scale(0.95)" />
          </g>
        </g>
      )}

      {(kind === 'cloud' || kind === 'fog') && (
        <g className="wxCloudDrift">
          <path d={CLOUD_PATH} fill="#9ca3af" />
          {kind === 'fog' && (
            <g className="wxFogFade" stroke="#cbd5e1" strokeWidth="1.4" strokeLinecap="round">
              <line x1="3" y1="19" x2="15" y2="19" />
              <line x1="6" y1="21.5" x2="18" y2="21.5" />
            </g>
          )}
        </g>
      )}

      {kind === 'rain' && (
        <g>
          <path d={CLOUD_PATH} fill="#9ca3af" />
          <g stroke="#38bdf8" strokeWidth="1.6" strokeLinecap="round">
            <line x1="8" y1="17" x2="7" y2="21" className="wxDrop wxDrop1" />
            <line x1="12.5" y1="17" x2="11.5" y2="22" className="wxDrop wxDrop2" />
            <line x1="17" y1="17" x2="16" y2="21" className="wxDrop wxDrop3" />
          </g>
        </g>
      )}

      {kind === 'storm' && (
        <g>
          <path d={CLOUD_PATH} fill="#6b7280" />
          <polygon points="12,15.5 9.5,20 11.5,20 10,24 15,18.5 12.5,18.5 14.5,15.5" fill="#fbbf24" className="wxBoltFlash" />
          <g stroke="#38bdf8" strokeWidth="1.4" strokeLinecap="round">
            <line x1="6.5" y1="17" x2="5.7" y2="20" className="wxDrop wxDrop1" />
            <line x1="18" y1="17" x2="17.2" y2="20" className="wxDrop wxDrop3" />
          </g>
        </g>
      )}

      {kind === 'snow' && (
        <g>
          <path d={CLOUD_PATH} fill="#9ca3af" />
          <g fill="#e0f2fe">
            <circle cx="7.5" cy="18" r="1.1" className="wxFlake wxDrop1" />
            <circle cx="12" cy="19.5" r="1.1" className="wxFlake wxDrop2" />
            <circle cx="16.5" cy="18" r="1.1" className="wxFlake wxDrop3" />
          </g>
        </g>
      )}
    </svg>
  );
}
