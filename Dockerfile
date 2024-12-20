# Sử dụng Node.js base image
FROM node:18

# Đặt thư mục làm việc trong container
WORKDIR /app

RUN npm install -g pm2

# Sao chép tệp package.json và package-lock.json
COPY package*.json ./

# Cài đặt các dependencies
RUN npm install --production --silent

# Sao chép toàn bộ mã nguồn vào container
COPY . .

# Mở cổng 8080 (hoặc cổng bạn muốn)
EXPOSE 3000

# Lệnh để chạy ứng dụng
CMD ["npm", "start"]
