
# DJI-Run

<div align="center">

[![GitHub license](https://img.shields.io/github/license/Ahua9527/DJI-Run)](https://github.com/Ahua9527/DJI-Run/blob/main/LICENSE)
![GitHub stars](https://img.shields.io/github/stars/Ahua9527/DJI-Run)

🎬 A DJI database conversion tool designed for DIT 🚀

English · [简体中文](./README.md) · [Live Demo](https://djirun.ahua.space)

</div>

DJI-Run is a tool designed to **extract and correct the Sensor FPS metadata from DJI Ronin 4D and Inspire 3 devices**. It converts the SQLite database stored on DJI device memory cards into CSV format, helping Digital Imaging Technicians (DIT) manage shooting data accurately, particularly for **CINITY-specialized workflows**.

## ✨ Features

- 🔄 **Convert DJI database files to CSV format**
- 🎯 **Drag-and-drop support for DJI .db files**
- 📊 **Batch processing of multiple database files**
- 🌓 **Automatic dark/light mode adaptation**
- 📱 **PWA support for offline use and installation**
- 🔒 **All data is processed locally, ensuring data security**
- 💻 **Cross-platform compatibility for both desktop and mobile devices**

## 🚀 Quick Start

### Steps to use

1️⃣ **Open the DJI-Run web app** (PWA installation supported)  
2️⃣ **Drag and drop or select** a DJI device database file (.db)  
3️⃣ **Click "Export CSV"**, and the tool will automatically parse and convert the data  
4️⃣ **Download the converted CSV file**, and you're done!  

🎯 **Just three simple steps to retrieve accurate Sensor FPS information!**

### Supported Data Fields

DJI-Run extracts and converts the following key metadata:

- file_name
- project_fps	
- sensor_fps
- duration
- resolution_width
- resolution_height
- shutter
- shutter_angle
- ei_value
- wb_count
- wb_tint
- nd_value
- aperture
- model_name

## 🛠 Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- SQLite
- PWA support

## 📦 Installation & Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ahua9527/DJI-Run.git
   cd DJI-Run
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Start development server**
   ```bash
   npm run dev
   ```
4. **Build the project**
   ```bash
   npm run build
   ```

## 🎯 Future Vision

DJI-Run is not just a data conversion tool—it aims to **push for improvements in DJI's metadata handling**, allowing DITs and post-production teams to **manage and utilize shooting data more efficiently**. We also urge DJI to **fix the Sensor FPS metadata issue as soon as possible** to provide filmmakers worldwide with more accurate metadata.

## 📃 License

[Apache License 2.0](LICENSE)

## 🤝 Contributing

Feel free to submit Issues and Pull Requests—your contributions are welcome!

## 👨‍💻 Author

[哆啦Ahua🌱 ](https://github.com/Ahua9527)  

---

这样，你的 README 现在有了完美的英文版本！