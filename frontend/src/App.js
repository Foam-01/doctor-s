import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Textarea } from './components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Badge } from './components/ui/badge';
import { Calendar, MapPin, Clock, DollarSign, User, FileImage, CheckCircle, XCircle, Menu, X, Stethoscope, Heart, Shield, Users } from 'lucide-react';
import { Alert, AlertDescription } from './components/ui/alert';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = React.createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(`${API}/me`);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/login`, { email, password });
      const { access_token, user } = response.data;
      
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser(user);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'เข้าสู่ระบบไม่สำเร็จ' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, fetchCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Header Component
const Header = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-lg border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-2 rounded-lg">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              รับเวรหมอ
            </span>
          </Link>

          {user ? (
            <div className="hidden md:flex items-center space-x-4">
              <nav className="flex items-center space-x-6">
                <Link to="/dashboard" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                  แดชบอร์ด
                </Link>
                <Link to="/shifts" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                  เวรที่เปิด
                </Link>
                <Link to="/post-shift" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                  ประกาศเวร
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                    จัดการระบบ
                  </Link>
                )}
              </nav>
              
              <div className="flex items-center space-x-3">
                <div className="text-sm">
                  <span className="text-gray-600">สวัสดี</span>
                  <span className="font-medium text-gray-900 ml-1">{user.first_name}</span>
                </div>
                {user.approval_status === 'approved' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Clock className="h-5 w-5 text-yellow-500" />
                )}
                <Button variant="outline" size="sm" onClick={logout}>
                  ออกจากระบบ
                </Button>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/login">
                <Button variant="outline">เข้าสู่ระบบ</Button>
              </Link>
              <Link to="/register">
                <Button>สมัครสมาชิก</Button>
              </Link>
            </div>
          )}

          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            {user ? (
              <div className="space-y-3">
                <Link to="/dashboard" className="block text-gray-700 hover:text-blue-600 font-medium">
                  แดชบอร์ด
                </Link>
                <Link to="/shifts" className="block text-gray-700 hover:text-blue-600 font-medium">
                  เวรที่เปิด
                </Link>
                <Link to="/post-shift" className="block text-gray-700 hover:text-blue-600 font-medium">
                  ประกาศเวร
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin" className="block text-gray-700 hover:text-blue-600 font-medium">
                    จัดการระบบ
                  </Link>
                )}
                <Button variant="outline" size="sm" onClick={logout} className="w-full">
                  ออกจากระบบ
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Link to="/login">
                  <Button variant="outline" className="w-full">เข้าสู่ระบบ</Button>
                </Link>
                <Link to="/register">
                  <Button className="w-full">สมัครสมาชิก</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

// Landing Page Component
const LandingPage = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-blue-800/5"></div>
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 rounded-full">
                <Stethoscope className="h-16 w-16 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              แพลตฟอร์ม
              <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                {' '}รับเวรหมอ
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              เชื่อมต่อแพทย์ที่ต้องการหาคนช่วยเวร กับแพทย์ที่ต้องการรับเวร
              <br />
              ระบบที่ปลอดภัย รวดเร็ว และเชื่อถือได้
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3">
                  เริ่มต้นใช้งาน
                </Button>
              </Link>
              <Link to="/shifts">
                <Button size="lg" variant="outline" className="px-8 py-3">
                  ดูเวรที่เปิด
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ทำไมต้องเลือกเรา?
            </h2>
            <p className="text-xl text-gray-600">
              ระบบที่ออกแบบมาเฉพาะสำหรับวงการแพทย์
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-16 h-16 flex items-center justify-center">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle>ปลอดภัยและเชื่อถือได้</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  ตรวจสอบใบอนุญาตประกอบวิชาชีพเวชกรรม
                  รับรองความน่าเชื่อถือของสมาชิกทุกคน
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle>เชื่อมต่อรวดเร็ว</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  ค้นหาและเชื่อมต่อกับแพทย์ที่เหมาะสม
                  ได้อย่างรวดเร็วและมีประสิทธิภาพ
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto mb-4 p-3 bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center">
                  <Heart className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle>ใส่ใจทุกรายละเอียด</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  ระบบค้นหาที่ละเอียดตามสาขาความเชี่ยวชาญ
                  วันเวลา และสถานที่
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            พร้อมเริ่มต้นแล้วหรือยัง?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            เข้าร่วมกับแพทย์หลายพันคนที่ใช้แพลตฟอร์มของเรา
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-50 px-8 py-3">
              สมัครสมาชิกฟรี
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

// Register Component
const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    medical_license_number: ''
  });
  const [licenseFile, setLicenseFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!licenseFile) {
      setError('กรุณาแนบภาพใบอนุญาตประกอบวิชาชีพเวชกรรม');
      return;
    }

    setIsLoading(true);
    setError('');

    const submitData = new FormData();
    Object.keys(formData).forEach(key => {
      submitData.append(key, formData[key]);
    });
    submitData.append('license_image', licenseFile);

    try {
      await axios.post(`${API}/register`, submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(true);
    } catch (error) {
      setError(error.response?.data?.detail || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <CardTitle>สมัครสมาชิกสำเร็จ!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <CardDescription>
              บัญชีของคุณอยู่ในระหว่างการตรวจสอบ
              <br />
              เราจะแจ้งให้ทราบเมื่อการอนุมัติเสร็จสิ้น
            </CardDescription>
            <Button onClick={() => navigate('/login')} className="w-full">
              เข้าสู่ระบบ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">สมัครสมาชิก</CardTitle>
          <CardDescription className="text-center">
            กรอกข้อมูลเพื่อสร้างบัญชีแพทย์
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-600">{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">ชื่อ</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="last_name">นามสกุล</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">รหัสผ่าน</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="phone_number">หมายเลขโทรศัพท์</Label>
              <Input
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="medical_license_number">เลขที่ใบอนุญาต</Label>
              <Input
                id="medical_license_number"
                name="medical_license_number"
                value={formData.medical_license_number}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="license_image">ภาพใบอนุญาตประกอบวิชาชีพเวชกรรม</Label>
              <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <FileImage className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="license_image" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                      <span>แนบไฟล์</span>
                      <input
                        id="license_image"
                        name="license_image"
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={(e) => setLicenseFile(e.target.files[0])}
                      />
                    </label>
                  </div>
                  {licenseFile && <p className="text-sm text-green-600">{licenseFile.name}</p>}
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <span className="text-gray-600">มีบัญชีอยู่แล้ว? </span>
            <Link to="/login" className="text-blue-600 hover:text-blue-500 font-medium">
              เข้าสู่ระบบ
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Login Component
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await login(email, password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">เข้าสู่ระบบ</CardTitle>
          <CardDescription className="text-center">
            เข้าสู่บัญชีแพทย์ของคุณ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-600">{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">รหัสผ่าน</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <span className="text-gray-600">ยังไม่มีบัญชี? </span>
            <Link to="/register" className="text-blue-600 hover:text-blue-500 font-medium">
              สมัครสมาชิก
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Dashboard Component
const Dashboard = () => {
  const { user } = useAuth();
  const [myShifts, setMyShifts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMyShifts();
  }, []);

  const fetchMyShifts = async () => {
    try {
      const response = await axios.get(`${API}/my-shifts`);
      setMyShifts(response.data);
    } catch (error) {
      console.error('Error fetching shifts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">อนุมัติแล้ว</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">รออนุมัติ</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">ถูกปฏิเสธ</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">ไม่ทราบสถานะ</Badge>;
    }
  };

  if (user.approval_status !== 'approved') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="text-center">
          <CardHeader>
            <Clock className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
            <CardTitle>บัญชีอยู่ในระหว่างการตรวจสอบ</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              เรากำลังตรวจสอบใบอนุญาตประกอบวิชาชีพเวชกรรมของคุณ
              <br />
              กรุณารอการอนุมัติจากผู้ดูแลระบบ
            </CardDescription>
            <p className="text-sm text-gray-500">
              โดยปกติใช้เวลา 1-2 วันทำการ
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          สวัสดี {user.first_name} {user.last_name}
        </h1>
        <div className="flex items-center space-x-4">
          <p className="text-gray-600">แพทย์ใบอนุญาตเลขที่: {user.medical_license_number}</p>
          {getStatusBadge(user.approval_status)}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">เวรที่ประกาศ</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myShifts.length}</div>
            <p className="text-xs text-muted-foreground">เวรทั้งหมด</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">เวรที่ใช้งาน</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {myShifts.filter(shift => shift.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">เวรที่เปิดอยู่</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">สถานะบัญชี</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">อนุมัติ</div>
            <p className="text-xs text-muted-foreground">ใช้งานได้ปกติ</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>เวรที่ประกาศล่าสุด</CardTitle>
          <CardDescription>
            รายการเวรที่คุณประกาศไว้
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">กำลังโหลด...</div>
          ) : myShifts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p>คุณยังไม่มีเวรที่ประกาศ</p>
              <Link to="/post-shift">
                <Button className="mt-4">ประกาศเวรแรก</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {myShifts.slice(0, 3).map((shift) => (
                <div key={shift.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{shift.position}</h3>
                    {shift.is_active ? (
                      <Badge className="bg-green-100 text-green-800">เปิด</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800">ปิด</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {shift.shift_date}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {shift.start_time} - {shift.end_time}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {shift.hospital_name}
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      {shift.compensation.toLocaleString()} บาท
                    </div>
                  </div>
                </div>
              ))}
              {myShifts.length > 3 && (
                <div className="text-center">
                  <Link to="/shifts">
                    <Button variant="outline">ดูเวรทั้งหมด</Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">กำลังโหลด...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">กำลังโหลด...</div>;
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Shifts List Component (placeholder)
const ShiftsList = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">เวรที่เปิดทั้งหมด</h1>
      <Card>
        <CardContent className="text-center py-12">
          <Calendar className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <p className="text-gray-500">ฟีเจอร์นี้กำลังพัฒนา</p>
        </CardContent>
      </Card>
    </div>
  );
};

// Post Shift Component (placeholder)
const PostShift = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">ประกาศหาคนรับเวร</h1>
      <Card>
        <CardContent className="text-center py-12">
          <Calendar className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <p className="text-gray-500">ฟีเจอร์นี้กำลังพัฒนา</p>
        </CardContent>
      </Card>
    </div>
  );
};

// Admin Dashboard Component
const AdminDashboard = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const response = await axios.get(`${API}/admin/pending-users`);
      setPendingUsers(response.data);
    } catch (error) {
      setError('ไม่สามารถโหลดรายการผู้ใช้ที่รอการอนุมัติได้');
      console.error('Error fetching pending users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const approveUser = async (userId) => {
    try {
      await axios.post(`${API}/admin/approve-user/${userId}`);
      // Remove approved user from the list
      setPendingUsers(pendingUsers.filter(user => user.id !== userId));
    } catch (error) {
      setError('ไม่สามารถอนุมัติผู้ใช้ได้');
      console.error('Error approving user:', error);
    }
  };

  const rejectUser = async (userId) => {
    try {
      await axios.post(`${API}/admin/reject-user/${userId}`);
      // Remove rejected user from the list
      setPendingUsers(pendingUsers.filter(user => user.id !== userId));
    } catch (error) {
      setError('ไม่สามารถปฏิเสธผู้ใช้ได้');
      console.error('Error rejecting user:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">จัดการระบบ</h1>
        <p className="text-gray-600">ตรวจสอบและอนุมัติการสมัครสมาชิกของแพทย์</p>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50 mb-6">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-600">{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            แพทย์ที่รอการอนุมัติ
          </CardTitle>
          <CardDescription>
            รายการแพทย์ที่สมัครสมาชิกและรอการตรวจสอบใบอนุญาต
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-pulse">กำลังโหลด...</div>
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p>ไม่มีแพทย์ที่รอการอนุมัติ</p>
              <p className="text-sm">แพทย์ทุกคนได้รับการอนุมัติแล้ว</p>
            </div>
          ) : (
            <div className="space-y-6">
              {pendingUsers.map((user) => (
                <div key={user.id} className="border rounded-lg p-6 bg-gray-50">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {user.first_name} {user.last_name}
                      </h3>
                      <p className="text-gray-600">{user.email}</p>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      รออนุมัติ
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        หมายเลขโทรศัพท์
                      </Label>
                      <p className="text-gray-900">{user.phone_number}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        เลขที่ใบอนุญาต
                      </Label>
                      <p className="text-gray-900">{user.medical_license_number}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        วันที่สมัคร
                      </Label>
                      <p className="text-gray-900">
                        {new Date(user.created_at).toLocaleDateString('th-TH')}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        สถานะบัญชี
                      </Label>
                      <p className="text-gray-900">{user.approval_status === 'pending' ? 'รออนุมัติ' : user.approval_status}</p>
                    </div>
                  </div>

                  {user.license_image_path && (
                    <div className="mb-6">
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        ภาพใบอนุญาตประกอบวิชาชีพเวชกรรม
                      </Label>
                      <div className="border rounded-lg p-2 bg-white inline-block">
                        <img
                          src={`${BACKEND_URL}${user.license_image_path}`}
                          alt="ใบอนุญาตประกอบวิชาชีพเวชกรรม"
                          className="max-w-md max-h-96 object-contain rounded"
                          onError={(e) => {
                            e.target.alt = 'ไม่สามารถโหลดภาพได้';
                            e.target.className = 'w-32 h-32 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-sm';
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <Button
                      onClick={() => approveUser(user.id)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      อนุมัติ
                    </Button>
                    <Button
                      onClick={() => rejectUser(user.id)}
                      variant="destructive"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      ปฏิเสธ
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/shifts"
                element={
                  <ProtectedRoute>
                    <ShiftsList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/post-shift"
                element={
                  <ProtectedRoute>
                    <PostShift />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;