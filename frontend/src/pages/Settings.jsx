import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/api/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/useAuth';
import { DEFAULT_AVATAR } from '@/lib/constants';
import { Camera } from 'lucide-react';

export function Settings() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [full_name, setFullName] = useState(user?.full_name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [address, setAddress] = useState(user?.address ?? '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  const [current_password, setCurrentPassword] = useState('');
  const [new_password, setNewPassword] = useState('');
  const [confirm_password, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');

  const [avatarUploading, setAvatarUploading] = useState(false);

  if (!user) {
    navigate('/login', { state: { from: '/settings' } });
    return null;
  }

  const avatarSrc = user.avatar
    ? (user.avatar.startsWith('http') || user.avatar.startsWith('/') ? user.avatar : `/api/${user.avatar}`)
    : DEFAULT_AVATAR;

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMessage('');
    setProfileSaving(true);
    try {
      const { data } = await api.patch('/auth/profile', { full_name, phone, address });
      await refreshUser();
      setProfileMessage('Đã lưu thông tin.');
    } catch (err) {
      setProfileMessage(err.response?.data?.message || 'Lỗi lưu thông tin');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMessage('');
    if (new_password !== confirm_password) {
      setPasswordMessage('Mật khẩu mới và xác nhận không khớp.');
      return;
    }
    if (new_password.length < 6) {
      setPasswordMessage('Mật khẩu mới tối thiểu 6 ký tự.');
      return;
    }
    setPasswordSaving(true);
    try {
      await api.put('/auth/password', { current_password, new_password });
      setPasswordMessage('Đã đổi mật khẩu.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMessage(err.response?.data?.message || 'Lỗi đổi mật khẩu');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const { data } = await api.post('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await refreshUser();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi tải ảnh');
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Cài đặt</h1>

      <Card>
        <CardHeader>
          <CardTitle>Ảnh đại diện</CardTitle>
          <CardDescription>Không chọn ảnh thì dùng ảnh mặc định</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <div className="relative">
            <img
              src={avatarSrc}
              alt="Avatar"
              className="w-24 h-24 rounded-full object-cover border-2 border-muted"
            />
            <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90">
              <Camera className="h-4 w-4" />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={avatarUploading}
              />
            </label>
          </div>
          {avatarUploading && <span className="text-sm text-muted-foreground">Đang tải lên...</span>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin cá nhân</CardTitle>
          <CardDescription>Họ tên, số điện thoại, địa chỉ</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            {profileMessage && (
              <p className={`text-sm ${profileMessage.startsWith('Đã') ? 'text-green-600' : 'text-destructive'}`}>
                {profileMessage}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="full_name">Họ tên</Label>
              <Input
                id="full_name"
                value={full_name}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user.email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email không thể thay đổi</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912345678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Địa chỉ</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
              />
            </div>
            <Button type="submit" disabled={profileSaving}>
              {profileSaving ? 'Đang lưu...' : 'Lưu thông tin'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Đổi mật khẩu</CardTitle>
          <CardDescription>Nhập mật khẩu hiện tại và mật khẩu mới</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {passwordMessage && (
              <p className={`text-sm ${passwordMessage.startsWith('Đã') ? 'text-green-600' : 'text-destructive'}`}>
                {passwordMessage}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="current_password">Mật khẩu hiện tại</Label>
              <Input
                id="current_password"
                type="password"
                value={current_password}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_password">Mật khẩu mới</Label>
              <Input
                id="new_password"
                type="password"
                value={new_password}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password">Xác nhận mật khẩu mới</Label>
              <Input
                id="confirm_password"
                type="password"
                value={confirm_password}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={passwordSaving}>
              {passwordSaving ? 'Đang xử lý...' : 'Đổi mật khẩu'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
