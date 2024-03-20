import blogRoute from "./routes/blogRoute.js"
import UserRoleRoute from "./routes/userRoleRoute.js"
import UserRoute from "./routes/userRoute.js"
import errorHandler from "./utils/errorHandler.js"
import AdminRoute from './routes/adminRoute.js'
const routersFunction = (app) => {
    
    app.use("/api/v1/admin",AdminRoute)
    app.use("/api/v1/article",blogRoute)
    app.use("/api/v1/user-role",UserRoleRoute)
    app.use("/api/v1/auth",UserRoute)

    app.use(errorHandler)
}
export default routersFunction;
