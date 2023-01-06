const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require('lodash');

const app = express();

/*let items = ["Buy Food", "Cook Food", "Eat Food"];
let workItems = [];*/




// from https://github.com/mde/ejs/wiki/Using-EJS-with-Express
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://skavvathas:01052001sk@cluster0.9dsorio.mongodb.net/todolistDB", { useNewUrlParser: true });

/******************************************************************************/
// the Schema --> ItemSchema
const ItemSchema = {
    name: String
};

// the model
const Item = mongoose.model("Item", ItemSchema);

const item1 = new Item({
    name: "Welcome to your todolist!"
});

const item2 = new Item({
    name: "Hit the + button to add a new item."
});

const item3 = new Item({
    name: "<-- Hit this to delete an item."
});

/******************************************************************************/

const defaultItems = [item1, item2, item3];

/******************************************************************************/
// the listSchema
const listSchema = {
    name: String,
    items: [ItemSchema]
};

const List = mongoose.model("List", listSchema);

/******************************************************************************/

app.get("/", function(req, res) {

    Item.find({}, function(err, foundItems) {

        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, function(err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfully saved default items to DB.")
                }
            });
            res.redirect("/");
        } else {
            res.render("list", {
                listTitle: "Today",
                newListItems: foundItems
            });
        }

    });


});

app.get("/:parameter", function(req, res) {
    const customListName = _.capitalize(req.params.parameter);

    // we search in the List to find if there is an object with name customListName
    List.findOne({ name: customListName }, function(err, foundList) {
        if (!err) {
            if (!foundList) { // if does not exist 
                //create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName); // redirect in 83
            } else {
                // show an existing list

                res.render("list", {
                    listTitle: foundList.name,
                    newListItems: foundList.items
                });
            }
        }
    });



});

app.post("/", function(req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if (listName === "Today") {
        item.save(); // save the item in our collection
        res.redirect("/");
    } else {
        List.findOne({ name: listName }, function(err, foundList) {
            foundList.items.push(item); // we add the ITEM object in the foundList
            foundList.save();
            res.redirect("/" + listName);
        });
    }

});

app.post("/delete", function(req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId, function(err) {
            if (err) {
                console.log(err);
            } else {
                console.log("Successfully deleted checked item.")
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, function(err) {
            if (!err) {
                res.redirect("/" + listName);
            }
        });
    }


});



/*app.post("/work", function(req, res) {
    let item = req.body.newItem;
    workItems.push(item);
    res.redirect("/");
});*/

app.listen(3000, function() {
    console.log("Server started on port 3000!");
});