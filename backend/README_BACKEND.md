# Backend Noisy Digit Recognition

Backend được xây dựng bằng FastAPI.

## Yêu cầu

- Python 3.10+

## Cài đặt

Chạy từ thư mục gốc của repo:

```powershell
cd backend
$env:PYTHONUTF8 = "1"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Nếu cần file cấu hình local, có thể tạo từ file mẫu:

```powershell
Copy-Item .env.example .env
```

Chỉ giữ `.env` trên máy local. File `.env.example` là file mẫu và có thể commit lên GitHub trừ khi clone về

## Chạy backend
```
uvicorn app.main:app --reload --port 8000

Nếu Windows báo lỗi launcher do đường dẫn project có dấu tiếng Việt, chạy uvicorn qua Python:

```powershell
$env:PYTHONUTF8 = "1"
python -m uvicorn app.main:app --reload --port 8000
```

## Kiểm tra health

```
GET http://127.0.0.1:8000/api/health
```

Response mong đợi:

```json
{"status":"ok"}
```

## API xử lý ảnh hiện tại

Endpoint demo đầu tiên nhận ảnh upload, đọc ảnh bằng OpenCV, lưu ảnh gốc, ảnh grayscale, ảnh binary, ảnh morphology và ảnh connected components. Response trả về theo cấu trúc `ProcessResult` để frontend có thể dùng dần.

```
POST http://127.0.0.1:8000/api/process
```

Các field trong form:

| Field | Kiểu | Bắt buộc | Ghi chú |
|---|---|---:|---|
| `image` | File | Có | Ảnh JPG, JPEG hoặc PNG. Field `file` cũng được chấp nhận như alias. |
| `parameters` | Text | Không | JSON object chứa tham số pipeline. Có thể để trống. |

Ví dụ `parameters`:

```json
{"threshold_mode":"otsu","min_area":50}
```

Có thể test bằng FastAPI docs:

```text
http://127.0.0.1:8000/docs
```

## Ảnh pipeline đã lưu

Sau khi gọi `POST /api/process`, backend lưu ảnh vào:

```text
backend/storage/results/{result_id}/
```

Các ảnh hiện có:

```text
original.png
grayscale.png
binary.png
morphology.png
components.png
```

Response trả về URL đầy đủ để mở ảnh trong browser:

```text
GET /api/images/original/{result_id}
GET /api/images/grayscale/{result_id}
GET /api/images/binary/{result_id}
GET /api/images/morphology/{result_id}
GET /api/images/components/{result_id}
```

Response cũng có `debug_links` để copy link nhanh khi test thủ công.

## Trạng thái hiện tại

Đã làm thật:

- Upload ảnh.
- Decode ảnh bằng OpenCV.
- Lấy `width`, `height`, `file_size`, `format`.
- Lưu ảnh gốc.
- Chuyển ảnh sang grayscale.
- Tạo ảnh binary bằng Otsu threshold.
- Tạo ảnh morphology mặc định để giảm nhiễu foreground nhỏ.
- Tạo ảnh connected components để xem các vùng liên thông.
- Trả URL để mở ảnh `original`, `grayscale`, `binary`, `morphology`, `components`.

Vẫn còn mock hoặc chưa làm:

- Bounding boxes thật.
- Output image có vẽ bounding box.
- File `output.txt`.
- Label và confidence từ CNN.
- LLM comment thật.

Hiện tại `output_image_url` tạm trỏ tới ảnh gốc đã lưu. Sau khi có bước detect bounding box thật, URL này sẽ trỏ tới ảnh output có bounding box.
