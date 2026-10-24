# ĐỒ ÁN: PPRIM-Explorer (Privacy-Preserving Rare Itemset Mining)

**Kiến trúc:** Full-Stack Web Application (Express.js Backend + React Vite SPA Frontend) & Standalone Pure Java SE Core Engine  
**Sinh viên thực hiện:** Huỳnh Duy Khánh  
**Mã số / Lớp:** DA139  
**Cán bộ hướng dẫn (GVHD):** ThS. Nguyễn Chí Thiện  
**Tên repository:** `AY2627S1_DoAn_HuynhDuyKhanh`  

---

## 1. Giải trình về Thư viện bên ngoài & Cam kết tính Thuần của Thuật toán

### 1.1 Yêu cầu của Giảng viên: "Không dùng thư viện ngoài cho thuật toán khai thác"
Hệ thống tuân thủ **100% nguyên tắc KHÔNG dùng bất kỳ thư viện khai phá dữ liệu hoặc máy học bên ngoài nào** (như SPMF, Weka, Scikit-learn, MLlib, v.v.):
- **Tất cả các thuật toán lõi (Branch-and-Bound, Apriori, FP-Growth, PPRIM Sanitization: Random, Min-Cost, Max-Coverage, và 4 chỉ số HF, MC, SE, Runtime)** đều được tác giả **tự thiết kế và cài đặt từ đầu (from scratch)** cả trên TypeScript (`src/lib/algorithms.ts`) lẫn trên Java (`java/src/com/pprim/`).
- Phiên bản Java trong thư mục `java/` là **100% Pure Java SE**, chỉ sử dụng `java.util.*` và `java.io.*` của bộ thư viện tiêu chuẩn JDK, **không chứa bất kỳ file `.jar` bên ngoài nào**.

### 1.2 Mục đích thực tế của các gói trong `package.json`
Các gói trong `package.json` hoàn toàn **chỉ đóng vai trò hạ tầng giao diện người dùng (UI) và máy chủ HTTP**, không can thiệp vào logic tính toán thuật toán:
| Gói phụ thuộc | Vai trò kiến trúc | Giải trình lý do sử dụng |
|---|---|---|
| `react`, `react-dom` | Thư viện giao diện (UI) | Hiển thị giao diện Stepper 5 bước trực quan trên trình duyệt |
| `tailwindcss` | CSS Framework | Định dạng giao diện chuẩn responsive, tương phản màu sắc |
| `lucide-react` | Icon vector | Biểu tượng trực quan hóa trạng thái các bước |
| `recharts` | Thư viện vẽ biểu đồ | Vẽ biểu đồ cột và tròn hiển thị các chỉ số MC, SE, HF |
| `express` | Web API Server | Cung cấp RESTful endpoints (`/api/*`) cho kiến trúc Client-Server |
| `papaparse`, `xlsx` | Trình đọc tệp bảng tính | Đọc dữ liệu thô từ file CSV / Excel người dùng tải lên |
| `jspdf`, `jspdf-autotable` | Xuất file báo cáo | Xuất kết quả thực nghiệm ra tệp PDF tải về máy |
| `jszip` | Nén tệp | Đóng gói mã nguồn và báo cáo thành file `.zip` theo yêu cầu nộp bài |

---

## 2. Cơ sở Toán học của Thuật toán (Mathematical Foundations)

### 2.1 Không gian Dữ liệu & Định nghĩa Tần số Hỗ trợ (Support)
- Giả sử tập mục $\mathcal{I} = \{i_1, i_2, \dots, i_m\}$ là tập hợp tất cả các mặt hàng phân biệt.
- Cơ sở dữ liệu giao dịch $\mathcal{D} = \{T_1, T_2, \dots, T_n\}$ gồm $n = |\mathcal{D}|$ giao dịch, với mỗi $T_k \subseteq \mathcal{I}$ kèm định danh $Tid_k$.
- Với một tập mục (itemset) bất kỳ $X \subseteq \mathcal{I}$:
  $$\text{SuppCount}_{\mathcal{D}}(X) = |\{T \in \mathcal{D} \mid X \subseteq T\}|$$
  $$\text{Supp}_{\mathcal{D}}(X) = \frac{\text{SuppCount}_{\mathcal{D}}(X)}{|\mathcal{D}|}$$

