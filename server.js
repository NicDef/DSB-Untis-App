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

//////////
// DATA //
//////////

const dsbuntis = require('dsb-untis');
io.on('connection', async (socket) => {
	console.log('New WS Connection');

	const username = '201002';
	const password = 'Ludwig23';

	const dsb = new dsbuntis(username, password);

	let dsbDataOld = null;
	async function makerequest() {
		console.log('Making a request!');
		await dsb.fetch().then((data) => {
			let dsbData = JSON.stringify(data);
			// console.log(dsbData);
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
