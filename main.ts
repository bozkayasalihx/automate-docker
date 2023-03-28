import {execSync, exec} from 'child_process';
import path from 'path';

export class Execute {
    private dir:string 
    private Command = "docker run --rm -v `pwd`:/project mingc/android-build-box bash -c 'cd /project; ./gradlew build'"
    // private outDir = "/project/app/build/outputs/apk/release"
    private keepRunningDocker = "docker run --name android  -v `pwd`:/project -it mingc/android-build-box bash"
    private extract = "docker cp android:/project/app/build/outputs/apk/release/app-release-unsigned.apk /home/ubuntu"

    constructor(dir: string) {
        this.dir= dir;
    }


    private check(): boolean {
        let valid: boolean = false;
        exec("docker images", (err, sdtout) => {
            if (err) {
                console.log("got an error! try again later!\n", err); 
                return err;
            } 
            if (sdtout.includes("android")) {
                valid = true;
            }
            valid  =false
        })

        return valid;
        
    }


    private absolutePath(): string {
        return path.resolve(this.dir);
    }


    public build() {
        if (this.check() == false)  {
            console.log("please check images was built, and try again later");
            return;
        }

        const path = this.absolutePath(); 
        try {
 
            process.chdir(path);
            const buff = execSync(this.Command)
            console.log(buff.toString() + "\n")
        }catch(err) {
            console.log(`couldnt change ${path} with an ${err}`);
        }

        try {
            const buff = execSync(this.keepRunningDocker);
            console.log(buff.toString() + "\n")
            const b = execSync(this.extract)
            console.log(b.toString());
        }catch(err) {
            console.log("couldnt run command", err);
        }
    }






}





const execute = new Execute("./test2");
execute.build()
