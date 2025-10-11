import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import { readFile } from 'fs/promises';
import {
	weatherProxy, radarProxy, outlookProxy, mesonetProxy, forecastProxy,
} from './proxy/handlers.mjs';
import playlist from './src/playlist.mjs';
import OVERRIDES from './src/overrides.mjs';
import cache from './proxy/cache.mjs';

const travelCities = JSON.parse(await readFile('./datagenerators/output/travelcities.json'));
const regionalCities = JSON.parse(await readFile('./datagenerators/output/regionalcities.json'));
const stationInfo = JSON.parse(await readFile('./datagenerators/output/stations.json'));

const app = express();
const port = process.env.WS4KP_PORT ?? 8080;

// CORS middleware - allow requests from the Vite dev server
app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	res.setHeader('X-Weatherstar', 'true');

	// Handle preflight requests
	if (req.method === 'OPTIONS') {
		res.sendStatus(204);
		return;
	}

	next();
});

// template engine - no longer needed with React
// app.set('view engine', 'ejs');

// version
const { version } = JSON.parse(fs.readFileSync('package.json'));

// read and parse environment variables to append to the query string
// use the permalink (share) button on the web app to generate a starting point for your configuration
// then take each key/value in the querystring and append WSQS_ to the beginning, and then replace any
// hyphens with underscores in the key name
// environment variables are read from the command line and .env file via the dotenv package

const qsVars = {};

Object.entries(process.env).forEach(([key, value]) => {
	// test for key matching pattern described above
	if (key.match(/^WSQS_[A-Za-z0-9_]+$/)) {
		// convert the key to a querystring formatted key
		const formattedKey = key.replace(/^WSQS_/, '').replaceAll('_', '-');
		qsVars[formattedKey] = value;
	}
});

// single flag to determine if environment variables are present
const hasQsVars = Object.entries(qsVars).length > 0;

// turn the environment query string into search params
const defaultSearchParams = (new URLSearchParams(qsVars)).toString();

// React app handles rendering - API server only
const apiInfo = (req, res) => {
	res.json({
		version,
		serverAvailable: !process.env?.STATIC,
		OVERRIDES,
		query: req.query,
	});
};

const geoip = (req, res) => {
	res.set({
		'x-geoip-city': 'Orlando',
		'x-geoip-country': 'US',
		'x-geoip-country-name': 'United States',
		'x-geoip-country-region': 'FL',
		'x-geoip-country-region-name': 'Florida',
		'x-geoip-latitude': '28.52135',
		'x-geoip-longitude': '-81.41079',
		'x-geoip-postal-code': '32789',
		'x-geoip-time-zone': 'America/New_York',
		'content-type': 'application/json',
	});
	res.json({});
};

// Configure static asset caching with proper ETags and cache validation
const staticOptions = {
	etag: true, // Enable ETag generation
	lastModified: true, // Enable Last-Modified headers
	setHeaders: (res, path, stat) => {
		// Generate ETag based on file modification time and size for better cache validation
		const etag = `"${stat.mtime.getTime().toString(16)}-${stat.size.toString(16)}"`;
		res.setHeader('ETag', etag);

		if (path.match(/\.(png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$/i)) {
			// Images and fonts - cache for 1 year (immutable content)
			res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
		} else if (path.match(/\.(css|js|mjs)$/i)) {
			// Scripts and styles - use cache validation instead of no-cache
			// This allows browsers to use cached version if ETag matches (304 response)
			res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
		} else {
			// Other files - cache for 1 hour with validation
			res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
		}
	},
};

// Weather.gov API proxy (catch-all for any Weather.gov API endpoint)
// Skip setting up routes for the caching proxy server in static mode
if (!process.env?.STATIC) {
	app.use('/api/', weatherProxy);

	// Cache management DELETE endpoint to allow "uncaching" specific URLs
	app.delete(/^\/cache\/.*/, (req, res) => {
		const path = req.url.replace('/cache', '');
		const cleared = cache.clearEntry(path);
		res.json({ cleared, path });
	});

	// specific proxies for other services
	app.use('/radar/', radarProxy);
	app.use('/spc/', outlookProxy);
	app.use('/mesonet/', mesonetProxy);
	app.use('/forecast/', forecastProxy);

	// Playlist route is available in server mode (not in static mode)
	app.get('/playlist.json', playlist);
}

// Data endpoints - serve JSON data with long-term caching
const dataEndpoints = {
	travelcities: travelCities,
	regionalcities: regionalCities,
	stations: stationInfo,
};

Object.entries(dataEndpoints).forEach(([name, data]) => {
	app.get(`/data/${name}.json`, (req, res) => {
		res.set({
			'Cache-Control': 'public, max-age=31536000, immutable',
			'Content-Type': 'application/json',
		});
		res.json(data);
	});
});

// API endpoints only - React app handles the frontend
app.use('/geoip', geoip);
app.get('/api-info', apiInfo);

// Root route - inform users to use the React dev server
app.get('/', (req, res) => {
	res.json({
		message: 'WeatherStar 4000+ API Server',
		version,
		note: 'This is the API backend. To access the application, run "npm run dev" and visit http://localhost:3000',
		endpoints: {
			api: '/api/*',
			data: '/data/[travelcities|regionalcities|stations].json',
			geoip: '/geoip',
			radar: '/radar/*',
			spc: '/spc/*',
			mesonet: '/mesonet/*',
			forecast: '/forecast/*',
			playlist: '/playlist.json'
		}
	});
});

// Serve static files if needed
app.use('/fonts', express.static('./server/fonts', staticOptions));
app.use('/images', express.static('./server/images', staticOptions));
app.use('/music', express.static('./server/music', staticOptions));

const server = app.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});

// graceful shutdown
const gracefulShutdown = () => {
	server.close(() => {
		console.log('Server closed');
		process.exit(0);
	});
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
