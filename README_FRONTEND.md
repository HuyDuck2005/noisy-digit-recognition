src/
├── assets/          # Chứa hình ảnh mẫu, logo, icon
├── components/      # Các thành phần giao diện nhỏ dùng đi dùng lại
│   ├── Common/      # Button.jsx, Card.jsx, Input.jsx (đã bo tròn, đổ màu)
│   ├── Upload/      # DragDropZone.jsx (Khu vực kéo thả ảnh)
│   └── Result/      # BoundingBoxTable.jsx (Bảng tọa độ), ImageTabs.jsx (Các ảnh trung gian)
├── layouts/         # Bố cục chính của trang web
│   ├── MainLayout.jsx  # Chứa Sidebar bên trái và Header trên cùng
│   └── AdminLayout.jsx # Bố cục riêng cho trang Admin
├── pages/           # Các màn hình lớn (Kết hợp từ các components)
│   ├── Dashboard.jsx   # Dashboard cá nhân của User
│   ├── ImageProcess.jsx# Màn hình chính: Upload + Chỉnh tham số + Xem kết quả
│   ├── History.jsx     # Xem lại lịch sử các lần chạy
│   └── AdminLog.jsx    # Trang quản trị xem log lỗi và quản lý model
├── services/        # NƠI BACKEND SẼ NHẢY VÀO ĐỂ VIẾT CODE GỌI API
│   └── api.js       # Các hàm fetch/axios gửi ảnh và nhận JSON kết quả
├── App.jsx          # Cấu hình định tuyến (Routing) chuyển trang
└── main.jsx         # Điểm khởi chạy dự án
node_modules/
package.json/
package-lock.json/