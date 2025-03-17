const s3sdk = require('../../lib/aws-sdk/s3');
const s3Handler = module.exports;

// Get Bucket List
s3Handler.listFiles = async function listFiles(req, res) {
    try {

        let prefix = req.query.prefix ? req.query.prefix : ''
        let limit = req.query.limit ? req.query.limit : 50

        let bucketList = await s3sdk.listFiles(prefix, limit)

        if (!bucketList) {
            return res.status(404).send({
                status: 'error',
                message: 'Either bucket is empty or not exists.'
            })
        }

        return res.status(200).send({
            status: 'success',
            message: 'Bucket File List Fetched Successfully.',
            data: bucketList
        });

    } catch (error) {
        return res.status(500).send(error.message);
    }
}

// Upload object to AWS S3 Bucket
s3Handler.uploadFiles = async function uploadFiles(req, res) {
    try {

        if (req.files !== null) {

            if (!Array.isArray(req.files.attachment)) {
                let tempFiles = req.files.attachment;
                req.files.attachment = [];
                req.files.attachment.push(tempFiles);
            }

            if (req.files.attachment.length > 0) {
                for (let file of req.files.attachment) {

                    let fileData = {
                        attachment: file
                    }

                    await s3sdk.uploadFiles(
                        'attachment',
                        fileData,
                        req.body.directoryPath ? req.body.directoryPath : null
                    );
                }
            }
        }

        return res.status(200).send({
            status: 'success',
            message: 'File Added Successfully.'
        });

    } catch (error) {
        return res.status(500).send(error.message);
    }
}

// Get pre-signed URL of a object
s3Handler.generatePresignedUrl = async function generatePresignedUrl(req, res) {
    try {

        let preSignedUrl = s3sdk.generatePresignedUrl(req.query.fileName, req.query.expiresIn);

        return res.status(200).send({
            status: 'success',
            message: 'Pre-Signed URL Created Successfully.',
            data: preSignedUrl
        });

    } catch (error) {
        return res.status(500).send(error.message);
    }
}

// Delete file from bucket
s3Handler.deleteFile = async function deleteFile(req, res) {
    try {

        await s3sdk.deleteFile(req.query.fileName);

        return res.status(200).send({
            status: 'success',
            message: 'File Deleted Successfully.'
        });

    } catch (error) {
        return res.status(500).send(error.message);
    }
}

// Initiate Multipart Upload for Files
s3Handler.initiateMultipartUpload = async function (req, res) {
    try {
        const response = await s3sdk.initiateMultipartUpload(req.body);
        res.json(response)
    } catch (error) {
        res.status(500).send(`Error initiating multipart upload :: ${error.message}`);
    }
}

// Generate Pre-Signed Urls to Upload a file
s3Handler.generateUploadPresignedUrls = async function (req, res) {
    try {
        if(!Array.isArray(req.body.partNumbers)){
            req.body.partNumbers = [req.body.partNumbers];
        }
        const response = await s3sdk.generateUploadPresignedUrls(req.body);
        res.json(response)
    } catch (error) {
        res.status(500).send(`Error generating pre-signed URLs :: ${error.message}`);
    }
}

// Generate Pre-Signed Urls to Upload a file
s3Handler.completeMultipartUpload = async function (req, res) {
    try {
        const response = await s3sdk.completeMultipartUpload(req.body);
        res.json({ message: 'Upload complete', location: response })
    } catch (error) {
        res.status(500).send(`Error generating pre-signed URLs :: ${error.message}`);
    }
}