var session = require('express-session');
var createError = require('http-errors');
var express = require('express');
var path = require('path');
const ax = require("axios");
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var mysql      = require('mysql');
var connection = mysql.createConnection({host     : 'localhost',user     : 'mary',password : 'mary5!!!',database:'imdb'});
connection.connect();
var app = express();
	async function listemovies(){
	//most recent
        return ax.get("https://yts.mx/api/v2/list_movies.json?sort_by=year");
	}
                async function mid(mid){
                return ax.get("https://yts.mx/api/v2/movie_details.json?movie_id="+mid);
                }
                async function queryterm(titrefilm){
         return ax("https://yts.mx/api/v2/list_movies.json?query_term="+titrefilm);
	}
                async function genre(genrefilm){
         return ax("https://yts.mx/api/v2/list_movies.json?genre="+genrefilm);
	}


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.disable('etag');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false,
  originalMaxAge: 365 * 24 * 60 * 60 * 1000,
  expires:false }
  
}));


app.post('/logout',function(req,res){
  if (req && req.session && req.session.loggedIn){
  req.session.destroy();
  res.send('vous etes a present deconnecte');
  } else {
      res.send('vous souhaitez vous connecter');
  }
  
  });
  
  app.get('/', async function(req,res){
      var films;
      console.log(JSON.stringify(req.session)+"sessions");

  var userdecon =     !req.session.loggedIn,movie,mostrecentfilms;
  connection.query(
    `select note.movie_id as movie_id, note.note_id as note_id, user.name as username
from note
      LEFT JOIN user ON note.user_id = user.id
    where hour_and_date in (
        select max(hour_and_date) from note group by movie_id
    ) ORDER BY hour_and_date DESC
limit 20;`,
    async function (err,data) {
            if (err) {
                console.log('erreur avec la premiere requete');
          } else {

        mostrecentfilms = await listemovies();
	console.log(mostrecentfilms);
	if (data.length > 0){
		for (var i=0;i<data.length;i++){
        	movie= await mid(data[i]['movie_id']);
		console.log(movie);
			data[i]['title']=movie.data.data.movie.title;
			data[i]['smallcover']=movie.data.data.movie.small_cover_image;
			data[i]['year']=movie.data.data.movie.year;
		}
	}

              res.render('index',{films:mostrecentfilms.data.data.movies, titre:'Bienvenue', userdecon: userdecon,mostrecentnotes:data});
          }
      }
              );
      console.log(films);

  });

  app.post('/', function(req,res){

    var userdecon =     !req.session.loggedIn;
    
  res.render('index',{titre:'Bienvenue', userdecon: userdecon});
  
  });
  

app.get('/list_movies',function(req,res){
  var q = req.body;
  var title = q.titre.replace(' ','%').replace('%20','%');
  connection.query(
    'SELECT * FROM movie WHERE name LIKE ?',
    [title],
    function (err,data) {
            if (err) {
              return null;
          } else {
        var list=[];
      data.forEach(res => {
        list.push({name: res['title'], description: res['description'], id: res['id'], image: res['image']});
      });
      res.json(list);
          }

    });
  });

  app.get('/movies',function(req,res){

    var q=req.body;
    if (q.titre) {
    var name = q.titre.replace(' ','%').replace('%20','%');
    connection.query(
      "SELECT * from movies WHERE name like ?",
      [name],
      function (err,data) {
      if (err) {
      }else {
    res.render('movies',{titre: 'Liste des résultats de films pour le titre "'+name+'"',films:data});
      }
    });
    }else{
    connection.query(
      "SELECT * from movies",
      [name],
      function (err,data) {
      if (err) {
      }else {
    res.render('movies',{titre: 'Tous les films',films:data});
      }
    }
    );
    }
});

app.post('/newlogin',function(req,res){
  var q = req.body;
console.log(q);
            var name = q.username;
console.log(name);
           var password = require("crypto").createHash("sha256").update(q.password).digest("hex");
console.log(password);

            connection.query(
              'SELECT * FROM user WHERE name = ? AND password = ?',
                    [name,password],
              function (err,data) {
                      if (err) {
console.log('erreur  SELECT * FROM imdb.user');
                    res.send("notok");
                    } else {
console.log('ok SELECT * FROM imdb.user');

                if (data.length > 0) {
                  //se connecter
                if (!req.session.login) {
                  req.session.login = {};
                }
                  req.session.login.username = name;
                  req.session.login.password = password;
                  req.session.login.id = data[0]['id'];
                      req.session.loggedIn = true;
                      req.session.save();
                  //revenir à la page précédente

                    console.log(req.session.login);
                    res.send("ok");
                } else {
                  //créer l'utilisateur 
                  connection.query(
                    `INSERT INTO user (name, password)
             VALUES
            ( ?, ?)`,
            
                    [name,password],
                    function (err,data) {
                      if (err) {
                        
                    res.send("notok");
                    } else {
                        
                    res.send("notok");
                    }
                  });

                }

                    }


              }
            );
            
            });
        
            app.get('/login',function(req,res){
              var q = req.body;
              
              res.render('login',{titre:'Connexion et inscription'});
              });


              app.post('/login',function(req,res){
                var q = req.body;
                
                res.render('login',{titre:'Connexion et inscription'});
                });


app.post('/new_movie',function(req,res){
var q = req.body;
var values = [q.name, q.description, q.image];
connection.query(
  `INSERT INTO movie (name, description, image)
 VALUES
( ?, ?, ?)`,
  values,
  function (err,data) {
        if (err) {
            res.send('error');
        } else {
            res.send(data);
        }

  }
);
});
	
//

// catch 404 and forward to error handler


app.get('/films/:id?',async function(req,res){
    var iddufilm = req.params.id;
    if(iddufilm)
    {
    console.log(req.session);
	async function movieid(){
         return ax("https://yts.mx/api/v2/movie_details.json?movie_id="+iddufilm);
	}
         var unfilm = await movieid();
         var film = unfilm.data.data.movie;


  var user_id, id = req.params.id,username,userdecon = !req.session.loggedIn;
    if (!userdecon && req.session && req.session.login) {
        user_id = req.session.login.id;
    }
      console.log(req.params, username);
  connection.query(
    
  `SELECT user.name as username, note.hour_and_date as hour_and_date, note.note_id as note
   FROM note
  LEFT JOIN user ON note.user_id = user.id
  WHERE note.movie_id = ? ;`
    ,
    [id],
    async function (err,notesdufilm) {
console.log(notesdufilm);
    if (err) {
        console.log('erreur pas de film');
    var titrepage = "erreur";
res.render('note',{userdecon,film,iddufilm,datafilm:null, titrepage:titrepage, notesdufilm,user_id});
    }else {
        console.log('unfilm');
        console.log(user_id+"user");
    if (notesdufilm.length > 0) {
      res.render('note',{iddufilm,film,titrepage:'', notesdufilm,user_id,userdecon});
	} else {
	var titrepage = "erreur";
res.render('note',{iddufilm,film,datafilm:null, titrepage, notesdufilm,userdecon,user_id});
	}
    }
    });
  
    } else {
var q = req.query;
var genrefilm = q.genre;
var titrefilm = q.titre,titrepage = 'Fiches film de '+'"'+String(titrefilm||genrefilm)+'"';

if (typeof titrefilm === "string") {
    titrefilm = '%'+titrefilm.toLowerCase().replace(' ','%')+'%';
}
console.log(String(titrefilm));

console.log(String(genrefilm));
var films;
if (titrefilm) {
         var cherche = await queryterm(titrefilm);
	console.log(cherche);
         films = cherche.data.data.movies;


res.render('movies',{titre: titrepage,films});
  } else if(genrefilm) {
         var cherche = await genre(genrefilm);
         films = cherche.data.data.movies;


res.render('movies',{titre: titrepage,films});
  } else {
    res.redirect(200,'/');
  }
}
});



  app.post('/new_note',function(req,res) {
    var q = req.query;
	var username=req.session.login.username;
    var date = new Date().toISOString().slice(0, 19).replace('T', ' ');
	var note=q.note;
    var params = [date, q.user_id, q.film_id,note];
    console.log(JSON.stringify(params));
    connection.query(
      `INSERT INTO note (hour_and_date, user_id, movie_id,note_id) VALUES (?,?,?,?);`
      ,
      params,
      function (err,data) {
      if (err) {
    res.send('notok');
      }else {

    date && username ? res.json({date,note,username}) : res.send('notok');
      };
      }
    );
  });
    app.use(function(req, res, next) {
      next(createError(404));
    });
// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
