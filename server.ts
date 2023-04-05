import express, {Request, Response} from "express";
import execute from "./main";
import glob from "glob";
import { S3Uploader } from "./uploader";
import "dotenv/config";
import fs from "fs";
import xml2js from "xml2js";
import axios from 'axios';

const REGION = process.env.REGION;
const ACCESSKEY = process.env.ACCESSKEY;
const SECRETKEY = process.env.SECRETKEY;
// const DOWNLOAD_URL = process.env.DOWNLOAD_URL || "https://gearbox.playablefactory.com/files/y7hD0F6gp8hitADJxOTBGG7_T_test/default.js"
const WRITTEN_PATH = process.env.WRITTEN_PATH || "/home/ubuntu/test2/app/src/main/assets/www/main.js"
const MANIFEST_PATH = process.env.MANIFEST_PATH || "/home/ubuntu/test2/app/src/main/AndroidManifest.xml"
const INSTANT_DOWNLOAD_PATH = process.env.INSTANT_DOWNLOAD_PATH  ||  "/home/ubuntu/test2/app/src/main/java/cordova/plugin/instantdownload/InstantDownload/InstantDownload.java"; const PORT = process.env.PORT || 5000
const S3_BUCKET = "storage-domain"

const app = express();

app.use(express.json());

app.post("/bundle", async (req: Request<{bundle: string, version: string, code: string, download_url: string}>, res: Response) => {
    const { bundle, version, code, download_url } = req.body
    if (!bundle || !version || !code || !download_url) return res.sendStatus(400);
    downloadFile(download_url).then((ev) => {
        console.log(`${ev} done \n`)
    }).catch((err) => {
            console.log("got an error " ,err);
    })
    try {

        const buff = fs.readFileSync(MANIFEST_PATH);

        xml2js.parseString(buff, (err, result) => {
            if (err) {
                console.error(err);
                return;
            }

            result.manifest.$.package = bundle
            result.manifest.$["android:versionName"] = version;
            result.manifest.$["android:versionCode"] =  code;
            const builder = new xml2js.Builder();
            const updatedXml = builder.buildObject(result);

            fs.writeFileSync(
                MANIFEST_PATH,
                updatedXml,
            );
        });
        template(bundle);
    } catch (err) {
        console.log(`got an error ${err}`);
    }
    res.sendStatus(200);
    execute.build();
    const uploader = new S3Uploader(
        REGION as string,
        ACCESSKEY as string,
        SECRETKEY as string,
        S3_BUCKET as string,
    );

    let mostrecent: number = 0;
    let thefile: string = "";
    while (true) {
        const files = await glob("/home/ubuntu/*.aab");
        if (files.length == 0) continue;
        for (let file of files) {
            console.log(file + "\n");
            const lastModified = fs.statSync(file).mtimeMs;
            if (lastModified > mostrecent) {
                mostrecent = lastModified;
                thefile = file;
            }
        }
        break;
    }


    uploader.uploadFile(thefile, Date.now() + ".aab");
    // await responseBack("jsofsejfosjf")
    console.log("sent response to remote server. its all good to go \n");
});

app.listen(PORT, () => {
    console.log("server is running on port ", PORT);
});

function template(packageBundle: string) {
    const tmpl = `
package cordova.plugin.instantdownload;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.google.android.gms.instantapps.InstantApps;
import android.content.Intent;
import android.net.Uri;

public class InstantDownload extends CordovaPlugin {

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {

        if (action.equals("downloadApp")) {
            this.downloadApp( callbackContext );
            return true;
        }
        return false;
    }

    private void downloadApp(CallbackContext callbackContext) {
        Intent postInstallIntent = new Intent(Intent.ACTION_MAIN,
                            Uri.parse("${packageBundle}")).
                            addCategory(Intent.CATEGORY_DEFAULT);

        InstantApps.showInstallPrompt(this.cordova.getActivity(), postInstallIntent, 7, null);
    }
}`;
    try {
        fs.writeFileSync(
            INSTANT_DOWNLOAD_PATH,
            tmpl
        );
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
}


async function downloadFile(download_url: string) {
    try {
        const response = await axios.get(download_url);
        fs.writeFileSync(WRITTEN_PATH, response.data);
        return true;
    }catch(err) {
        console.log("got and error while downloading ", err);
        return false;

    }
}


async function  responseBack(responseBackUrl: string) {
    const response = await axios.post(responseBackUrl, { status: "done" })
    return response
}


