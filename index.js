const express = require('express')
const cors = require('cors')

const port = process.env.PORT || 5000
const app = express()

app.use(express.json())
app.use(cors({
    require: ['']
}))


app.listen(port,()=>{
    console.log(`listening on port ${port}`)
})