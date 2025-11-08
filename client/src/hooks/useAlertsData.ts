import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';

interface Alert {
  id: string;
  areaDesc: string;
  headline: string;
  description: string;
  severity: string;
  urgency: string;
  event: string;
  onset: string;
  expires: string;
  instruction?: string;
}

export const useAlertsData = () => {
  const { location } = useApp();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!location) {
      setAlerts([]);
      return;
    }

    const fetchAlerts = async () => {
      setLoading(true);
      setError(null);

      // Use relative URL to work with both dev and preview servers
      const baseUrl = '';

      try {
        // Get alerts for the point
        const lat = location.latitude.toFixed(4);
        const lon = location.longitude.toFixed(4);
        const alertsUrl = `${baseUrl}/api/alerts/active?point=${lat},${lon}`;

        const response = await fetch(alertsUrl);
        if (response.ok) {
          const data = await response.json();
          const alertsList = data.features?.map((feature: any) => ({
            id: feature.id,
            areaDesc: feature.properties.areaDesc,
            headline: feature.properties.headline,
            description: feature.properties.description,
            severity: feature.properties.severity,
            urgency: feature.properties.urgency,
            event: feature.properties.event,
            onset: feature.properties.onset,
            expires: feature.properties.expires,
            instruction: feature.properties.instruction,
          })) || [];

          setAlerts(alertsList);
        } else {
          console.warn('Failed to fetch alerts');
          setAlerts([]);
        }
      } catch (err) {
        console.error('Error fetching alerts:', err);
        setError('Failed to load alerts');
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [location]);

  return { alerts, loading, error };
};