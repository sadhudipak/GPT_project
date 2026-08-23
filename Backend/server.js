import express from "express";
import "dotenv/config";
import cors from "cors";
import mongoose from "mongoose";
import chatRoutes from "./routes/chat.js";
import voiceRoutes from "./routes/voice.js";
import authRoutes from "./routes/auth.js";
import optionsRoutes from "./routes/options.js";

const app=express();
const PORT=8080;

const connectDB = async()=>{
  try{
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("connection with Database!!");
  }catch(err){
    console.log("Faild to connect with DB",err);  
  }
}

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({extended:true}))

app.use("/api",chatRoutes);
app.use("/api/voice", voiceRoutes); 
app.use("/api/auth", authRoutes);
app.use("/api/options", optionsRoutes);

app.listen(PORT,()=>{
  console.log(`server running on ${PORT}`);  
  connectDB();
});

// app.post("/test",async(req,res)=>{
//   const options={
//     method:"POST",
//     headers:{
//       "Content-Type":"application/json",
//       "Authorization":`Bearer ${process.env.OPENAI_API_KEY}`
//     },
//     body:JSON.stringify({
//       model:"gpt-5.4-mini",
//       messages:[{
//         role:"user",
//         content:req.body.message,
//       }]
//     })
//   }
  
  
//   try{
//     const response=await fetch("https://api.openai.com/v1/chat/completions",options);
//     const data=await response.json();
//     console.log(data);
//     res.send(data.choices[0].message.content);
    
//   }catch(err){
//     console.log(err);
    
//   }
// });