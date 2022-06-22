module.exports = function (app, passport, db, multer, ObjectId) {

 // Image Upload Code =========================================================================
var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images/uploads')
  },
  filename: (req, file, cb) => {
  console.log("REQ",req,"FILE",file)
    cb(null, file.fieldname + '-' + Date.now() + ".png")
  }
});
  var upload = multer({ storage: storage });
  
// normal routes ===============================================================

    // show the home page (will also have our login links)
  app.get('/', function (req, res) {
    res.render('index.ejs');
  });

    // PROFILE SECTION ===========================================================
  app.get('/profile', isLoggedIn, function (req, res) {
    db.collection('VentingSession').find({ postedBy: req.user._id }).toArray((err, result) => { //for postedBy: req.user._id , postedBy can be anything. _id is the name in ejs
     
        //db.collection('VentingSession').find().toArray((err, result) => { //for postedBy: req.user._id , postedBy can be anything. _id is the name in ejs
            if (err) return console.log(err)
          // console.log("profile" , postedBy)
          res.render('profile.ejs', {
            user: req.user,
           feelings: result
          })
        })
    });
    //feed page ================================================
  app.get('/feed', isLoggedIn, function (req, res) {
    db.collection('VentingSession').find().toArray((err, result) => {
      if (err) return console.log(err)
      console.log("feed", result)
      res.render('feed.ejs', {
        feelings: result
      })
    })
  });
  //post page
  app.get('/post/:profilePost', isLoggedIn, function(req, res) {
    let postId = ObjectId(req.params.profilePost)
    // console.log(postId)
    db.collection('VentingSession').find({ _id: postId }).toArray((err, result) => {
      if (err) return console.log(err)
      res.render('post.ejs', {
        feelings: result
      })
    })
});
//profile page
app.get('/page/:id', isLoggedIn, function (req, res) {
  let postId = ObjectId(req.params.id)
  db.collection('VentingSession').find({ postedBy: postId }).toArray((err, result) => { // 
    console.log("profile" , result)
    if (err) return console.log(err)
    res.render('page.ejs', {
      feelings: result
    })
  })
});

    // LOGOUT ==============================
  app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });
// post routes
//   app.post('/makePost', isLoggedIn, upload.single('imageUpload'), (req, res) => {
//   let user = req.user._id
//   db.collection('VentingSession').save({ imagecaption: req.body.imagecaption, img: 'images/uploads/' + req.file.filename, postedBy: user }, (err, result) => {
//     if (err) return console.log(err)
//     console.log('saved to database')
//     res.redirect('/profile')
//   })
// })


// message board routes ===============================================================
// add multer middleware image upload to this file 
  app.post('/addVent', isLoggedIn, upload.single('imageUpload'), (req, res) => {
    console.log("addVent" , req.file)
    // let image = "default.jpeg" //typeof return a string 
    // //console.log(req.body.imageUpload)
    // if (typeof req.body.imageUpload !== "undefined"){
    //   image = req.file.filename

   // }
    db.collection('VentingSession').save({ mood: "I am :" + req.body.feeling, vent: "I feel :" + req.body.ventText, hearts: 0, image: "images/uploads/" + req.file.filename , imagecaption: "The image explain :" + req.body.imagecaption, postedBy: req.user._id, comments:[]}, (err, result) => {
      if (err) return console.log(err)
      console.log('saved to database')
      res.redirect('/profile')
    })
  })

  app.put('/feelVent', isLoggedIn, (req, res) => {
   db.collection('VentingSession')
      .findOneAndUpdate({_id:ObjectId (req.body.id) }, {
        $inc: {
          hearts: 1
        }
      }, {
        sort: { _id: -1 },
        //upsert: true
      }, (err, result) => {
        if (err) return res.send(err)
        res.send(result)
      })
  })

  app.put('/addComment', isLoggedIn, (req, res) => {
    db.collection('VentingSession')
      .findOneAndUpdate({ _id: ObjectId(req.body.id) }, {
        $push: {
          comments: req.body.comment
        }
      }, 
       
       (err, result) => {
        if (err) return res.send(err)
        res.send(result)
      })
  })



  app.delete('/deleteMistake', isLoggedIn, (req, res) => {
    db.collection('VentingSession').findOneAndDelete({
      _id: ObjectId(req.body.id)
    },
      (err, result) => {
        if (err) return res.send(500, err)
        res.send('Message deleted!')
      })
  })

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/login', function (req, res) {
            res.render('login.ejs', { message: req.flash('loginMessage') });
        });

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect: '/feed', // redirect to the secure profile section
            failureRedirect: '/login', // redirect back to the signup page if there is an error
            failureFlash: true // allow flash messages
        }));

        // SIGNUP =================================
        // show the signup form
        app.get('/signup', function (req, res) {
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        });

        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect: '/profile', // redirect to the secure profile section
            failureRedirect: '/signup', // redirect back to the signup page if there is an error
            failureFlash: true // allow flash messages
        }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
  app.get('/unlink/local', isLoggedIn, function (req, res) {
    var user = req.user;
    user.local.email = undefined;
    user.local.password = undefined;
    user.save(function (err) {
      res.redirect('/profile');
    });
  });

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
