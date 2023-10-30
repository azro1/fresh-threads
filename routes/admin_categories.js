const express = require('express');
const router = express.Router();
const auth = require('../config/auth');
const isAdmin = auth.isAdmin;




// GET Category model 
const Category = require('../models/category'); 



/*
*  GET category index
*/
router.get('/', isAdmin, (req, res) => {
  Category.find((err, categories) => {
    if (err) return console.log(err);
      
      res.render('admin/categories', {
        categories: categories
    }); 
  });
});



/*
*  GET add category
*/
router.get('/add-category', isAdmin, (req, res) => {
    
  let title = "";
    
  res.render('admin/add_category', {
      title: title
  });
     
});



/*
*  POST add category
*/
router.post('/add-category', (req, res) => { 
  
  if (req.session.csrfToken !== req.body.csrfToken) {
    res.sendStatus(401)
    return
  }
    
  // Validate title and content using express validator 
  req.checkBody('title', 'Title must have a value.').notEmpty(); 

  // using body parser to get form values 
  let title = req.body.title;
  // make slug all lowercase and replace all white space with hyphens
  let slug = title.replace(/\s+/g, '-').toLowerCase();
  // also need to cover cases where there is no slug. If no slug is entered, make title the slug
    

  let errors = req.validationErrors();
    
  if (errors) {
    res.render('admin/add_category', {
      errors: errors,
      title: title
    });
  } else {
      // Check that slug is unique as there shouldn't be 2 slugs that are identical
      Category.findOne({ slug: slug }, (err, category) => {
        if (category) {
          req.flash('danger', 'Category title exists, choose another.');
          res.render('admin/add_category', {
            title: title
          });
        } else {
            let category = new Category({
              title: title,
              slug: slug
            });
            
            category.save((err) => {
                if (err) 
                    return console.log(err);
               
                Category.find((err, categories) => {
                    if (err) {
                        console.log(err);
                    } else {
                        req.app.locals.categories = categories;
                      }
                });
                
            
                req.flash('success', 'Category added!'); 
                res.redirect('/admin/categories');
              
            });      
          }
      });
    }
    
});



/*
*  GET edit category
*/
router.get('/edit-category/:id', isAdmin, (req, res) => {
    
  Category.findById(req.params.id, (err, category) => {
      
    if (err) {
      return console.log(err); 
    } else {
        res.render('admin/edit_category', {
          title: category.title,
          id: category._id
        });       
      }
  });
       
});



/*
*  POST edit category
*/
router.post('/edit-category/:id', (req, res) => {
    
  // Validate title and content using express validator 
  req.checkBody('title', 'Title must have a value.').notEmpty(); 

  // using body parser to get form values 
  let title = req.body.title;
  // make slug all lowercase and replace all white space with hyphens
  let slug = title.replace(/\s+/g, '-').toLowerCase();
  let id = req.params.id;

  let errors = req.validationErrors();
    
  if (errors) {
    res.render('admin/edit_category', {
      errors: errors,
      title: title,
      id: id
    });
  } else {
      // Check that slug is unique as there shouldn't be 2 slugs that are identical
      Category.findOne({ slug: slug, _id: {'$ne':id}}, (err, category) => {
        if (category) {
          req.flash('danger', 'Category title exists, choose another.');
          res.render('admin/edit_category', {
            title: title,
            id: id
          });
        } else {
            
           Category.findById(id, (err, category) => {
              if (err) {
                return console.log(err);
            } else {
                category.title = title;
                category.slug = slug;
              }
               
               category.save((err) => {
                   if (err) 
                       return console.log(err);
                   
                   Category.find((err, categories) => {
                       if (err) {
                           console.log(err);
                       } else {
                           req.app.locals.categories = categories;
                         }
                   });    
                   
                
                   req.flash('success', 'Category edited!'); 
                   res.redirect('/admin/categories/edit-category/'+id);
                  
               }); 
           
           });
            
     
        }
      });
    }
    
});



/*
*  GET delete category 
*/
router.get('/delete-category/:id', isAdmin, (req, res) => {
  Category.findByIdAndRemove(req.params.id, (err) => {
    if (err) 
      return console.log(err);
        
    Category.find((err, categories) => {
        if (err) {
            console.log(err);
        } else {
            req.app.locals.categories = categories;
          }
    }); 
      
    req.flash('success', 'Category deleted!');
    res.redirect('/admin/categories/');
    
  });
});




// Exports
module.exports = router;