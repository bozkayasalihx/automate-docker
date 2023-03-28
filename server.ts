import express from "express"
import execute from "./main";


const app = express()

app.use(express.json())

app.get("bundle/:bundle/:s3address", (req, res) => {
    const { bundle, s3address} = req.params
        


})


app.listen(5000, () => {
    console.log("server is running\n")
})

