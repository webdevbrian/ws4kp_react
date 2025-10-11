interface DataStore {
  travelCities?: any;
  regionalCities?: any;
  stations?: any;
}

const dataStore: DataStore = {};

export const loadAllData = async (version: string = ''): Promise<void> => {
  const versionQuery = version ? `?v=${version}` : '';

  const dataEndpoints = [
    { key: 'travelCities', path: `/data/travelcities.json${versionQuery}` },
    { key: 'regionalCities', path: `/data/regionalcities.json${versionQuery}` },
    { key: 'stations', path: `/data/stations.json${versionQuery}` },
  ];

  await Promise.all(
    dataEndpoints.map(async ({ key, path }) => {
      try {
        const response = await fetch(path);
        if (!response.ok) {
          throw new Error(`Failed to load ${key}: ${response.statusText}`);
        }
        const data = await response.json();
        dataStore[key as keyof DataStore] = data;
      } catch (error) {
        console.error(`Error loading ${key}:`, error);
        throw error;
      }
    })
  );
};

export const getTravelCities = () => dataStore.travelCities;
export const getRegionalCities = () => dataStore.regionalCities;
export const getStations = () => dataStore.stations;