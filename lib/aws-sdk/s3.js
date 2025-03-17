const AWS = require('aws-sdk');
const s3Export = module.exports;

// Configure AWS SDK Config(v2)
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY, // Replace with your actual secret key
    region: process.env.AWS_REGION, // Change to your region
});

const s3 = new AWS.S3();
// S3 bucket name
const bucketName = process.env.S3_BUCKET_NAME;

// List and Filter AWS s3 Bucket Object
s3Export.listFiles = async function listFiles(prefix, maxKeys) {
    try {
        const listParams = {
            Bucket: bucketName,
            Prefix: prefix,
            MaxKeys: maxKeys
        };

        const data = await s3.listObjectsV2(listParams).promise();
        if (data.Contents && data.Contents.length > 0) {
            return data.Contents.map(file => file.Key);
        } else {
            throw new Error("No files found in the bucket.");
        }
    } catch (err) {
        throw new Error(err)
    }
}

// Upload Object to AWS s3 Bucket
s3Export.uploadFiles = async function uploadFiles(fileObjectName, file, relativePath) {
    return new Promise(function (resolve, reject) {
        const uploadParams = {
            Bucket: bucketName,
            Key: relativePath ? `${relativePath}/${file[fileObjectName]['name']}` : file[fileObjectName]['name'],
            Body: file[fileObjectName]['data'],
            ContentType: file[fileObjectName].mimetype,
        };

        s3.putObject(uploadParams, function (err, data) {
            if (err)
                reject(err);
            else {
                resolve(data);
            }
        })
    });
}

// Generate pre-signed URL
s3Export.generatePresignedUrl = function generatePresignedUrl(fileName) {
    try {

        const params = {
            Bucket: bucketName,
            Key: fileName,
            Expires: 3600, // URL expires in 1 hour
        };

        const signedUrl = s3.getSignedUrl('getObject', params);
        return signedUrl;

    } catch (error) {
        throw new Error(error)
    }
}

// Generate pre-signed URL
s3Export.deleteFile = async function deleteFile(fileName) {
    try {

        const params = {
            Bucket: bucketName,
            Key: fileName
        };

        await s3.deleteObject(params).promise();
        return {};

    } catch (error) {
        throw new Error(error)
    }
}

// Initiate Multipart Upload for a File
s3Export.initiateMultipartUpload = async function initiateMultipartUpload(fileData) {
    const { fileName, fileType } = fileData;
    try {
        const params = {
            Bucket: bucketName,
            Key: fileName,
            ContentType: fileType,
        };

        const response = await s3.createMultipartUpload(params).promise();
        return { uploadId: response.UploadId };
    } catch (error) {
        console.error('Error initiating upload:', error);
        throw new Error(error)
    }
}

// Generate Pre-Signed Urls to Upload a file
s3Export.generateUploadPresignedUrls = async function generateUploadPresignedUrls(fileData) {
    const { fileName, uploadId, partNumbers } = fileData;
    try {
        const urls = await Promise.all(
            partNumbers.map((partNumber) => {
                const params = {
                    Bucket: bucketName,
                    Key: fileName,
                    PartNumber: partNumber,
                    UploadId: uploadId,
                };
                return s3.getSignedUrlPromise('uploadPart', params);
            })
        );

        return { urls };
    } catch (error) {
        console.error('Error generating pre-signed URLs:', error);
        throw new Error(error)
    }
}

// Complete multipart upload
s3Export.completeMultipartUpload = async function completeMultipartUpload(fileData) {
    const { fileName, uploadId, parts } = fileData;
    try {
        const params = {
            Bucket: bucketName,
            Key: fileName,
            UploadId: uploadId,
            MultipartUpload: {
                Parts: parts, // List of { ETag, PartNumber }
            },
        };
        const response = await s3.completeMultipartUpload(params).promise();
        return response.Location;
    } catch (error) {
        console.error('Error generating pre-signed URLs:', error);
        throw new Error(error)
    }
}