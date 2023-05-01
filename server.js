const express = require('express')
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')
const { Server } = require('socket.io')

const UserModel = require('./models/UserModels.js')

const PORT = process.env.PORT || '3001'

const app = express();
app.use(cors())
app.use(express.json())
app.use(bodyParser.json());

//FOR SOCKET.IO
const http = require('http');
const server = http.createServer(app);
// const io = new Server(server)
const io = new Server(server, {
    cors: {
        origin: '*', //'https://socketiochatappreact.onrender.com',
        methods: ['GET', 'POST'],
    }
});
//CONNECT TO DB
try{mongoose.connect('mongodb+srv://nash:nash@cluster0.av72roz.mongodb.net/mayOneChanged')} 
catch (err) {console.log(err);}

//SOCKET.IO
io.on('connection', (socket) => {
    console.log(`A User Connected: ${socket.id}`)

    socket.on('joinRoom', (room) => {
        socket.join(room)
        console.log(`User: ${socket.id} joined room: ${room}`)
    })

    socket.on('sendMessageToServer', (data) => {
        const room = data.room.split('-');
        let to = data.name !== room[0] ? room[0] : room[1] 
        
        io.to(data.room).emit('sendMessageToClient', {
            message: data.message, 
            room: data.room,
            name: data.name, 
            time: data.time, 
            profile: data.profile,
            to,
        })
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
        console.log(req.body)
        if (found){
            res.json({ status: "error", message: "user already exists"})
        } 
        else {
            const newUser = new UserModel({
                name, password, profile, 
                addedFriends: [], messages: {}
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
        console.log(req.body)

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

app.get('/getUserAddedUsers/:name/:token', async (req, res) => {
    try{
        const name = req.params.name;
        const token = req.params.token;
        const result = jwt.verify(token, 'secret123')

        if (result.name && result.iat){
            const data = await UserModel.findOne({name});

            if (data){
                res.json({ status: "ok", data })
            } else {
                res.json({ status: "error", data })
            }
        } 
    } catch (error){ //
        res.json({status: "error", error})
    }
})

app.post("/addUser", async (req, res) => {
    try{
        const {token, ownerName, toUserName} = req.body;
        const result = jwt.verify(token, 'secret123')

        if (result.name && result.iat){
            let owner = await UserModel.findOne({name: ownerName})
            let toUser = await UserModel.findOne({name: toUserName})
            
            //CREATE MESSAGES ARRAY
            //https://mongoosejs.com/docs/api/map.html

            owner.messages.set(toUserName, []) 
            toUser.messages.set(ownerName, []) 
            
            //ADD USER
            if (!owner.addedFriends.includes(toUserName) && 
                !toUser.addedFriends.includes(ownerName))
            {
                owner.addedFriends.push(toUserName);
                toUser.addedFriends.push(ownerName);
            }
            
            await owner.save()
            await toUser.save()

            owner = await UserModel.findOne({name: ownerName})
            toUser = await UserModel.findOne({name: toUserName})

            res.json({status: 'ok', owner, toUser})
        }
    } catch (error){
        res.json({status: "error", error})
    }
})

app.post("/deleteUser", async (req, res) => {
    try{
        const {token, ownerName, toUserName} = req.body;
        const result = jwt.verify(token, 'secret123')

        if (result.name && result.iat){
            let owner = await UserModel.findOne({name: ownerName})
            let toUser = await UserModel.findOne({name: toUserName})
            
            //DELETE MESSAGES ARRAY
            // owner.messages.delete(toUserName)
            // toUser.messages.delete(ownerName)
            
            //DELETE USER 
            owner.addedFriends.splice(
                owner.addedFriends.indexOf(toUser.name, 1))

            toUser.addedFriends.splice(
                toUser.addedFriends.indexOf(owner.name), 1)
                
            await owner.save()
            await toUser.save()

            owner = await UserModel.findOne({name: ownerName})
            toUser = await UserModel.findOne({name: toUserName})

            res.json({status: 'ok', owner, toUser})
        }
    } catch (error){
        res.json({status: "error", error})
    }
})

app.post('/getInitialConversation', async (req, res) => {
    try{
        const {token, ownerName} = req.body;
        const result = jwt.verify(token, 'secret123')

        if (result.name && result.iat){
            const owner = await UserModel.findOne({name: ownerName})
            
            res.json({status: 'ok', data: owner})
        }
    } catch (error){
        res.json({status: "error", error})
    }
})

app.post('/saveConversation', async (req, res) => {
    try{
        const {token, ownerName, toUserName, messagesArray} = req.body;
        const result = jwt.verify(token, 'secret123')

        if (result.name && result.iat){
            let ownerModel = await UserModel.findOne({name: ownerName})
            let toUserModel = await UserModel.findOne({name: toUserName})
            
            const array = []
            messagesArray.forEach((item, i) => {
                if (item.name === toUserName || item.name === ownerName){
                    array.push(item)
                }
            })
            
            ownerModel.messages.set(toUserName, [
                ...array
            ]) 
            toUserModel.messages.set(ownerName, [
                ...array
            ]) 

            await ownerModel.save()
            await toUserModel.save()
            
            ownerModel = await UserModel.findOne({name: ownerName})
            toUserModel = await UserModel.findOne({name: toUserName})

            res.json({status: 'ok', ownerModel, toUserModel})
        }
    } catch (error){
        res.json({status: "error", error})
    }
})

app.post('/changeInfo', async (req, res) => {
    try{
        const {token, owner, newName, newPassword, newAvatar} = req.body;
        const result = jwt.verify(token, 'secret123')

        if (result.name && result.iat){
            
            let ownerModel = 'no update :/'

            if (newName !== ''){
                ownerModel = await UserModel.findOneAndUpdate({name: owner}, {name: newName})
                
                ownerModel.addedFriends.forEach(async (item) => {
                    let userModel = await UserModel.findOne({name: item})
                    const index = userModel.addedFriends.indexOf(owner)
                    userModel.addedFriends.splice(index, 1, newName)
                    await userModel.save()

                    userModel = await UserModel.findOne({name: item})
                })
            }
            if (newPassword !== ''){
                ownerModel = await UserModel.findOneAndUpdate({name: owner}, {password: newPassword})
            }
            if (newAvatar !== ''){
                ownerModel = await UserModel.findOneAndUpdate({name: owner}, {profile: newAvatar})
            }
            
            res.json({status: "ok changing", newName})
        }
    } catch (error){
        res.json({status: "error", error})
    }
})

server.listen(PORT, () => console.log('>> ', PORT))
