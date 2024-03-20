import Blog from "../models/blogModel.js";
import tryCatch from "../utils/tryCatch.js";
import AppError from "../utils/appError.js";
//Bodyden gelen verileri Veri tabanına kaydetme işlemlerini yapıyor

const create = tryCatch(async (req, res) => {
    console.log("geldii");
    console.log(req.body);

    const savedObject = {
        userId: req.user._id,
        title: req.body.title,
        short_description: req.body.short_description,
        description1: req.body.description1,
        description2: req.body.description2,
        description3: req.body.description3,
        description4: req.body.description4,
        coverPhoto: req.body.coverPhoto,
        image1: req.body.image1,
        image2: req.body.image2,
    };

    // if (req.body.images && req.body.images.length > 0) savedObject.image = req.body.images[0].filename;

    const create = await Blog.create(savedObject);
    console.log(create);
    if (!create) {
        throw new AppError("Blog could not be created", 404);
    }
    res.status(200).json({
        succeded: true,
        data: create,
    });
});
//Paramsdan gelen id'yi Veri tabanından silme işlemini yapıyor

const remove = tryCatch(async (req, res) => {
    console.log(req.params.id, "aaaa");
    const exist = await Blog.findById(req.params.id);
    if (!exist) {
        console.log("geldi");
        throw new AppError("Article  not found", 404);
    }
    const remove = await Blog.findOneAndRemove({
        _id: req.params.id,
    });
    if (!remove) {
        console.log("eeeee");
        throw new AppError("Blog  not deleted", 404);
    }
    res.status(200).json({
        succeded: true,
        data: remove,
    });
});
//Paramsdan gelen id ile buldugu datayı, body gelen verilerle güncelleme işlemini yapıyor

const update = tryCatch(async (req, res) => {
    const id = req.params.id;
    let object;
    // if (req.body.images && req.body.images.length > 0) {
    //     object = {
    //         seoTitle: req.body.seoTitle,
    //         seoUrl: req.body.seoUrl,
    //         seoDescription: req.body.seoDescription,
    //         title: req.body.title,
    //         content: req.body.content,
    //         image: req.body.images[0].filename,
    //         isStatus: req.body.isStatus,
    //         short_description: req.body.short_description,

    //     }
    // } else {
    //     object = {
    //         seoTitle: req.body.seoTitle,
    //         seoUrl: req.body.seoUrl,
    //         seoDescription: req.body.seoDescription,
    //         title: req.body.title,
    //         content: req.body.content,
    //         isStatus: req.body.isStatus,
    //     }
    // }
    object = {
        title: req.body.title,
        short_description: req.body.short_description,
        description1: req.body.description1,
        description2: req.body.description2,
        description3: req.body.description3,
        description4: req.body.description4,
    };
    if (req.body.coverPhoto && req.body.image1 && req.body.image2) {
        object.coverPhoto = req.body.coverPhoto;
        object.image1 = req.body.image1;
        object.image2 = req.body.image2;
    }
    const update = await Blog.findByIdAndUpdate(id, object, { new: true });
    if (!update) {
        throw new AppError("Blog  not update", 404);
    }
    res.status(200).json({
        succeded: true,
        data: update,
    });
});
//Verileri filtere ile  listeleme işlemi yapıyor

const getAll = tryCatch(async (req, res) => {
    let { page, paginate, searchKey } = req.query;

    if (!page) page = 1;
    if (!paginate) paginate = 10;
    const skip = (page - 1) * paginate;

    if (!searchKey) searchKey = "";
    const filterObj = {
        $or: [
            {
                title: {
                    $regex: searchKey,
                },
            },
            {
                content: {
                    $regex: searchKey,
                },
            },
            {
                seoDescription: {
                    $regex: searchKey,
                },
            },
        ],
    };
    const getAll = await Blog.find(filterObj).skip(skip).limit(paginate).sort({ createdAt: -1 });
    if (!getAll) {
        throw new AppError("Blog  failed to fetch", 404);
    }
    const totalRecord = await Blog.find({}).count();
    res.status(200).json({
        succeded: true,
        data: getAll,
        totalRecord,
    });
});
//paramsdan gelen id ile istenilen blog detayı getiriliyor
const getDetail = tryCatch(async (req, res) => {
    const id = req.params.id;
    console.log(id, "id");
    const getAll = await Blog.findOne({ _id: id });
    console.log(getAll, "getall");
    res.status(200).json({
        succeded: true,
        data: getAll,
    });
});
//Tüm verileri listeleme işlemi yapıyor
const getListAll = tryCatch(async (req, res) => {
    const getAll = await Blog.find().populate({ path: "userId", select: "username title image_url" })
    console.log(getAll,"-aaaaaaaaaaaaaa");
    res.status(200).json({
        succeded: true,
        data: getAll,
    });
});
const getUserData = tryCatch(async (req, res) => {
    const filterObj = {};
    filterObj.userId = req.user._id;
    const getAll = await Blog.find(filterObj);
    console.log(getAll);
    if (!getAll) {
        throw new AppError("Blog failed to fetch", 404);
    }
    // const totalRecord = await Blog.find(filterObj).count()
    res.status(200).json({
        succeded: true,
        data: getAll,
    });
});

const blogFilter = tryCatch(async (req, res) => {
    let { page, paginate } = req.query;

    let { searchKey, user } = req.body;

    if (!page) page = 1;
    if (!paginate) paginate = 10;
    const skip = (page - 1) * paginate;

    if (!searchKey) searchKey = "";
    const filterObj = {
        $or: [
            {
                title: {
                    $regex: searchKey,
                },
            },
            {
                content: {
                    $regex: searchKey,
                },
            },
            {
                seoDescription: {
                    $regex: searchKey,
                },
            },
        ],
    };
    if (user) filterObj.userId = user;

    const getAll = await Blog.find(filterObj)
        .skip(skip)
        .limit(paginate)
        .sort({ createdAt: -1 })
        .populate({ path: "userId", select: "firstName lastName image_url" });

    if (!getAll) {
        throw new AppError("Blog  failed to fetch", 404);
    }
    const totalRecord = await Blog.find(filterObj).count();
    res.status(200).json({
        succeded: true,
        data: getAll,
        totalRecord,
    });
});
export { create, remove, update, getAll, getDetail, getListAll, getUserData, blogFilter };
