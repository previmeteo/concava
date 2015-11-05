var connect = require('connect')
var http = require('http')
var app = connect()
var getRawBody = require('raw-body')
var SensorData = require('./SensorData')
var ContextBrokerClient = require('./ContextBrokerClient')
var Converter = require('./Converter')
var Calibrator = require('./Calibrator')
var defaultConvertTypes = require('./defaultConvertTypes')
var validate = require('./validate')

var buffer, data

// Configuration
var debug = true
var port = 3000
var contextBroker = {
	url: 'http://context_broker:1026/v1',
	timeout: 5000,
}
var payloadMaxSize = '512kb'

// Setup classes
var client = new ContextBrokerClient(contextBroker)
var converter = new Converter(defaultConvertTypes)
var calibrator = new Calibrator()

// Verify request method
app.use(function (req, res, next) {
	if (req.method === 'POST') return next()

	res.writeHead(404)
	res.end('Not found.')
})

// Parse payload into buffer
app.use(function (req, res, next) {
	getRawBody(req, {
		length: req.headers['content-length'],
		limit: payloadMaxSize,
	}, function (err, buf) {
		if (err) return next(err)

		buffer = buf
		next()
	})
})

// Verify given payload
app.use(function (req, res, next) {
	if (buffer.length) return next()

	res.writeHead(204)
	res.end('No binary payload provided.')
})

// Create SensorData instance
app.use(function (req, res, next) {
	try {
		data = new SensorData(buffer)
		next()
	} catch (err) {
		next(err)
	}
})

// Validate device ID
app.use(function (req, res, next) {
	if (data.getDeviceId()) return next()

	res.writeHead(400)
	res.end('Could not determine payload ID.')
})

// Retrieve sensor metadata
app.use(function (req, res, next) {
	client.getSensorMetadata(data.getDeviceId(), function (err, metadata) {
		if (err) return next(err)

		data.setMetadata(metadata)
		next()
	})
})

// Convert
app.use(function (req, res, next) {
	converter.convert(data, next)
})

// Calibrate
app.use(function (req, res, next) {
	calibrator.calibrate(data, next)
})

// Validate
app.use(function (req, res, next) {
	validate(data, next)
})

// Debug: dump sensor data
if (debug) {
	app.use(function (req, res, next) {
		console.log(
			data.getDeviceId(),
			data.getData()
		)
		next()
	})
}

// Store sensor data
app.use(function (req, res, next) {
	client.insertSensorData(data, next)
})

// Return response
app.use(function (req, res, next) {
	res.end()
})

// Error handler
app.use(function (err, req, res, next) {
	console.error(err, err.stack)
	if (err instanceof Error) err = err.toString()
	res.writeHead(500)
	res.end(err || '')
	next()
})

// Start server
http.createServer(app).listen(port)
console.log('Listening on', port)
