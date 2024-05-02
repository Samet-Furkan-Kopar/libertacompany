// import FormData from "../middlewares/blogPhotoMiddleware.js"
import express  from "express"
import User from "../controllers/user/userController.js"
import Auth from "../middlewares/userAuthMiddleware.js"
import UserFormData from "../middlewares/officeMiddleware.js"
import FormData from "../middlewares/userPhotoMiddleware.js"
import PasswordValidation from "../validations/resetPassword.validation.js"
import UserValidate from "../validations/userValidation.js"
const router = express.Router()


router.route("/user-register").post(FormData.uploadSettingImages,FormData.resizeImages,UserValidate.userCreateValidate,User.userRegister)
router.route("/admin-register").post(FormData.uploadSettingImages,UserValidate.userCreateValidate,User.doctorRegister)
router.route("/login").post(FormData.uploadSettingImages,User.userLogin)
// 
// router.route("/user-count").get(FormData.uploadSettingImages,User.userCount)

router.route("/user-filter").post(FormData.uploadSettingImages,User.userFilter)
router.route("/detail").get(Auth.authenticateUserAPIToken,User.userDetail)
router.route("/getAllUsers").get(Auth.authenticateUserAPIToken,User.getAllUser)
router.route("/delete-user/:id").delete(Auth.authenticateUserAPIToken,User.removeUser)
router.route("/update").put(Auth.authenticateUserAPIToken,UserFormData.uploadSettingImages,UserFormData.resizeImages,User.userUpdate)
router.route("/update-password").put(Auth.authenticateUserAPIToken,UserFormData.uploadSettingImages,PasswordValidation.resetPasswordDataValidate,User.userPasswordUpdate)
// router.route("/detail/:id").get(UserRole.getDetail)
// router.route("/:id").put(FormData.uploadSettingImages,UserRole.update)

export default router