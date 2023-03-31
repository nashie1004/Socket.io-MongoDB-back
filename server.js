const express = require('express')
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')

app.use(cors())
app.use(express.json())
app.use(bodyParser.json());

try{
    mongoose.connect('mongodb+srv://nash:nash@cluster0.av72roz.mongodb.net/chatApplicationOfficial')
} catch (err) {
    console.log(err);
}

app.post('/register', async (req, res) => {
    try{
        const {} = req.body;
        const found = await UserModel.findOne({})

    } catch (error){
        res.json({ status: 'register error', error })
    }
})

app.post('/login', async (req, res) => {
    try{
        //
    } catch (error){
        res.json({ status: 'login error', error })
    }
})

app.post('/getAllUsers', async (req, res) => {
    try{
        //
    } catch (error){
        res.json({ status: 'getAllUsers error', error })
    }
})

app.listen('3001', () => console.log('>> 3001'))