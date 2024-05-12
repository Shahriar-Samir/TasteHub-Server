const express = require('express')
const cors = require('cors')
require('dotenv').config()

const port = process.env.PORT || 5000
const app = express()

// middlewares
app.use(express.json())
app.use(cors({
    require: ['']
}))


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@databases1.utppk3d.mongodb.net/?retryWrites=true&w=majority&appName=databases1`;

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
    
    const foodItemsCollection = client.db('Restaurant_Management').collection('AllFoodItems')
    const feedbackCollection = client.db('Restaurant_Management').collection('Feedbacks')
    const purchaseItemsCollection = client.db('Restaurant_Management').collection('PurchaseItems')

    app.get('/allFoods',async (req,res)=>{
        const allFoods = await foodItemsCollection.find().toArray()
        res.send(allFoods)
    })

    app.get('/foodDetails/:id',async (req,res)=>{
        const {id} = req.params
        const foodItem = await foodItemsCollection.findOne({_id: new ObjectId(id)})
        res.send(foodItem)
    })

    app.get('/myFoods/:email',async (req,res)=>{
        const {email} = req.params
        const myFoods = await foodItemsCollection.find({email}).toArray()
        res.send(myFoods)
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

    app.get('/myPurchasedItems/:email', async (req,res)=>{
      const {email} = req.params
      const myPurchasedFoods = await purchaseItemsCollection.find({email}).toArray()
      res.send(myPurchasedFoods)
    })

    app.post('/addFood',async (req,res)=>{
        const data = req.body
        const addFood = await foodItemsCollection.insertOne(data)
        res.send(addFood)
    })

    app.post('/addFeedback',async (req,res)=>{
        const data = req.body
        const addFeedback = await feedbackCollection.insertOne(data)
        res.send(addFeedback)
    })

    app.post('/addPurchaseItem', async(req,res)=>{
        const purchaseData = req.body
        const {foodId,quantity} = purchaseData
        await foodItemsCollection.updateOne(
          {_id: new ObjectId(foodId)},
          {$inc: {quantity: -quantity, purchased: +quantity}}
        )
        const addPurchaseData = await purchaseItemsCollection.insertOne(purchaseData)
        res.send(addPurchaseData)
    })

    app.put('/updateFood/:id',async(req,res)=>{
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
    })

    app.delete('/deletePurchaseItem/:id', async(req,res)=>{
        const {id} = req.params
        const deleteItem = await purchaseItemsCollection.deleteOne({_id: new ObjectId(id)})
        res.send(deleteItem)
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