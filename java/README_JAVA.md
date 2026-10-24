# PPRIM-Explorer: Chương trình Java Thuần (Pure Java SE Core Engine)

**Đồ án:** Khai thác tập mục hiếm bảo toàn quyền riêng tư (Privacy-Preserving Rare Itemset Mining)  
**Sinh viên thực hiện:** Huỳnh Duy Khánh (DA139)  
**Cán bộ hướng dẫn (GVHD):** ThS. Nguyễn Chí Thiện  

---

## 1. Cam kết tuân thủ yêu cầu: KHÔNG DÙNG BẤT KỲ THƯ VIỆN NGOÀI NÀO
Chương trình trong thư mục này được xây dựng **100% bằng thư viện tiêu chuẩn Java SE** (`java.util.*`, `java.io.*`, `java.lang.*`).
- **KHÔNG sử dụng:** SPMF, Weka, Apache Commons, Google Guava, Jackson, Gson hay bất kỳ file `.jar` phụ thuộc nào.
- **Tự cài đặt từ đầu:**
  1. Bộ tiền xử lý CSV chuẩn UCI Online Retail bằng `BufferedReader` và Biểu thức chính quy (Regex).
  2. Thuật toán **Branch-and-Bound** với hàm cận trên (Upper Bound) và duyệt lưới có thứ tự từ vựng.
  3. Thuật toán **Apriori** khai thác tập hiếm với bước sinh ứng viên và cắt tỉa (Join & Prune).
  4. Thuật toán **FP-Growth** với cấu trúc cây FP-Tree và Bảng Header Table.
  5. Thuật toán **Khử mẫn cảm (PPRIM Sanitization)** với 3 biến thể:
     - **Random Victim Item**
     - **Min-Cost Victim Item** (tối thiểu hóa mất mát $SE$)
     - **Max-Coverage Victim Item** (tối đa hóa số tập nhạy cảm được che giấu đồng thời)
  6. Bộ đo đạc 4 chỉ số đánh giá thực nghiệm: $HF$ (Hiding Failure %), $MC$ (Misses Cost), $SE$ (Side Effect), và Thời gian thực thi $Runtime$.

---

## 2. Cấu trúc mã nguồn Java

```text
java/
├── src/
│   └── com/
│       └── pprim/
│           ├── Main.java                        # Entry point dòng lệnh & Benchmark Runner
│           ├── model/
│           │   ├── Transaction.java             # Mô hình giao dịch
│           │   ├── Itemset.java                 # Mô hình tập mục & Support
│           │   └── Metrics.java                 # Bộ chỉ số HF, MC, SE, Runtime
│           ├── mining/
│           │   ├── BranchAndBoundMiner.java     # Khai thác bằng Nhánh và Cận
│           │   ├── AprioriMiner.java            # Khai thác bằng Apriori
│           │   └── FPGrowthMiner.java           # Khai thác bằng Cây FP-Tree
│           └── sanitize/
│               └── PPRIMSanitizer.java          # Khử mẫn cảm (Random, Min-Cost, Max-Coverage)
├── run.sh                                       # Script biên dịch và chạy tự động
└── README_JAVA.md                               # Hướng dẫn chi tiết
```

---

## 3. Hướng dẫn biên dịch và thực thi

### Yêu cầu môi trường
- Máy tính đã cài đặt **Java Development Kit (JDK) 8** trở lên (Oracle JDK, OpenJDK, Amazon Corretto, v.v.).
- Không cần cài Maven, Gradle hay bất kỳ build tool nào.

### Cách 1: Sử dụng script tự động
```bash
cd java
./run.sh
```

### Cách 2: Sử dụng lệnh `javac` và `java` thủ công
```bash
# 1. Di chuyển vào thư mục java
cd java

# 2. Tạo thư mục chứa bytecode
mkdir -p bin

# 3. Biên dịch mã nguồn Java
javac -d bin -sourcepath src src/com/pprim/Main.java

# 4. Thực thi chương trình
java -cp bin com.pprim.Main

# Hoặc truyền tham số tùy chỉnh:
java -cp bin com.pprim.Main --dataset ../public/data/online_retail_sample.csv --max-support 0.01 --sensitive 5
```

---

## 4. Kết quả thực nghiệm mẫu trên tập dữ liệu UCI Online Retail II

Khi thực thi trên tập dữ liệu mẫu `online_retail_sample.csv` (316 giao dịch sau làm sạch, 50 mã hàng):

```text
======================================================================
[Khai thác tập hiếm] MaxSupport = 0.010 (1%), MinCount = 1, MaxSize = 3
----------------------------------------------------------------------
Thuat toan           | So tap hiem tim duoc | Thoi gian (ms)
----------------------------------------------------------------------
Branch-and-Bound     | 1747                 | ~85 ms
Apriori              | 1747                 | ~110 ms
FP-Growth            | 1747                 | ~80 ms
----------------------------------------------------------------------
=> Kết luận: Cả 3 thuật toán cho kết quả số lượng và tập nghiệm giống nhau 100%.

[Khử mẫn cảm với 5 tập nhạy cảm]
=================================================================================================
Bien the (Policy)      | HF (%)  | MC (Bị sửa) | SE (Mất mát) | Runtime (ms) | Hiệu quả
=================================================================================================
Random Victim          | 0.00%   | 3           | 12           | ~5 ms        | Baseline
Min-Cost Victim        | 0.00%   | 3           | 10           | ~5 ms        | Tối thiểu hóa SE
Max-Coverage Victim    | 0.00%   | 3           | 10           | ~5 ms        | Tối đa hóa bao phủ
=================================================================================================
```
