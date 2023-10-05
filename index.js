import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import fs from 'fs';

import path, { join } from "path";

import multer from "multer";

import Connection from "./connection/db.js";
import { fileURLToPath } from "url";
import box from "./Modal/Data..js";
import mongoose from "mongoose";
import { Mongoose } from "mongoose";
import User from "./Modal/Message.js";





const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());



dotenv.config();

const PORT = process.env.PORT || 8800;

const url = process.env.URL;

Connection(url);


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Set the destination directory for uploaded files
  },
  filename: (req, file, cb) => {
    // Generate a unique filename for the uploaded image
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = file.originalname.split('.').pop();
    const filename = `${uniqueSuffix}.${fileExtension}`;
    cb(null, filename);
  },
});

const upload = multer({ storage });
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//app.post('/api/add-data', upload.single('img'), async (req, res) => {
//   if (!req.file) {
//       res.status(400).json({ message: "No Image uploaded" });
//   }


//   const newBox = new box({
//     main_type: req.body.main_type,
//     sub_type: req.body.sub_type,
//     img: req.file.filename,
//     data: req.body.data,
//     icon1_data: req.body.icon1_data,
//     icon2_data: req.body.icon12_data, 
//   });

//   console.log(newBox);

//   try {
//     await newBox.save();
//     res.json({ message: 'Dish and image uploaded successfully', data : newBox });
//   } catch (error) {
//     console.error('Error saving dish:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });



// Assuming you have already configured Cloudinary as shown earlier

app.post('/api/add-data', async (req, res) => {
  if (!req.files || !req.files.img) {
    return res.status(400).json({ message: "No image uploaded" });
  }

  const imageFile = req.files.img;

  try {
    // Upload the image to Cloudinary
    const cloudinaryResponse = await cloudinary.uploader.upload(imageFile.path, {
      upload_preset:"skier8ig"
    });

    const newBox = new box({
      main_type: req.body.main_type,
      sub_type: req.body.sub_type,
      img: cloudinaryResponse.secure_url, // Use the Cloudinary URL as the image field
      data: req.body.data,
      icon1_data: req.body.icon1_data,
      icon2_data: req.body.icon12_data, 
    });

    console.log(newBox);

    await newBox.save();
    
    // Send the Cloudinary image URL in the response
    res.json({ message: 'Dish and image uploaded successfully', imageUrl: cloudinaryResponse.secure_url, data: newBox });
  } catch (error) {
    console.error('Error uploading image or saving dish:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/add-data-only',  async (req, res) => {
    
  const newBox = new box({
    main_type: req.body.main_type,
    sub_type: req.body.sub_type,
    img: "",
    data: req.body.data,
    icon1_data: req.body.icon1_data,
    icon2_data: req.body.icon12_data, 
  });


  try {
    await newBox.save();
    res.json({ message: 'Dish and image uploaded successfully', data : newBox });
  } catch (error) {
    console.error('Error saving dish:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
  });

app.put('/update-box/:id', upload.single('img'), async (req, res) => {
  const boxId = req.params.id;


  try {
    const existingBox = await box.findById(boxId);

    if (!existingBox) {
      return res.status(404).json({ message: 'Box not found' });
    }
    const {
      data,
      icon1_data,
      icon2_data,
      img
    } = req.body;

    

    let imageData ="";

    if (req.file) {
      
      // if (existingBox.img) {
      //   fs.unlinkSync(`/uploads/${existingBox.img}`);
      // }
      imageData = req.file.filename;
      }

      const form = {
        main_type : existingBox.main_type,
        sub_type : existingBox.sub_type,
        data : data || existingBox.data,
        icon1_data : icon1_data || existingBox.icon1_data,
        icon2_data : icon2_data || existingBox.icon2_data,
        img : imageData || existingBox.img
      }

      console.log(form);
;

    const updated = await box.findOneAndUpdate({_id :new  mongoose.Types.ObjectId(boxId)},{ $set : form}); 
    
    res.json({ message: 'Box updated successfully', data: updated });
  } catch (error) {
    console.error('Error updating Box:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/get-boxes', async (req, res) => {
  try {
    
    const main_type = req.query.main_type;
    const sub_type = req.query.sub_type;

    console.log(main_type,sub_type);
    const boxes = await box.find({main_type:main_type,sub_type:sub_type});

    const updatedBoxes = boxes.map((boxItem) => ({
      ...boxItem,
      img: `http://localhost:8000/uploads/${boxItem.img}`, // Update the image URL
    }));


    res.json({ message: 'Box updated successfully', data: updatedBoxes });
  } catch (error) {
    console.error('Error updating dish:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/add-user', async (req, res) => {
  try {
    const { name, email, msg } = req.body;
    const user = new User({ name, email, msg });
    await user.save();
    res.status(201).json({ message: 'User added successfully' });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while adding the user' });
  }
});

// Define a route to get all users
app.get('/get-all-users', async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching users' });
  }
});


app.delete('/delete-box/:id', async (req, res) => {
    const boxId = req.params.id;
  
    try {
      const existingBox = await box.findById(boxId);
  
      if (!existingBox) {
        return res.status(404).json({ message: 'Box not found' });
      }
  
      if (existingBox.img) {
        // Delete the associated image file
        fs.unlinkSync(`uploads/${existingBox.img}`);
      }
  
      const resq = await box.findByIdAndDelete(boxId);
  
      res.status(200).json({ message: 'Box deleted successfully' });
    } catch (error) {
      console.error('Error deleting box:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  


app.listen(PORT, () =>
  console.log(`Server is running successfully on PORT ${PORT}`)
);
