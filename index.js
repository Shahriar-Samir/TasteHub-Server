const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')

require('dotenv').config()

const port = process.env.PORT || 5000
const app = express()

// middlewares
app.use(express.json())
app.use(cors({
    origin: ['http://localhost:5173','https://assignment-11-3cc1c.web.app','https://assignment-11-3cc1c.firebaseapp.com'],
    credentials: true
}))
app.use(cookieParser())

// cookies options
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};


// verify token middleware
const verifyToken = (req,res,next)=>{
    const token = req.cookies?.token
    if(!token){
      return res.status(401).send({message: 'unauthorized access'})
    }
    else{
      jwt.verify(token, process.env.TOKEN_SECRET, (err,decoded)=>{
        if(err){
           return res.send({message: 'unauthorized access'})
        }
        req.user = decoded
        next()
      })
    }

}

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@databases1.utppk3d.mongodb.net/?retryWrites=true&w=majority&appName=databases1`;




app.get('/',(req,res)=>{
  res.send('TasteHub Server')
})


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    
    const usersCollection = client.db('Restaurant_Management').collection('Users')
    const foodItemsCollection = client.db('Restaurant_Management').collection('AllFoodItems')
    const feedbackCollection = client.db('Restaurant_Management').collection('Feedbacks')
    const purchaseItemsCollection = client.db('Restaurant_Management').collection('PurchaseItems')



 

    // secure api
    app.post('/jwt',async(req,res)=>{
      const userData = req.body
      const token = jwt.sign(userData,process.env.TOKEN_SECRET,{expiresIn: '1h'})
      res.cookie('token',token, cookieOptions)
      .send()
    })

    app.post('/logout', async (req,res)=>{
      res.clearCookie('token',{maxAge:0})
      .send()
    })

    // database related api routes

    app.get('/allFoodsCount',async (req,res)=>{
        const count = await foodItemsCollection.estimatedDocumentCount()
        res.send({count})
    })
    app.get('/allFoods',async (req,res)=>{
        const {page,size} = req.query
        const pageInt = parseInt(page)
        const sizeInt = parseInt(size)
        const foods = await foodItemsCollection.find().skip(pageInt*sizeInt).limit(sizeInt).toArray()
        res.send(foods)
    })

    app.get('/foodDetails/:id',async (req,res)=>{
        const {id} = req.params
        const foodItem = await foodItemsCollection.findOne({_id: new ObjectId(id)})
        res.send(foodItem)
    })

    app.get('/myFoods/:email', verifyToken ,async (req,res)=>{
        if(req.user.email !== req.params.email){
          return res.status(403).send({message: 'forbidden access'})
        }
        else{
          const {email} = req.params
          const myFoods = await foodItemsCollection.find({email}).toArray()
          res.send(myFoods)
        }
    })

    app.get('/allFeedbacks', async (req,res)=>{
      const allFeedbacks = await feedbackCollection.find().toArray()
      res.send(allFeedbacks)
    })
    app.get('/topPurchasedItems', async (req,res)=>{
      const topFoods = await foodItemsCollection.aggregate([
        {$sort: {purchased:-1}},
        {$limit: 6}
      ]).toArray()
      res.send(topFoods)
    })

    app.get('/searchFood/:search',async(req,res)=>{
          const searchValue = req.params.search
          if(searchValue === 'false'){
            res.send([])
          }
          else{
           const foodItem = await foodItemsCollection.find({foodName:{$regex: new RegExp(searchValue,'i')}}).toArray()
           res.send(foodItem)
          }
    })


    app.get('/myPurchasedItems/:email', verifyToken, async (req,res)=>{
      if(req.user.email !== req.params.email){
        return res.status(403).send({message: 'forbidden access'})
      } 
      else{
        const {email} = req.params
        const myPurchasedFoods = await purchaseItemsCollection.find({email}).toArray()
        res.send(myPurchasedFoods)
      }
    })

    app.post('/addUser',verifyToken,async(req,res)=>{
      if(req.user.email !== req.body.email){
        return res.status(403).send({message: 'forbidden access'})
      } 
      else{
        const data = req.body
        const addData = await usersCollection.insertOne(data)
        res.send(addData)
      }
    })

    app.post('/addFood',verifyToken,async (req,res)=>{
      if(req.user.email !== req.body.email){
        return res.status(403).send({message: 'forbidden access'})
      } 
      else{
        const data = req.body
        const addFood = await foodItemsCollection.insertOne(data)
        res.send(addFood)
      }
    })

    app.post('/addFeedback',verifyToken,async (req,res)=>{
      if(req.user.email !== req.body.email){
        return res.status(403).send({message: 'forbidden access'})
      } 
      else{
        const data = req.body
        const addFeedback = await feedbackCollection.insertOne(data)
        res.send(addFeedback)
      }

    })

    app.post('/addPurchaseItem',verifyToken,async(req,res)=>{
      if(req.user.email !== req.body.email){
        return res.status(403).send({message: 'forbidden access'})
      } 
      else{
        const purchaseData = req.body
        const {foodId,quantity} = purchaseData
        await foodItemsCollection.updateOne(
          {_id: new ObjectId(foodId)},
          {$inc: {quantity: -quantity, purchased: +quantity}}
        )
        const addPurchaseData = await purchaseItemsCollection.insertOne(purchaseData)
        res.send(addPurchaseData)
      }
 
    })

    app.put('/updateFood/:id',verifyToken,async(req,res)=>{
      if(req.user.email !== req.body.email){
        return res.status(403).send({message: 'forbidden access'})
      } 
      else{
        const {id} =  req.params
        const data = req.body
        const options = {uprest:true}
        const updatedData = {
          $set:{
             foodName: data.foodName,
             foodImage: data.foodImage,
             foodCategory: data.foodCategory,
             quantity: data.quantity,
             price: data.price,
             foodOrigin: data.foodOrigin,
             description: data.description,
          }
        }
  
        const allFoods = await foodItemsCollection.updateOne({_id: new ObjectId(id)},updatedData,options)
        res.send(allFoods)
      }
    })

    app.delete('/deletePurchaseItem/:id',verifyToken,async(req,res)=>{
      if(req.user.email !== req.query.email){
        return res.status(403).send({message: 'forbidden access'})
      } 
      else{
        const {id} = req.params
        const deleteItem = await purchaseItemsCollection.deleteOne({_id: new ObjectId(id)})
        res.send(deleteItem)
      }
    })
    app.delete('/deleteMyItem/:id',verifyToken,async(req,res)=>{
      if(req.user.email !== req.query.email){
        return res.status(403).send({message: 'forbidden access'})
      } 
      else{
        const {id} = req.params
        const deleteItem = await foodItemsCollection.deleteOne({_id: new ObjectId(id)})
        res.send(deleteItem)
      }
    })

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port,()=>{
    console.log(`listening on port ${port}`)
})