import express from "express"
import execute from "./main";
import glob from 'glob';
import { S3Uploader } from "./uploader";
import "dotenv/config";
import fs from 'fs';
//@ts-ignore
import xml2js from  "xml2js";

const REGION = process.env.REGION
const ACCESSKEY = process.env.ACCESSKEY; 
const SECRETKEY = process.env.SECRETKEY;


const app = express()

app.use(express.json())


app.get("/bundle/:bundle/:s3address", async(req, res) => {
    const { bundle, s3address} = req.params
    if(!bundle || !s3address) return res.sendStatus(400);
    res.sendStatus(200);
    // execute.build()
    // const uploader = new S3Uploader(REGION as string, ACCESSKEY as string, SECRETKEY as string, s3address)

    // let mostrecent: number = 0;
    // let thefile: string = "";
    // while (true) {
    //     const files = await glob("/home/ubuntu/*.apk");
    //     if (files.length == 0) continue;
    //     for (let file of files) {
    //         console.log(file + "\n");
    //         const lastModified = fs.statSync(file).mtimeMs
    //         if (lastModified > mostrecent) {
    //             mostrecent = lastModified;
    //             thefile = file;
    //         }
    //     }
    //     break;
    // }
    try {
        fs.readFile("/home/ubuntu/test2/app/src/main/AndroidManifest.xml", (err, data) => {
          if (err) {
            console.error(err);
            return;
          }

          xml2js.parseString(data, (err, result) => {
            if (err) {
              console.error(err);
              return;
            }

            // Update the package field
            console.log(result.manifest.$)
            result.manifest.$.package = 'com.bozkayasalih';

            // Convert the updated result back to XML
            const builder = new xml2js.Builder();
            const updatedXml = builder.buildObject(result);

            // Write the updated XML back to the file
            fs.writeFile("/home/ubuntu/test2/app/src/main/AndroidManifest.xml", updatedXml, (err) => {
              if (err) {
                console.error(err);
                return;
              }

              console.log('Package field updated successfully!');
            });
          });
    });
        
    }catch(err) {
        console.log(`got an error ${err}`);
    }
})


app.listen(5000, () => {
    console.log("server is running on port ", 5000);
})

