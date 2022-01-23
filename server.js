const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({extended: false}));
mongoose.connect(process.env['MONGO_URI'], { useNewUrlParser: true });
const {Schema} = mongoose;
require('dotenv').config()
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


const userSchema = new Schema({
  username:  String
});
let UserModel = mongoose.model('User', userSchema);

const excerciseSchema = new Schema({
  description:  String,
  duration:  Number,
  date: String,
  id_user: String
});

let ExcerciseModel = mongoose.model('Excercise', excerciseSchema);

app.get('/api/users',(req,res) => {
  UserModel.find({}).exec(function(err, users) {
    if(err) return console.error(err);
    res.json(users);
  });
});

app.post('/api/users',(req,res) => {
  const {username} = req.body;

  const newUser = new UserModel({username:username});
  newUser.save(function(err, data) {
    if (err) return console.error(err);

    res.json(data);
  });
});

app.post('/api/users/:_id/exercises',(req,res) => {

  let {description,duration,date} = req.body;
  const userId = req.params._id;
  let dateObj = (date === undefined || date === '') ? new Date() : new Date(date);

  UserModel.findById({_id:userId}).exec(function(err, user) {

    if(err) return console.error(err);

    const newExcercise = new ExcerciseModel({description:description,duration:duration,date:dateObj.toDateString(),id_user:userId});
    newExcercise.save(function(err, data) {
    if (err) return console.error(err);
    res.json({_id:userId,username:user.username,date:dateObj.toDateString(),duration:parseInt(duration),description:description});
    });
  });

});

app.get('/api/users/:_id/logs',(req,res) => {
  const paramFrom = req.query.from;
  const paramTo = req.query.to;
  const paramLimit = req.query.limit;
  const userId = req.params._id;
  let username = "";
  UserModel.find({_id:userId}).exec(function(err, user) {

    username = user[0].username;
    if(err) return console.error(err);
    
    const listExcercises = ExcerciseModel.find({id_user:userId});

    if(paramTo != undefined && paramFrom != undefined){
      listExcercises.find({created_on: {
        $gte: new Date(paramFrom), 
        $lt: new Date(paramTo)
      }});
    }

    if(paramLimit != undefined){
      listExcercises.limit(parseInt(paramLimit));
    }


    listExcercises.exec((err,excercises) => {
      if(err) return console.error(err);

      let newArray = excercises.map(elm => {
        let dateFormatted = new Date(elm.date).toDateString();
        return {description:elm.description,duration:elm.duration,date:dateFormatted}
      });

      if(!excercises){
        res.json({_id:userId,username:username,count:0,log:[]});
      }else{
        res.json({_id:userId,username:username,count:excercises.length,log:newArray});
      }
      
    });
  });
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
