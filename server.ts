import express from "express";
import execute from "./main";
import glob from "glob";
import { S3Uploader } from "./uploader";
import "dotenv/config";
import fs from "fs";
//@ts-ignore
import xml2js from "xml2js";

const REGION = process.env.REGION;
const ACCESSKEY = process.env.ACCESSKEY;
const SECRETKEY = process.env.SECRETKEY;

const app = express();

app.use(express.json());

app.get("/bundle/:bundle/:s3address", async (req, res) => {
    const { bundle, s3address } = req.params;
    if (!bundle || !s3address) return res.sendStatus(400);
    try {
        fs.readFile(
            "/home/ubuntu/test2/app/src/main/AndroidManifest.xml",
            (err, data) => {
                if (err) {
                    console.error(err);
                    return;
                }

                xml2js.parseString(data, (err, result) => {
                    if (err) {
                        console.error(err);
                        return;
                    }

                    console.log(result.manifest.$["android:versionName"]);
                    result.manifest.$.package = "com.bozkayasalih";
                    result.manifest.$["android:versionName"] = "1.0.0";
                    result.manifest.$["android:versionCode"] = "00000";
                    const builder = new xml2js.Builder();
                    const updatedXml = builder.buildObject(result);

                    fs.writeFile(
                        "/home/ubuntu/test2/app/src/main/AndroidManifest.xml",
                        updatedXml,
                        (err) => {
                            if (err) {
                                console.error(err);
                                return;
                            }
                            console.log("Package field updated successfully!");
                        }
                    );
                });
                const result = template(bundle);
                console.log(result);
            }
        );
    } catch (err) {
        console.log(`got an error ${err}`);
    }
    res.sendStatus(200);
    execute.build();
    const uploader = new S3Uploader(
        REGION as string,
        ACCESSKEY as string,
        SECRETKEY as string,
        s3address
    );

    let mostrecent: number = 0;
    let thefile: string = "";
    while (true) {
        const files = await glob("/home/ubuntu/*.apk");
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

    console.log("the file the creator of the universe", thefile);
});

app.listen(5000, () => {
    console.log("server is running on port ", 5000);
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
                                    Uri.parse(${packageBundle})).
                                    addCategory(Intent.CATEGORY_DEFAULT);

                InstantApps.showInstallPrompt(this.cordova.getActivity(), postInstallIntent, 7, null);
            }
        }
    `;
    try {
        fs.writeFileSync(
            "/home/ubuntu/test2/app/src/main/java/cordova/plugin/instantdownload/InstantDownload/InstantDownload.java",
            tmpl
        );
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
}
