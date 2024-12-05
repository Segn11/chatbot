import app from "./app.js";
// import { connectToDatabase } from "./db/connection.js";
import { connectToMongoDB } from "./db_connection/mogodbConnection.js";

import * as dotenv from 'dotenv';
dotenv.config();
//connections and listeneres
const PORT = process.env.PORT || 5000;
connectToMongoDB()
  .then(() => {
    app.listen(PORT, () =>
      console.log("Server Open & Connected To Database 🤟")
    );
  })
  .catch((err) => console.log(err));