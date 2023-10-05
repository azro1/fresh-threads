const mongoose = require('mongoose');


// Page Schema 
const PageSchema = mongoose.Schema({
  
    title: {
        type: String,
        required: true
    },
    slug: {
        type: String
    },
    content: {
        type: String,
        required: true
    },
    sorting: {
        type: Number
    }

}, { timestamps: true });




const Page = mongoose.model('Page', PageSchema);
module.exports = Page;