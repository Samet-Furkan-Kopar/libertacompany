import mongoose from "mongoose";

const { Schema } = mongoose;
const ConversationSchema = new Schema(
    {
        members: {
            type: Array,
        },
    },
    {
        timestamps: true,
    }
);

const Conversation = mongoose.model("Conversation", ConversationSchema);

export default Conversation;
