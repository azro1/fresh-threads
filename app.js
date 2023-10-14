const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoDbStore = require('connect-mongodb-session')(session);
const expressValidator = require('express-validator');
const fileUpload = require('express-fileupload');
const passport = require('passport');
require('dotenv').config()




// Get Page Model
const Page = require('./models/page');
// Get Category Model
const Category = require('./models/category');





// start server
let PORT = process.env.PORT || 3000;



// Init app
const app = express();



// Connect to db
mongoose.set('useFindAndModify', false);
mongoose.connect(process.env.MONGO_ATLAS_STRING, {useNewUrlParser: true, useUnifiedTopology: true})
.then((result) => {
  console.log('..connected to mongodb');
  app.listen(PORT, () => {
    console.log('Server started on port ' + PORT);

  
    if (result) {
      // Get all pages to pass to header.ejs
      Page.find({})
        .sort({ sorting: 1 })
        .exec((err, pages) => {
          if (err) {
            console.log(err);
          } else {
            app.locals.pages = pages;
          }
        });

      // Get all categories to pass to header.ejs
      Category.find((err, categories) => {
        if (err) {
          console.log(err);
        } else {
          app.locals.categories = categories;
        }
      });
    }
  });
})
.catch((err) => console.log(err))




const store = new mongoDbStore({
  uri: process.env.MONGO_ATLAS_STRING,
  collection: 'sessions'
})



// Set view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');



// Set public folder
app.use(express.static(path.join(__dirname, 'public')));



// Set global errors variable
app.locals.errors = null;



// Express fileUpload middleware
// Allows you to get the image file from form input.
app.use(fileUpload());



// Body Parser middleware
//
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());



// Express Session middleware
app.use(session({
  name: 'ftrends',
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  store: store,
  cookie: { maxAge: 60 * 60 * 1000 }
}));




// Express Validator middleware
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
    let namespace = param.split('.')
    , root = namespace.shift()
    , formParam = root;


    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg : msg,
      value : value
    };
  },

    customValidators: {
        isImage: function(value, filename) {
            let extension = (path.extname(filename)).toLowerCase();
            switch(extension) {
                case '.jpg':
                    return '.jpg';
                case '.jpeg':
                    return '.jpeg';
                case '.png':
                    return '.png';
                case '':
                    return '.jpg';
                default:
                    return false;
            }
        }
    }

}));




// Express Messages middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});



// Passport Config
require('./config/passport')(passport);



// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());




// make the cart session array available in each get request
app.get('*', (req, res, next) => {
    res.locals.user = req.user || null;
    res.locals.session = req.session;
    res.locals.cart = req.session.cart;
    next();
});







// Set routes
const pages = require('./routes/pages.js');
const products = require('./routes/products.js');
const cart = require('./routes/cart.js');
const users = require('./routes/users.js');
const adminPages = require('./routes/admin_pages.js');
const adminCategories = require('./routes/admin_categories.js');
const adminProducts = require('./routes/admin_products.js');




app.use('/admin/pages', adminPages);
app.use('/admin/categories', adminCategories);
app.use('/admin/products', adminProducts);
app.use('/products', products);
app.use('/cart', cart);
app.use('/users', users);
app.use('/', pages);
