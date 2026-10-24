# ==========================================
# Giai đoạn 1: Build Frontend (Vite)
# ==========================================
FROM node:20-alpine AS builder

# Nâng npm lên 11 để tránh bug nội bộ của npm 10
RUN npm install -g npm@11

WORKDIR /app

# CHỈ copy package.json — KHÔNG copy lockfile cũ
# (lockfile cũ ghim esbuild 0.25 → ERESOLVE với vite@8)
COPY package.json ./

# --legacy-peer-deps làm lớp bảo hiểm, kết hợp overrides trong package.json
RUN npm install --legacy-peer-deps

# Sao chép toàn bộ mã nguồn
COPY . .

# Biên dịch ứng dụng React bằng Vite sang thư mục dist
RUN npm run build

# ==========================================
# Giai đoạn 2: Runtime Production Container
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Tạo non-root user để tăng cường bảo mật container
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 pprim

# Sao chép package.json
COPY --from=builder /app/package.json ./package.json

# Sao chép node_modules (đã cài đủ dependency ở builder, bao gồm react-is)
COPY --from=builder /app/node_modules ./node_modules

# Sao chép bản build tĩnh từ giai đoạn builder
COPY --from=builder /app/dist ./dist

# Sao chép thư mục public (chứa public/data/online_retail_sample.csv)
COPY --from=builder /app/public ./public

# Sao chép mã nguồn backend server.ts, server/, shared/, và thư viện thuật toán
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Phân quyền cho non-root user
RUN chown -R pprim:nodejs /app

USER pprim

# Mở cổng 3000
EXPOSE 3000

# Thiết lập kiểm tra tình trạng sức khỏe của container
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Khởi chạy Full-stack Express server (qua tsx)
CMD ["npm", "start"]