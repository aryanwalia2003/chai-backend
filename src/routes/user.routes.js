import {Router} from "express"
import { registerUser,loginUser,logoutUser,refreshAccessToken } from "../controllers/user.controller.js";
import uploadLocally from "../middlewares/multer.middleware.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
const router=Router();

router.route("/register").post(
    uploadLocally.fields([
        {
        name: "avatar",
        maxCount: 1
    }, {
        name: "coverImage",
        maxCount: 1
    }]),
    registerUser
);

router.route("/login").post(loginUser)

//secure routes
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refresh-access-token").post(refreshAccessToken)
export default router;