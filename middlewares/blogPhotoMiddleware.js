import fs from "fs"
import {
    mkdirp
} from 'mkdirp'
import multer from "multer";
import sharp from "sharp";
import tryCatch from "../utils/tryCatch.js";




const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {

    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Not an image! Please upload only images.', 400), false)
    }
}

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
})
// const resizeImages = tryCatch(async (req, res, next) => {
//     if (!fs.existsSync('public/contents/blog')) {
//         await mkdirp('public/contents/blog');
//     }

//     req.body.images=[]
//     req.body.coverPhoto=""

//     // Images
//     await Promise.all(req.files.map(async (file, i) => {
//         const result = file.fieldname.split("-")
//         // if (result.length > 0) {
//         //     const random = await generateRandomString(6)
//         //     const baseUrl = process.env.DOMAIN
//         //     const file_name = `/contents/blog/image-${Date.now()}-${random}.png`;
//         //     req.body.images.push({filedname:file.fieldname,filename:baseUrl + file_name})
//         //     await sharp(file.buffer).toFile(`public${file_name}`)
//         // }
//         if (result[0] === "coverPhoto") {
//             const random = await generateRandomString(6)
//             const baseUrl = process.env.DOMAIN
//             const file_name = `/contents/blog/image-${Date.now()}-${random}.png`;
//             req.body.coverPhoto = baseUrl + file_name
//             await sharp(file.buffer).toFile(`public${file_name}`)
//         }

//     }));
//     next()

// })
const resizeImages = tryCatch(async (req, res, next) => {
    if (!fs.existsSync('public/contents/cover') || !fs.existsSync('public/contents/article'))  {
        await mkdirp('public/contents/cover');
        await mkdirp('public/contents/article');
    }

    req.body.coverPhoto = "";
    req.body.image1 = "";
    req.body.image2 = "";

    await Promise.all(req.files.map(async (file, i) => {
        const result = file.fieldname.split("-");
console.log("aawawd",result);
        if (result[0] === "coverPhoto") {
            const random = await generateRandomString(6);
            const baseUrl = process.env.DOMAIN;
            const file_name = `/contents/cover/image-${Date.now()}-${random}.png`;
            req.body.coverPhoto = baseUrl + file_name;
            await sharp(file.buffer).toFile(`public${file_name}`);
        } 
        if (result[0] === "image1") {
            const random = await generateRandomString(6);
            const baseUrl = process.env.DOMAIN;
            const file_name = `/contents/article/image-${Date.now()}-${random}.png`;
            req.body.image1 = baseUrl + file_name;
            await sharp(file.buffer).toFile(`public${file_name}`);
        }
         if (result[0] === "image2") {
            const random = await generateRandomString(6);
            const baseUrl = process.env.DOMAIN;
            const file_name = `/contents/article/image-${Date.now()}-${random}.png`;
            req.body.image2 = baseUrl + file_name;
            await sharp(file.buffer).toFile(`public${file_name}`);
        }
        if (result[0] === "profilePhoto") {
            const random = await generateRandomString(6);
            const baseUrl = process.env.DOMAIN;
            const file_name = `/contents/profile/image-${Date.now()}-${random}.png`;
            req.body.profilePhoto = baseUrl + file_name;
            await sharp(file.buffer).toFile(`public${file_name}`);
        }
    }));

    next();
});
async function generateRandomString(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        const randomChar = characters.charAt(randomIndex);
        result += randomChar;
    }

    return result;
}
const uploadSettingImages = upload.any()








const photoMiddleware = {
    uploadSettingImages,
    resizeImages,
};

export default photoMiddleware;