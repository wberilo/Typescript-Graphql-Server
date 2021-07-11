import { graphqlHTTP } from "express-graphql";
const express = require('express');
import { Request, Response, NextFunction } from 'express';
const bodyParser = require('body-parser');
const mongoose = require('mongoose')
const schema = require('./schema/schema');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt')
const User = require('./models/user');

require('dotenv').config()
const app = express()
const port = process.env.TODO_PORT
app.use(bodyParser.json())

interface TokenRequest extends Request {
  id?:string
}

interface TokenInterface {
  id:string
}
interface UserInterface {
  id:string,
  userName:string,
  password:string
}

function verifyJWT(req:TokenRequest, res:Response, next:NextFunction){
  const token = req.headers['Authorization'];
  if (!token) return res.status(401).json({ auth: false, message: 'No token provided.' });
  
  jwt.verify(token, process.env.SECRET, function(err:Error, decoded:TokenInterface) {
    if (err) return res.status(500).json({ auth: false, message: 'Failed to authenticate token.' });
    req.id = decoded.id
    next();
  });
}

app.use('/graphql',verifyJWT ,graphqlHTTP(req => ({ schema, context:req, graphiql:true })));

app.post('/login', async (req:TokenRequest, res:Response, next:NextFunction) => {
  const userName:string = req.body.username;
  const password:string = req.body.password;
  const user:UserInterface = await User.find({userName})
  if(user && bcrypt.compareSync(password, user.password)){
    const id = user.id;
    const token = jwt.sign({ id }, process.env.SECRET, {expiresIn: "30 days",algorithm: "HS512"});
    return res.json({ auth: true, token: token });
  }
  return res.status(500).json({message: 'Invalid Login'});
})

app.post('/register', async (req:Request, res:Response, next:NextFunction) => {
  if(!req.body.username || req.body.password ) return res.status(400).json({error: 'invalid'})
  const userName:string = req.body.username;
  const password:string = bcrypt.hashSync(req.body.password, process.env.TODO_SALT);
  const user:UserInterface = await User.find({userName})
  if(user) return res.status(400).json({error: 'user already exists'})
  let newUser = new User({
    userName: userName,
    password: password
  });
  newUser.save();
})

mongoose
  .connect(`${process.env.TODO_MONGODB_URL}`)
  .then(() => (app.listen(port, () => console.log(`🍕 server running on: ${port}`))))
  .catch((error: Error) => console.log(error))