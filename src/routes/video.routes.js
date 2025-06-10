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

router.route("/get-video-by-title/:title").get(getVideoByTitle)
router.route("/get-video-by-id/:_id").get(getVideoByID)
router.route("/get-all-videos/:channelId").get(getAllVideos)
router.route("/delete-video/:_id").delete(verifyJWT, deleteVideo)


export default router;