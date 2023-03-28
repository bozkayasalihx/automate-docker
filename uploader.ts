import AWS from 'aws-sdk';
import fs from 'fs';

export class S3Uploader {
  private readonly s3: AWS.S3;
  private readonly bucketName: string;

  constructor(region: string, accessKeyId: string, secretAccessKey: string, bucketName: string) {
    AWS.config.update({
      region: region,
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey
    });

    this.s3 = new AWS.S3();
    this.bucketName = bucketName;
  }

  public uploadFile(filePath: string, fileName: string): void {
    const fileData = fs.readFileSync(filePath);

    const s3Params: AWS.S3.Types.PutObjectRequest = {
      Bucket: this.bucketName,
      Key: fileName,
      Body: fileData,
      ContentType: 'application/vnd.android.package-archive'
    };

    this.s3.upload(s3Params, (err: Error, data: AWS.S3.ManagedUpload.SendData) => {
      if (err) {
        console.error(err);
      } else {
        console.log(`File uploaded successfully. File location: ${data.Location}`);
      }
    });
  }
}

// // Example usage
// const uploader = new S3Uploader('your-region', 'your-access-key-id', 'your-secret-access-key', 'your-bucket-name');
// uploader.uploadFile('/path/to/your/file.apk', 'your-file-name.apk');
