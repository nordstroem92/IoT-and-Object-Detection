const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const sqlite3 = require('sqlite3').verbose();
var path = require('path');

const app = express();

//setup database
let db = new sqlite3.Database('./test.db', (err) => {
	if (err) {
		console.error(err.message);
	}
	console.log('Connected to the test database.');
});
db.run('CREATE TABLE IF NOT EXISTS available(spotID INT, status INT)');
  
function sendToDatabase(available, status){
console.log(available, status)
db.run('INSERT INTO available(spotID, status) VALUES('+available+','+status +');');
}

function getFromDatabase(){
let sql = 'SELECT * FROM available WHERE status=1'; // lorte query 
db.all(sql, [], (err, rows) => {
	if (err) {
	throw err;
	}
	rows.forEach((row) => {
	console.log(row.name);
	});
});
}

//sendToDatabase(1, 0);
//getFromDatabase()

db.close();

//create websocket connection
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
var socket = []; //not used yet

	wss.on('connection', function connection(ws) {
		socket.push(ws); // make array of connected sockets

		ws.on('message', function incomming(message) {
			console.log("message: "+message);

			function isJson(message) { // check for om message er JSON så vi ikke crasher serveren når vi fx. sender data fra index.html
				try {
					let JSONParsed = JSON.parse(message); 
					let msgId = JSONParsed['id']; // id variable of object
					let msgIdInt = parseInt(msgId); // DB takes integers
					let msgStatus = JSONParsed['status']; // id variable of object
					let msgStatusInt = parseInt(msgStatus); // DB takes integers
					console.log("id: "+msgIdInt +" status: "+ msgStatusInt);
					sendToDatabase(msgId, msgStatus);
					getFromDatabase()
				} catch (e) {
					return false;
				}
				return true;
			}
			isJson(message);

			for(i = 0; i < socket.length; i++) { // loop gennem alle sockets og send besked - vi skal i virkeligheden kun sende til HTML-siden, spørgsmålet er om de altid bliver connected i samme rækkefølge?
				socket[i].send(message);
			}
		});
	});
//midlleware
app.use(bodyParser.json());
app.use(cors());

//routing
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
  });

app.use(express.static(__dirname + '/images'));

app.use(express.static('public'));

server.listen(process.env.PORT || 80, () => {
    console.log(`Server started on port ${server.address().port} :)`);
});

function originIsAllowed(origin) {
  return true;
}