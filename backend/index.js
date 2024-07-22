const express = require('express');
const cors = require("cors");

require("./db/config");
const app = express();

// import models
const User = require("./db/model/User");
const Product = require("./db/model/Product");

const Jwt = require('jsonwebtoken');
const jwtKey = 'e-commerce';

app.use(express.json());
app.use(cors());

app.post("/register", async (req, resp) => {
    let user = new User(req.body);
    let result = await user.save();
    result = result.toObject();
    delete result.password;
    Jwt.sign({ result }, jwtKey, { expiresIn: "2h" }, (err, token) => {
        if (err) {
            resp.send({ result: "Something Went Wrong" })
        }
        resp.send({ result, token: token });
    })
});

app.post("/login", async (req, resp) => {

    if (req.body.email && req.body.password) {
        let user = await User.findOne(req.body).select("-password");
        if (user) {
            Jwt.sign({ user }, jwtKey, { expiresIn: "2h" }, (err, token) => {
                if (err) {
                    resp.send({ result: "Something Went Wrong" })
                }
                resp.send({ user, token: token });
            })
        }
        else {
            resp.send({ result: 'No User Found' })
        }
    }
    else {
        resp.send({ result: 'No User Found' })
    }

});

app.post("/add_product", verifyToken, async (req, resp) => {
    let product = new Product(req.body);
    let result = await product.save();
    result = result.toObject();
    resp.send(result);
});

app.get('/get_products', verifyToken, async (req, resp) => {
    let products = await Product.find();
    if (products.length > 0) {
        resp.send(products);
    }
    else {
        resp.send({ result: "No Products Found!!" });
    }
});

app.delete("/delete_product/:id", verifyToken, async (req, resp) => {
    const result = await Product.deleteOne({ _id: req.params.id })
    resp.send(result);
});

app.get("/product_detail/:id", verifyToken, async (req, resp) => {
    const result = await Product.findOne({ _id: req.params.id })
    if (result) {
        resp.send({ 'data': result });
    }
    else {
        resp.send({ "data": "No Data Found!!" });
    }
});

app.put("/update_produt/:id", verifyToken, async (req, resp) => {
    const result = await Product.updateOne(
        { _id: req.params.id },
        {
            $set: req.body
        }
    );
    resp.send(result);
});

app.get("/search/:key", verifyToken, async (req, resp) => {
    let result = await Product.find({
        "$or": [
            { name: { $regex: req.params.key } },
            { price: { $regex: req.params.key } },
            { category: { $regex: req.params.key } },
            { company: { $regex: req.params.key } }
        ]
    });
    resp.send(result);
});

function verifyToken(req, resp, next) {
    let token = req.headers['authorization'];
    if (token) {
        token = token.split(' ')[1];
        Jwt.verify(token, jwtKey, (err, valid) => {
            if(err){
                resp.status(401).send({result:"Unauthorized token!!"});
            }
            else{
                next();
            }
        });
    }
    else{
        resp.status(403).send({result :"Plase add token with header!!"})
    }
}

app.listen(5000);