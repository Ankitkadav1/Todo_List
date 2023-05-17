//jshint esversion:6

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _=require("lodash");

const app = express();
const PORT =process.env.port ||3000;
if (port == null || port=="") 
{
    port=3000;
}
app.listen(port,function(){
    console.log("Server started successfully");
})

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//conect to mongodDB which serves locally

mongoose.connect(process.env.MONGO_URI);

//Cratea schema

const itemsSchema = {
    name: String
};

//Create the moongoose model

const Item = mongoose.model("item", itemsSchema)

//Create three document using item model

const item1 = new Item({
    name: "welcome to your todolist!"
});
const item2 = new Item({
    name: "Hit the + button to add a new item."
});
const item3 = new Item({
    name: "<-- Hit this to delete an item."
});

//Craete the array which stores above 3 documents

const defaultItems = [item1, item2, item3];

//Create another schma fir list

const listSchema = {
    name: String,
    items: [itemsSchema]
}

// Create the model for list

const List = mongoose.model("List", listSchema);

//documents are created in get request


//Find all the documents in homepage

app.get("/", function (req, res) {

    Item.find()
        .then(function (foundItems) {
            if (foundItems.length === 0) {
                //Store array in items collection
                Item.insertMany(defaultItems)
                    .then(function () {
                        console.log("Successfully saved default items to DB.");
                    })
                    .catch(function (err) {
                        console.log(err);
                    });
                res.redirect("/");
            } else {
                res.render("list", { listTitle: "Today", newListItems: foundItems });
            }
        });
});
//Save new item in todolist using reference from form
app.post("/", function (req, res) {


    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });
    if (listName == "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({ name: listName })
            .then(function (foundList) {
                foundList.items.push(item);
                foundList.save();
                res.redirect("/" + listName);
            });
    }


});

app.post("/delete", function (req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName == "Today"){
        Item.findByIdAndRemove(checkedItemId)
        .then(function () {
            console.log("Successfully deleted the checked items.");
            res.redirect("/");
        });
    }else{
        List.findOneAndUpdate({name: listName}, {$pull: {items:{_id: checkedItemId}}})
            .then(function(){
                res.redirect("/" + listName);
            })
    }
    
    //tap into items collection using Item model


});

app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({ name: customListName })
        .then(function (foundList) {
            if (!foundList) {
                //Create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
            } else {
                //Show an existing list
                res.render("list", { listTitle: foundList.name, newListItems: foundList.items });//--Send that over to list.ejs to populate that page
            }

        })


});

app.get("/about", function (req, res) {
    res.render("about");
});
// app.post("/work", function(req, res){

//     const  item = req.body.newItem;

//     workItems.push(item);

//     res.redirect("/work");
// });

app.listen(process.env.port||3000, function () {
    console.log("Server started on port 3000.");
});