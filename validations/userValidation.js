import { checkSchema, validationResult } from "express-validator";
import User from "../models/user/userModel.js"


const userCreateValidate = [checkSchema({
    email: {
        notEmpty: {
            errorMessage:"Email boş geçilemez"
        },
        custom: {
            options: async (value) => {
                console.log(value)
                const check = await User.findOne({ email: value })
                if (check) {
                    return Promise.reject();
                }
            },
            errorMessage:"Email sisteme kayıtlı."
        }
    },
    username: {
        notEmpty: {
            errorMessage: "Lütfen Kullanıcı Adı Giriniz." 
        },
    },
    password: {
        notEmpty: {
            errorMessage: "Şifre Boş Geçilemez" 
        },
        isLength: {
            options: {
                min: 5
            },
            errorMessage: "Şifreniz en az 5 karakter içermelidir",
        },
    },
   
}),
(req, res, next) => {
    const errors = validationResult(req);
    console.log(errors);
    if (!errors.isEmpty()) {
        const errorObject = {};
        for (let i = 0; i < errors.errors.length; i++) {
            const key = errors.errors[i].path;
            const value = errors.errors[i].msg;
            errorObject[key] = value;
        }
        return res.status(422).json({
            succeded: false,
            data: {
                error: errorObject
            }
        });
    } else {
        next();
    }
},
];



const UserValidations = {
    userCreateValidate,
  };
  
  export default UserValidations;
  