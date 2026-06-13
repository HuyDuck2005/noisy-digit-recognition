import React from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate(); // Hook chuyển trang của React Router

  return (
    <div className="flex flex-col gap-8 anim-in">
      
      {/* ----- PHẦN 1: TIÊU ĐỀ TRANG ----- */}
      <div>
        <h2 className="page-eyebrow">Tổng quan</h2>
        <h1 className="page-title">Bảng điều khiển</h1>
        <p className="page-sub">Theo dõi hiệu suất nhận diện kí tự nhiễu (Noisy Digits)</p>
      </div>

      {/* ----- PHẦN 2: CÁC KHỐI THỐNG KÊ (STAT CARDS) ----- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card">
          <div className="stat-label">Tổng ảnh đã xử lý</div>
          <div className="stat-value">1,248</div>
          <div className="stat-sub text-teal">+12% so với hôm qua</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Độ chính xác trung bình</div>
          <div className="stat-value">94.5%</div>
          <div className="stat-sub text-sky">Model v2.1</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Lỗi nhận diện</div>
          <div className="stat-value text-red-400">23</div>
          <div className="stat-sub">Cần xem xét lại</div>
        </div>
      </div>

      {/* ----- PHẦN 3: CÁC KHỐI NỘI DUNG LỚN ----- */}
      {/* Chia thành 2 cột đều nhau trên màn hình lớn */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        
        {/* KHỐI BÊN TRÁI: Phím tắt sang trang Xử lý ảnh */}
        <div className="card flex flex-col h-full">
          <h3 className="card-title">Không gian làm việc</h3>
          <p className="card-sub mb-6">Đi tới khu vực tải ảnh lên, tinh chỉnh tham số OpenCV và chạy Model AI.</p>
          
          <div 
            onClick={() => navigate('/process')}
            className="flex-1 w-full min-h-[200px] border-2 border-dashed border-sky-500/30 rounded-xl flex flex-col items-center justify-center bg-[rgba(56,189,248,0.05)] cursor-pointer hover:bg-[rgba(56,189,248,0.1)] hover:border-teal-500 transition-all group"
          >
            <div className="text-5xl mb-3 group-hover:scale-110 group-hover:-translate-y-1 transition-transform">🚀</div>
            <span className="text-teal font-bold text-lg">Chuyển đến trang Xử lý ảnh</span>
            <span className="text-muted text-sm mt-1">Upload & Run Pipeline</span>
          </div>
        </div>

        {/* KHỐI BÊN PHẢI: Bảng Lịch sử gần đây */}
        <div className="card flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="card-title">Lịch sử gần đây</h3>
              <p className="card-sub">Các lượt nhận diện mới nhất hệ thống ghi nhận.</p>
            </div>
            <button onClick={() => navigate('/history')} className="btn btn-sm btn-ghost">Xem tất cả</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tên File</th>
                  <th>Kết quả</th>
                  <th>Độ tin cậy</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-mono text-sm">noise_sample_8.png</td>
                  <td><span className="badge badge-teal">Số 8</span></td>
                  <td>98%</td>
                </tr>
                <tr>
                  <td className="font-mono text-sm">test_blur_A.jpg</td>
                  <td><span className="badge badge-sky">Chữ A</span></td>
                  <td>91%</td>
                </tr>
                <tr>
                  <td className="font-mono text-sm">heavy_noise_X.png</td>
                  <td><span className="badge badge-red">Không rõ</span></td>
                  <td className="text-red-400">45%</td>
                </tr>
                <tr>
                  <td className="font-mono text-sm">clean_digit_3.jpg</td>
                  <td><span className="badge badge-teal">Số 3</span></td>
                  <td>99%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;