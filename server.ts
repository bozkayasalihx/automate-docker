import express from "express"
import execute from "./main";
import glob from 'glob';
import { S3Uploader } from "./uploader";
import "dotenv/config";
import fs from 'fs';


const REGION = process.env.REGION
const ACCESSKEY = process.env.ACCESSKEY; 
const SECRETKEY = process.env.SECRETKEY;


const app = express()

app.use(express.json())

app.get("bundle/:bundle/:s3address", async(req, res) => {
    const { bundle, s3address} = req.params
    execute.build()
    // const uploader = new S3Uploader(REGION, ACCESSKEY, SECRETKEY, s3address)

    let mostrecent: number = 0;
    let thefile: string = "";
    while (true) {
        const files = await glob("/home/ubuntu/*.apk");
        if (files.length == 0) continue;
        for (let file of files) {
            console.log(file + "\n");
            const lastModified = fs.statSync(file).mtimeMs
            if (lastModified > mostrecent) {
                mostrecent = lastModified;
                thefile = file;
            }
        }
        break;
    }

    return res.sendStatus(200);



})


app.listen(5000, () => {
    console.log("server is running on port ", 5000);
})

