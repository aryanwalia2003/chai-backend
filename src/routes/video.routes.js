import {Router} from "express"
import {publishVideo} from "../controllers/video.controller.js"
import uploadLocally from "../middlewares/multer.middleware.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
const router=Router();

router.route("/publish-video").post(
    verifyJWT,
    uploadLocally.fields([
        {
        name: "thumbnail",
        maxCount: 1
    }, {
        name: "video",
        maxCount: 1
    }]),
    publishVideo
);

export default router;