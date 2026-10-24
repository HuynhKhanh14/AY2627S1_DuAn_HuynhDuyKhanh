#!/bin/bash
# ==============================================================================
# Script biên dịch và thực thi chương trình Java PPRIM-Explorer (Pure Java SE)
# Yêu cầu: JDK 8 trở lên (Đã cài sẵn lệnh javac và java trong PATH)
# KHÔNG CẦN BẤT KỲ FILE .JAR BÊN NGOÀI NÀO
# ==============================================================================

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

echo "======================================================================"
echo " [PPRIM-Explorer Java Core] Bien dich ma nguon Java SE khong thu vien"
echo "======================================================================"

# 1. Tạo thư mục bin chứa bytecode đã biên dịch
mkdir -p bin

# 2. Biên dịch toàn bộ các file .java bằng javac tiêu chuẩn
echo "--> Dang bien dich bang 'javac'..."
javac -d bin -sourcepath src src/com/pprim/Main.java

echo "--> Bien dich thanh cong vao thu muc bin/"

# 3. Chạy chương trình
echo "--> Dang khoi chay chuong trinh..."
java -cp bin com.pprim.Main "$@"