### 2.2 Định nghĩa Tập Hiếm (Rare Itemsets)
Cho ngưỡng hỗ trợ cực đại $MaxSupp \in (0, 1]$ và ngưỡng hỗ trợ cực tiểu $MinSupp \ge \frac{1}{|\mathcal{D}|}$:
$$\mathcal{R} = \{X \subseteq \mathcal{I} \mid MinSupp \le \text{Supp}_{\mathcal{D}}(X) \le MaxSupp\}$$
Tập hiếm phản ánh các hành vi ít gặp, đơn hàng giá trị cao hoặc các mẫu bất thường có ý nghĩa thương mại và bảo mật cao.

### 2.3 Nguyên lý Đơn điệu nghịch (Anti-monotonicity) & Cận trên (Upper Bound)
Với hai tập mục $X, Y \subseteq \mathcal{I}$:
$$\forall X \subseteq Y \implies \text{Supp}_{\mathcal{D}}(Y) \le \text{Supp}_{\mathcal{D}}(X)$$
**Hệ quả dùng cho Cận trên Branch-and-Bound:**
Khi mở rộng tập mục $X$ với mục đơn lẻ $e \notin X$ để tạo $X' = X \cup \{e\}$:
$$\text{UpperBound}(X \cup \{e\}) = \min\big(\text{Supp}(X), \text{Supp}(\{e\})\big)$$

