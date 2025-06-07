import multer from "multer"

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, "./public/temp")
    },
    filename: function(req, file, cb) {
        cb(null, file.fieldname + "-" + Date.now())
    }
})

const uploadLocally = multer({storage})

export default uploadLocally;