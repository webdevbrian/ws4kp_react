import swaggerJsdoc from 'swagger-jsdoc';
import { readFileSync } from 'fs';

const { version } = JSON.parse(readFileSync('./package.json'));

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WeatherStar 4000+ API',
      version,
      description: 'API documentation for the WeatherStar 4000+ weather application server',
      contact: {
        name: 'Matt Walsh',
        url: 'https://github.com/netbymatt/ws4kp',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:8080',
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        ApiInfo: {
          type: 'object',
          properties: {
            version: {
              type: 'string',
              description: 'Application version',
            },
            serverAvailable: {
              type: 'boolean',
              description: 'Whether the server is available (not in static mode)',
            },
            OVERRIDES: {
              type: 'object',
              description: 'Configuration overrides',
            },
            query: {
              type: 'object',
              description: 'Query parameters from the request',
            },
          },
        },
        Playlist: {
          type: 'object',
          properties: {
            displayList: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    description: 'Display name',
                  },
                  path: {
                    type: 'string',
                    description: 'Component path',
                  },
                  duration: {
                    type: 'number',
                    description: 'Display duration in seconds',
                  },
                },
              },
            },
          },
        },
        CityData: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'City name',
              },
              state: {
                type: 'string',
                description: 'State code',
              },
              latitude: {
                type: 'number',
                description: 'Latitude coordinate',
              },
              longitude: {
                type: 'number',
                description: 'Longitude coordinate',
              },
            },
          },
        },
        StationData: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Station name',
              },
              lat: {
                type: 'number',
                description: 'Latitude',
              },
              lon: {
                type: 'number',
                description: 'Longitude',
              },
            },
          },
        },
        GeoIP: {
          type: 'object',
          description: 'Empty object - location data is returned in headers',
        },
        CacheDelete: {
          type: 'object',
          properties: {
            cleared: {
              type: 'boolean',
              description: 'Whether the cache entry was cleared',
            },
            path: {
              type: 'string',
              description: 'The path that was cleared',
            },
          },
        },
      },
    },
    paths: {
      '/': {
        get: {
          summary: 'API Server Information',
          description: 'Returns basic information about the API server',
          tags: ['System'],
          responses: {
            '200': {
              description: 'Server information',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      version: { type: 'string' },
                      note: { type: 'string' },
                      endpoints: {
                        type: 'object',
                        properties: {
                          api: { type: 'string' },
                          data: { type: 'string' },
                          geoip: { type: 'string' },
                          radar: { type: 'string' },
                          spc: { type: 'string' },
                          mesonet: { type: 'string' },
                          forecast: { type: 'string' },
                          playlist: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api-info': {
        get: {
          summary: 'Get API information',
          description: 'Returns version, server availability status, and configuration',
          tags: ['System'],
          parameters: [
            {
              name: 'query',
              in: 'query',
              description: 'Any query parameters will be included in the response',
              schema: {
                type: 'object',
              },
            },
          ],
          responses: {
            '200': {
              description: 'API information',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ApiInfo',
                  },
                },
              },
            },
          },
        },
      },
      '/geoip': {
        get: {
          summary: 'Get GeoIP location data',
          description: 'Returns mock GeoIP location data in response headers',
          tags: ['Location'],
          responses: {
            '200': {
              description: 'GeoIP data returned in headers',
              headers: {
                'x-geoip-city': {
                  schema: { type: 'string' },
                  description: 'City name',
                },
                'x-geoip-country': {
                  schema: { type: 'string' },
                  description: 'Country code',
                },
                'x-geoip-country-name': {
                  schema: { type: 'string' },
                  description: 'Country name',
                },
                'x-geoip-country-region': {
                  schema: { type: 'string' },
                  description: 'Region/State code',
                },
                'x-geoip-country-region-name': {
                  schema: { type: 'string' },
                  description: 'Region/State name',
                },
                'x-geoip-latitude': {
                  schema: { type: 'string' },
                  description: 'Latitude',
                },
                'x-geoip-longitude': {
                  schema: { type: 'string' },
                  description: 'Longitude',
                },
                'x-geoip-postal-code': {
                  schema: { type: 'string' },
                  description: 'Postal code',
                },
                'x-geoip-time-zone': {
                  schema: { type: 'string' },
                  description: 'Time zone',
                },
              },
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/GeoIP',
                  },
                },
              },
            },
          },
        },
      },
      '/playlist.json': {
        get: {
          summary: 'Get display playlist',
          description: 'Returns the configured display playlist for weather screens',
          tags: ['Configuration'],
          responses: {
            '200': {
              description: 'Display playlist configuration',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Playlist',
                  },
                },
              },
            },
            '404': {
              description: 'Playlist not available in static mode',
            },
          },
        },
      },
      '/data/travelcities.json': {
        get: {
          summary: 'Get travel cities data',
          description: 'Returns list of travel cities with coordinates',
          tags: ['Data'],
          responses: {
            '200': {
              description: 'Travel cities data',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/CityData',
                  },
                },
              },
            },
          },
        },
      },
      '/data/regionalcities.json': {
        get: {
          summary: 'Get regional cities data',
          description: 'Returns list of regional cities with coordinates',
          tags: ['Data'],
          responses: {
            '200': {
              description: 'Regional cities data',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/CityData',
                  },
                },
              },
            },
          },
        },
      },
      '/data/stations.json': {
        get: {
          summary: 'Get weather station data',
          description: 'Returns weather station information',
          tags: ['Data'],
          responses: {
            '200': {
              description: 'Weather station data',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/StationData',
                  },
                },
              },
            },
          },
        },
      },
      '/api/{path}': {
        get: {
          summary: 'Weather.gov API proxy',
          description: 'Proxies requests to the Weather.gov API with caching',
          tags: ['Weather Data'],
          parameters: [
            {
              name: 'path',
              in: 'path',
              required: true,
              description: 'Weather.gov API endpoint path',
              schema: {
                type: 'string',
              },
              example: 'points/28.52,-81.41',
            },
          ],
          responses: {
            '200': {
              description: 'Weather data from Weather.gov',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    description: 'Response varies based on the Weather.gov endpoint',
                  },
                },
              },
            },
            '404': {
              description: 'Not available in static mode',
            },
          },
        },
      },
      '/radar/{path}': {
        get: {
          summary: 'Radar data proxy',
          description: 'Proxies requests for radar imagery',
          tags: ['Weather Data'],
          parameters: [
            {
              name: 'path',
              in: 'path',
              required: true,
              description: 'Radar endpoint path',
              schema: {
                type: 'string',
              },
            },
          ],
          responses: {
            '200': {
              description: 'Radar data or imagery',
            },
            '404': {
              description: 'Not available in static mode',
            },
          },
        },
      },
      '/spc/{path}': {
        get: {
          summary: 'Storm Prediction Center data proxy',
          description: 'Proxies requests to the Storm Prediction Center',
          tags: ['Weather Data'],
          parameters: [
            {
              name: 'path',
              in: 'path',
              required: true,
              description: 'SPC endpoint path',
              schema: {
                type: 'string',
              },
            },
          ],
          responses: {
            '200': {
              description: 'SPC outlook data',
            },
            '404': {
              description: 'Not available in static mode',
            },
          },
        },
      },
      '/mesonet/{path}': {
        get: {
          summary: 'Mesonet data proxy',
          description: 'Proxies requests for mesonet weather data',
          tags: ['Weather Data'],
          parameters: [
            {
              name: 'path',
              in: 'path',
              required: true,
              description: 'Mesonet endpoint path',
              schema: {
                type: 'string',
              },
            },
          ],
          responses: {
            '200': {
              description: 'Mesonet weather data',
            },
            '404': {
              description: 'Not available in static mode',
            },
          },
        },
      },
      '/forecast/{path}': {
        get: {
          summary: 'Forecast data proxy',
          description: 'Proxies requests for forecast data',
          tags: ['Weather Data'],
          parameters: [
            {
              name: 'path',
              in: 'path',
              required: true,
              description: 'Forecast endpoint path',
              schema: {
                type: 'string',
              },
            },
          ],
          responses: {
            '200': {
              description: 'Forecast data',
            },
            '404': {
              description: 'Not available in static mode',
            },
          },
        },
      },
      '/cache/{path}': {
        delete: {
          summary: 'Clear cache entry',
          description: 'Clears a specific cached URL from the cache',
          tags: ['Cache Management'],
          parameters: [
            {
              name: 'path',
              in: 'path',
              required: true,
              description: 'Path to clear from cache',
              schema: {
                type: 'string',
              },
            },
          ],
          responses: {
            '200': {
              description: 'Cache clear result',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/CacheDelete',
                  },
                },
              },
            },
            '404': {
              description: 'Not available in static mode',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'System',
        description: 'System and API information endpoints',
      },
      {
        name: 'Location',
        description: 'Location-related endpoints',
      },
      {
        name: 'Configuration',
        description: 'Application configuration endpoints',
      },
      {
        name: 'Data',
        description: 'Static data endpoints',
      },
      {
        name: 'Weather Data',
        description: 'Weather data proxy endpoints',
      },
      {
        name: 'Cache Management',
        description: 'Cache management endpoints',
      },
    ],
  },
  apis: [], // We're defining everything inline above
};

export default swaggerJsdoc(swaggerOptions);