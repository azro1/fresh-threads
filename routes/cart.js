const express = require('express');
const router = express.Router();



// GET Product model
const Product = require('../models/product');



/*
* GET add product to cart
*/
router.get('/add/:product', (req, res) => {

    let slug = req.params.product;

    Product.findOne({slug: slug}, (err, p) => {
        if (err)
            console.log(err);

     // Check if session cart is defined, if not define it and add the product and if it is, then do something else
        if (typeof req.session.cart == "undefined") {
            req.session.cart = [];
            req.session.cart.push({
                title: slug,
                qty: 1,
                price: parseFloat(p.price).toFixed(2),
                image: '/product_images/' + p._id + '/' + p.image
            });
        } else {
            let cart = req.session.cart;
            let newItem = true;

         // Check if the title of some product inside the array is equal to slug. If it is, it exists and we increment quantity
            for (let i = 0; i < cart.length; i++) {
                if (cart[i].title == slug) {
                    cart[i].qty++;
                    newItem = false;
                    break;
                }
            }

         // Check if newItem is true, if it is then we need to add a new item
            if (newItem) {
                cart.push({
                    title: slug,
                    qty: 1,
                    price: parseFloat(p.price).toFixed(2),
                    image: '/product_images/' + p._id + '/' + p.image
                });
            }

         }

      // console.log(req.session.cart);
         req.flash('success', 'Product added!');
         res.redirect('back');
    });

});



/*
* GET checkout page
*/
router.get('/checkout', (req, res) => {

    if (req.session.cart && req.session.cart.length == 0) {
        delete req.session.cart;
        res.redirect('/cart/checkout');
    } else {
        res.render('checkout', {
        title: 'Checkout',
        cart: req.session.cart
        });
      }
});



/*
* GET update product
*/
router.get('/update/:product', (req, res) => {

let slug = req.params.product;
let cart = req.session.cart;
let action = req.query.action;

    for (let i = 0; i < req.session.cart.length; i++) {
        if (cart[i].title == slug) {
            switch(action) {
                case "add":
                    cart[i].qty++;
                    break;
                case "remove":
                    cart[i].qty--;
                    if (cart[i].qty < 1) {
                        cart.splice(i, 1);
                    }
                    break;
                case "clear":
                    cart.splice(i, 1);
                    if (cart.length == 0) {
                        delete req.session.cart;
                    }
                    break;
                default:
                    console.log('update problem');
                    break;
            }
            break;
        }

    }

    req.flash('success', 'Cart updated!');
    res.redirect('/cart/checkout');

});



/*
* GET clear cart
*/
router.get('/clear', (req, res) => {

    delete req.session.cart;

    req.flash('success', 'Cart cleared!');
    res.redirect('/cart/checkout');
});



/*
* GET buy now
*/
router.get('/buynow', (req, res) => {

    delete req.session.cart;

    res.sendStatus(200);
});




// Exports
module.exports = router;
