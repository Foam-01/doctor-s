# 🏥 รับเวรหมอ (Thai Doctor Shift Platform)

แพลตฟอร์มเชื่อมต่อแพทย์ที่ต้องการหาคนช่วยเวร กับแพทย์ที่ต้องการรับเวร

## ✨ ฟีเจอร์หลัก

### 🔐 ระบบลงทะเบียนและยืนยันตัวตนแพทย์
- ✅ สมัครสมาชิกสำหรับแพทย์
- ✅ อัปโหลดภาพใบอนุญาตประกอบวิชาชีพเวชกรรม
- ✅ ระบบอนุมัติจากผู้ดูแลแพลตฟอร์ม

### 📋 ระบบประกาศเวร
- ✅ สร้างประกาศหาคนรับเวร
- ✅ ระบุตำแหน่งงาน วันที่ เวลา สถานที่ ค่าตอบแทน
- ✅ แสดงรายการประกาศเวรทั้งหมด

### 🔍 ระบบค้นหาและกรองข้อมูล
- ✅ ค้นหาเวรตามเงื่อนไข
- ✅ กรองตามตำแหน่งงาน วันที่ สถานที่
- ✅ แสดงผลแบบ real-time

## 🛠 เทคโนโลยีที่ใช้

### Backend
- **FastAPI** - Python web framework
- **MongoDB** - NoSQL database
- **JWT Authentication** - ระบบยืนยันตัวตน
- **File Upload** - จัดการการอัปโหลดไฟล์

### Frontend  
- **React 19** - JavaScript library
- **Tailwind CSS** - CSS framework
- **shadcn/ui** - UI component library
- **Axios** - HTTP client
- **React Router** - การจัดการ routing

### Styling & UX
- **Kanit Font** - ฟอนต์ภาษาไทย
- **Responsive Design** - รองรับทุกหน้าจอ
- **Modern UI/UX** - ออกแบบสมัยและใช้งานง่าย



---
<img width="1889" height="891" alt="image" src="https://github.com/user-attachments/assets/afbcfcb1-44fd-41b3-a460-fd959d9ead6a" />
<img width="1897" height="890" alt="image" src="https://github.com/user-attachments/assets/a3684ff8-0bca-4da5-83e1-b820da7e6912" />
<img width="1886" height="877" alt="image" src="https://github.com/user-attachments/assets/9de84e98-7118-4c0a-a868-8df0947b676c" />
<img width="1903" height="898" alt="image" src="https://github.com/user-attachments/assets/8e0602a2-9ed5-4884-8c8b-b191cec4b4a7" />
<img width="1900" height="901" alt="image" src="https://github.com/user-attachments/assets/d6739e8d-69d8-44a5-bed1-2fb0b5a87965" />
<img width="1738" height="955" alt="image" src="https://github.com/user-attachments/assets/ee4d1b9f-3ee9-4f0d-8e85-a0eeeb896926" />
---

## 🚀 การติดตั้งและรันโปรเจค

### ข้อกำหนดเบื้องต้น
- Node.js 18+
- Python 3.8+  
- MongoDB
- Yarn

### 1. Clone repository
```bash
git clone https://github.com/Foam-01/doctor-s.git
cd doctor-s
```

### 2. ตั้งค่า Backend
```bash
cd backend
pip install -r requirements.txt

# สร้าง .env file
echo 'MONGO_URL="mongodb://localhost:27017"' > .env
echo 'DB_NAME="doctor_platform"' >> .env
echo 'CORS_ORIGINS="*"' >> .env
echo 'SECRET_KEY="your-secret-key-here"' >> .env

# รัน server
python server.py
```

### 3. ตั้งค่า Frontend  
```bash
cd frontend
yarn install

# สร้าง .env file
echo 'REACT_APP_BACKEND_URL=http://localhost:8001' > .env

# รัน development server
yarn start
```

### 4. เข้าถึงแอปพลิเคชัน
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001

## 👨‍⚕️ การใช้งาน

### สำหรับแพทย์
1. **สมัครสมาชิก** - กรอกข้อมูลและอัปโหลดใบอนุญาต
2. **รอการอนุมัติ** - รอผู้ดูแลตรวจสอบและอนุมัติบัญชี  
3. **ประกาศเวร** - สร้างประกาศหาคนรับเวร
4. **ค้นหาเวร** - ค้นหาและสมัครรับเวรที่สนใจ

### สำหรับผู้ดูแลระบบ  
1. **เข้าสู่ระบบ Admin** - admin@doctorshift.com / admin123
2. **ตรวจสอบใบอนุญาต** - ตรวจสอบและอนุมัติการสมัครของแพทย์
3. **จัดการระบบ** - ดูแลการทำงานของแพลตฟอร์ม

## 📁 โครงสร้างโปรเจค

```
doctor-s/
├── backend/
│   ├── server.py          # FastAPI application
│   ├── requirements.txt   # Python dependencies  
│   ├── .env              # Environment variables
│   └── uploads/          # ไฟล์อัปโหลด
├── frontend/
│   ├── src/
│   │   ├── App.js        # React main component
│   │   ├── App.css       # Styling
│   │   └── components/   # UI components
│   ├── package.json      # Node dependencies
│   └── .env             # Environment variables
└── README.md
```

## 🔒 ความปลอดภัย

- ✅ JWT Authentication  
- ✅ Password Hashing (bcrypt)
- ✅ File Upload Validation
- ✅ CORS Configuration
- ✅ Input Validation

## 🌟 ฟีเจอร์ที่จะพัฒนาต่อ

- [ ] ระบบแชทภายในแพลตฟอร์ม
- [ ] การแจ้งเตือนผ่าน Email/SMS  
- [ ] ระบบรีวิวและคะแนน
- [ ] Mobile Application
- [ ] ระบบชำระเงินออนไลน์

## 📄 License

MIT License - ใช้งานได้อย่างอิสระ

## 👥 ผู้พัฒนา

พัฒนาโดยทีมนักพัฒนาที่ใส่ใจในวงการแพทย์ไทย

---

🇹🇭 **Made with ❤️ for Thai Medical Community**
