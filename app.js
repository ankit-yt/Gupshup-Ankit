const express = require('express')
const app = express()
const http = require('http')
const socketIo = require('socket.io')
const path = require('path')
app.set("view engine", "ejs")
const server = http.createServer(app)
const io = socketIo(server)
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json())
app.use(express.urlencoded({extended:true}))
const port = process.env.PORT || 4000;

let waitingUsers = []
let room = {}
io.on("connection", (socket)=>{
    console.log("New User Connected")
    socket.on("joinRoom" , ()=>{
        if(waitingUsers.length > 0){
            let partner = waitingUsers.shift()
            let roomName = `${socket.id}-${partner.id}`
            socket.join(roomName)
            partner.join(roomName)
            io.to(roomName).emit("joined", roomName);
            console.log(`room Created: ${roomName}`)
        }
        else{
            waitingUsers.push(socket)
        }

    })
    socket.on("message", (data)=>{
        socket.broadcast.to(data.roomName).emit("message", data.message)
    })

    socket.on("signalingMessage" , (data)=>{
        socket.broadcast.to(data.roomName).emit("signalingMessage", data.message)
    })

    socket.on("reqCall", (roomName)=>{
        console.log("req received")
        console.log(roomName)
        socket.broadcast.to(roomName).emit("callReq")
    })
    socket.on("acceptCall", (roomName)=>{
        io.to(roomName).emit("accept")
    })

    socket.on("rejectCall" , (roomName)=>{
        io.to(roomName).emit("reject")
    })

   


})

app.get("/" , (req, res)=>{
    res.render("index")
})

app.get("/chat" , (req , res)=>{
    res.render("chat")
})

server.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })
