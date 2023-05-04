const express = require('express');
const path = require('path');
const http = require('http');
const PORT = process.env.PORT || 3000;
const socketio = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketio(server);

const url = `http://localhost:${PORT}`;

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Start server
server.listen(PORT, () => console.log(`Server is running on Port ${PORT} --> ` + url));

///////////////////
// NOTIFICATIONS //
///////////////////

//web-push
const webpush = require('web-push');

//body-parser
const bodyParser = require('body-parser');

//using bodyparser
app.use(bodyParser.json());

//storing the keys in variables
const publicVapidKey = '';
const privateVapidKey = '';

//setting vapid keys details
webpush.setVapidDetails('mailto:', publicVapidKey, privateVapidKey);

//subscribe route
function Notification(title, body) {
	app.post('/subscribe', (req, res) => {
		//get push subscription object from the request
		const subscription = req.body;

		console.log(req.body);

		//send status 201 for the request
		res.status(201).json({});

		//create paylod: specified the details of the push notification
		const payload = JSON.stringify({ title: title, body: body });

		//pass the object into sendNotification fucntion and catch any error
		webpush.sendNotification(subscription, payload).catch((err) => console.error(err));
	});
}

//////////
// DATA //
//////////

const dsbuntis = require('dsb-untis');
io.on('connection', async (socket) => {
	console.log('New WS Connection');

	const username = '';
	const password = '';

	const dsb = new dsbuntis(username, password);

	let dsbDataOld = null;
	async function makerequest() {
		console.log('Making a request!');
		await dsb.fetch().then((data) => {
			let dsbData = JSON.stringify(data);
			io.emit('data', dsbData);

			if (dsbData != dsbDataOld && dsbDataOld != null) {
				Notification('DSB', 'Ein neuer Stundenplan ist verfügbar!');
			}

			dsbDataOld = dsbData;
		});
		setTimeout(makerequest, 10000);
	}
	makerequest();
});
