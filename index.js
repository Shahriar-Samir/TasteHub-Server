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


const { MongoClient, ServerApiVersion } = require('mongodb');
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

    app.get('/allFoods',async (req,res)=>{
        const allFoods = await foodItemsCollection.find().toArray()
        res.send(allFoods)
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