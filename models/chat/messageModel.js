import mongoose from "mongoose";

const {
    Schema
} = mongoose;
const MessageSchema = new Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"Conversation",
        require:true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        require:true
    },
    text: {
        type: String,
    },
    IsSeen:{
        type:Boolean,
        default:false
    }

}, {
    timestamps: true
})

const Message = mongoose.model("Message", MessageSchema)

export default Message