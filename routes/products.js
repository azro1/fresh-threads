const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const auth = require('../config/auth');
const isUser = auth.isUser;


// GET Product model 
const Product = require('../models/product'); 



// GET Category model 
const Category = require('../models/category'); 



/*
* GET all products 
*/
// add isUser to the routes you want to limit access to. Now only logged in users will be able to access 'All products'.
// router.get('/', (req, res) => {
router.get('/', isUser, (req, res) => {     

    Product.find((err, products) => {
        if (err)
            console.log(err);
      
        res.render('all_products', {
            title: 'All Products',
            products: products
        });
    });
});



/*
* GET products by category
*/
router.get('/:category', (req, res) => {
    
    let categorySlug = req.params.category;
    
    Category.findOne({slug: categorySlug}, (err, category) => {
        Product.find({category: categorySlug}, (err, products) => {
            if (err)
                console.log(err);

            res.render('category_products', {
                title: category.title,
                products: products
            });
        });            
                     
    });
    
});



/*
* GET product details 
*/
router.get('/:category/:product', (req, res) => {
    
    let galleryImages = null;
    
    Product.findOne({slug: req.params.product}, (err, product) => {
        if (err) {
            console.log(err);
        } else {
            let galleryDir = 'public/product_images/' + product._id + '/gallery';
            
            
            fs.readdir(galleryDir, (err, files) => {
                if (err) {
                    console.log(err);
                } else {
                    galleryImages = files;
                    
                    
                    res.render('product', {
                        title: product.title,
                        p: product,
                        galleryImages: galleryImages
                    });
                  }
                
            });
          }
    });
    
});




// Exports
module.exports = router;