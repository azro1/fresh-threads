const express = require('express');
const router = express.Router();
var mkdirp = require('mkdirp');
const fs = require('fs-extra');
const resizeImg = require('resize-img');
const auth = require('../config/auth');
const isAdmin = auth.isAdmin;





// GET Product model 
const Product = require('../models/product'); 


// GET Category model 
const Category = require('../models/category'); 


/*
*  GET products index
*/
router.get('/', isAdmin, (req, res) => {
    let count;
    
    Product.countDocuments((err, c) => {
        count = c;
    });
    
    Product.find((err, products) => {
        res.render('admin/products', {
            products: products,
            count: count
        });
    });
});

  

/*
*  GET add product
*/
router.get('/add-product', isAdmin, (req, res) => {
    
  let title = "";
  let desc = "";
  let price = "";
    
  Category.find(function(err, categories) {
      res.render('admin/add_product', {
          title: title,
          desc: desc,
          categories: categories,
          price: price
      });
  });
 
});



/*
*  POST add product
*/
router.post('/add-product', (req, res) => {
        
    if (!req.files) {
      imageFile = "";
    } 
    else if (req.files) {
      var imageFile = typeof(req.files.image) !== "undefined" ? req.files.image.name: "";
    }
    
  // Validate title and content using express validator 
  req.checkBody('title', 'Title must have a value.').notEmpty(); 
  req.checkBody('desc', 'Description must have a value.').notEmpty();
  req.checkBody('price', 'Price must have a value.').isDecimal(); 
  req.checkBody('image', 'You must upload an image').isImage(imageFile);

  // using body parser to get form values 
  let title = req.body.title; 
  let slug = title.replace(/\s+/g, '-').toLowerCase();
  let desc = req.body.desc;
  let price = req.body.price;
  let category = req.body.category;

    
    
  let errors = req.validationErrors();
    
  if (errors) {
      Category.find(function(err, categories) {
          res.render('admin/add_product', {
              errors: errors,
              title: title,
              desc: desc,
              categories: categories,
              price: price
          });
      });
  } else {
    // Check that product name is unique.
      Product.findOne({ slug: slug }, function(err, product) {
        if (product) {
          req.flash('danger', 'Product title exists, choose another.');
          Category.find(function(err, categories) {
              res.render('admin/add_product', {
                  title: title,
                  desc: desc,
                  categories: categories,
                  price: price
              });
          });
        } else {
            
            let price2 = parseFloat(price).toFixed(2);
            
            let product = new Product({
                title: title,
                slug: slug,
                desc: desc,
                price: price2,
                category: category,
                image: imageFile
            });
            
            product.save(function(err) {
                if (err) 
                    return console.log(err);
                
                mkdirp('public/product_images/'+product._id, function(err) {
                    return console.log(err);
                });
                
                mkdirp('public/product_images/'+product._id + '/gallery', function(err) {
                    return console.log(err);
                });
                
                
                mkdirp('public/product_images/'+product._id + '/gallery/thumbs', function(err) {
                    return console.log(err);
                });
                
                if (imageFile !== "") {
                    let productImage = req.files.image;
                    let path = 'public/product_images/' + product._id + '/' + imageFile;
                    
                    productImage.mv(path, function(err) {
                        return console.log(err);
                    });
                }
                
                    req.flash('success', 'Product added!'); 
                    res.redirect('/admin/products');
                  
            });      
          }
      });
    }
    
});



/*
*  GET edit product
*/
router.get('/edit-product/:id', isAdmin, (req, res) => {
    
  let errors;
    
  if (req.session.errors) {
    errors = req.session.errors;
  }
    req.session.errors = null;
    
    Category.find(function(err, categories) {
        
      Product.findById(req.params.id, (err, p) => {
          if (err) {
              console.log(err);
              res.redirect('/admin/products');
          } else {
              let galleryDir = 'public/product_images/' + p._id + '/gallery';
              let galleryImages = null;
              
              fs.readdir(galleryDir, (err, files) => {
                  if (err) {
                      console.log(err);
                  } else {
                      galleryImages = files;
                      
                      res.render('admin/edit_product', {
                         title: p.title,
                         errors: errors,
                         desc: p.desc,
                         categories: categories,
                         category: p.category.replace(/\s+/g, '-').toLowerCase(),
                         price: parseFloat(p.price).toFixed(2),
                         image: p.image,
                         galleryImages: galleryImages,
                         id: p._id
                      });
                    }
              });
            }
      });
        
  });   
    
       
});



