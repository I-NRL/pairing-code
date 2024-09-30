const express = require("express")
const http = require("http")
const { Server } = require("socket.io");
const path = require('path');
const pair = require('./pair');
const {decrypt} = require('./enc');
const axios = require('axios');


const app = express()
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app)
const io = new Server(server, {
    cors: {
           origin: undefined,
           methods: ["GET", "POST"]
    }
});
io.on("connection", async(socket) => {
       console.log('client connected');
       socket.on('get-pair', async(n)=>{
              return await pair(n, socket);
       })
       socket.on('disconnect', () => {
              console.log(`User disconnected`);
       });
});

const dirName = __dirname.slice(0, -7);
app.post('/get_session', async(req, res) => {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "ID is required" });
    if(!id.includes('::') || !id.includes('inrl~')) return res.status(400).json({ error: "invalid ID" });
    console.log(`Received ID: ${id}`);
    const credsId = decrypt(id.split('::')[0].replace('inrl~',''));
    try {
        const session = await axios.get(`https://gist.githubusercontent.com/inr-l/${credsId}/raw`);
        return res.json({status: true, result: session.data });
    } catch (e) {
        console.log(e);
        return res.status(400).json({ status: false, message: "Internal Server Error" });
    };

    res.status(200).json({ message: "ID received successfully", id });
});

app.use(express.static(path.join(dirName, '/client/build')))
console.log(path.join(dirName, '/client/build'))
app.get('*', (req, res) => res.sendFile(path.resolve(dirName, 'client', 'build', 'index.html')));

const PORT = process.env.PORT || 5000

server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`)
})
