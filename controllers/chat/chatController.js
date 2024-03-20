import tryCatch from "../../utils/tryCatch.js"
import Conversations from "../../models/chat/conversationModel.js"
import Message from "../../models/chat/messageModel.js"
import { io } from "socket.io-client";
import User from "../../models/user/userModel.js"
const socket = io("http://localhost:8800");

const sendMessage = tryCatch(async (req,res)=>{
    let conversationId
    const senderId = req.user._id

    if (req.body.conversationId) {
        conversationId = req.body.conversationId
    } else {
        const receiverId = req.body.receiverId
        let conversation = await Conversations.findOne({
            $and: [{
                    members: String(senderId)
                },
                {
                    members: String(receiverId)
                }
            ]
        })
        if (!conversation) {
            const newConversation = await Conversations.create({
                members: [String(senderId), String(receiverId)]
            })
            conversationId = newConversation._id
        }else{
            conversationId = conversation._id
        }
    }
    const saveMessage = await Message.create({
        conversationId:conversationId ,
        sender:senderId,
        text: req.body.text
    })
    let obj = {}
    obj.conversationId = saveMessage.conversationId
    obj.sender = saveMessage.sender
    obj.text = saveMessage.text
    obj.IsSeen = saveMessage.IsSeen
    obj._id = saveMessage._id
    obj.createdAt = saveMessage.createdAt
   
    const conversation = await Conversations.findOne({_id:conversationId})
    const receiverId = conversation.members.filter((id) => id !==String(senderId) );
    obj.receiverId = receiverId[0]

    socket.emit("chatUser", {
      conversationId: saveMessage.conversationId,
      senderId: saveMessage.sender,
      receiverId: receiverId[0],
      text: saveMessage.text,
      _id: saveMessage._id,
      createdAt: saveMessage.createdAt,
    });
    res.status(200).json({
        succeded:true,
        data:obj,
        message:"Mesaj Başarılı bir şekilde gönderildi"
    })

})
//Kullanıcılar arasındaki msj gösteriyor
const getmessagesBetweenUsersFor = tryCatch(async (req, res) => {
    const conversation = req.params.conversationId;
    const userId = req.user._id;
    let result = await Conversations.findOne({_id:conversation});
    if (!result) {
      return res.status(422).json({
        succedd: false,
        messages: "İki Kullanıcı arasında konuşma yok",
        data: [],
      });
    }  
    const data = await Message.find({
      conversationId: conversation,
    })
      .populate({ path: "sender", select: "firstAndLastName _id" })
      .sort({ createdAt: 1 });
  
  
    const messages = [];
    for (const i of data) {
      if (String(i.sender._id) === String(userId)) {
        messages.push({
          conversationId: i?.conversationId,
          text: i?.text,
          senderId:i?.sender?._id,
          IsSeen: i.IsSeen,
          createdAt: i.createdAt,
          type: "going",
        });
      } else {
        messages.push({
          conversationId: i?.conversationId,
          text: i?.text,
          senderId:i?.sender?._id,
          IsSeen: i.IsSeen,
          createdAt: i.createdAt,
          type: "coming",
        });
      }
    }
    res.status(200).json({
      succedd: true,
      data: messages,
    });
});
const bringThePeopleITexted = tryCatch(async (req, res) => {
  let {searchKey} = req.query
  if (!searchKey) searchKey = "";
  const filterObj = {
    $or: [
      {
        firstName: {
          $regex: searchKey,
        },
      },
      {
        lastName: {
          $regex: searchKey,
        },
      }
    ],
  };
  const userId = req.user._id;
  const data = await Conversations.find({
    members: {
      $in: [String(userId)],
    },
  });
  console.log(data);
  const targetId = String(userId);
  const otherIds = [];

  for (const item of data) {
    if (item.members.includes(targetId)) {
      const filteredMembers = item.members.filter((id) => id !== targetId);
      otherIds.push({ conversationId: item._id, otherIds: filteredMembers[0] });
    }
  }
  let users = [];
  if (otherIds.length > 0) {
    for (const i of otherIds) {

      filterObj._id = i.otherIds
      const user = await User.findOne(filterObj);
      if (user) {
        const lastMessage = await Message.aggregate([
          {
            $match: { conversationId: i.conversationId } // ConversationId değeri 1 olan mesajları filtrele
          },
          {
            $sort: { createdAt: -1 }, // createdAt'e göre tersten sırala
          },
          {
            $group: {
              _id: "$conversationId",
              data: { $first: "$$ROOT" }, // Her advertId için ilk veriyi seç (en sonuncusu)
            },
          },
        ]);
        for (const i of lastMessage) {
          users.push({
            userId: user?._id || "",
            conversationId: i.data.conversationId || "",
            userName: user?.firstName +" "+ user?.lastName || "",
            image_url: user?.image_url || "",
            lastMessage: i.data.text || "",
            lastMessageDate: i.data.createdAt || "",
          });
        }
      }

    }
  }
 const result = users.sort((a, b) =>  new Date(b.lastMessageDate) - new Date(a.lastMessageDate));
  res.status(200).json({
    succedd: true,
    data: result,
  });
});
const chat = {
    sendMessage,
    getmessagesBetweenUsersFor,
    bringThePeopleITexted
}

export default chat