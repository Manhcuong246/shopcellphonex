-- =============================================
-- Web Bán Đồ Điện Tử - Database Schema (có biến thể: mẫu mã, màu)
-- Import file này vào phpMyAdmin
-- =============================================

CREATE DATABASE IF NOT EXISTS cellphone_shop;
USE cellphone_shop;

-- Bảng người dùng
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    avatar VARCHAR(500) COMMENT 'Đường dẫn ảnh đại diện, null thì dùng ảnh mặc định',
    role ENUM('customer', 'staff', 'admin') NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bảng refresh token (lưu refresh token đã cấp; cookie chỉ gửi khi gọi POST /api/auth/refresh-token)
CREATE TABLE refresh_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(64) NOT NULL COMMENT 'SHA-256 hash của refresh token',
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token_hash (token_hash),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
);

-- Bảng danh mục
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng sản phẩm (giá gốc dùng khi không có variant hoặc hiển thị "từ X₫")
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    image VARCHAR(500),
    brand VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    INDEX idx_category (category_id),
    INDEX idx_slug (slug)
);

-- Bảng biến thể sản phẩm: mẫu mã (dung lượng/cấu hình) + màu sắc, giá theo từng biến thể
CREATE TABLE product_variants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    model_name VARCHAR(100) NOT NULL COMMENT 'VD: 128GB, 256GB, 512GB',
    color_name VARCHAR(100) NOT NULL COMMENT 'VD: Đen, Trắng, Xanh',
    color_hex VARCHAR(7) COMMENT 'Mã màu hex VD: #000000',
    price DECIMAL(12, 2) NOT NULL,
    sale_price DECIMAL(12, 2),
    stock INT DEFAULT 0,
    image VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product (product_id)
);

-- Giỏ hàng: mỗi dòng = 1 biến thể (variant_id), lưu giá tại thời điểm thêm
CREATE TABLE cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    variant_id INT NOT NULL,
    variant_label VARCHAR(255) NOT NULL COMMENT 'VD: 256GB - Đen',
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(12, 2) NOT NULL COMMENT 'Giá lưu khi thêm vào giỏ',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_variant (user_id, variant_id)
);

-- Đơn hàng
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total DECIMAL(12, 2) NOT NULL,
    status ENUM('pending', 'confirmed', 'shipping', 'delivered', 'cancelled') DEFAULT 'pending',
    shipping_address TEXT NOT NULL,
    shipping_phone VARCHAR(20) NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Chi tiết đơn hàng (có variant)
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    variant_id INT,
    variant_label VARCHAR(255),
    product_name VARCHAR(255) NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    quantity INT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
);

-- Bình luận sản phẩm
CREATE TABLE product_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    rating TINYINT COMMENT '1-5 sao, NULL nếu không đánh giá',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_product (product_id)
);

-- ========== DỮ LIỆU MẪU ==========
INSERT INTO categories (name, slug, description) VALUES
('Điện thoại', 'dien-thoai', 'Smartphone, điện thoại di động'),
('Laptop', 'laptop', 'Laptop, máy tính xách tay'),
('Tai nghe', 'tai-nghe', 'Tai nghe Bluetooth, có dây'),
('Phụ kiện', 'phu-kien', 'Sạc, ốp lưng, cáp');

-- Sản phẩm (không còn price/stock ở đây, nằm ở variant)
INSERT INTO products (category_id, name, slug, description, brand) VALUES
(1, 'iPhone 15 Pro Max', 'iphone-15-pro-max', 'iPhone 15 Pro Max - Chip A17 Pro, màn hình 6.7 inch Super Retina XDR. Camera 48MP, pin trâu.', 'Apple'),
(1, 'Samsung Galaxy S24 Ultra', 'samsung-galaxy-s24-ultra', 'Galaxy S24 Ultra - Snapdragon 8 Gen 3, bút S Pen, camera 200MP.', 'Samsung'),
(1, 'Xiaomi 14', 'xiaomi-14', 'Xiaomi 14 - Snapdragon 8 Gen 3, Leica camera, màn hình 120Hz.', 'Xiaomi'),
(2, 'MacBook Pro M3', 'macbook-pro-m3', 'MacBook Pro 14 inch M3 - 18GB RAM, 512GB SSD, màn hình Liquid Retina XDR.', 'Apple'),
(2, 'Dell XPS 15', 'dell-xps-15', 'Dell XPS 15 OLED - Intel Core i7, 16GB RAM, 512GB SSD.', 'Dell'),
(3, 'AirPods Pro 2', 'airpods-pro-2', 'Tai nghe Apple AirPods Pro thế hệ 2 - Chống ồn chủ động, chip H2.', 'Apple'),
(3, 'Sony WH-1000XM5', 'sony-wh1000xm5', 'Tai nghe chụp tai Sony - Chống ồn hàng đầu, pin 30 giờ.', 'Sony'),
(4, 'Sạc nhanh 65W', 'sac-nhanh-65w', 'Củ sạc nhanh đa năng 65W 3 cổng USB-C + USB-A.', 'Baseus');

-- Biến thể: mẫu mã + màu, giá khác nhau (product_id 1 = iPhone 15 Pro Max, ...)
INSERT INTO product_variants (product_id, model_name, color_name, color_hex, price, sale_price, stock) VALUES
(1, '256GB', 'Titan tự nhiên', '#8B7355', 32990000, 30990000, 25),
(1, '256GB', 'Titan xanh', '#4A6B6B', 32990000, 30990000, 20),
(1, '256GB', 'Titan trắng', '#E8E6E3', 32990000, 30990000, 18),
(1, '512GB', 'Titan tự nhiên', '#8B7355', 37990000, 35990000, 15),
(1, '512GB', 'Titan xanh', '#4A6B6B', 37990000, 35990000, 12),
(2, '256GB', 'Titanium Gray', '#5C5C5C', 27990000, 25990000, 20),
(2, '256GB', 'Titanium Black', '#1A1A1A', 27990000, 25990000, 15),
(2, '512GB', 'Titanium Gray', '#5C5C5C', 31990000, 29990000, 10),
(3, '256GB', 'Đen', '#1A1A1A', 18990000, 17990000, 30),
(3, '256GB', 'Trắng', '#F5F5F5', 18990000, 17990000, 25),
(3, '512GB', 'Đen', '#1A1A1A', 21990000, 20990000, 15),
(4, '18GB/512GB', 'Xám không gian', '#53524F', 45990000, NULL, 12),
(4, '18GB/512GB', 'Bạc', '#E8E8E8', 45990000, NULL, 10),
(4, '36GB/1TB', 'Xám không gian', '#53524F', 55990000, 53990000, 5),
(5, '16GB/512GB', 'Đen', '#1A1A1A', 39990000, 37990000, 8),
(5, '32GB/1TB', 'Đen', '#1A1A1A', 45990000, 42990000, 5),
(6, 'Mặc định', 'Trắng', '#F5F5F5', 5490000, 4990000, 50),
(6, 'Mặc định', 'Đen', '#1A1A1A', 5490000, 4990000, 50),
(7, 'Mặc định', 'Đen', '#1A1A1A', 7990000, 7490000, 15),
(7, 'Mặc định', 'Bạc', '#C0C0C0', 7990000, 7490000, 10),
(8, 'Mặc định', 'Đen', '#1A1A1A', 390000, 350000, 100),
(8, 'Mặc định', 'Trắng', '#F5F5F5', 390000, 350000, 80);

-- Tài khoản admin/staff: cd backend && npm run seed → admin@cellphone.com | staff@cellphone.com / 123456
