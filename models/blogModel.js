import mongoose from "mongoose";
import slugify from "slugify";

const {
    Schema
} = mongoose;
const blogSchema = new Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        require:true,
        ref: "User",
    },
    title: {
        type: String
    },
    short_description: {
        type: String,
    },
    description1: {
        type: String,
    },
    description2: {
        type: String,
    },
    description3: {
        type: String,
    },
    description4: {
        type: String,
    },
    coverPhoto: {
        type: String,
    },
    image1: {
        type: String,
    },
    image2: {
        type: String,
    },
    
}, {
    timestamps: true
})

// blogSchema.pre("validate", function (next) {
//     this.seoUrl = slugify(this.seoUrl, {
//         lower: true,
//         strict: true
//     })
//     next()
// });

const Blog = mongoose.model("Blog", blogSchema)

export default Blog