import { execSync, exec, spawn } from "child_process";
import path from "path";

export class Execute {
    private dir: string;
    private Command =
        "docker run --rm -v `pwd`:/project salihbozkaya1001/android-build bash -c 'cd /project; ./gradlew bundleRelease'";
    private extract =
        "docker cp android:/project/app/build/outputs/bundle/release/app-release.aab /home/ubuntu";

    constructor(dir: string) {
        this.dir = dir;
    }

    private check(): boolean {
        let valid: boolean = true;
        exec("docker images", (err, sdtout) => {
            if (err) {
                console.log("got an error! try again later!\n", err);
                return err;
            }
            if (sdtout.includes("android")) {
                valid = true;
            }
            valid = true;
        });

        return valid;
    }

    private absolutePath(): string {
        return path.resolve(this.dir);
    }


    public build() {
        if (this.check() == false) {
            console.log("please check images was built, and try again later");
            return;
        }

        const path = this.absolutePath();
        try {
            process.chdir(path);
            const buff = execSync(this.Command);
            console.log(buff.toString() + "\n");
        } catch (err) {
            console.log(`couldnt change ${path} with an ${err}`);
        }

        try {
            // const buff = execSync(this.keepRunningDocker);
            // console.log(buff.toString() + "\n")
            const docker = spawn("docker", [
                "run",
                "--name",
                "android",
                "-v",
                "`pwd`:/project",
                "-it",
                "salihbozkaya1001/android-build",
                "bash",
            ]);
            docker.on("message", (msg) => {
                console.log(msg.toString() + "\n");
            });
            docker.on("error", (code) => {
                console.log("got an error with this error code", code);
            });
            const b = execSync(this.extract);
            console.log(b.toString());
        } catch (err) {
            console.log("couldnt run command", err);
        }
    }
}

export default new Execute("/home/ubuntu/test2");
