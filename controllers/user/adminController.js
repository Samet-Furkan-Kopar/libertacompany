import Admin from "../../models/user/adminModel.js";
import bcrypt from "bcrypt";
import tryCatch from "../../utils/tryCatch.js";
import AppError from "../../utils/appError.js";
import jwt from "jsonwebtoken";
import User from "../../models/user/userModel.js"


//Admin için gerekli bilgileri veri tabanına kayıt ediliyor
const registerAdmin = tryCatch(async (req, res) => {
    const registerAdmin = await Admin.create(req.body);
    if (!registerAdmin) {
        throw new AppError("registration admin failed", 404);
    }
    res.status(200).json({
        succeded: true,
        data: registerAdmin,
    });
});
//admin login giriş işlemlerini yapıyor
const loginAdmin = tryCatch(async (req, res) => {
    const { username, password } = req.body;

    const user = await Admin.findOne({ username:username });
    console.log(user,"cc");
    let same = false;
    if (user) {
        same = await bcrypt.compare(password, user.password);

        if (same) {
            const user = await Admin.findOne({ username }, "-password");
            const token = await createToken(user._id);
            if (!token) {
                throw new AppError("Failed to create token", 404);
            }
            let oldTokens = user.tokens || [];
            if (oldTokens.length) {
                oldTokens.filter((t) => {
                    const timeDiff = (Date.now() - parseInt(t.signedAt)) / 1000;
                    if (timeDiff < 86400) {
                        return t;
                    }
                });
            }
            await Admin.findByIdAndUpdate(user._id, {
                tokens: [...oldTokens, { token, signedAt: Date.now().toString() }],
            });
            res.status(200).json({
                succeded: true,
                data: {
                    token,
                    user,
                    message: "Successfully sign-in",
                },
            });
        } else {
            console.log("password not matched");
            throw new AppError("Passwords are not matched", 401);
        }
    } else {
        res.status(404).json({
            succeded: false,
            message: "User not found",
        });
    }
});
//admin logout işlemini yapıyor
const adminLogout = tryCatch(async (req, res, next) => {
    const token = req.headers["authorization"].split(" ")[1];
    const tokens = req.user.tokens;
    const newTokens = tokens.filter((t) => t.token !== token);
    await Admin.findByIdAndUpdate(req.user._id, { tokens: newTokens });
    return res.status(200).json({
        success: true,
        message: "Successfully sign out",
        data: [],
    });
});
//login işlemleri sırasında gerekli jwtToken oluşturuyor
const createToken = async (id) => {
    return jwt.sign(
        {
            id,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1d",
        }
    );
};
const doctorList = tryCatch(async (req, res) => {
    let { page, paginate, searchKey } = req.query
    if (!page) page = 1
    if (!paginate) paginate = 10
    const skip = (page - 1) * paginate

    if (!searchKey) searchKey = ''

    let filterObj = {
        "$or": [{
            "firstName": {
                $regex: searchKey
            }
        },
        {
            "lastName": {
                $regex: searchKey
            }
        },
        {
            "email": {
                $regex: searchKey
            }
        },
        ],
    }
    filterObj.isApproved = false
    filterObj.type = "doctor"
    const data = await User.find(filterObj, "-tokens -password").skip(skip).limit(paginate).populate("userRole")
    const totalRecord = await User.find(filterObj).count()
    res.status(200).json({
        succeded: true,
        data,
        totalRecord
    })
})
const confirmDoctor = tryCatch(async (req, res) => {
    const id = req.params.id
    const data = await User.findByIdAndUpdate(id, {
        isApproved: true
    })
    res.status(200).json({
        succeded: true
    })
})
const userDelete = tryCatch(async (req, res) => {
    const id = req.params.id
    const data = await User.findByIdAndDelete(id)

    if (data.type === "doctor") {
        const ofis = await Office.findOneAndDelete({
            ownerId: id
        })
        const result = await Appointment.find({ doctorId: id })
        if (result.length > 0) {
            for (const i of result) {
                await Appointment.findByIdAndDelete(i._id)
            }
        } else {
            const result = await Appointment.find({ patientId: id })
            if (result.length > 0) {
                for (const i of result) {
                    await Appointment.findByIdAndDelete(i._id)
                }
            }
        }

    }
    res.status(200).json({
        succeded: true
    })
})
const doctorGetAll = tryCatch(async (req, res) => {
    let { page, paginate, searchKey } = req.query
    if (!page) page = 1
    if (!paginate) paginate = 10
    const skip = (page - 1) * paginate

    if (!searchKey) searchKey = ''

    let filterObj = {
        "$or": [{
            "firstName": {
                $regex: searchKey
            }
        },
        {
            "lastName": {
                $regex: searchKey
            }
        },
        {
            "email": {
                $regex: searchKey
            }
        },
        ],
    }
    filterObj.type = "doctor"
    const data = await User.find(filterObj, "-tokens -password").skip(skip).limit(paginate).populate("userRole")
    const totalRecord = await User.find(filterObj).count()
    res.status(200).json({
        succeded: true,
        data,
        totalRecord
    })
})
const userGetAll = tryCatch(async (req, res) => {
    let { page, paginate, searchKey } = req.query
    if (!page) page = 1
    if (!paginate) paginate = 10
    const skip = (page - 1) * paginate

    if (!searchKey) searchKey = ''

    let filterObj = {
        "$or": [{
            "firstName": {
                $regex: searchKey
            }
        },
        {
            "lastName": {
                $regex: searchKey
            }
        },
        {
            "email": {
                $regex: searchKey
            }
        },
        ],
    }
    filterObj.type = "user"
    const data = await User.find(filterObj, "-tokens -password").skip(skip).limit(paginate).populate("userRole")
    const totalRecord = await User.find(filterObj).count()
    res.status(200).json({
        succeded: true,
        data,
        totalRecord
    })
})
const admin = {
    registerAdmin,
    loginAdmin,
    adminLogout,
    doctorList,
    confirmDoctor,
    userDelete,
    doctorGetAll,
    userGetAll
}
export default admin