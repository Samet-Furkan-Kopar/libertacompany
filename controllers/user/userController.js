import tryCatch from "../../utils/tryCatch.js";
import AppError from "../../utils/appError.js";
import User from "../../models/user/userModel.js";
import Blog from "../../models/blogModel.js";
import jwt from "jsonwebtoken";

import bcrypt from "bcrypt";
import lodash from "lodash";
import fs from "fs";

const doctorRegister = tryCatch(async (req, res) => {
    const register = await User.create({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        type: "user",
        userRole: req.body.userRole,
    });
    if (!register) {
        return res.status(404).json({
            succeded: false,
            // message: i18n.translate("USERS.USER_NOT_CREATED", lang),
        });
    }

    res.status(200).json({
        succeded: true,
        //message: i18n.translate("USERS.USER_CREATED", lang)
    });
});
const userRegister = tryCatch(async (req, res) => {
    console.log(req.body);
    const register = await User.create({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        title: req.body.title,
        image_url: req.body.profilePhoto,
        type: "user",
    });
    if (!register) {
        return res.status(404).json({
            succeded: false,
            //message: i18n.translate("USERS.USER_NOT_CREATED", lang),
        });
    }
    res.status(200).json({
        succeded: true,
        data: register,

        //message: i18n.translate("USERS.USER_CREATED", lang)
    });
});
const userLogin = tryCatch(async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({
        username,
    });

    let same = false;
    if (user) {
        same = await bcrypt.compare(password, user?.password);
    } else {
        res.status(201).json({
            succeded: false,
            message: "Kullanıcı bulunamadı",
        });
    }
    if (same) {
        const user = await User.findOne(
            {
                username,
            },
            "-password -token"
        );
        const token = await createToken(user._id);

        if (!token) {
            //throw new AppError(i18n.translate("USERS.USER_TOKEN_ERROR", lang), 404);
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
        await User.findByIdAndUpdate(user._id, {
            tokens: [
                ...oldTokens,
                {
                    token,
                    signedAt: Date.now().toString(),
                },
            ],
        });
        const users = await User.findOne(
            {
                username,
            },
            "-password -token -tokens"
        );
        return res.status(200).json({
            succeded: true,
            data: {
                token,
                user: users,
                // message: i18n.translate("USERS.USER_SUCCESS_LOGIN", lang),
            },
        });
    } else {
        res.status(200).json({
            succeded: true,
            data: {
                message: "Şifreniz yanlış",
                // message: i18n.translate("USERS.USER_SUCCESS_LOGIN", lang),
            },
        });
    }
});
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
const userFilter = tryCatch(async (req, res) => {
    let { page, paginate } = req.query;
    let { role, country, city, district, neighbourhood, searchKey } = req.body;
    if (!page) page = 1;
    if (!paginate) paginate = 10;
    const skip = (page - 1) * paginate;

    if (!searchKey) searchKey = "";

    let filterObj = {
        $or: [
            {
                companyName: {
                    $regex: searchKey,
                },
            },
            {
                companyTitle: {
                    $regex: searchKey,
                },
            },
            // {
            //     "ownerId": {
            //       $elemMatch: {
            //         "firstName": { $regex: searchKey } // 'posts' alanındaki 'author' alanında arama
            //       }
            //     }
            //   }
        ],
    };
    if (role) {
        const result = await User.find({ userRole: role });
        let filterRole = [];
        if (result) {
            for (const i of result) {
                filterRole.push(i._id);
            }
        }
        filterObj.ownerId = { $in: filterRole };
    }

    if (country) filterObj.countryId = country;
    if (city) filterObj.cityId = city;
    if (district) filterObj.districtId = district;
    if (neighbourhood) filterObj.neighbourhoodId = neighbourhood;

    const result = await Office.find(filterObj)
        .skip(skip)
        .limit(paginate)
        .populate({
            path: "ownerId",
            select: "firstName lastName phoneNumber email userRole image_url",
            populate: { path: "userRole", select: "role" },
        })
        .populate({ path: "countryId", select: "name" })
        .populate({ path: "cityId", select: "name" })
        .populate({ path: "districtId", select: "name" })
        .populate({ path: "neighbourhoodId", select: "name" });
    const totalRecord = await Office.find(filterObj).count();
    res.status(200).json({
        succeded: true,
        data: result,
        totalRecord,
    });
});
const userDetail = tryCatch(async (req, res) => {
    const user = req.user;

    let detail = {
        firstName: {
            type: "string",
            label: "Adınız",
            value: user?.firstName || "",
        },
        lastName: {
            type: "string",
            label: "Soyadınız",
            value: user?.lastName || "",
        },
        email: {
            type: "string",
            label: "E-mail",
            value: user?.email || "",
        },
        phoneNumber: {
            type: "string",
            label: "Telefon Numarası",
            value: user?.phoneNumber || "",
        },
        image_url: {
            type: "string",
            label: "Kullanıcı Fotografı",
            value: user?.image_url || "",
        },
        type: {
            type: "string",
            label: "Kullanıcı Rolü",
            value: user?.type || "",
        },
    };

    if (user.type === "doctor") {
        const office = await Office.findOne({ ownerId: user._id }).populate([
            "countryId",
            "cityId",
            "districtId",
            "neighbourhoodId",
        ]);
        const country = await Country.find({});
        const city = office?.countryId?._id
            ? await City.find({ countryId: office?.countryId?._id })
            : [];
        const district = office?.cityId?._id
            ? await District.find({ cityId: office?.cityId?._id })
            : [];
        const neighbourhood = office?.districtId?._id
            ? await Neighbourhood.find({ districtId: office?.districtId?._id })
            : [];
        let countryData = [];
        let cityData = [];
        let districtData = [];
        let neighbourhoodData = [];
        if (country.length > 0) {
            for (const i of country) {
                countryData.push({
                    type: "string",
                    label: i.name,
                    value: i._id,
                });
            }
        }
        if (city.length > 0) {
            for (const i of city) {
                cityData.push({
                    type: "string",
                    label: i.name,
                    value: i._id,
                });
            }
        }
        if (district.length > 0) {
            for (const i of district) {
                districtData.push({
                    type: "string",
                    label: i.name,
                    value: i._id,
                });
            }
        }
        if (neighbourhood.length > 0) {
            for (const i of neighbourhood) {
                neighbourhoodData.push({
                    type: "string",
                    label: i.name,
                    value: i._id,
                });
            }
        }
        detail.companyName = {
            type: "string",
            label: "Firma Adı",
            value: office?.companyName || "",
        };
        detail.companyTitle = {
            type: "string",
            label: "Firma Ünvanı",
            value: office?.companyTitle || "",
        };
        detail.officeEmail = {
            type: "string",
            label: "Ofis Email",
            value: office?.officeEmail || "",
        };
        detail.taxNo = {
            type: "number",
            label: "Vergi No",
            value: office?.taxNo || 0,
        };
        detail.taxOffice = {
            type: "string",
            label: "Vergi Dairesi",
            value: office?.taxOffice || "",
        };
        detail.logo_url = {
            type: "string",
            label: "Logo",
            value: office?.logo_url || "",
        };
        detail.coverPhoto = {
            type: "string",
            label: "Kapak Fotografı",
            value: office?.coverPhoto || "",
        };
        detail.description = {
            type: "string",
            label: "Açıklama",
            value: office?.description || "",
        };
        detail.address = {
            type: "string",
            label: "Adres",
            value: office?.address || "",
        };
        detail.aboutUs = {
            type: "string",
            label: "Hakkımda",
            value: office?.aboutUs || "",
        };
        detail.description = {
            type: "string",
            label: "Açıklama",
            value: office?.description || "",
        };
        detail.countryId = {
            type: "string",
            label: office?.countryId?.name || "",
            value: office?.countryId?._id || "",
            options: countryData,
        };
        detail.cityId = {
            type: "string",
            label: office?.cityId?.name || "",
            value: office?.cityId?._id || "",
            options: cityData,
        };
        detail.districtId = {
            type: "string",
            label: office?.districtId?.name || "",
            value: office?.districtId?._id || "",
            options: districtData,
        };
        detail.neighbourhoodId = {
            type: "string",
            label: office?.neighbourhoodId?.name || "",
            value: office?.neighbourhoodId?._id || "",
            options: neighbourhoodData,
        };
        detail.latitude = {
            type: "number",
            label: "latitude",
            value: office?.latitude || 0,
        };
        detail.longitude = {
            type: "number",
            label: "longitude",
            value: office?.longitude || 0,
        };
    }

    res.status(200).json({
        succeded: true,
        data: detail,
    });
});
const userUpdate = tryCatch(async (req, res) => {
    const bodyWithoutEmptyValues = lodash.pickBy(req.body, lodash.identity);
    req.body = bodyWithoutEmptyValues;

    const id = req.user._id;

    const user = await User.findOne({ _id: id });
    if (req.body.image_url && user.image_url) {
        photoDelete(user.image_url);
    }

    const userupdate = await User.findByIdAndUpdate(id, req.body);
    if (user.type === "doctor") {
        const result = await Office.findOne({ ownerId: id });
        if (req.body?.logo_url && result.logo_url) {
            photoDelete(result.logo_url);
        }
        if (req.body?.coverPhoto && result.coverPhoto) {
            photoDelete(result.coverPhoto);
        }
        const updateData = await Office.findByIdAndUpdate(result._id, req.body, { new: true });
        if (!updateData) {
            throw new AppError("Güncellemede Hata Oluştu", 404);
        }
    }

    res.status(200).json({
        succeded: true,
        message: "Ofis Güncelleme Başarılı Şekilde Oldu",
    });
    function photoDelete(filePath) {
        console.log(filePath);
        let path = filePath.split("http://localhost:8800");
        console.log(path);
        path = `public${path[1]}`;
        fs.access(path, fs.constants.F_OK, (err) => {
            if (err) {
                console.error("Fotoğraf bulunamadı:", err);
                return;
            }

            // Fotoğrafı sil
            fs.unlink(path, (unlinkErr) => {
                if (unlinkErr) {
                    console.error("Fotoğrafı silme hatası:", unlinkErr);
                } else {
                    console.log("Fotoğraf başarıyla silindi.");
                }
            });
        });
    }
});
const userPasswordUpdate = tryCatch(async (req, res) => {
    const id = req.user._id;
    const user = await User.findById(id);
    let same = false;
    same = await bcrypt.compare(req.body.currentpassword, user.password);
    if (same) {
        const newPassword = await hashpassword(req.body.password);
        const update = await User.findByIdAndUpdate(id, {
            password: newPassword,
        });

        res.status(200).json({
            succeded: true,
            message: "Şifreniz başarılı bir şekilde değiştirildi.",
        });
    } else {
        res.status(422).json({
            succeded: false,
            message: "Mevcut şifrenizi kontrol ediniz",
        });
    }
});
const getAllUser = tryCatch(async (req, res) => {
    try {
        const userId = req.user._id;
        const users = await User.find({ _id: { $ne: userId } });// ne:not equals
        // const users = await User.find();
        console.log(users);
        if (users && users.length > 0) {
            res.status(200).json({
                succeded: true,
                message: "",
                data: users,
            });
        } else {
            res.status(422).json({
                succeded: false,
                message: "Kullanıcı bulunamadı.",
            });
        }
    } catch (error) {
        res.status(500).json({
            succeded: false,
            message: "Sunucu hatası oluştu: " + error.message,
        });
    }
});
const removeUser = tryCatch(async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndDelete(id);

        if (user) {
            res.status(200).json({
                succeded: true,
                message: "Kullanıcı başarılı bir şekilde silindi.",
            });
        } else {
            res.status(422).json({
                succeded: false,
                message: "Kullanıcı bulunamadı.",
            });
        }
    } catch (error) {
        res.status(500).json({
            succeded: false,
            message: "Sunucu hatası oluştu: " + error.message,
        });
    }
});
async function hashpassword(password) {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    return hashedPassword;
}
const user = {
    doctorRegister,
    userRegister,
    userLogin,
    userFilter,
    userDetail,
    userUpdate,
    userPasswordUpdate,
    getAllUser,
    removeUser,
};
export default user;
