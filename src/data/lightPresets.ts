const LIGHTING_PRESETS = {
    ambient: {
        name: 'Ambient Only',
        config: {
            enabled: true,
            ambient: { color: '#cfc2c2', intensity: 0.3, enabled: true },
            sun: { elevation: 0, azimuth: 0, intensity: 0, color: '#ffffff', enabled: false },
            enableShadows: true,
        },
    },
    studio: {
        name: 'Studio',
        config: {
            enabled: true,
            ambient: { color: '#404040', intensity: 0.4, enabled: true },
            sun: { elevation: 60, azimuth: -45, intensity: 1.0, color: '#ffffff', enabled: true },
            enableShadows: true,
        },
    },
    outdoor: {
        name: 'Outdoor Day',
        config: {
            enabled: true,
            ambient: { color: '#87CEEB', intensity: 0.6, enabled: true },
            sun: { elevation: 60, azimuth: -45, intensity: 1.5, color: '#FFF8DC', enabled: true },
            enableShadows: true,
        },
    },
    sunset: {
        name: 'Outdoor Sunset',
        config: {
            enabled: true,
            ambient: { color: '#FF6347', intensity: 0.4, enabled: true },
            sun: { elevation: 15, azimuth: -120, intensity: 1.2, color: '#FF8C00', enabled: true },
            enableShadows: true,
        },
    },
    indoor: {
        name: 'Indoor',
        config: {
            enabled: true,
            ambient: { color: '#F5F5DC', intensity: 0.8, enabled: true },
            sun: { elevation: 30, azimuth: -90, intensity: 0.3, color: '#ffffff', enabled: true },
            enableShadows: false,
        },
    },
};
export default LIGHTING_PRESETS;