/*
*  POST edit product
*/
router.post('/edit-product/:id', (req, res) => {
    
    if (!req.files) {
      imageFile = "";
    } 
    else if (req.files) {
      var imageFile = typeof(req.files.image) !== "undefined" ? req.files.image.name: "";
    }
    
  // Validate title and content using express validator 
  req.checkBody('title', 'Title must have a value.').notEmpty(); 
  req.checkBody('desc', 'Description must have a value.').notEmpty();
  req.checkBody('price', 'Price must have a value.').isDecimal(); 
  req.checkBody('image', 'You must upload an image').isImage(imageFile);

  // using body parser to get form values 
  let title = req.body.title; 
  let slug = title.replace(/\s+/g, '-').toLowerCase();
  let desc = req.body.desc;
  let price = req.body.price;
  let category = req.body.category;
  let pimage = req.body.pimage;
  let id = req.params.id;

    
  let errors = req.validationErrors();

  if (errors) {
      req.session.errors = errors;
      res.redirect('/admin/products/edit-product/' +id);
  } else {
      Product.findOne({slug: slug, _id:{'$ne':id}}, function(err, p) {
          if (err) 
              console.log(err);
          
          if (p) {
              req.flash('danger', 'Product title exist, choose another.');
              res.redirect('/admin/products/edit-product/' +id);
          } else {
              Product.findById(id, function(err, p) {
                  if (err) 
                      console.log(err);
                  
                  p.title = title;
                  p.slug = slug;
                  p.desc = desc;
                  p.price = parseFloat(price).toFixed(2);
                  p.category = category;
                  if (imageFile !== "") {
                      p.image = imageFile;
                  }
                  
                  p.save(function(err) {
                      if (err)
                          console.log(err);
                      
                      if (imageFile !== "") {
                          if (pimage !== "") {
                              fs.remove('public/product_images/' + id + '/' + pimage, function(err) {
                                  if (err)
                                      console.log(err);
                              });
                          }
                          
                          let productImage = req.files.image;
                          let path = 'public/product_images/' + id + '/' + imageFile;

                          productImage.mv(path, function(err) {
                              return console.log(err);
                          });
                      }
                      
                      req.flash('success', 'Product edited!'); 
                      res.redirect('/admin/products/edit-product/'+id);

                      
                  });
              });
          }
      });

  }
    
});



/*
*  POST product gallery 
*/
router.post('/product-gallery/:id', (req, res) => {

    let productImage = req.files.file;
    let id = req.params.id;
    let path = 'public/product_images/' + id + '/gallery/' + req.files.file.name;
    let thumbsPath = 'public/product_images/' + id + '/gallery/thumbs/' + req.files.file.name;
    
    productImage.mv(path, function(err) {
        if (err)
            console.log(err);
        
        resizeImg(fs.readFileSync(path), {width: 100, height: 100}).then(function(buf) {
            fs.writeFileSync(thumbsPath, buf);
        });
    });

    res.sendStatus(200);
});



/*
*  GET delete image 
*/
router.get('/delete-image/:image', isAdmin, (req, res) => {
    let originalImage = 'public/product_images/' + req.query.id + '/gallery/' + req.params.image;
    let thumbImage = 'public/product_images/' + req.query.id + '/gallery/thumbs/' + req.params.image;
    
    fs.remove(originalImage, (err) => {
        if (err) {
            console.log(err);
        } else {
            fs.remove(thumbImage, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    req.flash('success', 'Image deleted!'); 
                    res.redirect('/admin/products/edit-product/' + req.query.id);
                  }
            });
        }
    });
});



/*
*  GET delete product 
*/
router.get('/delete-product/:id', isAdmin, (req, res) => {
    
    let id = req.params.id;
    let path = 'public/product_images/' + id;
    
    fs.remove(path, (err) => {
        if (err) {
            console.log(err);
        } else {
            Product.findByIdAndRemove(id, (err) => {
                console.log(err);
            });
            
            req.flash('success', 'Product deleted!'); 
            res.redirect('/admin/products');
            
          }
    });
});

// Exports
module.exports = router;