import { useEffect } from 'react';
import { useAlertsData } from '../hooks/useAlertsData';
import { useNavigation } from '../contexts/NavigationContext';

const AlertsMonitor: React.FC = () => {
  const { alerts } = useAlertsData();
  const { setHasActiveAlerts } = useNavigation();

  // Update navigation context when alerts change
  useEffect(() => {
    setHasActiveAlerts(alerts.length > 0);
  }, [alerts, setHasActiveAlerts]);

  return null; // This component doesn't render anything
};

export default AlertsMonitor;