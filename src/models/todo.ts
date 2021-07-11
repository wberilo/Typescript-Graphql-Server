export {};
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const todoSchema = new Schema({
  content: String,
  done: Boolean,
  userId: String,
})

module.exports = mongoose.model('Todo', todoSchema)