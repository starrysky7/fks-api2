var express = require('express');
var router = express.Router();

//import models
const Assignment = require('../models/assignments')


//file upload
const AWS = require('aws-sdk')
var multer = require('multer')
var path = require('path')


//multer
var storage = multer.memoryStorage({
    destination: function (req, file, callback) {
        callback(null, '')
    }
})

var upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, callback) {
        var ext = path.extname(file.originalname);
        if(ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
            return callback(new Error('Only images are allowed'))
        }
        callback(null, true)
    } 
 });

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ID,
    secretAccessKey: process.env.AWS_SECRET
})


//filename generator
function generateFileName() {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < 16; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}



//add spare part img
router.post('/:id/upload_img', upload.single('assignment_img'), async function (req, res) {
    try {

        const assignment = await Assignment.findById({ _id: req.params.id })

        var myFile = req.file.originalname.split('.')
            const fileType = myFile[myFile.length - 1]

            const params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: `${generateFileName()}.${fileType}`,
                Body: req.file.buffer
            }
            const uploaded = await s3.upload(params).promise()

            const updatedSpare = await Spare.updateOne(
                { _id: req.params.id },
                {
                    $push: { images: uploaded.key }
                }
            )

            res.status(200).json({ message: "success", additional_info: "assignment image uploaded" })

    } catch (err) {
        res.status(500).json(err)
    }
})


//export
module.exports = router;