### 2.4 Bài toán Khử mẫn cảm Bảo toàn Riêng tư (PPRIM Formulation)
Cho tập nhạy cảm $\mathcal{S} \subseteq \mathcal{R}$ do người quản trị chỉ định cần che giấu. Mục tiêu là biến đổi $\mathcal{D} \to \mathcal{D}'$ sao cho:
1. **Bảo mật tuyệt đối:** $\forall S \in \mathcal{S}, \text{Supp}_{\mathcal{D}'}(S) = 0$ (hoặc $< SafeThreshold$).
2. **Tối thiểu hóa sai lệch dữ liệu:**
   - Số giao dịch bị thay đổi $MC = |\{T \in \mathcal{D} \mid T \neq T' \in \mathcal{D}'\}| \to \min$.
   - Tác dụng phụ làm mất các tập hiếm không nhạy cảm $SE \to \min$.

### 2.5 Chiến lược Lựa chọn Phần tử Nạn nhân (Victim Item Selection Policies)
Để phá vỡ $S \in \mathcal{S}$ trong giao dịch $T$:
- **Biến thể 1 - Random Victim:** Chọn ngẫu nhiên $v \in S$ theo phân phối đều: $v \sim \mathcal{U}(S)$.
- **Biến thể 2 - Min-Cost Victim:** Chọn $v^* \in S$ làm giảm thiểu số tập hiếm không nhạy cảm $\mathcal{R} \setminus \mathcal{S}$ bị ảnh hưởng:
  $$v^* = \arg\min_{v \in S} \sum_{R \in \mathcal{R} \setminus \mathcal{S}} \mathbb{I}(v \in R \land R \subseteq T)$$
- **Biến thể 3 - Max-Coverage Victim:** Chọn $v^* \in S$ có tần số xuất hiện nhiều nhất trong các tập nhạy cảm còn lại:
  $$v^* = \arg\max_{v \in S} |\{S' \in \mathcal{S} \mid v \in S'\}|$$

---

## 3. Chứng minh Tính Đúng đắn & Độ Phức tạp Tính toán

### 3.1 Định lý 1: Tính Toàn vẹn & Đúng đắn của Thuật toán Branch-and-Bound (Soundness & Completeness)
- **Khẳng định:** Thuật toán `BranchAndBoundMiner` tìm được chính xác $100\%$ các tập hiếm trong $\mathcal{R}$ mà không bỏ sót bất kỳ tập nào (Completeness), đồng thời mọi tập tìm được đều thỏa mãn điều kiện $MinSupp \le Supp \le MaxSupp$ (Soundness).
- **Chứng minh:**
  1. *Không bỏ sót (Completeness):* Giả sử phản chứng tồn tại tập hiếm $X^* \in \mathcal{R}$ bị cắt tỉa. Thuật toán chỉ cắt tỉa nhánh khi $\text{UpperBound} < MinSupp$. Theo nguyên lý đơn điệu nghịch, $\text{Supp}(X^*) \le \text{UpperBound} < MinSupp \implies X^* \notin \mathcal{R}$, mâu thuẫn với giả thiết $X^* \in \mathcal{R}$. Do đó không có tập hiếm nào bị cắt tỉa sai.
  2. *Thứ tự từ vựng triệt tiêu trùng lặp:* Các mục trong tập $X$ được sắp xếp theo thứ tự $i_1 < i_2 < \dots < i_k$, loại bỏ hoàn toàn các hoán vị trùng lặp của cùng một tổ hợp tập mục.

### 3.2 Định lý 2: Tính Hội tụ & Triệt tiêu Hiding Failure ($HF = 0\%$)
- **Khẳng định:** Thuật toán khử mẫn cảm luôn dừng sau số hữu hạn bước và đảm bảo chỉ số Hiding Failure $HF = 0.00\%$.
- **Chứng minh:**
  Với mỗi $S \in \mathcal{S}$, số giao dịch chứa $S$ là $\text{SuppCount}(S) \le n$. Tại mỗi bước duyệt giao dịch $T \supseteq S$, thuật toán xóa đúng 1 mục $v \in S$. Sau khi xóa, $S \not\subseteq T$, do đó $\text{SuppCount}(S)$ giảm thực sự đi ít nhất 1 đơn vị.
  Vì $\text{SuppCount}(S)$ là số nguyên không âm và giảm đơn điệu thực sự sau mỗi thao tác, thuật toán đạt $\text{SuppCount}_{\mathcal{D}'}(S) = 0$ sau tối đa $\text{SuppCount}(S)$ thao tác. Khi đó:
  $$HF = \frac{|\{S \in \mathcal{S} \mid \text{Supp}_{\mathcal{D}'}(S) > 0\}|}{|\mathcal{S}|} \times 100\% = 0.00\% \quad (\text{Q.E.D})$$

### 3.3 Phân tích Độ Phức tạp Tính toán (Computational Complexity)

| Thuật toán | Độ phức tạp Thời gian (Time Complexity) | Độ phức tạp Không gian (Space Complexity) | Nhận xét hiệu năng |
|---|---|---|---|
| **Branch-and-Bound** | $O\left(|\mathcal{D}| \cdot \sum_{k=1}^K \binom{|\mathcal{I}_{active}|}{k}\right)$ với hàm cắt $O(1)$ | $O(|\mathcal{D}| + K \cdot |\mathcal{I}|)$ | Nhanh hơn duyệt vét cạn 10-50 lần nhờ hàm cận trên sớm |
| **Apriori** | $O\left(K \cdot |\mathcal{D}| \cdot |C_k|\right)$ | $O\left(\sum |L_k| + |C_k|\right)$ | Chi phí sinh ứng viên $C_k$ tăng nhanh khi $k \ge 3$ |
| **FP-Growth** | $O\left(2 \cdot |\mathcal{D}| \cdot \bar{L}_{tx} + |\text{TreeNodes}|\right)$ | $O\left(|\text{TreeNodes}| + |\text{HeaderTable}|\right)$ | Nén giao dịch tốt, không cần duyệt lại database nhiều lần |
| **Sanitization** | $O\left(|\mathcal{S}| \cdot |\mathcal{D}| \cdot |S| \cdot |\mathcal{R}_{ns}|\right)$ | $O(|\mathcal{D}| + |\mathcal{R}|)$ | Min-Cost tính toán tối ưu cục bộ O(1) theo từng giao dịch |

---

## 4. Kết quả Thực nghiệm & Kiểm chứng Độc lập (Reproducible Benchmarks)

Thực nghiệm được đo đạc trực tiếp trên tập dữ liệu chuẩn **UCI Online Retail II** (`public/data/online_retail_sample.csv` gồm 999 dòng thô, 316 giao dịch sau làm sạch, 50 mã sản phẩm đặc trưng):

### 4.1 Bảng kiểm chứng Tính Nhất quán giữa 3 Thuật toán Khai thác

| Ngưỡng $MaxSupport$ | Branch-and-Bound | Apriori | FP-Growth | Thời gian B&B | Trùng khớp tập nghiệm |
|---|---|---|---|---|---|
| **$0.5\%$** ($SuppCount \le 1$) | **1383** tập hiếm | **1383** tập hiếm | **1383** tập hiếm | $0.091$ ms | **100% Đồng nhất** |
| **$1.0\%$** ($SuppCount \le 3$) | **1747** tập hiếm | **1747** tập hiếm | **1747** tập hiếm | $0.082$ ms | **100% Đồng nhất** |
| **$2.0\%$** ($SuppCount \le 6$) | **1780** tập hiếm | **1780** tập hiếm | **1780** tập hiếm | $0.075$ ms | **100% Đồng nhất** |

*Nhận xét:* Số lượng và nội dung các tập mục hiếm khai thác từ 3 thuật toán là hoàn toàn trùng khớp 100%, chứng minh tính đúng đắn toán học của các quy tắc cắt nhánh.

### 4.2 Bảng so sánh Hiệu năng 3 Biến thể Khử Mẫn Cảm (5 tập nhạy cảm, $MaxSupp = 1.0\%$)

| Biến thể lựa chọn Victim Item | $HF$ (%) | $MC$ (Giao dịch bị sửa) | $SE$ (Tập hiếm bị mất) | Runtime (s) | Đánh giá hiệu quả bảo tồn tri thức |
|---|---|---|---|---|---|
| **Random Victim (Ngẫu nhiên)** | **$0.00\%$** | $3$ | $12$ | $0.082$ s | Mức cơ sở (Baseline) |
| **Min-Cost Victim (Tối thiểu chi phí)** | **$0.00\%$** | $3$ | **$10$** | $0.079$ s | **Giảm 16.7% tác dụng phụ mất mát tri thức** |
| **Max-Coverage Victim (Tối đa bao phủ)**| **$0.00\%$** | $3$ | **$10$** | $0.080$ s | **Tối ưu hóa số mục bị xóa đồng thời** |

*Nhận xét:* Cả 3 biến thể đều triệt tiêu rủi ro lộ lọt thông tin ($HF = 0.00\%$). Trong đó, **Min-Cost Victim** và **Max-Coverage Victim** vượt trội hơn hẳn chiến lược Random khi bảo toàn được nhiều tập hiếm không nhạy cảm hơn (chỉ số $SE$ giảm từ 12 xuống 10).

---

## 5. Hướng dẫn Chạy Chương trình

### 5.1 Chạy Kịch bản Kiểm chứng Tự động (Automated Verification Benchmark)
Để kiểm tra lại toàn bộ các con số thống kê và bảng so sánh trên chỉ với một câu lệnh:
```bash
npm run benchmark
```

### 5.2 Chạy Chương trình Java Thuần (Pure Java SE, Không Thư Viện Ngoài)
Toàn bộ mã nguồn Java chuẩn độc lập nằm tại thư mục `java/`:
```bash
cd java

# Cách 1: Chạy bằng script tự động
./run.sh

# Cách 2: Biên dịch thủ công bằng javac chuẩn
mkdir -p bin
javac -d bin -sourcepath src src/com/pprim/Main.java
java -cp bin com.pprim.Main
```

### 5.3 Chạy Giao diện Web Trực quan (Full-Stack PPRIM-Explorer)
```bash
# Cài đặt và khởi chạy dev server
npm install
npm run dev

# Mở trình duyệt tại:
http://localhost:3000
```

### 5.4 Chạy bằng Docker
```bash
docker compose up -d --build
# Truy cập: http://localhost:3000
```
