const express = require("express");
const app = new express();
const bodyParser = require("body-parser");
const path = require("path");
const multer = require("multer");
const PDFDocument = require("pdfkit");
const fs = require("fs");
var cors = require("cors");
app.use(express.static("client-side/build"));
app.use(bodyParser.json());
app.use(cors());

// Upload Image File To UploadImages Directory
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./UploadImgs");
  },
  filename: function (req, file, cb) {
    const fileExt = path.extname(file.originalname);

    const fileName = file.originalname;
    cb(null, fileName);
  },
});

const limits = {
  fieldNameSize: 300,
  fileSize: 10000000, // 10 Mb
};
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/ebp" ||
    file.mimetype === "image/webp"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Not Allow!"));
  }
};

const upload = multer({
  storage: storage,
  limits: limits,
  fileFilter: fileFilter,
}).single("uploaded_file");

app.post("/upload", (req, res) => {
  upload(req, res, (error) => {
    if (error) {
      res.send("fail");
    } else {
      res.send("success");
    }
  });
});

// Remove Uploaded File

app.post("/remove", (req, res) => {
  let ImageName = req.body["ImageName"];
  let data = `/uploads/${ImageName}`;
  console.log(data);
  fs.unlink("./UploadImgs/" + ImageName, (err) => {
    if (err) {
      res.send("fail");
    } else {
      res.send("success");
    }
  });
});

// Create PDF
app.post("/createPDF", (req, res) => {
  let ImgArrayData = req.body["ImgArrayData"];
  let paperSize = req.body["paperSize"];
  let marginSize = req.body["marginSize"];
  let imageFit = req.body["imageFit"];

  console.log(req.body);
  const doc = new PDFDocument({
    autoFirstPage: false,
    size: paperSize,
    margin: marginSize,
  });
  let pdfFileName =
    Math.floor(100000 + Math.random() * 900000) +
    "_" +
    Math.round(new Date() / 1000) +
    "_output.pdf";
  doc.pipe(fs.createWriteStream("./OutputPDF/" + pdfFileName));

  let pageInfo;
  let ImgOption;

  if (paperSize === "A4") {
    pageInfo = {
      width: 595.28 - 2 * marginSize,
      height: 841.89 - 2 * marginSize,
    };
  } else if (paperSize === "B4") {
    pageInfo = {
      width: 708.66 - 2 * marginSize,
      height: 1000.63 - 2 * marginSize,
    };
  } else if (paperSize === "Letter") {
    pageInfo = {
      width: 612.0 - 2 * marginSize,
      height: 792.0 - 2 * marginSize,
    };
  } else if (paperSize === "Legal") {
    pageInfo = {
      width: 612.0 - 2 * marginSize,
      height: 1008.0 - 2 * marginSize,
    };
  } else if (paperSize === "Tabloid") {
    pageInfo = {
      width: 792.0 - 2 * marginSize,
      height: 1224.0 - 2 * marginSize,
    };
  } else if (paperSize === "Executive") {
    pageInfo = {
      width: 521.86 - 2 * marginSize,
      height: 756.0 - 2 * marginSize,
    };
  }

  if (imageFit === "Auto") {
    ImgOption = {
      align: "center",
      valign: "top",
    };
  } else if (imageFit === "Fit") {
    ImgOption = {
      fit: [pageInfo.width, pageInfo.height],
      align: "center",
      valign: "top",
    };
  } else if (imageFit === "Cover") {
    ImgOption = {
      cover: [pageInfo.width, pageInfo.height],
      align: "center",
      valign: "top",
      overflow: false,
    };
  }

  ImgArrayData.forEach((item, i) => {
    doc.addPage().image("./UploadImgs/" + item.ImageName, ImgOption);
  });

  doc.end();
  res.send(pdfFileName);
});

// Download PDF
app.get("/downloadPDF/:outputFile", (req, res) => {
  let outputFile = req.params.outputFile;
  const file = `${__dirname}` + "/OutputPDF/" + `${outputFile}`;
  res.download(file);
});

app.listen(5000, () => {
  console.log("Listening on port 5000");
});
