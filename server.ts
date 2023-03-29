import express from "express"
import execute from "./main";
import glob from 'glob';
import { S3Uploader } from "./uploader";
import "dotenv/config";
import fs from 'fs';
//@ts-ignore
import  Parser from './xmlParser';

const REGION = process.env.REGION
const ACCESSKEY = process.env.ACCESSKEY; 
const SECRETKEY = process.env.SECRETKEY;


const app = express()

app.use(express.json())


app.get("/bundle/:bundle/:s3address", async(req, res) => {
    const { bundle, s3address} = req.params
    if(!bundle || !s3address) return res.sendStatus(400);
    res.sendStatus(200);
    execute.build()
    const uploader = new S3Uploader(REGION as string, ACCESSKEY as string, SECRETKEY as string, s3address)

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
    try {
        const buf = fs.readFileSync("/home/ubuntu/test2/app/src/main/AndroidManifest.xml")
        //@ts-ignore
        const parser = new Parser();
        const data = parser(buf).parse()
        console.log('data', data);
        
    }catch(err) {
        console.log(`got an error ${err}`);
    }
    






})


app.listen(5000, () => {
    console.log("server is running on port ", 5000);
})

