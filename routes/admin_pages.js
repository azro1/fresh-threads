const express = require('express');
const router = express.Router();
const auth = require('../config/auth');
const isAdmin = auth.isAdmin;



// GET Page model 
const Page = require('../models/page'); 



/*
*  GET pages index
*/
router.get('/', isAdmin, (req, res) => {
    Page.find({}).sort({ sorting: 1}).exec((err, pages) => {
        res.render('admin/pages', {
            pages: pages
        });
    });
});



/*
*  GET add page
*/
router.get('/add-page', isAdmin, (req, res) => {
    
  let title = "";
  let slug = "";
  let content = "";
    
  res.render('admin/add_page', {
      title: title,
      slug: slug,
      content: content
  });
    
    
});



/*
*  POST add page
*/
router.post('/add-page', (req, res) => {
    
  // Validate title and content using express validator 
  req.checkBody('title', 'Title must have a value.').notEmpty(); 
  req.checkBody('content', 'Content must have a value.').notEmpty(); 

  // using body parser to get form values 
  let title = req.body.title;
  // make slug all lowercase and replace all white space with hyphens
  let slug = req.body.slug.replace(/\s+/g, '-').toLowerCase();
  // also need to cover cases where there is no slug. If no slug is entered, make title the slug
    
  if (slug === "") slug = title.replace(/\s+/g, '-').toLowerCase();
  let content = req.body.content;
    
    
    
  let errors = req.validationErrors();
    
  if (errors) {
    res.render('admin/add_page', {
      errors: errors,
      title: title,
      slug: slug,
      content: content
    });
  } else {
      // Check that slug is unique as there shouldn't be 2 slugs that are identical
      Page.findOne({ slug: slug }, (err, page) => {
        if (page) {
          req.flash('danger', 'Page slug exists, choose another.');
          res.render('admin/add_page', {
            title: title,
            slug: slug,
            content: content
          });
        } else {
            let page = new Page({
              title: title,
              slug: slug,
              content: content,
              sorting: 100
            });
            
            page.save(function(err) {
                if (err) 
                    return console.log(err);
                    
                Page.find({}).sort({ sorting: 1}).exec(function(err, pages) {
                    if (err) {
                        console.log(err);
                    } else {
                        req.app.locals.pages = pages;
                      }
                }); 
                    
              
                req.flash('success', 'Page added!'); 
                res.redirect('/admin/pages');
        
            });      
          }
      });
    }
    
});



// Sort pages function
function sortPages(ids, callback) {
    let count = 0;
    
    for (let i = 0; i < ids.length; i++) {
        let id = ids[i];
        count++;
        
       (function(count) {
            Page.findById(id, function(err, page) {
                page.sorting = count;
                page.save(function(err) {
                    if (err) 
                       return console.log(err);
                    ++count;
                    if (count >= ids.length) {
                        callback();
                    }
                });
            });
      
        })(count); 
        
     } 
};



/*
*  POST reorder pages 
*/
router.post('/reorder-pages', (req, res) => {
    let ids = req.body['id[]'];
    
    
    sortPages(ids, function() {
        Page.find({}).sort({ sorting: 1}).exec(function(err, pages) {
            if (err) {
                console.log(err);
            } else {
                req.app.locals.pages = pages;
              }
        });
    });
    
});



/*
*  GET edit page
*/
router.get('/edit-page/:id', isAdmin, (req, res) => {
    
  Page.findById(req.params.id, (err, page) => {
    if (err) {
      return console.log(err); 
    } else {
        res.render('admin/edit_page', {
          title: page.title,
          slug: page.slug,
          content: page.content,
          id: page._id
        });       
      }
    
  });
       
});



/*
*  POST edit page
*/
router.post('/edit-page/:id', (req, res) => {
    
  // Validate title and content using express validator 
  req.checkBody('title', 'Title must have a value.').notEmpty(); 
  req.checkBody('content', 'Content must have a value.').notEmpty(); 

  // using body parser to get form values 
  let title = req.body.title;
  // make slug all lowercase and replace all white space with hyphens
  let slug = req.body.slug.replace(/\s+/g, '-').toLowerCase();
  // also need to cover cases where there is no slug. If no slug is entered, make title the slug
  if (slug === "") slug = title.replace(/\s+/g, '-').toLowerCase();
  
  let content = req.body.content;
  let id = req.params.id;

    
    
    
  let errors = req.validationErrors();
    
  if (errors) {
    res.render('admin/edit_page', {
      errors: errors,
      title: title,
      slug: slug,
      content: content,
      id: id
    });
  } else {
      // Check that slug is unique as there shouldn't be 2 slugs that are identical
      Page.findOne({ slug: slug, _id:{'$ne':id}}, (err, page) => {
        if (page) {
          req.flash('danger', 'Page slug exists, choose another.');
          res.render('admin/edit_page', {
            title: title,
            slug: slug,
            content: content,
            id: id
          });
        } else {
           Page.findById(id, (err, page) => {
              if (err) {
                return console.log(err);
              } else {
                page.title = title;
                page.slug = slug;
                page.content = content;
              }
               
               page.save((err) => {
                  if (err) 
                    return console.log(err);
                   
                   
               Page.find({}).sort({ sorting: 1}).exec(function(err, pages) {
                   if (err) {
                       console.log(err);
                   } else {
                       req.app.locals.pages = pages;
                     }
                });
                   
                req.flash('success', 'Page edited!'); 
                res.redirect('/admin/pages/edit-page/'+ id);
                  
                }); 
           
           });
            
     
        }
      });
    }
    
});



/*
*  GET delete page 
*/
router.get('/delete-page/:id', isAdmin, (req, res) => {
    Page.findByIdAndRemove(req.params.id, (err) => {
        if (err) 
            return console.log(err);
          
        Page.find({}).sort({ sorting: 1}).exec(function(err, pages) {
            if (err) {
                console.log(err);
            } else {
                req.app.locals.pages = pages;
              }
        });
          
        req.flash('success', 'Page deleted!');
        res.redirect('/admin/pages/');

    });
});

// Exports
module.exports = router;