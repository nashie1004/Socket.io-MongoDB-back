const express = require('express')
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')
const { Server } = require('socket.io')

const UserModel = require('./models/UserModels.js')

const app = express();
app.use(cors())
app.use(express.json())
app.use(bodyParser.json());

//FOR SOCKET.IO
const http = require('http');
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
    }
});

//CONNECT TO DB
try{mongoose.connect('mongodb+srv://nash:nash@cluster0.av72roz.mongodb.net/chatApplicationOfficial')} 
catch (err) {console.log(err);}

//SOCKET.IO
io.on('connection', (socket) => {
    console.log(`A User Connected: ${socket.id}`)

    socket.on('joinRoom', (room) => {
        socket.join(room)
        console.log(`User: ${socket.id} joined room: ${room}`)
    })

    socket.on('sendMessageToServer', (data) => {
        io.to(data.room).emit('sendMessageToClient', {
            message: data.message,
            room: data.room,
            name: data.name,
        })
        console.log(`message: ${data.message} on room: ${data.room}`)
    })

    socket.on('disconnect', () => {
        console.log(`A User Disconnected`)
    })
})

//ROUTES
app.post('/register', async (req, res) => {
    try{
        const {name, password, profile} = req.body;
        const found = await UserModel.findOne({name})
        if (found){
            res.json({ status: "error", message: "user already exists"})
        } 
        else {
            const newUser = new UserModel({
                name, password, profile
            })
            await newUser.save()
            res.json({ status: "ok", newUser })
        }
    } catch (error){
        res.json({ status: 'error', error })
    }
})

app.post('/login', async (req, res) => {
    try{
        const {name, password} = req.body;
        const found = await UserModel.findOne({name, password})

        if (found){
            const token = jwt.sign({ name }, 'secret123')
            res.json({ status: 'ok', found, token })
        } 
        else {
            res.json({ status: 'error', message: "user not found error" })
        }
    } catch (error){
        res.json({ status: 'error', error })
    }
})

app.get('/getAllUsers/:token', async (req, res) => {
    try{
        const result = jwt.verify(req.params.token, 'secret123')
        
        if (result.name && result.iat){
            const data = await UserModel.find();
            res.json({status: 'ok', data})
        }
    } catch (error){
        res.json({ status: 'error', error })
    }
})

app.post("/addUser", async (req, res) => {
    try{
        const {token, ownerName, toUserName} = req.body;
        const result = jwt.verify(token, 'secret123')
        if (result.name && result.iat){
            const owner = await UserModel.findOne({name: ownerName})
            const toUser = await UserModel.findOne({name: toUserName})
            
            // TODO: 
            // owner.addedFriends.push(toUser.name);
            // toUser.addedFriends.push(owner.name);
            // UserModel.save()

            res.json({status: 'ok', owner, toUser})
        }
    } catch (error){
        res.json({status: "error", error})
    }
})

server.listen('3001', () => console.log('>> 3001'))