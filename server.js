const express = require('express')
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')

app.use(cors())
app.use(express.json())
app.use(bodyParser.json());

const UserModel = require('./models/UserModels.js')

try{
    mongoose.connect('mongodb+srv://nash:nash@cluster0.av72roz.mongodb.net/chatApplicationOfficial')
} catch (err) {
    console.log(err);
}

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

app.post('/getAllUsers', async (req, res) => {
    try{
        const {token} = req.body;
        const result = jwt.verify(token, 'secret123')
        
        if (result.name && result.iat){
            const data = await UserModel.find();
            res.json({status: 'ok', data})
        }
    } catch (error){
        res.json({ status: 'error', error })
    }
})

app.listen('3001', () => console.log('>> 3001'))