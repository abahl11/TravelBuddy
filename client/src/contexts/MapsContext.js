import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/client';

/**
 * Runtime map configuration, fetched from the API rather than compiled in.
 *
 * Keys used to be REACT_APP_* build-time values, which meant rotating one
 * required a full rebuild. The server now reports what is available at
 * /api/config, so a key change is just a restart.
 *
 * Nothing here ever gates rendering. The context starts disabled and flips on
 * once (and if) the config arrives, so a slow or failed request costs a map
 * preview — never the whole page.
 */
const DEFAULT_CONFIG = {
  tilesEnabled: false,
  maptilerKey: null,
  mapStyle: 'streets-v2',
  geocodingEnabled: false,
  loaded: false,
};

const MapsContext = createContext(DEFAULT_CONFIG);

export const useMaps = () => useContext(MapsContext);

export const MapsProvider = ({ children }) => {
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  useEffect(() => {
    let cancelled = false;

    api
      .get('/config')
      .then(({ data }) => {
        if (cancelled) return;
        setConfig({ ...DEFAULT_CONFIG, ...(data?.maps || {}), loaded: true });
      })
      .catch(() => {
        // Offline or the endpoint is unavailable — stay in the degraded but
        // fully usable state.
        if (!cancelled) setConfig((prev) => ({ ...prev, loaded: true }));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      ...config,
      // Tiles need both the feature flag and an actual key to render.
      canShowMap: Boolean(config.tilesEnabled && config.maptilerKey),
      tileUrl: config.maptilerKey
        ? `https://api.maptiler.com/maps/${config.mapStyle}/{z}/{x}/{y}.png?key=${config.maptilerKey}`
        : null,
    }),
    [config]
  );

  return <MapsContext.Provider value={value}>{children}</MapsContext.Provider>;
};

export default MapsContext;
